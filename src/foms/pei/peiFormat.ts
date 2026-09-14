// `selected` de um subitem do formulário, reposto pelo ID do subitem
// original (não pela posição no array — remover um subitem no meio
// deslocava a resposta dos seguintes pro subitem errado). Subitem novo
// (sem original) fica sem `selected`.
const selectedDoOriginal = (subitemsOriginais: any[] = [], id: any) => {
  const original = subitemsOriginais.find((sub: any) => sub.id === id);
  return original?.selected ? { selected: original.selected } : {};
};

// Portage continua voltando pro cadastro com a meta montada no cliente
// (state.metaEdit — ver foms/Portage.tsx): o PUT
// protocolo/portage/meta/:id/subitens do backend (item 16 do
// heron-list-nest/docs/pedido-frontend-fase2.md) só grava `subitems`/
// `selected`, e o formulário também edita procedimento de ensino,
// SD, resposta e SR+ da meta — usar o PUT perderia esses campos.
export function formatPortage(formvalue: any, metas: any[]) {
  const meta = { ...formvalue.metas[0] };
  delete formvalue.metas;
  const selectedMeta = metas[0]?.selected ? { selected: metas[0].selected } : {};

  return {
    ...formvalue,
    nome: meta.value,
    id: meta.id,
    programa: formvalue.programa.nome,
    faixaEtaria: metas[0].faixaEtaria,
    permiteSubitens: true,
    ...selectedMeta,
    subitems: meta.subitems.map((item: any) => ({
      nome: item.value,
      id: item.id,
      ...selectedDoOriginal(metas[0]?.subitems, item.id),
    })),
  };
}

// VB-MAPP: monta um corpo de PUT protocolo/vbmapp/meta/:id/subitens por
// atividade editada (item 16 do pedido-frontend-fase2.md) — o backend
// grava cada atividade isoladamente, sem o front reenviar o nível
// inteiro nem costurar a meta de volta na lista do cadastro.
// `vbmappId` é o id real da atividade (ver VBMapp.tsx/onClickAddSubItem)
// — o id do formulário ("N-meta-X") é só chave de campo do
// react-hook-form.
export function montarSubitensVBMapp(payload: any, metasOriginais: any[]) {
  const {
    procedimentoEnsinoId,
    estimuloDiscriminativo,
    estimuloReforcadorPositivo,
    resposta,
    pacienteId,
    metas = [],
  } = payload ?? {};

  return metas.map((metaForm: any) => {
    const original = metasOriginais.find((meta: any) => meta.id === metaForm.id);

    return {
      vbmappId: original?.vbmappId,
      body: {
        pacienteId,
        selected: original?.selected,
        procedimentoEnsinoId,
        estimuloDiscriminativo,
        estimuloReforcadorPositivo,
        resposta,
        subitems: (metaForm.subitems || []).map((item: any) => ({
          nome: item.value,
          id: item.id,
          ...selectedDoOriginal(original?.subitems, item.id),
        })),
      },
    };
  });
}
