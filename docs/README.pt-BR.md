# Lasthavens Addon Manager

[English](../README.md) · [Українська](README.uk.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt-BR.md)

Gerenciador local de addons para Lasthavens 3.3.5a. Importação ZIP, ativação, desativação, atualização por nova importação, exportação e remoção. As alterações exigem recarregar o jogo.

![Lasthavens Addon Manager — English interface](images/manager-en.png)

## Instalação no Chrome

1. Abra [Releases](https://github.com/Jamba777/lasthavens-addon-manager/releases) e baixe `lasthavens-addon-manager-<version>.zip` em **Assets**.
2. Extraia o ZIP para uma pasta que você manterá no computador.
3. Abra `chrome://extensions` no Chrome.
4. **Ative o Modo do desenvolvedor (Developer mode) no canto superior direito.**
5. Clique em **Carregar sem compactação (Load unpacked)** e selecione a pasta que contém `manifest.json`.
6. Abra **Lasthavens Addon Manager** pelo menu de extensões do Chrome. Você pode fixar o ícone.

> Se você baixou **Source code (zip)**, extraia o arquivo e selecione a subpasta `extension/`.

## Adicionar addons

1. Baixe um addon para **WoW 3.3.5a**.
2. Abra o gerenciador e importe o ZIP do addon.
3. Ative o addon com o interruptor.
4. **Recarregue a página do jogo** para aplicar as alterações.

Para atualizar um addon, importe o novo ZIP. Seu estado de ativação será preservado. Desativar, atualizar ou remover um addon também exige recarregar a página do jogo.

## Atualizar a extensão

Extraia a nova versão na mesma pasta de instalação. Abra `chrome://extensions` e clique no botão de recarregar no cartão da extensão. Abra novamente o gerenciador e recarregue o jogo. Extensões sem compactação não são atualizadas automaticamente.

## Armazenamento e compatibilidade

Os arquivos ficam no perfil atual do Chrome. A remoção preserva as configurações do jogo. Pastas integradas não podem ser substituídas. A compatibilidade de cada addon deve ser verificada no jogo.

| Limite                | Máximo |
| --------------------- | -----: |
| Arquivo ZIP           |  32 MB |
| Arquivo descompactado |  64 MB |
| Arquivo individual    |  16 MB |
| Biblioteca de addons  |  96 MB |

**Versão experimental:** as verificações locais automatizadas passam; a compatibilidade completa da extensão instalada com o cliente atual e addons de terceiros ainda está sendo verificada. [Status de validação](VALIDATION.md).

## Desenvolvimento e licença

[Desenvolvimento, testes e publicação](DEVELOPMENT.md). A extensão usa a [licença MIT](../LICENSE). Addons de terceiros mantêm suas próprias licenças e não estão incluídos.
