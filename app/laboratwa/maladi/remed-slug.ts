// Stable slug for a remedy (a plant within a condition), used to link the
// Maladi table to each remedy's preparation detail page. Same rule both sides.
export const remedSlug = (name: string) =>
  (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
