# uc-framer-to-local

A Claude Code skill that moves a Framer site into a codebase you own. It
runs in two passes:

- **Capture** exports the Framer project to JSON and measures the published
  site with Playwright at every breakpoint edge. It joins the two in one
  `CAPTURE.md`, and every value in it is tagged with where it came from.
- **Create** rebuilds the captured site in the stack you pick. It plans
  tickets that cover every page, component and CMS collection, then checks
  the result against the live site with a temporary parity suite.

Framer stays read-only the whole time. Every write lands in your repo.

## Requirements

- Claude Code.
- A Framer account that can open the project behind the site. Capture
  can't run without it. Check with `npx @framer/agent@latest project list`.
- The `framer` skill, installed by `npx @framer/agent@latest setup`.
- Node 22 or newer, and Playwright for the live audit.
- Permission to run commands outside the sandbox. The Framer CLI needs the
  network and its relay, and Chromium fails certificate checks on macOS
  when it runs inside the sandbox.

## Install

As a plugin, from inside Claude Code:

```
/plugin marketplace add doterodesign/uc-framer-to-local
/plugin install uc-framer-to-local@uc-framer-to-local
```

As a plain skill, copy the skill folder into your user or project skills:

```bash
git clone https://github.com/doterodesign/uc-framer-to-local.git
```

```bash
cp -R uc-framer-to-local/skills/uc-framer-to-local ~/.claude/skills/
```

## Use

Run it from the repo the site should end up in. Installed as a plugin, the
command is `/uc-framer-to-local:uc-framer-to-local`. Installed as a plain
skill, it's `/uc-framer-to-local`.

```
/uc-framer-to-local capture https://your-site.com/
/uc-framer-to-local create docs/framer-capture/
```

Capture writes one folder, `docs/framer-capture/` by default:

```
manifest.json   routes, per-page breakpoints, components, collections
CAPTURE.md      the joined report, 17 sections, with a decisions list at the end
export/         the Framer project as JSON, plus the scripts that produced it
live/           metadata, computed styles, screenshots, motion and hover samples
notes/          each capture agent's findings
```

Create starts by asking 17 intake questions (stack, CMS, hosting, what
"1:1" means per axis, keep or drop for each capture finding). It records
the answers in `DECISIONS.md` and builds nothing until you've answered them.

## How it checks itself

Each step ends on a check that can fail. `scripts/verify-capture.mjs`
gates the capture:

```bash
node skills/uc-framer-to-local/scripts/verify-capture.mjs docs/framer-capture
```

```bash
node skills/uc-framer-to-local/scripts/verify-capture.mjs docs/framer-capture --widths
```

The first command checks that every sitemap URL maps to a page, every
breakpoint edge has screenshots and computed styles on both sides, CMS item
counts match the project, and every report section has content. `--only
manifest|export|live|report` runs one phase. `--widths` prints the width
matrix the live audit captures at.

## Layout

```
skills/uc-framer-to-local/
  SKILL.md                routing and rules
  references/capture.md   the capture workflow
  references/create.md    the rebuild workflow
  references/intake.md    the 17 create-intake questions
  references/parity.md    the parity suite, tolerances and approvals
  references/briefs/      prompts for the export and live-audit sub-agents
  scripts/verify-capture.mjs
  templates/CAPTURE.md
test/                     verify-capture tests against a fixture manifest
```

## Develop

```bash
npm test
```

## License

MIT. See [LICENSE](LICENSE).
