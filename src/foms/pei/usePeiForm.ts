import { useCallback, useEffect, useState } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { TIPO_PROTOCOLO } from '../../constants/protocolo';
import { permissionAuth } from '../../contexts/permission';
import { useToast } from '../../contexts/toast';
import { CONSTANTES_ROUTERS } from '../../routes/OtherRoutes';
import { dropDown, update, create } from '../../server';
import { OBJ_ITEM, OBJ_META } from '../../util/util';
import { buildErrorToast } from '../../util/error';
import { formatPortage, montarSubitensVBMapp } from './peiFormat';
import {
  META_TEXTO_CAMPOS,
  baseMetaIdFromField,
  isMetaTextoField,
  metaObsFieldId,
  metaPropFromField,
  metaTextoFieldId,
} from './metaObsField';

// Maior sufixo numérico ("…-meta-3", "…-sub-item-7") + 1. Usar o
// tamanho da lista, como antes, repetia id depois de excluir uma meta
// ou item do meio (metas 0,1,2 → exclui a 1 → a nova virava "-meta-2").
const proximoIndice = (ids: string[], regex: RegExp) =>
  ids.reduce((max, id) => {
    const match = id.match(regex);
    return Math.max(max, match ? parseInt(match[1], 10) : -1);
  }, -1) + 1;

const META_INDICE = /-meta-(\d+)$/;
const ITEM_INDICE = /-sub-item-(\d+)$/;

const vazio = (valor: any) => `${valor ?? ''}`.trim() === '';

export interface PeiToast {
  texto: string;
  desfazer?: () => void;
}

