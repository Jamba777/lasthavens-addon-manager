# Development and release

Node.js 22 or later. Run commands from the repository root:

```sh
npm ci
npm run check
```

`extension/` is the complete unpacked extension. `npm run build` creates a ZIP with manifest.json at its root and SHA256SUMS in `dist/`. Only extension files are packaged; tests, documentation and dependencies are excluded. The vendored fflate MIT license stays in the ZIP. No third-party WoW addons are distributed.

Modules: archive parses and validates ZIPs; library contains immutable operations; repository handles Chrome storage; i18n handles locale selection; manager binds the UI; bridge transfers enabled addon data; loader and runtime-core provide the game overlay. Avoid extra class hierarchies for these small modules. Keep DOM output through textContent and avoid evaluating imported addon code in extension pages.

## GitHub setup

Upload the contents of this repository directory, including `.github/`, package.json and package-lock.json. CI runs formatting, unit tests and packaging on pushes and pull requests.

Releases run when a **new version tag is pushed**, not on ordinary pushes to main. Prepare the version before creating the tag. The following command updates package.json and package-lock.json; the version hook also synchronizes extension/manifest.json:

```sh
npm version 0.5.0 --no-git-tag-version
npm run check
npm run test:browser
```

The working tree is already prepared for 0.3.1; skip the version command if it already has that version. Update docs/RELEASE.md, review and commit the changes, then tag that commit:

```sh
git add package.json package-lock.json extension/manifest.json scripts/sync-version.js scripts/build.js docs/RELEASE.md docs/DEVELOPMENT.md
git commit -m "Prepare release 0.3.1"
git tag v0.3.1
git push origin main
git push origin v0.3.1
```

For subsequent releases, choose a new version and use the same value in the npm command and tag. A tag pointing to an older commit still builds the old files; changing main and rerunning that tag will not fix a version mismatch. Do not reuse published tags. Version 0.3.0 was tagged while the project still declared 0.2.0, so its build failed before attaching assets; 0.3.1 corrects this mismatch.

The Release workflow verifies the tag/version match, checks the code, builds the extension ZIP and creates a **draft** GitHub Release with the ZIP and SHA256SUMS. Open Releases, review the draft and publish. The workflow uses GITHUB_TOKEN with contents:write; no personal token is needed. Repository policies may require enabling Actions/write permissions. Automatic building does not publish to Chrome Web Store. Unpacked extensions do not update themselves: users replace files and reload the extension.

To publish immediately instead of drafting, remove `--draft` from release.yml after reviewing your publication process. For the next version, use a new tag; the workflow deliberately does not overwrite existing releases.

## Browser checks

Unit checks are independent of a browser. UI and worker-fixture checks use Playwright with a mocked Chrome API / test network responses; they do not establish real-game compatibility. Install a test browser using `npx playwright install chromium`, then run `npm run test:browser`.

Before publishing as stable, manually load extension/ in Chrome, import an addon, start Lasthavens, verify Lua/UI, toggle off and reload, update a file without changing its byte length and reload, export and delete. Verify settings persistence and absence of Lua errors. Record the client build and results in VALIDATION.md.

## Data

Addon archives are stored in chrome.storage.local. Language preference uses a separate key. No telemetry or backend is included. The host page receives enabled addon bytes to run them. The page can affect diagnostics, which are treated as untrusted and cannot modify the stored library. Imported metadata is displayed as text. Parser error details are technical diagnostics; standard UI strings use six locale catalogs.
