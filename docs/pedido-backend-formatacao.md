# Pedido pro backend — parar de formatar/classificar dado no frontend

## Contexto

Princípio que estamos adotando: **o frontend só exibe dado, não deveria
formatar, classificar nem calcular nada que seja regra de negócio.**
Isso hoje não é o caso em vários pontos do app — o frontend adivinha
cor de status a partir de texto livre, decide qual local mostrar
baseado numa flag, calcula agregados de produtividade, etc.

Fizemos um levantamento completo do projeto (formatação de data,
classificação de status/especialidade, cálculos de agregação, regras
condicionais de exibição, reestruturação de dado — inclusive as árvores
de protocolo, que também entram na mesma regra — e, à parte, um ponto de
segurança na autenticação) e migramos tudo o que deu pra mover com
segurança. Este documento lista exatamente o que precisamos do backend
pra cada item.

**Como o frontend está lidando com a transição:** todo item abaixo já
foi tratado no frontend de um jeito que não depende do backend entregar
primeiro:

- Onde dava pra checar um campo novo e cair num cálculo local se ele não
  vier (itens 1-6), foi implementado exatamente assim — **fallback
  temporário**, nada quebra até o backend entregar, e quando entregar o
  app passa a usar o valor pronto automaticamente, sem precisar de outro
  deploy do frontend.
- Onde a mudança é reestruturação de árvore de dado (itens 7-8), a
  função que faz isso no cliente é **idempotente** — processar um dado
  que já chega pronto no formato final não faz nada de errado. Por isso
  não precisou de nenhuma mudança de código agora, só a especificação
  exata do formato que o backend deve entregar.

Depois que o backend confirmar que cada item está no ar, fazemos uma
segunda passada pra remover o cálculo/transformação local (vira código
morto, mas não atrapalha até lá).

---

## Pedidos

### 1. `statusEventos.codigo` — status como enum estável, não só texto livre

Hoje o frontend decide a cor/categoria do status (Falta = vermelho,
Atestado = amarelo, Atendido = cinza) fazendo `.toLowerCase().includes()`
no campo `statusEventos.nome` — um texto livre que pode mudar de
pontuação/capitalização a qualquer momento e quebrar esse matching
silenciosamente.

**Pedido:** incluir um campo `codigo` estável (ex.: `"falta"`,
`"atestado"`, `"atendido"`, `"confirmado"`) dentro do objeto
`statusEventos`, em todo endpoint que já devolve esse objeto hoje
(`/evento/filtro`, e qualquer outro que devolva evento/sessão):

```jsonc
"statusEventos": { "codigo": "falta", "nome": "Falta" }
```

`nome` continua existindo (é o que aparece pro usuário), `codigo` é só
pra lógica.

### 2. `especialidade.codigo` — sigla estável, não só nome livre

Mesmo problema, pra especialidade — e esse aqui era mais grave do que
parecia: existiam **quatro implementações independentes** da mesma
lógica "nome da especialidade → cor" espalhadas pelo projeto
(`useBorderColorClass` pra borda de card, `Tag` pro chip da fila de
pacientes, `setColorChips` pro MultiSelect de especialidade, e uma
função `corEspecialidade` que nem chegava a ser usada). Três delas só
faziam correspondência por **igualdade exata de sigla** — se a API
mandasse o nome completo (`"Terapia Ocupacional"` em vez de `"TO"`), a
tag/chip nunca casava e caía silenciosamente na cor cinza padrão, sem
erro nenhum pra avisar que algo estava errado. Já corrigimos isso no
frontend (consolidamos numa função só, com fallback por substring), mas
o campo `codigo` do backend elimina de vez a necessidade de adivinhar.

**Pedido:** incluir um campo `codigo` estável no objeto `especialidade`
(`"TO"`, `"FONO"`, `"PSICO"`, `"PSICOPEDAG"`, `"MOTRICIDADE"`,
`"MUSICOTERAPIA"`) em **todo** endpoint que devolve esse objeto hoje —
eventos, especialidades da fila/vaga, opções do MultiSelect de
especialidade, etc.:

```jsonc
"especialidade": { "codigo": "TO", "nome": "Terapia Ocupacional" }
```

### 3. `localExibicao` — string pronta de "onde foi a sessão"

Hoje o frontend decide entre mostrar `localidade.nome` ou
`localExternoDescricao` baseado na flag `isExterno`, e concatena o `km`
manualmente quando é externo (`"Casa do paciente - 12km"`). É uma regra
de negócio pequena, mas ainda assim é regra.

**Pedido:** incluir um campo `localExibicao` já pronto, com a regra
aplicada e o km já formatado quando fizer sentido:

```jsonc
"localExibicao": "Casa do paciente - 12km"
```

