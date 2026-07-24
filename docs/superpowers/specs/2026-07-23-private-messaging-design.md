# Private admin → member messaging — design

**Date:** 2026-07-23
**Status:** Approved (design), pending implementation plan

## Goal

Let an admin write a private message to a specific member. The member reads it
in a small **floating message box** in their dashboard and can **reply**, so it
is a real conversation rather than a one-way announcement.

## Current state

Two mechanisms already exist, and neither quite does this:

- **Support chat** — `support_threads` (one conversation per member: subject,
  status, agent fields, `last_message_at`) + `support_messages` (`thread_id`,
  `sender_role`, `sender_id`, `body`). Members see it at `/dashboard/support`.
  Structurally this *is* private two-way admin↔member messaging. The gap: an
  admin can only **reply** (`adminSendSupportReply`); only the member can open a
  conversation (`getOrCreateThread`). An admin cannot start one.
- **Notifications** — `notifications` with `target_user_id` lets an admin push a
  title+message to one member's bell. One-way; the member cannot reply.

There is also no notion of "read": nothing records what the member has seen, so
an unread badge is not currently possible.

## Decisions (agreed)

| Question | Decision |
|---|---|
| Conversation or announcement | **Two-way** — the member can reply |
| Where the member sees it | **A small floating message box** in the dashboard |
| Build approach | **Reuse the support chat tables** (approach A) |
| Widget placement | **Stack above the existing floating buttons** — the suggestion box stays |

## Approach

Reuse `support_threads` / `support_messages` rather than build a parallel
messaging system. They already model exactly this, the admin screens and
realtime wiring exist, and the member keeps **one** place where all
correspondence with Hoïs lives. A second set of tables would duplicate a whole
chat stack and give the member two inboxes to watch.

## Architecture

### 1. Schema — one column
```sql
alter table public.support_threads
  add column member_last_read_at timestamptz;
```
Everything else is reused. Existing RLS already covers the new flows:
`support_threads` has "Admins manage all threads" (ALL) so an admin may insert a
thread for a member, and "Users update their own threads" so the member can
stamp their own read marker. `support_messages` has "Admins post any messages"
and "Users post user messages in their own threads".

### 2. Admin side — start a conversation
A **"Voye yon mesaj"** action on the member's admin page
(`/admin/users/[userId]`):

1. Find the member's thread; create one if absent (subject defaults to
   something like "Mesaj Hoïs", status open, agent = the acting admin).
2. Insert the first `support_messages` row with `sender_role='agent'`.
3. Bump `last_message_at`.
4. Email the member through the existing free-form `emailNotifyMember` path —
   the same one already used for "Sipò Hoïs reponn ou".

This generalizes `adminSendSupportReply` into "send a message, creating the
thread if needed" rather than adding a separate code path.

### 3. Member side — the floating box
A client component mounted in the dashboard layout:

- A **floating button** bottom-right with an **unread count badge**.
- Unread = messages where `sender_role='agent'` and
  `created_at > member_last_read_at` (or all agent messages when the marker is
  null).
- Opening the panel shows the conversation, marks it read (sets
  `member_last_read_at = now()`), and offers a reply box that posts a
  `sender_role='user'` message.
- **Realtime**: subscribe to `support_messages` for the thread so a reply from
  either side appears without a refresh — the same mechanism the support page
  already uses.

`/dashboard/support` stays as the full-page view of the same conversation; the
widget is a shortcut, not a second inbox.

### 4. Widget placement
The bottom-right corner already stacks three floating controls:
`translate-switcher` (`bottom-4`, z-100), `remed-finder` (`bottom-16`, z-95),
`suggestion-box` (`bottom-28`, z-99). The message box goes **above them**
(`bottom-40`), keeping the same rounded-pill styling. The suggestion box is
left in place.

Accepted trade-off: four stacked buttons is visually busy. If it proves
cluttered in use, the suggestion box is the natural one to fold into the
message box later — both are "talk to Hoïs" — but that is not part of this work.

## Non-goals

- No new messaging tables, and no second inbox for the member.
- No attachments, no group messages, no admin-to-many broadcast (the
  notifications system already covers broadcast).
- No change to how members open their own support requests.
- The suggestion box is not removed or merged.

## Acceptance

- An admin can start a conversation with a member who has never contacted
  support, and the member receives it.
- The floating box shows an unread badge until the member opens it.
- The member can reply from the widget and the admin sees it in `/admin/support`.
- A message from either side appears without a page refresh.
- The member is emailed when an admin writes.
- `/dashboard/support` shows the same conversation — not a duplicate.
- `tsc --noEmit` and `next build` pass.
