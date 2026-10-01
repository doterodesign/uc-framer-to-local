---
name: uc-framer-to-local
description: "Capture a published Framer site as data, or rebuild a captured site 1:1 in a stack you choose. User-invoked via /uc-framer-to-local only.\n"
disable-model-invocation: true
user-invocable: true
argument-hint: "capture <live-url> | create [capture-dir]"
---

# Framer site

Two workflows, one spine. Both walk the same five steps, and each step ends
on a check you can run.

| Step | Capture Framer Site | Create Framer Site |
|---|---|---|
| 1. Intake | Live URL, Framer project access, open a session | Stack and scope questions, `DECISIONS.md` |
| 2. Plan | `manifest.json`: routes, breakpoints, widths | Research, spec, tickets covering the manifest |
| 3. Run | Export and live-audit agents in parallel | Milestones, one agent per ticket |
| 4. Verify | `verify-capture.mjs` | Parity suite, accessibility, performance, cull |
| 5. Report | `CAPTURE.md`, decisions for the owner | Final parity report, suite deleted |

## Routing

Read the routed leaf in `references/` before acting. This file has no
workflow steps.

| Signal | Leaf |
|---|---|
| `capture`, a live URL, "audit this Framer site" | `references/capture.md` |
| `create`, "rebuild", a stack named | `references/create.md` |
| `create` with no passing capture | `references/capture.md` first, then `references/create.md` |
| Neither | Ask: capture, or create from an existing capture? |

## Rules

- **Framer is read-only.** Both workflows only read the Framer project.
  Every edit lands in the user's repo.
- **Export wins on content and structure; live wins on rendering.** A
  disagreement is re-probed on live, then recorded under Conflicts. It is
  never resolved silently.
- **Measured, not invented.** Every value in a report, token table or test
  comes from the export or a live measurement, and cites which. Curves and
  rates are sampled numbers.
- **Breakpoint edges.** Capture and compare at both sides of every
  breakpoint, computed from the manifest (`verify-capture.mjs --widths`),
  plus each canvas width and 1440, 1200, 1024, 810, 390.
- **The capture is one folder.** `manifest.json`, `CAPTURE.md`, `export/`,
  `live/`, `notes/`. Scripts ship inside it with relative paths, so it can
  be regenerated.
- **Sub-agents write before they return.** Findings go to a file in the
  repo; the reply names the path.
- **Decisions stay closed.** Once the user answers, the answer goes in
  `DECISIONS.md` and in every brief. A sub-agent that hits a closed
  decision reports back instead of reopening it.