Enquanto esse campo não vier, o frontend continua aplicando a regra
`isExterno ? localExternoDescricao : localidade.nome` como hoje.

### 4. Endpoint de dashboard agregado

Já está em documento separado, mais detalhado, porque envolve endpoint
novo (não só campo novo em endpoint existente): ver
`docs/pedido-backend-dashboard.md`.

### 5. `tipo: "livre" | "agendado"` — em vez do sentinela `id === 0`

Em vários pontos (`Schedule.tsx`, `Home.tsx`) o frontend interpreta um
evento com `id === 0` como "vaga livre, não é sessão real". É uma
convenção implícita do contrato de API — funciona, mas nada garante que
um evento real nunca terá `id === 0` por algum motivo (migração de
dados, id temporário, etc.), e nada no contrato documenta essa regra.

**Pedido:** incluir um campo explícito `tipo` em cada item de
`/evento/filtro`: `"livre"` pros horários vagos, `"agendado"` (ou
qualquer outro valor) pros eventos reais.

```jsonc
{ "id": 1234, "tipo": "agendado", /* ...resto do evento... */ }
```

Enquanto esse campo não vier, o frontend continua usando `id === 0` como
critério (`src/util/evento.ts: isSlotLivre`).

### 6. `temSessaoRegistrada` / `sessaoBloqueada` — decisões de fluxo prontas

Dois pontos onde o frontend hoje **decide fluxo** (não só aparência)
comparando a data do evento com "agora" (relógio do navegador):

- **Ao abrir uma sessão** (`useSessionForm.ts`): decide se busca
  `GET /sessao/:id` (assume que já existe registro) ou parte pro fluxo
  de sessão nova, usando a heurística "atendido OU data já passou". Essa
  heurística pode estar errada — ex.: uma sessão de 3 dias atrás que o
  terapeuta nunca chegou a abrir não tem registro nenhum, mas a
  heurística assume que tem.

  **Pedido:** incluir um campo booleano `temSessaoRegistrada` no evento,
  indicando se já existe um registro de sessão de verdade pra ele.

- **Na Agenda** (`Schedule.tsx`): decide se o card é clicável (pode abrir
  a tela de Sessão) combinando "sessão passada e nunca atendida" com
  `statusEventos.atender === false`.

  **Pedido:** incluir um campo booleano `sessaoBloqueada` no evento, já
  com essa decisão pronta.

```jsonc
{
  "id": 1234,
  "temSessaoRegistrada": true,
  "sessaoBloqueada": false
  /* ...resto do evento... */
}
```

Ambos os campos já têm fallback implementado (`src/util/evento.ts`) — se
não vierem, o frontend cai na heurística atual, idêntica à de antes
dessa mudança.

**Fora do escopo desses dois campos, propositalmente:** a escolha de
qual BOTÃO mostrar no card ("Pesquisar" / "Atendido" / "Não Atendido")
continua sendo calculada no cliente por enquanto — é decisão só de
rótulo/aparência (não muda qual endpoint é chamado nem bloqueia
navegação), e o botão "Pesquisar" hoje funciona de forma independente do
bloqueio de clique do card. Migrar isso também dá pra fazer depois, mas
não estava no caminho crítico dessa leva.

### 7. Árvores de protocolo já no formato final (Manual/VB-MAPP/Portage/Manutenção)

O frontend reconstrói recursivamente a árvore que vem da API
(`useSessionForm.ts: transformGenericNode`/`transformVBMappNode`),
normalizando formatos diferentes de `children`/`subitems` e preenchendo
"slots" vazios até um total fixo (10 pra atividade/VB-MAPP/Portage, 1
pra manutenção). Isso é reestruturação de dado de verdade, não só
formatação — e por isso não tinha entrado no pedido inicial.

**Por que dá pra pedir isso com segurança agora:** as duas funções são
**idempotentes** em relação ao próprio formato de saída delas — se o nó
já chegar exatamente no formato abaixo, elas o devolvem sem alteração
nenhuma (verificado lendo o código com atenção; recomendo uma checagem
manual rápida quando o backend entregar, já que isso não foi testado ao
vivo). Ou seja: **não precisei mudar nada no frontend agora.** Quando o
backend passar a mandar a árvore já pronta nesse formato, o app já
funciona sem esperar outro deploy — e depois disso confirmado, fazemos
uma segunda passada só pra apagar a função de transformação, que vira
código morto.

**Formato esperado, por nó da árvore** (recursivo — mesma estrutura em
qualquer profundidade):

