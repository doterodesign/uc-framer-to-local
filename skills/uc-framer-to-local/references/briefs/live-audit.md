# Brief: live audit

Send this to the live-audit agent with the placeholders filled. `{capture}`
is the absolute capture folder.

---

You are auditing the published Framer site {url} to capture what a rebuild
needs and a Framer export can't give: rendered layout, breakpoint behaviour,
motion, interaction states, page transitions and head metadata. Another
agent is exporting the Framer project in parallel, so measure how the site
renders rather than inventorying its content.

## Setup

- Routes, page templates, and each template's representative URL are in
  `{capture}/manifest.json`.
- The widths to capture come from the manifest:
  `node {verify} {capture} --widths` prints them per URL. They include both
  sides of every breakpoint edge. Capture at exactly those widths.
- Use Playwright from a script run with Node. Chromium needs the sandbox
  disabled on macOS (certificate errors otherwise). Only visit {host},
  `framerusercontent.com`, `framer.com` asset hosts and the site's font
  hosts. Block `events.framer.com` and {blockHosts}. Record the href of
  every external link; never follow it.
- Viewport height 900. DPR 1. Decline cookie banners.

## Method

Save every script you write in `{capture}/live/scripts/`, with the base URL,
widths and output folder as arguments. No absolute paths.

1. **Head and breakpoints.** Fetch each URL's HTML. Per route: title,
   description, Open Graph, canonical, icons, generator, every `<script>`
   (analytics, third parties), and the breakpoints in
   `data-framer-hydrate-v2`. That attribute is the most reliable per-page
   breakpoint source.
2. **Screenshots.** Full page, every URL, every width from `--widths`,
   after scrolling the page in viewport steps so lazy images load.
3. **Computed styles.** Every URL, every width: split the page root into
   sections by `data-framer-name`, and for each element record tag, framer
   name, rect, computed styles that differ from defaults, text, href, src
   and alt.
4. **Motion**, on each template's representative URL: a MutationObserver
   from page load, `document.getAnimations()` at 100, 500, 1000 and 2000ms,
   then a slow scroll. Look for `data-framer-appear-id` and
   `__framer__appearAnimationsContent`. For each ticker, marquee or loop,
   sample its transform every frame for two seconds, idle and hovered, and
   report px/s per 100ms. Record numbers, never adjectives.
5. **Interaction states**, on each template's representative URL: every
   element with a pointer cursor or a gesture variant in the export. Diff
   computed styles before, during and after hover and press, and sample the
   curve with `requestAnimationFrame`. Open and close every menu and
   accordion, sampling frames.
6. **Page transitions and scroll.** Wrap `document.startViewTransition`.
   Pause every animation with `getAnimations()` and seek to fixed times
   relative to the animation's start, not the click. Store the full text of
   every `::view-transition-*`, `@keyframes` and `@property` rule:
   `getKeyframes()` leaves out custom properties. Scroll down before
   navigating, then record the scroll position after forward, back and
   forward again.
7. **Framer bundles.** Download the `.mjs` modules the HTML loads from
   `framerusercontent.com` and search them for the parameters of marketplace
   and code components (ticker speed and `hoverFactor`, slideshow drag and
   loop settings, scramble glyphs and timing) and for transition objects
   (`bounce`, `damping`, `stiffness`, `duration`).

State per-breakpoint behaviour only when you measured it at that width.

## Output

Everything under `{capture}/live/`:

- `metadata.json`: `{ "<path>": { title, description, canonical, icons,
  scripts, breakpoints: [{ hash, mediaQuery }], generator, ... } }`
- `computed/<slug>.json`: `{ widths: { "<width>": { docHeight, sections: [...] } } }`
- `screenshots/<slug>-<width>.png`
- `raw/anim-<slug>.json`, `raw/hover-<slug>.json` for each representative
  URL. If a log is too big to keep, store a per-element summary and set
  `truncated: true`; never cut it silently.
- `raw/transition.json`: `{ frames: [...], cssRules: [...], scroll: {...} }`
  when any page has a page effect
- `scripts/`

## Done when

`node {verify} {capture} --only live` passes. Then write your findings to
`{capture}/notes/live.md`, listing every place where live disagrees with
what the export will likely say (breakpoints, radii, colors, transitions).
Reply with that path and a summary under 300 words. Write prose without em
dashes.
