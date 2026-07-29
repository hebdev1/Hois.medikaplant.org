-- Full designed course landing page (raw, self-contained HTML) rendered in an
-- isolated iframe on /klas/[slug]. Distinct from body_html, which is sanitized
-- rich text: page_html is trusted admin HTML kept verbatim so its own <style>
-- and layout survive. NULL = fall back to the default course page layout.
alter table public.courses add column if not exists page_html text;
