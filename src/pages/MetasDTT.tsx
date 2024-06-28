import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { create, filter, getList } from '../server';
import { useToast } from '../contexts/toast';
import { Tree } from 'primereact/tree';
import { ButtonHeron, Card } from '../components';
import { ChoiceItemSchedule } from '../components/choiceItemSchedule';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';


export default function MetasDTT() {
  const { renderToast } = useToast();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const [loading, setLoading] = useState<boolean>(false);

  const [nodes, setNodes] = useState([]);
  const [keys, setKeys] = useState([] as any);
  const [selectedKeys, setSelectedKeys] = useState({} as any);

  const getPEI = useMemo(async() => {
    setLoading(true)
    try {
      const paciente = state.paciente

      const { data }: any = await filter('pei', { paciente });
      const metas: any = []

      data.map((programa: any) => {
        const metaCurrent: any = []

        programa.metas.map((meta: any)=> {
          const children = meta.subitems.map((subitem: any) => ({
            key: subitem.id,
            label: subitem.value,
            data: subitem.id,
          }))
  
          metaCurrent.push({
            key: meta.id,
            label: meta.value,
            data:  meta.id,
            children
          })
        })

        metas.push({
          key: programa.id,
          label: programa.programa.nome,
          data: programa.id,
          children: metaCurrent
        })
      })

      const result: any = await getList(`pei/activity-session/${state.id}`);
      setSelectedKeys(JSON.parse(result.selectedKeys))

      setNodes(metas)
    } catch (error) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'PEI não encontrado!',
        open: true,
      });
    }
    setLoading(false)
  }, [])

  const onSubmit = async() => {
    setLoading(true)
    try {
      console.log(keys);
      
      const atividades: any =  []
      nodes.map((programas: any, programaKey: number) => {
        const programaCurrent: any = []
        programas.children.map((meta: any) => {
          const subitemsCurrent = meta.children.filter((subitem: any) => keys.includes(subitem.key))

          if (subitemsCurrent.length) {
            programaCurrent.push({
              ...meta, 
              children: subitemsCurrent
            })
          }
        })

        if (programaCurrent.length) {
          atividades.push({
            ...programas,
            children: programaCurrent
          })
        }
      })

      const peisIds: any = atividades.map((item: any) => item.key)

      const payload: any = {
        calendarioId: state.id,
        peisIds,
        pacienteId: state.paciente.id,
        atividades,
        selectedKeys
      }

      await create('pei/activity-session', payload);
      renderToast({
        type: 'success',
        title: '200',
        message: 'Cadastrado com sucesso!',
        open: true,
      });

      navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`)

    } catch (error) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Falha ao cadastrar!',
        open: true,
      });
    }
    setLoading(false)

  }

  const renderHeader = useMemo(() => {
    return  (
      <ChoiceItemSchedule
        start={state.data.start}
        end={state.data.end}
        statusEventos={state.statusEventos.nome}
        title={state.title}
        localidade={state.localidade.nome}
        isExterno={state.isExterno}
        km={state.km}
        modalidade={state.modalidade.nome}
        dataInicio={state.dataInicio}
        dataFim={state.dataFim}
        dataAtual={state.dataAtual}
      />
    )
  }, [])

  const renderFooter = () => {
    return  (
      <div className='mt-auto'>
        <ButtonHeron
          text="Salvar"
          type="primary"
          size="full"
          onClick={()=>onSubmit()}
          loading={loading}
          typeButton="button"
        />
      </div>
    )
  }

  useEffect(() => {
    getPEI
  }, [])

  return (
    <div className='h-[90vh] flex flex-col'>
      { renderHeader}

      <div className='grid gap-2 mt-8'>
        <div className='text-gray-400'> Selecione os programas para sessão</div>
        <Tree value={nodes} selectionMode="checkbox" selectionKeys={selectedKeys} onSelectionChange={async (e: any) => {
          setSelectedKeys(e.value)
          const _keys =  await  Object.keys(e.value)
         setKeys(_keys)

        }} className="w-full md:w-30rem" />
      </div>

      { renderFooter() }
    </div>
  );
}
