import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { create, filter, getList, update } from '../server';
import { useToast } from '../contexts/toast';
import { Tree } from 'primereact/tree';
import { ButtonHeron } from '../components';
import { ChoiceItemSchedule } from '../components/choiceItemSchedule';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { NotFound } from '../components/notFound';


export default function MetasDTT() {
  const { renderToast } = useToast();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const [loading, setLoading] = useState<boolean>(false);

  const [nodes, setNodes] = useState([]);
  const [isEdit, seIsEdit] = useState(false);
  const [keys, setKeys] = useState([] as any);
  const [selectedKeys, setSelectedKeys] = useState({} as any);

  //manutencao
  const [nodesMaintenance, setNodesMaintenance] = useState([]);
  const [selectedMaintenanceKeys, setSelectedMaintenanceKeys] = useState({} as any);


  const getAllKeys = (arr: any) =>{
    let current: string[] = [];
  
    arr.forEach((item: any) => {
      keys.push(item.key); // Pega a chave do item atual
  
      // Se o item tiver children, faz a recursão
      if (item.children) {
        current = keys.concat(getAllKeys(item.children));
      }
    });
  
    return current;
  }
  
  const getPEI = useMemo(async() => {
    setLoading(true)
    try {
      const paciente = state.paciente

      const [{data}, result] = await Promise.all([
        filter('pei', { paciente }),
        getList(`pei/activity-session/${state.id}`)
      ])

      const metas: any = []

      const selectedMaintenanceKeys =  Boolean(result) ? JSON.parse(result.maintenance) : {}
      const allKeysMaintenance = Boolean(result) ? getAllKeys(selectedMaintenanceKeys) : []

      data.map((programa: any) => {
        const metaCurrent: any = []
        programa.metas.map((meta: any)=> {
          const children = meta.subitems.reduce((acc: any[], subitem: any) => {
            // Add o  PEI se nao tiver em manutencao
            if (!allKeysMaintenance.includes(subitem.id)) {
              acc.push({
                key: subitem.id,
                label: subitem.value,
                data: subitem.id,
              });
            }
            return acc;
          }, []);

          children.length && metaCurrent.push({
            key: meta.id,
            label: meta.value,
            data:  meta.id,
            children
          })
        })

        metaCurrent.length && metas.push({
          key: programa.id,
          label: programa.programa.nome,
          data: programa.id,
          children: metaCurrent
        })
      })

      if (Boolean(result)) {
        const obj = JSON.parse(result.selectedKeys)
        const allKeys = Object.keys(obj);

        seIsEdit(Boolean(obj))
        setSelectedKeys(obj)
        setKeys(allKeys)


        result.maintenance ? setNodesMaintenance(JSON.parse(result.maintenance)) : setNodesMaintenance([])
        result.selectedMaintenanceKeys ?  setSelectedMaintenanceKeys(JSON.parse(result.selectedMaintenanceKeys)) : setNodesMaintenance({})
      }

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
        selectedKeys,
        maintenance: nodesMaintenance,
        selectedMaintenanceKeys,
      }

      if (isEdit) {
        payload.id = state.id
        await update('pei/activity-session', payload);
      }else {
        await create('pei/activity-session', payload);
      }

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
  
  const renderContent = () => {
    return  (
      <div className='grid gap-2 mt-8'>
       {
        nodes.length ? (
          <div>
          <div className='text-gray-400'> Selecione os programas para sessão</div>
          <Tree value={nodes} selectionMode="checkbox" selectionKeys={selectedKeys} onSelectionChange={async (e: any) => {
            setSelectedKeys(e.value)
            const _keys =  await  Object.keys(e.value)
          setKeys(_keys)

          }} className="w-full md:w-30rem" />
        </div>
        ) : (
          <div className='grid gap-4 justify-center'>
             <NotFound />
              <ButtonHeron
                text="Cadastrar PEI"
                icon="pi pi-book"
                type="primary"
                color='white'
                size="sm"
                onClick={()=>  navigate(`/${CONSTANTES_ROUTERS.PEICADASTRO}`)}
              />
          </div>
        )
         
       }
    </div>
    )
  }

  const renderContentMaintenance = () => {
    return  !!nodesMaintenance.length &&  (
      <div className='grid gap-2 mt-8'>
        <div className='text-gray-400'> Manutenção</div>
        <Tree value={nodesMaintenance} selectionMode="checkbox" selectionKeys={selectedMaintenanceKeys} onSelectionChange={async (e: any) => {
          setSelectedMaintenanceKeys(e.value)
        }} className="w-full md:w-30rem" />
    </div>
    )
  }

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

      { renderContent() }
      { renderContentMaintenance() }
      { renderFooter() }
    </div>
  );
}
