# Framer capture: {site name}

<!--
One home per fact. Tag every value with its source:
  [export]        read from the Framer project
  [live]          measured on the published site
  [export→live]   the export said one thing, live rendered another; live wins
                  on rendering, the export value goes in a footnote
Export wins on content, structure and intent. Live wins on how it renders.
A disagreement is never resolved silently: it gets a row under Conflicts.

Guidance sits in comments. verify-capture.mjs strips comments, then fails any
section that is empty or holds only a table header. Write "None." when a
section has nothing. Keep the headings and their order.
-->

## 1. Run

<!-- Site URL, Framer project id and name, CLI version, capture date, Framer
generator build (<meta name="generator">), how long each agent ran, and the
commands that regenerate every artifact that isn't committed (screenshots). -->

## 2. Route map

<!-- Every sitemap URL. Then 404 behaviour and redirects. -->

| Live URL | Page | Node id | Static or CMS template | Collection | Draft |
|---|---|---|---|---|---|

## 3. Breakpoints

<!-- Per page. Then the text style bands, which are separate from page
breakpoints. -->

| Page | Breakpoint | Media query [export] | Canvas width | Live media query [live] | Variant rendered at each edge width [live] |
|---|---|---|---|---|---|

## 4. Color

<!-- Color styles and variables [export], orphaned tokens, the raw color
frequency table with where each color is used, and every per-breakpoint
color override from breakpointOverrides. -->

## 5. Typography

<!-- Verified against the live preset CSS. Flag every style whose bold or
italic font is empty and where rich text uses it: those runs fall back to
another family. -->

| Style | Family | Weight | Size per band | Line height | Letter spacing | Paragraph spacing | Color | Bold and italic fonts |
|---|---|---|---|---|---|---|---|---|

## 6. Fonts

| Family | Weight | Style | File URL | Source (custom, Google, Framer) | Used by | Implicit fallbacks |
|---|---|---|---|---|---|---|

## 7. Components

<!-- One row per component, local and external: variants, gesture variants,
property controls, transitions (raw Framer string), where used. For layered
components, the visible silhouette measured on live, not the root radius. -->

## 8. Pages

<!-- Per page, section by section: name (data-framer-name), layout per
breakpoint, content source (CMS field or hard-coded), component instances,
effects. -->

## 9. Motion

<!-- Easing holds the raw Framer string and its CSS equivalent. Rates and
curves are sampled numbers, never adjectives. Page transitions record the
full ::view-transition-*, @keyframes and @property rules. -->

| Element | Trigger | From | To | Duration | Easing | Delay | Loop | Reduced motion | Source |
|---|---|---|---|---|---|---|---|---|---|

## 10. Interaction states

<!-- Every component with a gesture variant, by its Framer name, and every
interactive element: hover, press, focus, open and close, with sampled
curves. -->

## 11. CMS

<!-- Schema per collection, item counts, manual order, which items display
where at each breakpoint, and images without alt text. -->

## 12. Content not in the CMS

<!-- Every hard-coded text, image and SVG per page and component, with its
hidden flags. -->

## 13. Site settings and head

<!-- Per route: title, description, Open Graph, canonical, favicons.
Analytics and third-party scripts found in the live HTML. Custom code. -->

## 14. Keep, drop or fix

<!-- Hidden layers, template leftovers, empty CMS items, off-screen or broken
widgets, stale metadata, plain-text contact details, GIF or video effects,
legacy fonts, draft pages. -->

| Item | Where | Why it's in question | Suggested call |
|---|---|---|---|

## 15. Conflicts

| Fact | Export says | Live says | Won | Why |
|---|---|---|---|---|

## 16. Gaps

<!-- What neither source could give, each with the next probe to run. -->

## 17. Decisions needed

<!-- Questions for the owner the capture can't answer, starting with what
"1:1" means for each ambiguous row above. -->
