# Lasthavens Addon Manager

[English](../README.md) · [Українська](README.uk.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt-BR.md)

Gestionnaire local d’addons pour Lasthavens 3.3.5a. Import ZIP, activation, désactivation, mise à jour par réimportation, export et suppression. Les changements nécessitent de recharger le jeu.

![Lasthavens Addon Manager — English interface](images/manager-en.png)

## Installation dans Chrome

1. Ouvrez [Releases](https://github.com/Jamba777/lasthavens-addon-manager/releases) et téléchargez `lasthavens-addon-manager-<version>.zip` dans **Assets**.
2. Décompressez le ZIP dans un dossier que vous conserverez sur votre ordinateur.
3. Ouvrez `chrome://extensions` dans Chrome.
4. **Activez le Mode développeur (Developer mode) en haut à droite.**
5. Cliquez sur **Charger l’extension non empaquetée (Load unpacked)** et sélectionnez le dossier contenant `manifest.json`.
6. Ouvrez **Lasthavens Addon Manager** depuis le menu des extensions de Chrome. Vous pouvez épingler son icône.

> Si vous avez téléchargé **Source code (zip)**, décompressez-le et sélectionnez le sous-dossier `extension/`.

## Ajouter des addons

1. Téléchargez un addon pour **WoW 3.3.5a**.
2. Ouvrez le gestionnaire et importez le ZIP de l’addon.
3. Activez l’addon avec l’interrupteur.
4. **Rechargez la page du jeu** pour appliquer les changements.

Pour mettre à jour un addon, importez son nouveau ZIP. Son état d’activation est conservé. La désactivation, la mise à jour et la suppression nécessitent aussi de recharger la page du jeu.

## Mettre à jour l’extension

Décompressez la nouvelle version dans le même dossier d’installation. Ouvrez `chrome://extensions` et cliquez sur le bouton de rechargement de la fiche de l’extension. Rouvrez le gestionnaire et rechargez le jeu. Les extensions non empaquetées ne se mettent pas à jour automatiquement.

## Stockage et compatibilité

Les fichiers restent dans le profil Chrome actuel. La suppression conserve les réglages du jeu. Les dossiers intégrés ne peuvent pas être remplacés. La compatibilité de chaque addon doit être vérifiée dans le jeu.

| Limite                | Maximum |
| --------------------- | ------: |
| Archive ZIP           |   32 MB |
| Archive décompressée  |   64 MB |
| Fichier individuel    |   16 MB |
| Bibliothèque d’addons |   96 MB |

**Version expérimentale :** les vérifications locales automatisées réussissent ; la compatibilité complète de l’extension installée avec le client actuel et les addons tiers reste à vérifier. [État de validation](VALIDATION.md).

## Développement et licence

[Développement, tests et publication](DEVELOPMENT.md). L’extension est distribuée sous [licence MIT](../LICENSE). Les addons tiers conservent leurs propres licences et ne sont pas inclus.
