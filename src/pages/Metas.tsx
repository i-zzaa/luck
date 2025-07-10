import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { create, filter, getList, update } from '../server';
import { useToast } from '../contexts/toast';
import { Tree } from 'primereact/tree';
import { ButtonHeron } from '../components';
import { ChoiceItemSchedule } from '../components/choiceItemSchedule';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { NotFound } from '../components/notFound';
import { TIPO_PROTOCOLO, VALOR_PORTAGE } from '../constants/protocolo';


export default function Metas() {
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
  const [selectedMaintenanceKeys, setSelectedMaintenanceKeys] = useState({});

  //portage 
  const [nodesPortage, setNodesPortage] = useState([]);
  const [selectedPortageKeys, setSelectedPortageKeys] = useState({});
  
  
  //vbMapp 
  const [nodesVbMapp, setNodesVbMapp] = useState([]);
  const [selectedVbMappKeys, setSelectedVbMappKeys] = useState({});

  const getAllKeys = (arr: any) =>{
    let current: string[] = [];
  
    arr.forEach((item: any) => {
      current.push(item.key); // Pega a chave do item atual
  
      // Se o item tiver children, faz a recursão
      if (item.children) {
        current = keys.concat(getAllKeys(item.children));
      }
    });
  
    return current;
  }

  const getPEI = useCallback(async() => {
    setLoading(true)
    try {
      const paciente = state.paciente

      const [peiData, vbMappData, portageData, atividadesSessao] = await Promise.all([
        filter('pei', { paciente, protocoloId: TIPO_PROTOCOLO.pei}),
        filter('protocolo/meta', { pacienteId: paciente.id, protocoloId: TIPO_PROTOCOLO.vbMapp }),
        filter('protocolo/meta', { pacienteId: paciente.id, protocoloId: TIPO_PROTOCOLO.portage, notSelected: [VALOR_PORTAGE.sim] }),
        getList(`pei/activity-session/${state.id}`)
      ])

      const pei = peiData.data
      const portage = portageData.data
      const vbMapp = vbMappData.data

      seIsEdit(!!pei.length || !!portage.length || !!vbMapp.length)

      const allKeysMaintenance = Boolean(atividadesSessao?.maintenance) &&  typeof atividadesSessao?.maintenance === 'object' ? getAllKeys(atividadesSessao.maintenance) : []

      if (pei && pei.length > 0) {
      const metas: any = []

        pei.map((programa: any) => {
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

      setNodes(metas)
        
      }

      if (portage && portage.length > 0) {
        setNodesPortage(portage)
        setSelectedPortageKeys(atividadesSessao?.selectedPortageKeys)
      }

      if (vbMapp && vbMapp.length > 0) {
        setNodesVbMapp(vbMapp)
        setSelectedVbMappKeys(atividadesSessao?.selectedVbMappKeys)
      }

      if (atividadesSessao.selectedKeys && Object.values(atividadesSessao.selectedKeys).length > 0) {
        const obj = atividadesSessao.selectedKeys
        const allKeys = Object.keys(obj);

        setSelectedKeys(obj)
        setKeys(allKeys)

        if (atividadesSessao.maintenance) {
          setNodesMaintenance(atividadesSessao.maintenance)
        }

        if (Object.values(atividadesSessao.selectedMaintenanceKeys).length) {
          setSelectedMaintenanceKeys(atividadesSessao?.selectedMaintenanceKeys) 
        }
      }

    } catch (error) {
      // renderToast({
      //   type: 'failure',
      //   title: '401',
      //   message: 'PEI não encontrado!',
      //   open: true,
      // });
    } finally {
      setLoading(false);
    }
  }, [renderToast])

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
        selectedPortageKeys: selectedPortageKeys,
        portage: nodesPortage,
        selectedVbMappKeys: selectedVbMappKeys,
        vbmapp: nodesVbMapp        
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
    return  !!nodes.length && (
      <div className='grid gap-2 mt-4'>
       <div>
          <div className='text-gray-400'> Manual</div>
          <Tree value={nodes} selectionMode="checkbox" selectionKeys={selectedKeys} onSelectionChange={async (e: any) => {
            setSelectedKeys(e.value)
            const _keys =  await  Object.keys(e.value)
            setKeys(_keys)

          }} className="w-full md:w-30rem" />
        </div>
     </div>
    )
  }

  const renderContentMaintenance = () => {
    return  !!nodesMaintenance.length &&  (
      <div className='grid gap-2 my-8'>
        <div className='text-gray-400'> Manutenção </div>
        <Tree value={nodesMaintenance} selectionMode="checkbox" selectionKeys={selectedMaintenanceKeys} onSelectionChange={async (e: any) => {
          setSelectedMaintenanceKeys(e.value)
        }} className="w-full md:w-30rem" />
    </div>
    )
  }


  const renderContentPortage = () => {
    return  !!nodesPortage.length &&  (
      <div className='grid gap-2 mt-8'>
        <div className='text-gray-400'> Portage </div>
        <Tree value={nodesPortage} selectionMode="checkbox" selectionKeys={selectedPortageKeys} onSelectionChange={async (e: any) => {
          setSelectedPortageKeys(e.value)
        }} className="w-full md:w-30rem" />
    </div>
    )
  }

  const renderContentVbMapp = () => {
    return  !!nodesVbMapp.length &&  (
      <div className='grid gap-2 mt-8'>
        <div className='text-gray-400'> Vb Mapp </div>
        <Tree value={nodesVbMapp} selectionMode="checkbox" selectionKeys={selectedVbMappKeys} onSelectionChange={async (e: any) => {
          setSelectedVbMappKeys(e.value)
        }} className="w-full md:w-30rem" />
    </div>
    )
  }

  const renderNotFound = () => {
    return  !nodesVbMapp.length && !nodesPortage.length && !nodesMaintenance.length && !nodes.length && <div className='grid gap-4 justify-center'>
    <NotFound />
     <ButtonHeron
       text="Cadastrar Protocolo"
       icon="pi pi-book"
       type="primary"
       color='white'
       size="sm"
       onClick={()=>  navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { item: { paciente: state.paciente }}})}
     />
 </div>
  }

  const renderFooter = () => {
    return (!!nodesVbMapp.length || !!nodesPortage.length || !!nodesMaintenance.length || !!nodes.length ) &&  (
      <div className=' mt-8'>
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
    getPEI()
  }, [])

  return (
    <div className='h-[90vh] flex flex-col overflow-y-auto'>
      { renderHeader}

      <div className='text-gray-400 mt-8 text-center'> Selecione os programas para sessão</div>

      { renderContent() }
      { renderContentPortage() }
      { renderContentVbMapp() }
      { renderContentMaintenance() }
      { renderNotFound() }
      { renderFooter() }
    </div>
  );
}
