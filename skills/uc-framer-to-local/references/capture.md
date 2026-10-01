# Capture Framer Site

Audit a published Framer site and capture it as data: the Framer project
exported to JSON, the live site measured, one report joining the two. You
are the orchestrator. Two sub-agents do the capture.

`{capture}` is the capture folder, default `docs/framer-capture/` in the
current repo. `{verify}` is the absolute path to
`scripts/verify-capture.mjs` under this skill's base directory. Resolve it
once and pass the absolute path to sub-agents.

## 1. Intake

Ask for what you can't find yourself: the live URL, and access to the
Framer project (the user's Framer account must be able to open it). Confirm
the capture folder.

Follow the `framer` skill's setup: run `npx @framer/agent@latest setup` if
the skill isn't installed, then `project list` and `session new
<projectId>`, with the sandbox disabled.

**Done when** a Framer session is open on the project that publishes the URL.

## 2. Plan

Write `{capture}/manifest.json`:

```json
{
  "site": { "url": "", "projectId": "", "projectName": "", "cliVersion": "", "capturedAt": "" },
  "sitemap": ["every <loc> in /sitemap.xml"],
  "pages": [{
    "nodeId": "", "path": "/work/:slug", "slug": "work-detail", "draft": false,
    "collection": "for CMS templates",
    "breakpoints": [{ "name": "", "isPrimary": true, "canvasWidth": 1200, "minWidth": 1200, "mediaQuery": "", "pageEffects": false }],
    "urls": [{ "url": "", "path": "", "slug": "" }],
    "representativeUrl": "one of urls, used for motion and hover probes"
  }],
  "components": [{ "nodeId": "", "name": "", "slug": "" }],
  "collections": [{ "nodeId": "", "name": "", "slug": "", "itemCount": 0 }]
}
```

Pages come from `getNodesOfTypes(WebPageNode)` and their `$breakpoints`;
components and collections from `getNodesOfTypes` and each collection's
`getItems().length`. URL slugs are the path with `/` as `-`, `home` for `/`.
Mark a page draft when no sitemap URL maps to it.

**Done when** `node {verify} {capture} --only manifest` passes: every
sitemap URL maps to a page, and every page has one primary breakpoint with
widths.

## 3. Capture

Dispatch both agents in parallel, in the background, each with its brief
filled in:

- `references/briefs/export.md`
- `references/briefs/live-audit.md`

When one returns, run its phase: `--only export` or `--only live`. If it
fails, send the failures back to the same agent to finish the missing parts.

**Done when** both phases pass.

## 4. Report

Copy `templates/CAPTURE.md` to `{capture}/CAPTURE.md` and fill it from the
two agents' notes and the data. Each fact has one home and a source tag.

Where export and live disagree about how something renders, probe live
again before choosing. The live audit has been wrong before when its timing
was off. Record the outcome under Conflicts.

**Done when** `node {verify} {capture}` passes with every phase.

## 5. Hand off

1. Add `{capture}/live/screenshots/` to `.gitignore` unless the user wants
   the baseline committed. Either way, the Run section says how to
   regenerate it.
2. Show the user the Keep, drop or fix table and Decisions needed. These
   feed Create's intake.
3. Commit the capture.

**Done when** the capture is committed and the user has the decisions list.
