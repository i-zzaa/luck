# Pedido pro backend — dashboard de produtividade da terapeuta

## Contexto

A tela "Início" do app da terapeuta (`src/pages/Home.tsx`) ganhou um
dashboard de produtividade: sessões no período, taxa de comparecimento,
pacientes atendidos, próximas sessões do dia. Todos esses números já são
calculados no frontend a partir do endpoint que a Agenda já usa hoje:

```
GET /evento/filtro/{dataInicio}/{dataFim}?terapeutaId={id}
```

**Só uma coisa do dashboard não dá pra calcular com o que já existe:**
quais sessões já foram atendidas mas ainda estão sem o campo "Resumo"
preenchido. Por enquanto isso está **mockado** no frontend
(`src/pages/home/mockDashboard.ts`) — a lista mostrada é fixa/de exemplo,
não reflete dado real.

## Por que isso não dá pra fazer só no frontend

O campo `resumo` mora no registro da sessão (`GET /sessao/:id`), não no
evento em si. Pra saber quais sessões atendidas estão sem resumo, o
frontend precisaria buscar o registro da sessão de cada evento com
`statusEventos.nome === "Atendido"` no período, um por um (N+1
requisições) — inviável de fazer em toda visita à tela.

## O que precisamos

**Opção preferida (menor mudança):** incluir um campo booleano em cada
item já retornado por `GET /evento/filtro/{dataInicio}/{dataFim}`,
indicando se a sessão associada àquele evento está sem resumo:

```jsonc
{
  "id": 123,
  "title": "Gabriel Luis Guido",
  "statusEventos": { "nome": "Atendido" },
  // ...demais campos que o endpoint já devolve hoje
  "resumoPendente": true // novo campo
}
```

Regra: `resumoPendente` só faz sentido (`true`) quando
`statusEventos.nome === "Atendido"` **e** a sessão associada não tem
`resumo` preenchido (nulo, vazio ou só espaços em branco). Para qualquer
outro status (`Falta`, `Confirmado`, etc.), pode vir `false` ou nem
aparecer.

**Alternativa, se o campo acima for inviável de calcular no mesmo
endpoint:** um endpoint dedicado, mais simples de implementar de forma
isolada:

```
GET /sessao/sem-resumo?terapeutaId={id}&dataInicio={data}&dataFim={data}
```

Resposta:

```jsonc
[
  {
    "id": 123,
    "pacienteNome": "Gabriel Luis Guido",
    "data": "2026-08-19",
    "horario": "10:00"
  }
]
```

Qualquer uma das duas opções resolve — a primeira evita mais uma chamada
de rede na tela; a segunda pode ser mais rápida de implementar se a
consulta de resumo pendente for cara de acoplar ao endpoint de eventos.

## O que muda no frontend quando isso existir

Troca pontual em `src/pages/Home.tsx`: em vez de
`getMockSessoesSemResumo()`, ler `resumoPendente` direto dos eventos já
buscados (opção 1) ou chamar o novo endpoint (opção 2). O restante do
dashboard (sessões, comparecimento, pacientes, próximas sessões) já usa
dado real e não precisa de nenhuma mudança.
