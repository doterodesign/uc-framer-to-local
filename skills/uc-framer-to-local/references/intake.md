# Create intake

Ask these before any research or planning. Send them as one numbered list,
each with a default, so "defaults" is a valid answer. Prefill every answer
the capture already gives (routes, breakpoints, fonts, the keep/drop table).

Record each answer in `DECISIONS.md` at the repo root: the decision, who
made it, the date. Every sub-agent brief carries this file. A decision on
the list is closed; a sub-agent that hits one stops and reports rather than
reopening it.

An unanswered question is not an answer. If you proceed on a default, log it
in `DECISIONS.md` as an assumption and ask again before the ticket that
depends on it.

## Source and scope

1. **Capture.** Path to the capture folder. Default: `docs/framer-capture/`.
   It must pass `verify-capture.mjs` before intake continues.
2. **Routes.** Which pages are in scope, including CMS detail routes. Default:
   every published page in `manifest.json`; draft and unlinked pages dropped.
3. **What 1:1 means, per axis.** Layout per breakpoint, typography, color,
   motion and hover, page transitions, fonts, copy. For each: exact, or may
   the styling system's values win within a tolerance? Ask this one
   explicitly. It decides what the parity suite fails on.
4. **Breakpoints.** Keep Framer's per-page breakpoints, or normalise to one
   set? Default: keep per page. Framer sets breakpoints per page, and text
   styles carry their own.
5. **Keep, drop or fix.** Walk the capture's keep/drop table: hidden layers,
   template leftovers, empty CMS items and their routes, off-screen or broken
   widgets, stale metadata, plain-text contact details, GIF or video effects,
   legacy fonts. One answer per row.
6. **Improvements beyond 1:1.** Accessibility (one H1, landmarks, focus
   rings, alt text), per-page SEO and structured data, performance. Each
   accepted item becomes an approved difference.
7. **Content ownership.** What must be editable, whether editors reorder
   sections, preview and visual editing, who writes alt text.

## Stack

8. **Framework** and rendering mode (static, server, hybrid), component
   library, styling system and its rules (tokens only? where do raw values
   the system can't express live?), animation libraries and the split
   between them.
9. **CMS.** New or existing project. Separate development and production
   environments from day one. Who may write production.
10. **Hosting.** Provider, and when to deploy. Default: nothing deploys until
    the local build passes parity.
11. **Fonts.** Licence status, where the files are, substitutes.
12. **Integrations.** Forms, booking links, embeds, analytics IDs (off in
    development and preview), search-console verification.
13. **Browser support floor.**

## Process

14. **Tracker.** Tool, team, project, where the spec lives, sub-issues or
    checklists. Default when there's none: `PLAN.md` in the repo.
15. **Branching and releases.** PR and merge policy, who merges, release
    cadence, versioning tool. Default: one worktree, branch and PR per
    ticket; the orchestrator merges and releases.
16. **Repo.** Path and remote; check whether the remote exists.
17. **Stop points.** Which calls the user wants to approve: visual redesigns,
    copy, alt text, contrast exceptions, anything that ships a value not
    measured on the live site.
