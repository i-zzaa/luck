# Pedido pro backend — push notification (sessão cancelada / aguardando na recepção)

## Contexto

Objetivo: a terapeuta recebe uma notificação push no celular quando uma
sessão dela for cancelada (ou algo equivalente a "não vai ter sessão") e
quando o status virar "Aguardando na recepção" — mesmo com o app fechado.

O **frontend já está pronto** do lado que só ele consegue fazer:

- Pedido de permissão de notificação (banner em `src/pages/Home.tsx`,
  dispensável, só aparece se o navegador suportar push).
- Inscrição no `PushManager` do navegador e envio da inscrição pro
  backend guardar (`src/util/pushNotifications.ts`).
- Service worker (`src/sw.ts`) escutando os eventos `push` (mostra a
  notificação) e `notificationclick` (foca/abre o app na rota certa).

**O que só o backend consegue fazer** (é estrutural do protocolo Web
Push, não dá pra mover pro cliente):

1. Gerar o par de chaves VAPID (privada fica só no servidor).
2. Guardar as inscrições (`PushSubscription`) por terapeuta.
3. Decidir **quando** enviar (cancelamento de sessão, mudança de status
   pra "aguardando na recepção") — é o servidor que sabe quando esses
   eventos acontecem de verdade, o cliente só reage ao que chega.
4. Efetivamente disparar o envio via protocolo Web Push (biblioteca
   `web-push` no Node, `pywebpush` no Python, ou equivalente).

## 1. Gerar e expor a chave pública VAPID

```
npx web-push generate-vapid-keys
```

Guardar a chave **privada** só no backend (variável de ambiente, nunca
versionada). A chave **pública** o frontend precisa receber — mais
simples é só documentar pra colar em `.env`:

```
VITE_VAPID_PUBLIC_KEY=<chave pública gerada>
```

(o frontend já lê essa variável — `src/util/pushNotifications.ts` — e o
banner de "Ativar notificações" só aparece quando ela existir).

## 2. Endpoint pra guardar a inscrição

```
POST /push/subscribe
```

Body (exatamente o que `PushSubscription.toJSON()` do navegador
produz, sem nenhum tratamento extra do frontend):

```jsonc
{
  "terapeutaId": 42,
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

Guardar associado ao `terapeutaId` — uma terapeuta pode ter mais de uma
inscrição (celular + notebook, por exemplo), então é `1:N`, não
substituir a anterior.

```
DELETE /push/subscribe?terapeutaId=42&endpoint=<endpoint>
```

Remove uma inscrição específica (chamado quando o usuário desativa, ou
quando um envio falhar permanentemente — endpoint expirado/revogado é
comum e o backend deve limpar ao detectar erro 404/410 do serviço de
push, não é bug nosso).

## 3. Payload do envio (o que o service worker espera)

Quando o backend disparar o push (via `web-push.sendNotification(...)`
ou equivalente), o corpo deve ser um JSON com este formato — é
exatamente o que `src/sw.ts` lê no evento `push`:

```jsonc
{
  "title": "Sessão cancelada",
  "body": "A sessão de Ana Clara Souza às 14:00 foi cancelada.",
  "url": "/agenda", // rota que abre/foca quando clica na notificação
  "tag": "sessao-123" // opcional — mesma tag substitui notificação anterior em vez de empilhar
}
```

- `title`/`body`: texto já pronto, o frontend só exibe (mesmo princípio
  do resto do projeto — ver `docs/pedido-backend-formatacao.md`).
- `url`: pra onde o app navega ao clicar. Sugestão: `/agenda` por
  enquanto (não existe rota de "sessão específica" navegável direto por
  id ainda); se fizer sentido levar direto pra tela da sessão no
  futuro, é só mandar essa URL diferente — o frontend não precisa mudar.

## 4. Quando disparar

| Evento | Gatilho no backend |
|---|---|
| Sessão cancelada / "não vai ter sessão" | No momento em que o status do evento muda pra esse estado (cancelamento, falta reportada antecipadamente, etc — o que já existir como conceito no backend) |
| Status vira "Aguardando na recepção" | No momento em que `statusEventos` do evento muda pra esse valor |

**Observação importante:** hoje o frontend (`STATUS_EVENTS` em
`src/constants/schedule.ts`) só conhece `Atendido`, `Atestado`, `Livre`,
`Confirmado` — não existe ainda um código estável pra "cancelado" nem
pra "aguardando na recepção" no contrato atual. Isso amarra com o
pedido já feito em `docs/pedido-backend-formatacao.md` (item 1:
`statusEventos.codigo` estável) — se esses dois status ainda não
existirem como conceito formal no backend, precisam ser criados lá
primeiro (nome + código estável) antes de dar pra disparar o push no
momento certo.

Buscar, no momento do evento, todas as `PushSubscription` do
`terapeutaId` responsável por aquela sessão e mandar o push pra cada
uma (uma terapeuta pode ter várias inscrições ativas).

## 5. Resumo do que falta só no backend

- [ ] Gerar par de chaves VAPID, expor a pública pro frontend
- [ ] `POST /push/subscribe` (guardar inscrição por terapeuta)
- [ ] `DELETE /push/subscribe` (remover inscrição)
- [ ] Definir/confirmar código estável de status pra "cancelado" e
      "aguardando na recepção" (se ainda não existirem)
- [ ] Disparar push (biblioteca Web Push do lado do servidor) nos dois
      gatilhos acima, com o payload no formato da seção 3
- [ ] Limpar inscrições mortas quando o envio retornar 404/410

## O que muda no frontend quando isso existir

Só a variável de ambiente `VITE_VAPID_PUBLIC_KEY` — assim que ela
existir, o banner "Ativar notificações" passa a aparecer sozinho pra
quem ainda não decidiu (permissão do navegador em estado "default").
Nenhum outro código muda.
