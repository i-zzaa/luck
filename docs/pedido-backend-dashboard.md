# Pedido pro backend — dashboard de produtividade da terapeuta

## Contexto

A tela "Início" do app da terapeuta (`src/pages/Home.tsx`) tem um
dashboard de produtividade: sessões no período, taxa de comparecimento,
pacientes atendidos, horas atendidas, resumos pendentes, próximas sessões
do dia.

Hoje quase tudo isso é **calculado no frontend**, reaproveitando o
endpoint que a Agenda já usa:

```
GET /evento/filtro/{dataInicio}/{dataFim}?terapeutaId={id}
```

Isso é temporário — o objetivo é que o backend devolva esses números já
prontos, e o frontend só exiba (ver `docs/pedido-backend-formatacao.md`
pro racional geral dessa mudança). O frontend **já está preparado** pra
consumir o endpoint novo abaixo assim que ele existir: se a chamada
falhar (404, endpoint ainda não implementado), ele automaticamente cai
de volta pro cálculo local, sem quebrar a tela.

## O que precisamos: endpoint novo

```
GET /terapeuta/dashboard?terapeutaId={id}&dataInicio={data}&dataFim={data}
```

`dataInicio`/`dataFim` no formato `YYYY-MM-DD`, mesma convenção de
`/evento/filtro` — **inclusivo nas duas pontas** (ver nota de contrato
abaixo).

Resposta esperada:

```jsonc
{
  "totalSessoes": 12,
  "totalPacientes": 8,
  "taxaComparecimento": 83, // inteiro, 0-100 (já em %, não fração)
  "horasAtendidas": "9h30", // string pronta pra exibir (ver formato abaixo)
  "resumosPendentes": [
    {
      "id": 123,
      "pacienteNome": "Gabriel Luis Guido",
      "data": "19/08", // já formatado DD/MM
      "horario": "10:00"
    }
  ]
}
```

### Regras de cada campo

- `totalSessoes`: contagem de eventos reais no período (exclui horários
  livres/vagos — o mesmo conceito que hoje o frontend identifica via
  `id === 0` no endpoint de eventos; ver `docs/pedido-backend-formatacao.md`
  sobre substituir esse sentinela por um campo explícito).
- `totalPacientes`: contagem de pacientes **únicos** com sessão no
  período.
- `taxaComparecimento`: `atendidos / totalSessoes * 100`, arredondado.
  `null` (ou omitir o campo) se não houver sessão no período.
- `horasAtendidas`: soma da duração de todas as sessões do período,
  formatada como string pronta pro frontend (`"9h30"`, `"9h"` se minutos
  = 0). Se preferirem devolver em minutos (número) em vez de string
  formatada, também funciona — falem qual formato é mais natural pro
  backend que eu ajusto o consumo no frontend.
- `resumosPendentes`: sessões com `statusEventos` de atendimento e sem o
  campo `resumo` preenchido (nulo, vazio ou só espaço em branco) na
  sessão associada. **Esse é o único item que não dá pra calcular hoje
  só com `/evento/filtro`** — o campo `resumo` mora no registro da
  sessão (`GET /sessao/:id`), não no evento, e buscar sessão por sessão
  pra descobrir isso seria N+1 requisições.

## O que muda no frontend quando isso existir

Nada — já está pronto. `src/pages/Home.tsx` chama esse endpoint em
paralelo à busca de eventos; se vier resposta válida, usa os campos
acima; se falhar, calcula localmente como já fazia. Quando o backend
confirmar que o endpoint está no ar, aviso pra eu poder remover o
cálculo local e o mock (`src/pages/home/mockDashboard.ts`).
