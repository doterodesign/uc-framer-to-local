# Create Framer Site

Rebuild a captured Framer site 1:1 in the stack the user names. You are the
orchestrator: you plan, dispatch, verify, merge and report. Sub-agents build.

Read `parity.md` before step 3. Every sub-agent brief carries
`DECISIONS.md`, the ticket, and the capture paths the ticket cites.

## 1. Intake

1. Run `node <skill-dir>/scripts/verify-capture.mjs <capture-dir>`, where
   `<skill-dir>` is this skill's base directory.
   If there's no capture or it fails, run the Capture workflow first.
2. Ask the questions in `intake.md` as one list, prefilled from the capture.
   Stop and wait for answers.

**Done when** `verify-capture.mjs` passes and `DECISIONS.md` has an answer,
or a logged assumption, for all 17 intake items and every row of the
capture's keep/drop table.

## 2. Plan

1. **Research.** Dispatch in parallel, one background agent each, each
   writing to `docs/agents/<date>-<topic>.md`:
   - the styling system: how this site gets registered and consumed, how it
     expresses color, type, space, motion and breakpoints, and what it
     can't express
   - the framework and CMS: current versions, content model, preview and
     editing, migration
   - the capture: a token table (every color, text style, space, radius,
     effect, transition and breakpoint in `CAPTURE.md` mapped to the
     styling system), plus one escape-hatch file for values it can't express
   Bring back a question only when a finding changes a decision.
2. **Spec and tickets.** Write the spec, then tickets in four milestones:
   Foundations, Global elements, Pages, Editing and launch. Each ticket is a
   vertical slice (schema, migration step, component, styles, tests), has
   numbered sub-steps with acceptance criteria, cites the capture files it
   uses, and names what blocks it. Write approved differences into the ticket
   that owns them.

**Done when** the coverage table in the spec maps every page, component,
CMS collection and breakpoint in `manifest.json`, and every capture gap, to a
ticket, and the user has approved the plan.

## 3. Build

Run the milestones in order. Within a milestone, dispatch one sub-agent per
unblocked ticket, each in its own worktree, branch and port. Sub-agents
don't push, merge or release; they stop and report when a ticket needs a
decision (a new raw value, a token gap, a redesign). You verify, merge,
release per the intake cadence, and update the tracker.

**Foundations**
- Scaffold: every route as a placeholder, self-hosted fonts, the parity
  suite from `parity.md`. Done when the suite runs every route at every
  width and fails with readable per-difference reports.
- Tokens: the token table as config, the escape-hatch file, a lint that
  rejects raw values outside it, a specimen page. Done when the specimen
  renders every text role and color within tolerance of the capture with
  JavaScript off, and the lint passes.
- Content: schemas, a section registry that fails the build when a schema has
  no component, the URL resolver, head metadata, and a migration from
  the capture's `export/` that is idempotent (keyed on Framer asset and node
  ids, owns only the fields it writes, keeps editor-written alt text,
  development by default, `--dry-run`). Done when a dry run's counts equal
  the export's and a second run creates nothing.

**Global elements.** Build the first global component (usually the footer)
alone: it sets the test harness and the section and migration patterns the
rest copy. Then nav, shared buttons, page transition. Probe the transition
and scroll restoration on live first (`parity.md`, motion probes). Done when
region parity passes on every route and width.

**Pages.** Shared primitives before their second consumer (tickers,
carousels, image). Then sections, pages, and CMS detail routes, including
empty items. Done per ticket when region parity passes at each of its
page's widths, open and closed states included, and its permanent tests
hold the measured values.

**Editing and launch.** Preview and visual editing, analytics off in
development and preview, sitemap, robots, structured data. Done when a draft
edit appears only in preview and a test proves no analytics or Framer
runtime ships.

## 4. Verify

1. Full parity run. Fix real breaks; take every remaining difference to
   the user as a proposed approval.
2. Accessibility sweep and alt-text pass.
3. Performance pass: prefetch, hydration count, island data serialized
   twice, eager images above the fold, transitions that wait on fetch.
   Parity doesn't measure any of this.
4. Cull: unused code, types, dependencies and config. Nothing stays because
   it was written earlier.

**Done when** the suite is green with zero unapproved differences, the
accessibility sweep has no serious or critical issues, and the cull leaves
nothing unused.

## 5. Report

Write `docs/agents/<date>-final-parity-report.md` per `parity.md`, then
delete the suite. Deploy and domain cutover belong to the user.

**Done when** the report is committed, the permanent tests pass, and no test
loads the live site.
