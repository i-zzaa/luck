import { useEffect, useMemo, useState } from "react";
import { diffWeek, formatdate, formatdateEuaAddDay, formatdateeua } from "../util/util";
import { useAuth } from "../contexts/auth";
import { getList, update } from "../server";
import { ButtonHeron, Card, Filter } from "../components";
import { LoadingHeron } from "../components/loading";
import { NotFound } from "../components/notFound";
import { useToast } from "../contexts/toast";
import { STATUS_EVENTS, filterCalendarFields } from "../constants/schedule";
import { useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { ChoiceItemSchedule } from "../components/choiceItemSchedule";


const fieldsConst = filterCalendarFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export const Schedule = () => {
  const { renderToast } = useToast();
  const navigate = useNavigate();

  const [list, setList] = useState({}) as any;
  const [keys, setKeys] = useState([]) as any;
  const [loading, setLoading] = useState<boolean>(false);

  const { user } = useAuth();

  const current = new Date();
  const start = formatdateeua(current)
  const end = formatdateEuaAddDay(current)

  // async function handleSubmitCheckEvent(item: any) {
  //   try {
  //     await update('/evento/check', {id: item.id});

  //     renderToast({
  //       type: 'success',
  //       title: '',
  //       message: 'Evento atualizado!',
  //       open: true,
  //     });

  //     setTimeout(() => {
  //       getDayTerapeuta()
  //     }, 1000);

  //   } catch (error) {
  //     renderToast({
  //       type: 'failure',
  //       title: '401',
  //       message: 'Evento não atualizado!',
  //       open: true,
  //     });
  //   }
  // }

  const handleButtonDTTClick = (e: any, item: any) => {
    e.stopPropagation(); 
    navigate(`/${CONSTANTES_ROUTERS.METASDTT}`, { state: item})
  };


  const getDayTerapeuta = async (currentDateStart = start,  currentDateEnd = end) => {
  // const getDayTerapeuta = async (currentDateStart = '2024-10-24',  currentDateEnd =  '2024-10-24') => {

    setLoading(true)
    try {
      const response: any = await getList(`/evento/filtro/${currentDateStart}/${currentDateEnd}?terapeutaId=${user.id}`);
      let clavesOrdenadas = Object.keys(response).sort();

      setList(response);
      setKeys(clavesOrdenadas);
    } catch (error) {
      setList([]);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Período não encontrado!',
        open: true,
      });
    }
    setLoading(false)
  }

  const cardFree = (item: any) => {
    return <Card  key={item.id} customCss="border-l-4 border-l-green-400 rounded-lg cursor-not-allowed">
        <div className="flex gap-2 w-full item-center"> 
          <div className="grid text-center font-inter text-sm text-gray-400"> 
            <span> {item.start}</span> -
            <span>{item.end}</span>
          </div>
          <div className="text-gray-800 text-center flex items-center justify-center text-md">  { item.title }</div>
        </div>
    </Card>
  }

  const cardChoice = (item: any) => {
    return <Card key={item.id}  type={item.especialidade.nome} customCss={'border-l-4 rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out'} onClick={()=> navigate(`/${CONSTANTES_ROUTERS.SESSION}`, { state: { item } })}>
      <div className="flex">
        <ChoiceItemSchedule
        start={item?.data.start}
        end={item?.data.end}
        statusEventos={item?.statusEventos.nome}
        title={item?.title}
        localidade={item?.localidade.nome}
        isExterno={item?.isExterno}
        km={item?.km}
        modalidade={item?.modalidade.nome}
        dataInicio={item?.dataInicio}
        dataFim={item?.dataFim}
        dataAtual={item?.dataAtual}
        />
          {
            item.statusEventos.nome  != STATUS_EVENTS.atendido && <ButtonHeron
            text="Pesquisar"
            icon="pi pi-file-edit"
            type="primary"
            size="icon"
            loading={loading}
            onClick={(event: any) => handleButtonDTTClick(event, item)}
          />
          }

          { item.statusEventos.nome  == STATUS_EVENTS.atendido  &&  <ButtonHeron
          text="Atendido"
          type="transparent"
          icon="pi pi-check"
          size="icon"
          color="violet"
        />}
      </div>
    </Card>
  }

  const formatItem = (item: any) => {
    switch (item.id) {
      case 0:
        return cardFree(item)
      default:
        return cardChoice(item)
    }
  }

  const renderContent = () => {
    if (!loading) {
      return keys.length ? keys.map((key: string) => {
        return (
          <div key={key}>
            <div className="font-inter m-2 text-gray-400">
            { formatdate(key) }
            </div>
            {
              list[key].map((item: any)=> formatItem(item))
            }
          </div>
        )
      }) : (
       <Card> <NotFound /> </Card>
      );
    } else {
      return <LoadingHeron />;
    }
  }

  const renderHeader = useMemo(() => {
    return  (
      <div className="text-primary font-base grid justify-start m-2 leading-4"> 
      <span className="font-bold"> Agenda </span>
        <span className="text-gray-400 font-light text-sm font-inter"> {formatdate(new Date()) } </span>
      </div>
    )
  }, [])

  const renderFilter = useMemo(() => {
    return (
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        nameButton="Agendar"
        fields={fieldsConst}
        onSubmit={({dataInicio, datatFim}: any) =>  getDayTerapeuta(dataInicio, datatFim)}
        onReset={()=>  getDayTerapeuta()}
        screen="AGENDA_CALENDARIO"
        loading={loading}
        dropdown={[]}
      />
    )
  }, [])


  useEffect(()=> {
    getDayTerapeuta()
  }, [])

  return (
    <>
    { renderFilter }
    { renderHeader }
    { renderContent() }
    </>
  )
}