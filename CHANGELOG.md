# Changelog

## 0.1.0 (2026-10-01)

First standalone release. The skill came out of the
`unknown-creatives-studio` plugin, where it shipped as `framer-site`.

- Renamed the skill and plugin to `uc-framer-to-local`.
- The capture and create workflows now find `verify-capture.mjs` through the
  skill's base directory, not `${CLAUDE_PLUGIN_ROOT}`. The skill works the
  same installed as a plugin or copied into a skills folder.
- Added a plugin manifest and a single-plugin marketplace, so the repo
  installs with `/plugin marketplace add`.
- Added tests for `verify-capture.mjs`: manifest pass and fail, the
  breakpoint-edge width matrix, and an empty phase failing.
