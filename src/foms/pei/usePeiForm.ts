import { useCallback, useEffect, useState } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { TIPO_PROTOCOLO } from '../../constants/protocolo';
import { permissionAuth } from '../../contexts/permission';
import { useToast } from '../../contexts/toast';
import { CONSTANTES_ROUTERS } from '../../routes/OtherRoutes';
import { dropDown, update, create } from '../../server';
import { OBJ_ITEM, OBJ_META } from '../../util/util';
import { formatPortage, formatVBMapp } from './peiFormat';

export const usePeiForm = ({ paciente, param }: { paciente: any; param?: any }) => {
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
    unregister, resetField
  } = useForm({ defaultValues });

  const renderDropdown = useCallback(async () => {
    const [programa, procedimentoEnsino, protocolo]: any = await Promise.all([
      dropDown(`programa/${tipoProtocolo}`),
      dropDown('pei/procedimento-ensino'),
      dropDown('protocolo')
    ]);

    const drop = { programa, procedimentoEnsino, protocolo };
    setDropDownList(drop);
    formatarDado(drop);
  }, [setDropDownList]);

  const formatarDado = (drop: any) => {
    if (Boolean(state?.item?.programa) || (tipoProtocolo === TIPO_PROTOCOLO.vbMapp)) {
      const {
        paciente,
        programa,
        estimuloDiscriminativo,
        resposta,
        estimuloReforcadorPositivo,
        metas,
        procedimentoEnsinoId,
      } = state.item;

      const programaObj = typeof programa !== 'object' ? drop?.programa?.find((item: any) => item.nome.toLowerCase() === programa) : programa;
      const procedimentoEnsinoObj = typeof procedimentoEnsinoId !== 'object' ? drop?.procedimentoEnsino?.find((item: any) => item.id === procedimentoEnsinoId) : procedimentoEnsinoId;

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
    } else if (tipoProtocolo === TIPO_PROTOCOLO.portage) {
      const { paciente, metas } = param.item;

      const procedimentoEnsino = drop.procedimentoEnsino?.find((item: any) => item.id === metas[0].procedimentoEnsino);
      const programa = drop?.programa?.find((item: any) => item.id === metas[0].programa || item.nome === metas[0].programa );

      setMetas(metas);
      setValue(metas[0].id, metas[0].value);
      setValue('pacienteId', paciente);
      setValue('programaId', programa);
      setValue('procedimentoEnsinoId', procedimentoEnsino);
      setValue('estimuloDiscriminativo', metas[0].estimuloDiscriminativo);
      setValue('resposta', metas[0].resposta);
      setValue('estimuloReforcadorPositivo', metas[0].estimuloReforcadorPositivo);

      metas[0].subitems?.forEach((subitem: any) => setValue(subitem.id, subitem.value));
    }
  };

  const onSubmit = async (formvalue: any) => {
    formvalue.pacienteId = paciente;
    setLoading(true);

    try {
      const payload: any = { metas: [], programa: formvalue.programaId};
      const [protocoloId] = dropDownList.protocolo.filter((item: any)=> item.id == tipoProtocolo)

      if (Object.values(formvalue).some((valor) => valor === '' || valor === undefined)) {
        setLoading(false);
        renderToast({
          type: 'failure',
          title: 'Valores Vazios!',
          message: 'Preencha todos os campos. Informe a descrição da meta e/ou do item ou exclua-o',
          open: true,
        });
        return;
      }

      Object.keys(formvalue).forEach((key: any) => {
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

          payload.metas.push({ ...OBJ_META, id: key, subitems, value: formvalue[key] });
        } else if (key.includes('Id')) {
          payload[key] = formvalue[key].id;
        } else if (!key.includes('-meta-') && !key.includes('-sub-item-') && !key.includes('Id')) {
          payload[key] = formvalue[key];
        }
      });

      if (Boolean(state?.item?.id)) payload.id = state.item.id;

      if (tipoProtocolo === TIPO_PROTOCOLO.pei) {
        Boolean(state?.item?.id)
          ? await update('pei', payload)
          : await create('pei', payload);

        navigate(`/${CONSTANTES_ROUTERS.PEI}`, { state: { pacienteId: formvalue.pacienteId, protocoloId } });
      } else if (tipoProtocolo === TIPO_PROTOCOLO.portage) {
        const response = formatPortage(payload, metas);
        navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { pacienteId: formvalue.pacienteId, protocoloId: tipoProtocolo, metaEdit: response } });
      } else if (tipoProtocolo === TIPO_PROTOCOLO.vbMapp) {
        const response = formatVBMapp(payload, dropDownList);
        navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { pacienteId: formvalue.pacienteId, protocoloId: tipoProtocolo, metaEdit: response } });
      }

      reset();
      setLoading(false);
      setMetas([]);
      renderToast({ type: 'success', title: 'Sucesso!', message: 'PEI Cadastrado.', open: true });
    } catch (error) {
      setLoading(false);
      renderToast({ type: 'failure', title: 'Erro!', message: 'Falha na conexão', open: true });
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