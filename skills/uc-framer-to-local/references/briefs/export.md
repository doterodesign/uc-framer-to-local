# Brief: Framer export

Send this to the export agent with the placeholders filled. `{capture}` is
the absolute capture folder.

---

You are exporting a Framer project as data so a team can rebuild the site
1:1. This is read-only. Use only read methods: `framer.agent.getContext`,
`getNodesOfTypes`, `listComponents`, `serialize`, `serializeNodes`,
`readComponentControls`, `getNode`, and the plugin getters. If a call could
change the project, leave it out.

## Setup already done

- Framer CLI session `{session}` is open on project `{projectId}`
  ("{projectName}"). Pass `-s {session}` to every call.
- The page and component list is in `{capture}/manifest.json`. Export every
  page, component and collection it names, using its slugs for file names.
- Run every `npx @framer/agent@latest` call with the sandbox disabled: it
  needs the network and the relay. Run it from a working folder under
  `os.tmpdir()`.
- `exec` runs JS in a VM with `framer`, `state`, `fs`, `path`, `os` and
  `fetch`, and no `process`. Inside exec, build paths from `os.tmpdir()`.
  That folder is not the sandboxed shell's `$TMPDIR`, so resolve it once
  (`exec` printing `os.tmpdir()`) and use the absolute path in shell calls.
- Read the `framer` skill's `SKILL.md`, then in the project's `prompt/`
  folder: `tools.md` § Tree Inspection APIs, and `how-projects-work.md` §§
  Scope Types, Components, Layout Templates, CMS and breakpoints. Use
  `npx @framer/agent@latest docs <Name>` for plugin API signatures.

## Method

Write every large result straight to a file with `fs.writeFileSync` and
print only its length. Nothing gets truncated that way. Cache slow results
in `state`.

1. **Inventory.** `getNodesOfTypes` for CollectionNode, ComponentNode,
   LayoutTemplateNode, WebPageNode, ColorStyleTokenNode, TextStylePresetNode,
   LinkStylePresetNode, RedirectNode; then `listComponents()`.
2. **Styles.** `framer.getColorStyles()`, `framer.getTextStyles()`, and
   `serializeNodes` on every preset id with `ancestorPath: true`. The plugin
   API pairs text style values with the wrong breakpoints. Use the
   serializer's `breakpoint.{default,medium,small}` and check it against the
   live preset CSS (`.framer-styles-preset-<hash>` under each `@media`).
3. **CMS.** `getCollections()`, then `getFields()` and `getItems()` per
   collection. Store `getItems().length` in the raw file. Also `serialize`
   each collection at depth 10.
4. **Pages and components.** `serialize({ id, depth: 100 }, { pagePath })`
   for every page, `serialize({ id, depth: 100 })` for every component.
   Replicas (other breakpoints, variants, gesture variants) come back beside
   the primary with `$originalId`. Diff each replica against its primary to
   get per-breakpoint and per-variant overrides. Skip canvas-position keys
   on the replica root: top, left, right, bottom, centerAnchorX/Y,
   constraintsLocked.
5. **Effects.** Per page, `serializeNodes` over every Frame, RichText,
   ComponentInstance and SVG node with an `attributeFilter` of appearEffect,
   styleTransformEffect, textEffect, loopEffect, scrollVariantEffect,
   parallaxEffect, tapEffect, hoverEffect, pageEffects, positionStickyTop,
   dragEffect, tickerEffect, customCursor, transition, codeOverride.
6. **Controls and settings.** `readComponentControls` for every local,
   external and code component in use. `getProjectInfo`, `getPublishInfo`,
   `getCustomCode`, `getRedirects`, `getLocales`, `getCodeFiles`, and
   `serialize({ id: 'rootNode', depth: 1 })` for site metadata.
7. **Fonts and SVGs.** `getFonts()` doesn't list custom fonts: take their
   file URLs from the text styles and the live `@font-face` rules. For each
   primary SVGNode, `getNode(id).svg`, falling back to `exportSVG`.
8. **Derive.** Write one derive script that builds every file below from
   `_raw/`. Compute every value in it. A value typed by hand from reading
   the HTML can't be regenerated.

## Output

Everything under `{capture}/export/`:

- `_raw/`: untouched API output
- `pages/<slug>.json`: breakpoints (name, canvasWidth, mediaQuery, isPrimary,
  pageEffects), breakpointOverrides, hardcodedText, hardcodedImagesAndSvgs,
  componentInstances (literal vs CMS-bound controls), links,
  effectsAndInteractions, cmsBindings, collectionLists, tree
- `components/<slug>.json`: propertyControls, variants (with gesture and
  transition), variantOverrides, usedIn, hard-coded content, tree
- `components/_external-and-code-components.json`, `components/code/*`
- `cms/<slug>.json`: collection (with itemCount), fields, every item
- `styles/text-styles.json`, `styles/color-styles.json` (with the raw color
  frequency table), `fonts.json`, `site-settings.json` (with `redirects`
  and `locales`, even if empty), `assets.json` (every framerusercontent URL,
  once, with every place it's used)
- `scripts/`: the exec JS you ran and the derive script, with paths
  relative to the capture folder

## Flag as you go

These become rows in `CAPTURE.md`:

- Hard-coded content on the canvas, per page, with its hidden flags.
- Anything the API couldn't give (CMS image alt text comes back null;
  custom code set outside plugins isn't readable; marketplace component
  internals expose controls only).
- Keep/drop candidates: hidden layers, template leftovers, empty CMS items,
  orphaned tokens, legacy presets, draft pages.
- Text styles whose bold or italic font is empty.
- Every per-breakpoint color or type override, not only layout ones.

## Done when

`node {verify} {capture} --only export` passes. Then write your findings to
`{capture}/notes/export.md` and reply with that path and a summary under
300 words. Write prose without em dashes.
