# Workflows GitHub

## Build check (`build.yml`)

Chak push sou `main` (ak chak pull request) bati sit la sou GitHub, menm jan
Hostinger bati l:

1. Verifye pa gen okenn `next/font/google` — font yo self-hosted nan
   `app/fonts` (wè `scripts/vendor-fonts.mjs`).
2. `npm ci`
3. `npm run typecheck`
4. `npm run build` — ak yon adrès Supabase ki pa reponn, pou pwouve build la
   pa depann de baz done a.

**Vèt** = deplwaman an ap pase. **Wouj** = build Hostinger la t ap echwe tou:
louvri run nan (onglè **Actions**), gade ki etap ki kase, epi korije l anvan.

Li pa bezwen okenn Secret, epi li pa touche sèvè a.

## Deplwaman

Se **Hostinger** ki deplwaye: entegrasyon GitHub "Node.js App" la rale chak
push sou `main`, bati l, epi rekòmanse app la (wè `DEPLOY.md`).

Ansyen workflow SSH la (`deploy.yml`) retire: li pa t janm reyisi (0 sou 170
run), epi si l te mache li t ap fè yon dezyèm deplwaman an konfli ak pa
Hostinger la. Si w te ajoute Secrets `HOSTINGER_SSH_*` / `HOSTINGER_APP_PATH`
nan GitHub, ou ka efase yo (Settings → Secrets and variables → Actions).
