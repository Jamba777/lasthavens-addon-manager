# Lasthavens Addon Manager

A Chrome extension for managing local addons in the Lasthavens 3.3.5a browser client.

[Releases](https://github.com/Jamba777/lasthavens-addon-manager/releases) · [Report an issue](https://github.com/Jamba777/lasthavens-addon-manager/issues) · [Development](docs/DEVELOPMENT.md)

**Languages:** [English](README.md) · [Українська](docs/README.uk.md) · [Русский](docs/README.ru.md) · [Español](docs/README.es.md) · [Français](docs/README.fr.md) · [Português](docs/README.pt-BR.md)

![Lasthavens Addon Manager with the English interface](docs/images/manager-en.png)

## Features

- Import addon ZIPs, including archives with multiple addons and bundled libraries.
- View addon versions, sizes and dependency hints.
- Enable or disable addons with a labeled switch.
- Update addons by importing a new ZIP; export or remove them from the manager.
- Choose from six interface languages.

## Install in Chrome

1. Open [Releases](https://github.com/Jamba777/lasthavens-addon-manager/releases) and download the attached `lasthavens-addon-manager-<version>.zip` under **Assets**.
2. Extract the ZIP into a folder you will keep on your computer.
3. Open `chrome://extensions` in Chrome.
4. **Turn on Developer mode in the upper-right corner.** This reveals the installation controls.
5. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
6. Open Chrome's **Extensions** menu and click **Lasthavens Addon Manager**. You can pin it for easier access.

> Using GitHub's **Source code (zip)** download instead? Extract it and select the `extension/` folder when clicking **Load unpacked**.

## Add and manage addons

1. Download an addon intended for **WoW 3.3.5a**.
2. Open the manager and click **Import ZIP**.
3. Switch the imported addon to **Enabled**.
4. **Reload the game page** to apply the changes.

To update an addon, import its new ZIP. The manager preserves its enabled or disabled state. Disabling, updating or removing an addon also requires reloading the game page. Removing an addon preserves its game settings.

## Update the extension

Extract the new release into the same installation folder, then open `chrome://extensions` and click **Reload** on the extension card. Reopen the manager and reload the game page when ready. Unpacked extensions do not update automatically.

## Storage and compatibility

Addon files are stored locally in the current Chrome profile. Enabled addon files are passed to the game client so it can load them. Built-in addons remain managed through the game's library; their folders cannot be replaced.

| Limit               | Maximum |
| ------------------- | ------: |
| ZIP archive         |  128 MB |
| Unpacked archive    |  256 MB |
| Individual file     |   64 MB |
| Local addon library |  384 MB |

**Experimental:** automated import, UI and worker-fixture checks pass, but full installed-extension compatibility with the current game client and every third-party addon is not yet confirmed. See [validation status](docs/VALIDATION.md). When reporting a problem, include the extension version, addon name/version and error text.

## Development and license

See [development, tests and release automation](docs/DEVELOPMENT.md). The extension is distributed under the [MIT License](LICENSE). Third-party addons retain their own licenses and are not included.
