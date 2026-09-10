import { useCallback, useEffect, useState } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { STATUS_META_OPTIONS, TIPO_PROTOCOLO } from '../../constants/protocolo';
import { permissionAuth } from '../../contexts/permission';
import { useToast } from '../../contexts/toast';
import { CONSTANTES_ROUTERS } from '../../routes/OtherRoutes';
import { dropDown, update, create } from '../../server';
import { OBJ_ITEM, OBJ_META } from '../../util/util';
import { formatPortage, formatVBMapp } from './peiFormat';
import {
  baseMetaIdFromField,
  isMetaStatusOrObsField,
  metaObsFieldId,
  metaStatusFieldId,
} from './metaStatusFields';

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

  const location = useLocation();
  const navigate = useNavigate();
  const { renderToast } = useToast();
  const { hasPermition } = permissionAuth();
  const { state } = location;

  const tipoProtocolo = state?.tipoProtocolo || TIPO_PROTOCOLO.pei;

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    reset,
    watch,
    unregister,
    resetField,
  } = useForm({ defaultValues });

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
        // status/observação: campos novos (ver metaStatusFields.ts),
        // ainda não confirmados no backend — meta.status/observacao só
        // vêm preenchidos quando o backend já estiver salvando isso
        // (ver docs/pedido-backend-formatacao.md). Sem eles, os campos
        // do form ficam vazios, exatamente como uma meta nova.
        if (meta.status) {
          const statusOption = STATUS_META_OPTIONS.find(
            (option) => option.id === meta.status
          );
          if (statusOption) {
            setValue(metaStatusFieldId(meta.id) as any, statusOption);
          }
        }
        if (meta.observacao) {
          setValue(metaObsFieldId(meta.id) as any, meta.observacao);
        }

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

      // status/observação da meta (ver metaStatusFields.ts) são opcionais
      // — nem toda meta tem um status marcado ainda (igual no relatório
      // de referência, várias ficam sem rótulo) — por isso ficam de fora
      // da checagem de "nenhum campo vazio" abaixo.
      if (
        Object.entries(formvalue).some(
          ([key, valor]) =>
            !isMetaStatusOrObsField(key) && (valor === '' || valor === undefined)
        )
      ) {
        setLoading(false);
        renderToast({
          type: 'failure',
          title: 'Valores Vazios!',
          message:
            'Preencha todos os campos. Informe a descrição da meta e/ou do item ou exclua-o',
          open: true,
        });
        return;
      }

      Object.keys(formvalue).forEach((key: any) => {
        // Tratados à parte, depois de payload.metas estar montado (ver
        // abaixo) — sem esse retorno antecipado, cairiam no branch de
        // meta logo abaixo (o id de status/observação também contém
        // "-meta-", por ser o id da própria meta com um sufixo).
        if (isMetaStatusOrObsField(key)) return;

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

      // Segundo passe: status/observação de cada meta (ver
      // metaStatusFields.ts) — precisa rodar depois do payload.metas
      // estar montado acima, pra achar a meta certa pelo id base. Só
      // gera efeito quando o formulário realmente tem esses campos
      // (protocolo Manual — ver foms/pei/index.tsx); pra Portage/VB-MAPP
      // não existem, então esse passe não faz nada.
      Object.keys(formvalue).forEach((key: any) => {
        if (!isMetaStatusOrObsField(key)) return;
        const metaId = baseMetaIdFromField(key);
        const meta = payload.metas.find((item: any) => item.id === metaId);
        if (!meta) return;

        if (key.endsWith('::status')) {
          meta.status = formvalue[key]?.id;
        } else {
          meta.observacao = formvalue[key];
        }
      });

      if (Boolean(state?.item?.id)) payload.id = state.item.id;

      // Edição em nível de protocolo (Manual): o item editado é o grupo
      // inteiro de um programa, que pode ter nascido de vários registros
      // Pei mesclados na listagem (ver PeiService.agruparPeiPorPrograma).
      // `peiIds` carrega todos eles — o backend consolida no registro
      // canônico (payload.id) e apaga os outros ao salvar.
      if (tipoProtocolo === TIPO_PROTOCOLO.pei && state?.item?.peiIds) {
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
        const response = formatVBMapp(payload, dropDownList);
        navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
          state: {
            pacienteId: formvalue.pacienteId,
            protocoloId: tipoProtocolo,
            metaEdit: response,
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
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha na conexão',
        open: true,
      });
    }
  };

  const addMeta = () => {
    const item = [...metas];
    const programaId: any = watch('programaId');
    OBJ_META.id = `${programaId.id}-meta-${item.length}`;
    item.push({ ...OBJ_META });
    setMetas(item);
  };

  const removeMeta = (index: number) => {
    const item = [...metas];
    setValue(item[index].id, undefined);
    item.splice(index, 1);
    setMetas(item);
  };

  const addSubitem = (idMeta: number) => {
    const item = [...metas];
    const subitems = item[idMeta]?.subitems ? [...item[idMeta].subitems] : [];

    // Busca o maior número de subitem existente
    const lastIndex = subitems.reduce((max, sub) => {
      const match = sub.id.match(/sub-item-(\d+)$/);
      const num = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, num);
    }, -1);

    // Gera o novo id com base no último índice encontrado
    const newSubitemId = `${item[idMeta].id}-sub-item-${lastIndex + 1}`;
    const newSubitem = { ...OBJ_ITEM, id: newSubitemId };

    subitems.push(newSubitem);
    item[idMeta].subitems = subitems;
    setMetas(item);
  };

  const removeSubitemFromMeta = (metaIndex: number, subIndex: number) => {
    const novasMetas = [...metas];
    const subitemRemovido = novasMetas[metaIndex]?.subitems?.[subIndex];

    if (subitemRemovido?.id) {
      // Remove o campo e seu valor do react-hook-form
      unregister(subitemRemovido.id, { keepValue: false });
      resetField(subitemRemovido.id); // Garante que valores persistentes sejam limpos
    }

    novasMetas[metaIndex].subitems.splice(subIndex, 1);
    setMetas(novasMetas);
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
  };
};
