# Parity

How Create proves 1:1. The live Framer site is the reference; the local build
is compared against it. Every expected value in a test is measured on live or
read from the capture. A value nobody measured is a bug waiting to ship.

## The comparison suite

A temporary Playwright suite that opens each route on live and on a fresh
local production build, then compares what a visitor sees.

- **Build.** Production build, served the way the host will serve it, on a
  per-worktree port. Never reuse a running server.
- **Widths.** Per layout: each Framer canvas width, the pixel below each
  breakpoint, and 1440, 1200, 1024, 810, 390. Generate them from
  `manifest.json`. The edge widths find real layout breaks that the canvas
  widths miss.
- **Settle.** Block the live site's analytics and embeds (`events.framer.com`,
  `framer.com/edit`, booking hosts). Inject a style that pauses animations and
  removes transitions. Scroll the page in viewport steps so lazy images load.
  Wait for `document.fonts.ready`. Open anything the local build paginates so
  both sides show the same items.
- **Snapshot.** For every visible element with its own text: text, family,
  weight, size, line height, letter spacing, transform, painted sRGB color
  (read through a canvas, since modern CSS may emit `oklch()`), x, y, width.
  Plus page height, the heading outline from the accessibility tree, links as
  resolved hrefs, image count. Fold Framer's per-weight family names
  ("Cabinet Grotesk Bold") back to family plus weight.
- **Tolerances.** Height 2px. Headings exact. Links as a multiset, then order.
  Image count exact. Per text: size and line height 0.5px, letter spacing
  0.1px, x and y 2px, color 32 per channel and 0.1 alpha. Full-page
  pixelmatch at threshold 0.2, failing above 1% of pixels.
- **Masks.** Regions that move on their own (tickers, slideshows, scramble
  text, glows). Each mask carries a written reason. Masked regions are also
  skipped by the text, link and image checks.
- **Approvals.** The suite collects every difference and fails only on
  differences no approval covers. Each approval has an id, the reason, who
  decided and when, and a predicate as narrow as the difference: route, width
  band, check type, key, numeric bounds. Approved differences the suite can't
  see (head metadata, colors inside tolerance) go in a separate list in the
  same file.
- **Report.** Per route and width: `report.json`, `live.png`, `local.png`,
  `diff.png`, attached to the HTML report.

Treat semantic checks (text, headings, links, images) as the primary signal.
The pixel ratio is secondary: one height change shifts everything below it,
so it only means something once the semantic checks pass.

Rerun once before investigating a single failure on live. Framer sometimes
hasn't finished loading CMS content when the snapshot runs.

## Region parity

Until every page exists, full-page parity can only fail. Each section ticket
compares its own region instead, with the same settle and tolerances:

- Find the region on live by `data-framer-name` and locally by its class.
- Compare the region box, every text block relative to the region, its links,
  and a region pixelmatch at 0.2.
- For fixed or translucent chrome (a glass nav), hide everything else on both
  sites so it sits over the same canvas.
- Drive interactive states on both sites (open menu, expanded card, hover)
  and compare after the motion settles.

Write findings to the ticket's `docs/agents/<date>-<topic>-parity.md` and
carry the measured numbers into the ticket's permanent tests.

## Motion probes

- Sample curves with `requestAnimationFrame`: open and close timing, hover
  opacity dips, ticker px/s and the hover ramp.
- For transitions, pause Web Animations with `getAnimations()` and seek to
  fixed times. `getKeyframes()` leaves out custom properties, so also read
  the pseudo-element rules from the stylesheet.
- Seek to a time in tests; a wall-clock timer flakes on a busy machine.

## Permanent tests

Component tests for structure and ARIA, browser tests for computed style,
layout per width, hover, animation, reduced motion and the accessibility
tree. Each spec's header cites where its numbers came from ("measured on the
Framer site, <date>" or the capture file). These outlive the suite.

Plus an accessibility sweep on every route at the widest and narrowest width:
one H1, no skipped heading levels, landmarks, a visible focus ring on every
tab stop, and only the site's own fonts loading.

## Retiring the suite

After the final green run: write the final parity report (routes, widths,
pass count, every approval used and how often), confirm the permanent tests
hold the measured values, then delete the suite and its dependencies. No test
in the finished repo loads the live site.
