# 0.5.0

- Fix release version alignment and synchronize the extension manifest when preparing versions with npm.
- Localize import errors in all six interface languages.
- Expand installation instructions, including Developer mode, and add an English interface screenshot.

- Neutral addon-management interface; no promotional headings or demo-addon button.
- Six interface languages: Ukrainian, Russian, English, Spanish, French, Portuguese.
- Visible on/off switch with keyboard focus, state text and reload requirement.
- ZIP import/export, enable/disable, re-import updates and removal.
- Embedded libraries remain within their parent addon.
- Reorganized modules, automated unit/UI checks and reproducible release packaging.

Experimental release. Browser fixture tests do not establish compatibility with every WoW addon. Full installed-extension validation in Lasthavens remains a manual release check; see docs/VALIDATION.md in the source repository.

Extract the attached extension ZIP, open chrome://extensions, enable Developer mode, click Load unpacked and choose the extracted directory. To update, replace files in the installed directory, click Reload on the extension card, reopen the manager and reload the game when ready.