```jsonc
{
  "key": "123",             // string
  "label": "Nome do item",  // string
  "estimuloDiscriminativo": "",       // string, "" se não tiver
  "estimuloReforcadorPositivo": "",   // string, "" se não tiver
  "resposta": "",                     // string, "" se não tiver
  "children": [
    // OU um array de até 10 posições com o valor de cada tentativa
    // (string curto tipo "+"/"-"/etc., ou null pras posições ainda
    // não preenchidas) — isso é uma FOLHA;
    // OU um array de nós aninhados no mesmo formato — isso é um nó
    // interno (galho).
  ]
}
```

Regras:
- O tamanho fixo do array de slots numa folha é **10** para
  Manual/Portage/VB-MAPP, e **1** para Manutenção.
- Pra VB-MAPP especificamente, cada subitem folha também carrega
  `"permiteSubitens": true | false`.
- Se um nó não tiver filhos, `children` vem como array de slots vazios
  (`null` repetido), não como array vazio `[]` nem `undefined`.

### 8. Árvore de Metas já filtrada por exclusão

O frontend poda a árvore de metas (`Metas.tsx:
filterExcludedNode`/`buildFilteredTreeNodes`), removendo os itens cuja
`key` já está marcada como "em manutenção" — recursivamente, em
qualquer profundidade.

Mesmo caso do item 7: a função é idempotente quando o conjunto de
exclusão é vazio (é literalmente o que ela já assume — sem exclusão,
devolve a árvore inteira sem tocar em nada). **Não precisei mudar nada
no frontend.**

**Pedido:** o endpoint que devolve a árvore de metas (Manual/VB-MAPP/
Portage) aceitar um parâmetro opcional com as keys a excluir, e devolver
a árvore já podada:

```
GET /protocolo/meta/filtro?...&excludeKeys=101,205,310
```

Enquanto esse parâmetro não existir, o frontend continua pedindo a
árvore inteira e filtrando no cliente, exatamente como hoje — e mesmo
depois de existir, o filtro do cliente pode continuar ali como camada de
segurança (rodar de novo sobre uma árvore já filtrada não faz nada,
então não tem custo real em manter).

### 9. Validação de resumo obrigatório também no servidor

Hoje só existe validação no cliente (`useSessionForm.ts:
isResumoVazio`) — impede o `submit` se o campo estiver vazio. Isso não é
"mover" formatação, é reforçar: **nunca confiar só em validação
client-side** pra uma regra que agora é obrigatória. A validação do
cliente continua existindo (é sobre UX, dar feedback imediato antes de
gastar uma requisição) — o pedido é o backend rejeitar
(400/422) uma tentativa de salvar sessão com `resumo` vazio/nulo, como
segunda camada.

### 10. Token de autenticação em cookie `HttpOnly`, não no corpo da resposta

Fora do escopo de "formatação/reestruturação de dado", mas é um pedido
que só o backend resolve: hoje o login devolve o `accessToken` no corpo
da resposta JSON, e o frontend guarda em `sessionStorage` pra reenviar
como `Authorization: Bearer <token>` em cada requisição
(`src/contexts/auth.tsx`). Qualquer script injetado na página (XSS em
qualquer dependência, extensão de navegador maliciosa, etc.) consegue
ler esse token direto do `sessionStorage` — não existe isolamento
nenhum. Já mitigamos o que dava pra mitigar só no frontend nessa rodada
(parar de guardar senha em texto plano, parar de logar o header
`Authorization` em erro), mas essa é estrutural e depende do backend.

**Pedido:** no login (e refresh de token, se existir), o backend setar
o token num cookie `HttpOnly; Secure; SameSite=Strict` (ou `Lax`, se o
fluxo de navegação exigir) em vez de devolver no corpo. O navegador
passa a mandar o cookie sozinho em toda requisição pro mesmo domínio —
JS nunca chega a ver o valor do token.

**O que muda no frontend quando isso existir:** o axios deixa de
precisar montar o header `Authorization` manualmente (passa
`withCredentials: true` e o cookie já vai sozinho), e para de guardar
token em `sessionStorage`. Isso é uma mudança maior de fluxo de auth —
quando o backend confirmar o formato do cookie, faço a migração do
frontend numa rodada dedicada, com teste manual completo do fluxo de
login/logout/expiração antes de subir.

**Consideração de infra:** exige que frontend e backend estejam no
mesmo domínio (ou subdomínios do mesmo domínio-pai, com
`Domain=.multialcance...`) pra `SameSite=Strict/Lax` funcionar sem
fricção — vale confirmar isso com quem cuida do deploy antes de
implementar.

---

Não sobrou nenhum item de "Fase 2" pendente por enquanto — os que
existiam (árvores de protocolo, filtro de Metas, validação de resumo)
foram todos pro pedido acima. Se surgir algo novo que pareça estrutural
demais pra migrar com segurança, documento aqui do mesmo jeito antes de
mexer no código.