export const usePeiForm = ({
  paciente,
  param,
}: {
  paciente: any;
  param?: any;
}) => {
  const defaultValues = {
    pacienteId: '',
    procedimentoEnsinoId: '',
    programaId: '',
    estimuloDiscriminativo: '',
    resposta: '',
    estimuloReforcadorPositivo: '',
  };

  const [loading, setLoading] = useState(false);
  const [dropDownList, setDropDownList] = useState<any>([]);
  const [metas, setMetas] = useState<any[]>([]);
  // Accordion: uma meta aberta por vez. `undefined` = ainda não mexeu
  // (abre a primeira); `null` = fechou todas de propósito.
  const [openMetaId, setOpenMetaId] = useState<string | null | undefined>();
  // Campo que acabou de ser criado (meta/item novo) e deve receber foco.
  const [focusId, setFocusId] = useState<string | null>(null);
  // Metas sem descrição na última tentativa de salvar.
  const [metasInvalidas, setMetasInvalidas] = useState<string[]>([]);
  const [toast, setToast] = useState<PeiToast | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { renderToast } = useToast();
  const { hasPermition } = permissionAuth();
  const { state } = location;

  // "Dados do programa": aberto num cadastro novo, recolhido (com
  // resumo) na edição — reabre se faltar algum campo ao salvar.
  const [programaAberto, setProgramaAberto] = useState(!state?.item);

  const tipoProtocolo = state?.tipoProtocolo || TIPO_PROTOCOLO.pei;

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    reset,
    watch,
    getValues,
    unregister,
  } = useForm({ defaultValues });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Ids de form de uma meta: descrição, observação e itens.
  const camposDaMeta = (meta: any) => [
    meta.id,
    metaObsFieldId(meta.id),
    ...(meta.subitems || []).map((sub: any) => sub.id),
  ];

  // Foto de metas + valores pra "Desfazer" uma exclusão.
  const snapshot = (ids: string[]) => ({
    metas: metas.map((m) => ({ ...m, subitems: [...(m.subitems || [])] })),
    valores: ids.map((id) => [id, getValues(id as any)] as const),
  });

  const restaurar = ({ metas: salvas, valores }: ReturnType<typeof snapshot>) => {
    valores.forEach(([id, valor]) => {
      if (valor !== undefined) setValue(id as any, valor);
    });
    setMetas(salvas);
    setToast(null);
  };

  const limparInvalida = (metaId: string) =>
    setMetasInvalidas((ids) =>
      ids.includes(metaId) ? ids.filter((id) => id !== metaId) : ids
    );

  const renderDropdown = useCallback(async () => {
    const [programa, procedimentoEnsino, protocolo]: any = await Promise.all([
      dropDown(`programa/${tipoProtocolo}`),
      dropDown('pei/procedimento-ensino'),
      dropDown('protocolo'),
    ]);

    const drop = { programa, procedimentoEnsino, protocolo };
    setDropDownList(drop);
    formatarDado(drop);
  }, [setDropDownList]);

  const formatarDado = (drop: any) => {
    if (tipoProtocolo === TIPO_PROTOCOLO.vbMapp) {
      const {
        paciente,
        programa,
        estimuloDiscriminativo,
        resposta,
        estimuloReforcadorPositivo,
        procedimentoEnsinoId,
      } = state.item;

      const metasState = state.item.metas || [];

      const programaObj =
        typeof programa !== 'object'
          ? drop?.programa?.find((item: any) => item.nome === programa)
          : programa;
      const procedimentoEnsinoObj =
        typeof procedimentoEnsinoId !== 'object'
          ? drop?.procedimentoEnsino?.find(
              (item: any) =>
                item.id === procedimentoEnsinoId ||
                item.id === procedimentoEnsinoId?.id
            )
          : procedimentoEnsinoId;

      setValue('pacienteId', paciente);
      setValue('programaId', programaObj);
      setValue('procedimentoEnsinoId', procedimentoEnsinoObj);
      setValue('estimuloDiscriminativo', estimuloDiscriminativo);
      setValue('resposta', resposta);
      setValue('estimuloReforcadorPositivo', estimuloReforcadorPositivo);
      setMetas(metasState);

      metasState.forEach((meta: any) => {
        setValue(meta.id, meta.value);
        meta.subitems?.forEach((subitem: any) =>
          setValue(subitem.id, subitem.value)
        );
      });
    } else if (tipoProtocolo === TIPO_PROTOCOLO.portage) {
      const { paciente, programa } = param.item || state?.item;
      const metasState = state.item.metas || [];

      const procedimentoEnsino = drop.procedimentoEnsino?.find(
        (item: any) => item.id === metasState[0].procedimentoEnsino
      );
      const programaList = drop?.programa?.find(
        (item: any) =>
          item.id === programa ||
          item.nome === metasState[0].programa?.nome ||
          item.nome === metasState[0].programa?.id
      );

      setMetas(metasState);
      setValue(metasState[0].id, metasState[0].value);
      setValue('pacienteId', paciente);
      setValue('programaId', programaList);
      setValue('procedimentoEnsinoId', procedimentoEnsino);
      setValue('estimuloDiscriminativo', metasState[0].estimuloDiscriminativo);
      setValue('resposta', metasState[0].resposta);
      setValue(
        'estimuloReforcadorPositivo',
        metasState[0].estimuloReforcadorPositivo
      );

      metasState[0].subitems?.forEach((subitem: any) =>
        setValue(subitem.id, subitem.value)
      );
    } else if (tipoProtocolo === TIPO_PROTOCOLO.pei && state?.item) {
      const {
        paciente,
        procedimentoEnsino,
        programa,
        resposta,
        estimuloReforcadorPositivo,
        estimuloDiscriminativo,
      } = param?.item || state?.item;
      const metasState = state.item.metas || [];

      // const procedimentoEnsino = drop.procedimentoEnsino?.find(
      //   (item: any) => item.id === metas[0].procedimentoEnsino
      // );

      const programaList = drop?.programa?.find(
        (item: any) => item.id === programa || item.nome === programa?.nome
      );

      setMetas(metasState);
      // setValue(metasState[0].id, metasState[0].value);
      setValue('pacienteId', paciente);
      setValue('programaId', programaList);
      setValue('procedimentoEnsinoId', procedimentoEnsino);
      setValue('estimuloDiscriminativo', estimuloDiscriminativo);
      setValue('resposta', resposta);
      setValue('estimuloReforcadorPositivo', estimuloReforcadorPositivo);

      metasState.forEach((meta: any) => {
        setValue(meta.id, meta.value);
        // observação (ver metaObsField.ts): persistida pelo backend e
        // devolvida em GET /pei/filtro. Meta sem ela deixa o campo do
        // form vazio, exatamente como uma meta nova.
        // `meta.status` não tem campo aqui — só é exibido no PEI e nos
        // relatórios —, mas continua vindo em `metas` pra ser reenviado
        // em onSubmit.
        Object.entries(META_TEXTO_CAMPOS).forEach(([sufixo, prop]) => {
          if (meta[prop]) {
            setValue(
              metaTextoFieldId(meta.id, sufixo as any) as any,
              meta[prop]
            );
          }
        });

        meta.subitems?.forEach((subitem: any) =>
          setValue(subitem.id, subitem.value)
        );
      });
    }
  };

  const onSubmit = async (formvalue: any) => {
    formvalue.pacienteId = paciente;
    setLoading(true);

    try {
      const payload: any = { metas: [], programa: formvalue.programaId };
      const [protocoloId] = dropDownList.protocolo.filter(
        (item: any) => item.id == tipoProtocolo
      );

      // Item vazio não bloqueia mais o salvar: é descartado, como se
      // tivesse sido excluído (some da tela também, se o salvar falhar).
      const itensVazios = Object.keys(formvalue).filter(
        (key) =>
          key.includes('-sub-item-') &&
          !isMetaTextoField(key) &&
          vazio(formvalue[key])
      );
      if (itensVazios.length) {
        itensVazios.forEach((key) => {
          delete formvalue[key];
          unregister(key as any);
        });
        setMetas((atual) =>
          atual.map((meta) => ({
            ...meta,
            subitems: (meta.subitems || []).filter(
              (sub: any) => !itensVazios.includes(sub.id)
            ),
          }))
        );
      }

      // Só a descrição da meta é obrigatória. Em vez do toast genérico,
      // a meta com problema abre e o campo fica marcado (ver MetaCard).
      const semDescricao = metas.filter((meta) => vazio(formvalue[meta.id]));
      if (semDescricao.length) {
        setLoading(false);
        setMetasInvalidas(semDescricao.map((meta) => meta.id));
        setOpenMetaId(semDescricao[0].id);
        setFocusId(semDescricao[0].id);
        return;
      }
      setMetasInvalidas([]);

      // A observação da meta (ver metaObsField.ts) é opcional — nem
      // toda meta tem —, por isso fica de fora da
      // checagem de "nenhum campo vazio" abaixo (que agora só pega os
      // dados do programa).
      if (
        Object.entries(formvalue).some(
          ([key, valor]) =>
            !isMetaTextoField(key) && (valor === '' || valor === undefined)
        )
      ) {
        setLoading(false);
        setProgramaAberto(true);
        renderToast({
          type: 'failure',
          title: 'Valores Vazios!',
          message:
            'Preencha os dados do programa: procedimento, programa, SD, resposta e SR+.',
          open: true,
        });
        return;
      }

      Object.keys(formvalue).forEach((key: any) => {
        // Tratados à parte, depois de payload.metas estar montado (ver
        // abaixo) — sem esse retorno antecipado, cairiam no branch de
        // meta logo abaixo (o id da observação também contém "-meta-",
        // por ser o id da própria meta com um sufixo).
        if (isMetaTextoField(key)) return;

        if (key.includes('-meta-') && !key.includes(`-sub-item-`)) {
          const match = key.match(/\d+/);
          const matchLast = key.match(/(\d+)$/);
          const programaId = Number(match[0]);
          const metaId = Number(matchLast[0]);

          const subitems: any = [];
          Object.keys(formvalue).forEach((sub) => {
            if (sub.includes(`${programaId}-meta-${metaId}-sub-item-`)) {
              subitems.push({ ...OBJ_ITEM, id: sub, value: formvalue[sub] });
            }
          });

          payload.metas.push({
            ...OBJ_META,
            id: key,
            subitems,
            value: formvalue[key],
          });
        } else if (key.includes('Id')) {
          payload[key] = formvalue[key].id;
        } else if (
          !key.includes('-meta-') &&
          !key.includes('-sub-item-') &&
          !key.includes('Id')
        ) {
          payload[key] = formvalue[key];
        }
      });

      // Segundo passe: observação de cada meta (ver metaObsField.ts) —
      // precisa rodar depois do payload.metas estar montado acima, pra
      // achar a meta certa pelo id base. Só gera efeito quando o
      // formulário realmente tem esse campo (protocolo Manual — ver
      // foms/pei/index.tsx); pra Portage/VB-MAPP não existe, então esse
      // passe não faz nada.
      Object.keys(formvalue).forEach((key: any) => {
        if (!isMetaTextoField(key)) return;
        const metaId = baseMetaIdFromField(key);
        const meta = payload.metas.find((item: any) => item.id === metaId);
        if (!meta) return;

        meta[metaPropFromField(key)] = formvalue[key];
      });

      // Ordem da tela, não a de registro no form: um item criado com
      // Enter no meio da lista entra no form por último.
      const ordem = (lista: any[], id: string) =>
        lista.findIndex((item: any) => item.id === id);
      payload.metas.sort(
        (a: any, b: any) => ordem(metas, a.id) - ordem(metas, b.id)
      );
      payload.metas.forEach((meta: any) => {
        const naTela = metas.find((item: any) => item.id === meta.id);
        if (!naTela) return;
        meta.subitems.sort(
          (a: any, b: any) =>
            ordem(naTela.subitems || [], a.id) -
            ordem(naTela.subitems || [], b.id)
        );
      });

      // O status da meta não é cadastrado aqui (só aparece no PEI e nos
      // relatórios), mas o backend regrava o array de metas inteiro ao
      // salvar — sem reenviar o que já estava gravado, editar o programa
      // apagaria o status de todas as metas dele. Meta nova não tem
      // status e continua sem.
      if (tipoProtocolo === TIPO_PROTOCOLO.pei) {
        payload.metas.forEach((meta: any) => {
          const salva = metas.find((item: any) => item.id === meta.id);
          if (salva?.status) meta.status = salva.status;
        });
      }

      if (Boolean(state?.item?.id)) payload.id = state.item.id;

      // Edição em nível de protocolo (Manual): o item editado é o grupo
      // inteiro de um programa, que pode ter nascido de vários registros
      // Pei mesclados na listagem (ver PeiService.agruparPeiPorPrograma).
      // `peiIds` carrega todos eles — o backend consolida no registro
      // canônico (payload.id) e apaga os outros ao salvar. Sempre
      // presente no item vindo de /pei/filtro (item 15 do
      // pedido-frontend-fase2.md); só não existe num cadastro novo.
      if (tipoProtocolo === TIPO_PROTOCOLO.pei && state?.item) {
        payload.peiIds = state.item.peiIds;
      }

      if (tipoProtocolo === TIPO_PROTOCOLO.pei) {
        Boolean(state?.item?.id)
          ? await update('pei', payload)
          : await create('pei', payload);

        navigate(`/${CONSTANTES_ROUTERS.PEI}`, {
          state: { pacienteId: formvalue.pacienteId, protocoloId },
        });
      } else if (tipoProtocolo === TIPO_PROTOCOLO.portage) {
        const response = formatPortage(payload, metas);
        navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
          state: {
            pacienteId: formvalue.pacienteId,
            protocoloId: tipoProtocolo,
            metaEdit: response,
          },
        });
      } else if (tipoProtocolo === TIPO_PROTOCOLO.vbMapp) {
        // Salva cada atividade editada direto no backend (PUT
        // protocolo/vbmapp/meta/:id/subitens — item 16 do
        // pedido-frontend-fase2.md). Não há PUT em lote: uma requisição
        // por atividade do programa. Ao voltar, o cadastro rebusca o
        // nível do servidor — `subitensSalvos` só diz quais atividades
        // já estão gravadas (ver VBMapp.tsx/aplicarRascunho).
        const edicoes = montarSubitensVBMapp(payload, metas);
        await Promise.all(
          edicoes.map(({ vbmappId, body }: any) =>
            update(`protocolo/vbmapp/meta/${vbmappId}/subitens`, body)
          )
        );

        navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
          state: {
            pacienteId: formvalue.pacienteId,
            protocoloId: tipoProtocolo,
            nivel: state?.nivel,
            subitensSalvos: edicoes.map(({ vbmappId }: any) => vbmappId),
          },
        });
      }

      reset();
      setLoading(false);
      setMetas([]);
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'PEI Cadastrado.',
        open: true,
      });
    } catch (error) {
      setLoading(false);
      // Mensagem/código do backend em vez de "Falha na conexão" pra
      // qualquer erro (ver util/error.ts): no VB-MAPP é uma requisição
      // por atividade, então um erro em uma delas precisa dizer o que
      // foi — as outras já gravaram.
      renderToast(buildErrorToast(error, 'Falha na conexão'));
    }
  };

  const addMeta = () => {
    const programaId: any = watch('programaId');
    if (!programaId?.id) {
      renderToast({
        type: 'warning',
        title: 'Programa',
        message: 'Escolha o programa antes de adicionar metas.',
        open: true,
      });
      return;
    }

    const id = `${programaId.id}-meta-${proximoIndice(
      metas.map((m) => m.id),
      META_INDICE
    )}`;
    // Já nasce com um item vazio pra digitar direto (vazio é descartado
    // ao salvar).
    const subitems = [{ ...OBJ_ITEM, id: `${id}-sub-item-0` }];
    setMetas([...metas, { ...OBJ_META, id, subitems }]);
    setOpenMetaId(id);
    setFocusId(id);
  };

  const duplicateMeta = (index: number) => {
    const original = metas[index];
    const programaId = original.id.split('-meta-')[0];
    const id = `${programaId}-meta-${proximoIndice(
      metas.map((m) => m.id),
      META_INDICE
    )}`;
    const subitems = (original.subitems || []).map((sub: any, i: number) => ({
      ...OBJ_ITEM,
      id: `${id}-sub-item-${i}`,
    }));

    // Cópia sem status (é uma meta nova) — só os textos.
    const copia = { ...OBJ_META, id, subitems };
    delete (copia as any).status;
    setValue(id as any, getValues(original.id as any));
    const obs = getValues(metaTextoFieldId(original.id, 'obs') as any);
    if (obs) setValue(metaTextoFieldId(id, 'obs') as any, obs);
    (original.subitems || []).forEach((sub: any, i: number) =>
      setValue(subitems[i].id as any, getValues(sub.id as any))
    );

    const item = [...metas];
    item.splice(index + 1, 0, copia);
    setMetas(item);
    setOpenMetaId(id);
    setToast({ texto: `Meta ${index + 1} duplicada` });
  };

  const removeMeta = (index: number) => {
    const meta = metas[index];
    const campos = camposDaMeta(meta);
    const foto = snapshot(campos);

    // Tira do form também: antes o valor virava `undefined` mas a chave
    // continuava lá, e a checagem de campo vazio do onSubmit barrava o
    // salvar depois de excluir qualquer meta.
    campos.forEach((id) => unregister(id as any));
    setMetas(metas.filter((_, i) => i !== index));
    limparInvalida(meta.id);
    setToast({
      texto: `Meta ${index + 1} excluída`,
      desfazer: () => {
        restaurar(foto);
        setOpenMetaId(meta.id);
      },
    });
  };

  // afterIndex: Enter num item cria o próximo logo abaixo dele; sem ele
  // ("Adicionar item"), vai pro fim da lista.
  const addSubitem = (metaIndex: number, afterIndex?: number) => {
    const item = [...metas];
    const subitems = item[metaIndex]?.subitems
      ? [...item[metaIndex].subitems]
      : [];

    const id = `${item[metaIndex].id}-sub-item-${proximoIndice(
      subitems.map((sub: any) => sub.id),
      ITEM_INDICE
    )}`;
    const posicao = afterIndex === undefined ? subitems.length : afterIndex + 1;
    subitems.splice(posicao, 0, { ...OBJ_ITEM, id });

    item[metaIndex] = { ...item[metaIndex], subitems };
    setMetas(item);
    setFocusId(id);
  };

  const removeSubitemFromMeta = (metaIndex: number, subIndex: number) => {
    const subitem = metas[metaIndex]?.subitems?.[subIndex];
    if (!subitem) return;

    const valor = getValues(subitem.id as any);
    const foto = snapshot([subitem.id]);

    unregister(subitem.id, { keepValue: false });

    const item = [...metas];
    item[metaIndex] = {
      ...item[metaIndex],
      subitems: item[metaIndex].subitems.filter(
        (_: any, i: number) => i !== subIndex
      ),
    };
    setMetas(item);
    setToast({
      texto: vazio(valor) ? 'Item excluído' : `Item “${valor}” excluído`,
      desfazer: () => restaurar(foto),
    });
  };

  const toggleMeta = (metaId: string) => {
    const aberta = openMetaId === undefined ? metas[0]?.id : openMetaId;
    setOpenMetaId(aberta === metaId ? null : metaId);
    setFocusId(null);
  };

  return {
    control,
    errors,
    handleSubmit,
    loading,
    metas,
    dropDownList,
    tipoProtocolo,
    addMeta,
    addSubitem,
    removeMeta,
    renderDropdown,
    onSubmit,
    hasPermition,
    removeSubitemFromMeta,
    duplicateMeta,
    toggleMeta,
    openMetaId: openMetaId === undefined ? metas[0]?.id ?? null : openMetaId,
    focusId,
    metasInvalidas,
    limparInvalida,
    toast,
    fecharToast: () => setToast(null),
    programaAberto,
    setProgramaAberto,
    watch,
  };
};
