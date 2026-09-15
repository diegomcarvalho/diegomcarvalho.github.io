# WhatsApp Agendado via TickTick (PWA)

PWA estático que gera uma tarefa no TickTick contendo o link `wa.me` (com número e mensagem já preenchidos), agendada para notificar no horário escolhido. Quando a notificação chegar, você abre a tarefa, toca no link e o WhatsApp abre com a conversa e a mensagem prontas — falta só tocar em **Enviar**.

Não há backend: tudo roda no navegador. O token de acesso à API do TickTick fica salvo apenas no `localStorage` do seu dispositivo.

## Arquivos

- `index.html` — formulário (contato, mensagem, data/hora, lembrete).
- `app.js` — lógica: monta a URL do WhatsApp e chama a API do TickTick.
- `manifest.json` — metadados do PWA (permite "Adicionar à tela inicial").
- `service-worker.js` — cache offline dos arquivos estáticos.
- `icon.svg` — ícone do app.

## 1. Gerar o token da API do TickTick

Não é necessário implementar OAuth2. Use o **Personal API Token**:

1. Acesse [ticktick.com/webapp](https://ticktick.com/webapp/) e faça login.
2. Clique no seu avatar (canto superior esquerdo) → **Settings** → **Account** → **API Token**.
3. Gere e copie o token. Trate-o como uma senha: ele dá acesso total à sua conta.

## 2. Publicar no GitHub Pages

```bash
git init
git add .
git commit -m "PWA WhatsApp agendado via TickTick"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/whats-ticktick-pwa.git
git push -u origin main
```

No repositório no GitHub: **Settings → Pages → Branch: main → / (root) → Save**.
O app ficará disponível em `https://SEU_USUARIO.github.io/whats-ticktick-pwa/`.

## 3. Testar o CORS da API do TickTick

A TickTick Open API pode ou não aceitar chamadas `fetch()` diretas de um domínio de terceiros (CORS). Teste assim que publicar:

1. Abra o PWA publicado no navegador.
2. Cole o token, clique em **Carregar minhas listas**.
3. Se aparecer a lista de projetos, o CORS está liberado e o app funciona 100% client-side.
4. Se der erro (`Failed to fetch` ou similar no console do navegador), a API está bloqueando chamadas cross-origin. Nesse caso, será necessário um pequeno proxy serverless (Cloudflare Workers, Vercel Function, etc.) que repasse as requisições para `api.ticktick.com`, escondendo inclusive o token do lado do cliente se desejado.

## 4. Instalar como app no Android

1. Abra a URL do GitHub Pages no Chrome do Android.
2. Menu (⋮) → **Adicionar à tela inicial** / **Instalar app**.
3. O PWA passa a abrir em modo standalone, como um app nativo.

## 5. Seleção de contatos

O botão "Selecionar da agenda" usa a `Contact Picker API` (`navigator.contacts.select`), disponível apenas no **Chrome para Android**, exigindo HTTPS (GitHub Pages já serve em HTTPS). Em outros navegadores, o botão fica desabilitado automaticamente e você digita o número manualmente no formato `55DDDNUMERO` (sem `+`, espaços ou símbolos).

## 6. Limitações conhecidas

- O envio final da mensagem no WhatsApp continua exigindo um toque manual em "Enviar" — não há API pública para automatizar esse último passo sem risco de violar os termos de uso do WhatsApp.
- O Personal API Token não expira automaticamente segundo a documentação pública, mas se for revogado ou exposto, gere um novo em Settings → Account → API Token e cole-o de novo no app.
- Se o TickTick bloquear CORS, use um proxy serverless (ver passo 3).
