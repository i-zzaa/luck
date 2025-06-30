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
    subitems: meta.subitems.map((item: any, key: number) => {
      const selected = metas[0].subitems[key]?.selected ? { selected: metas[0].subitems[key]?.selected } : {};
      return {
        nome: item.value,
        id: item.id,
        ...selected,
      };
    }),
  };
}

export function formatVBMapp(formvalue: any, dropDownList: any) {
  const {
    procedimentoEnsinoId = '',
    estimuloDiscriminativo = '',
    estimuloReforcadorPositivo = '',
    resposta = '',
    pacienteId = '',
    programaId = '',
    metas = []
  } = formvalue ?? {};

  const programaObj = dropDownList?.programa?.find((item: any) => item.id === programaId);

  const formated = metas.map((metaCurrent: any) => ({
    id: metaCurrent.id,
    nome: metaCurrent.value,
    procedimentoEnsinoId,
    estimuloDiscriminativo,
    estimuloReforcadorPositivo,
    resposta,
    pacienteId,
    permiteSubitens: true,
    subitems: metaCurrent.subitems.map((item: any, key: number) => {
      const selected = metaCurrent.subitems[key]?.selected ? { selected: metaCurrent.subitems[key]?.selected } : {};
      return {
        nome: item.value,
        id: item.id,
        ...selected,
      };
    }),
  }));

  return {
    programa: programaObj.nome.toLowerCase(),
    metas: formated,
  };
}

export function formatarDado({ state, param, drop, setValue, setMetas, TIPO_PROTOCOLO }: any) {
  if (state?.item?.programa || (state?.tipoProtocolo && state?.tipoProtocolo === TIPO_PROTOCOLO.vbMapp)) {
    const {
      paciente,
      programa,
      estimuloDiscriminativo,
      resposta,
      estimuloReforcadorPositivo,
      metas,
      procedimentoEnsinoId,
    } = state.item;

    const programaObj = typeof programa !== 'object'
      ? drop?.programa?.find((item: any) => item.nome.toLowerCase() === programa)
      : programa;

    const procedimentoEnsinoObj = typeof procedimentoEnsinoId !== 'object'
      ? drop?.procedimentoEnsino?.find((item: any) => item.id === procedimentoEnsinoId)
      : procedimentoEnsinoId;

    setValue('pacienteId', paciente);
    setValue('programaId', programaObj);
    setValue('procedimentoEnsinoId', procedimentoEnsinoObj);
    setValue('estimuloDiscriminativo', estimuloDiscriminativo);
    setValue('resposta', resposta);
    setValue('estimuloReforcadorPositivo', estimuloReforcadorPositivo);

    setMetas(metas);
    metas.forEach((meta: any) => {
      setValue(meta.id, meta.value);
      meta.subitems?.forEach((subitem: any) => setValue(subitem.id, subitem.value));
    });
  } else if (state?.tipoProtocolo === TIPO_PROTOCOLO.portage) {
    const { paciente, metas } = param.item;
    const procedimentoEnsino = drop.procedimentoEnsino?.find((item: any) => item.id === metas[0].procedimentoEnsino);
    const programa = drop.programa?.find((item: any) => item.id === metas[0].programa);

    setMetas(metas);
    setValue(metas[0].id, metas[0].value);
    setValue('pacienteId', paciente);
    setValue('programaId', programa);
    setValue('procedimentoEnsinoId', procedimentoEnsino);
    setValue('estimuloDiscriminativo', metas[0].estimuloDiscriminativo);
    setValue('resposta', metas[0].resposta);
    setValue('estimuloReforcadorPositivo', metas[0].estimuloReforcadorPositivo);

    metas[0].subitems?.forEach((subitem: any) => setValue(subitem.id, subitem.value));
    if (!metas[0].subitems) metas[0].subitems = [];
  }
}