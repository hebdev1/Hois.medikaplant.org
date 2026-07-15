'use server';

// Course-delivery Phase 1 — the single access choke point for recorded video
// playback (spec §4.2). Preview modules are public; every other module
// requires an authenticated, enrolled user. Storage-hosted videos are served
// as short-lived signed URLs minted with the service role AFTER the
// enrollment check; external videos return their URL for embedding.

import { getCurrentUser } from '@/lib/supabase/auth';
import { createServiceClient } from '@/lib/supabase/service';

const SIGNED_URL_TTL = 7200; // seconds (2h)

type ModuleRow = {
  id: string;
  course_id: string;
  preview: boolean;
  video_source: 'external' | 'storage';
  video_url: string | null;
  video_path: string | null;
};

export type PlaybackResult =
  | { ok: true; kind: 'file' | 'embed'; url: string }
  | { ok: false; reason: 'unauthenticated' | 'locked' | 'not_found' | 'no_source' };

export async function getModulePlayback(
  moduleId: string
): Promise<PlaybackResult> {
  if (!moduleId) return { ok: false, reason: 'not_found' };

  // Service role: read module metadata + enrollment without depending on RLS
  // shape. All authorization is enforced explicitly below.
  const svc = createServiceClient();

  const { data: modRaw } = await svc
    .from('course_modules')
    .select('id, course_id, preview, video_source, video_url, video_path')
    .eq('id', moduleId)
    .maybeSingle();

  const mod = modRaw as ModuleRow | null;
  if (!mod) return { ok: false, reason: 'not_found' };

  // Gate: non-preview modules need an authenticated, enrolled viewer.
  if (!mod.preview) {
    const user = await getCurrentUser();
    if (!user) return { ok: false, reason: 'unauthenticated' };

    const { data: enrolled } = await svc
      .from('course_enrollments')
      .select('id')
      .eq('course_id', mod.course_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!enrolled) return { ok: false, reason: 'locked' };
  }

  // Resolve the playable source.
  if (mod.video_source === 'storage') {
    if (!mod.video_path) return { ok: false, reason: 'no_source' };
    const { data, error } = await svc.storage
      .from('course-videos')
      .createSignedUrl(mod.video_path, SIGNED_URL_TTL);
    if (error || !data?.signedUrl) return { ok: false, reason: 'no_source' };
    return { ok: true, kind: 'file', url: data.signedUrl };
  }

  if (!mod.video_url) return { ok: false, reason: 'no_source' };
  return { ok: true, kind: 'embed', url: mod.video_url };
}
