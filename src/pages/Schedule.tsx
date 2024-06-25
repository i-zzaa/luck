import { useEffect, useMemo, useState } from "react";
import { diffWeek, formatdate, formatdateEuaAddDay, formatdateeua } from "../util/util";
import { useAuth } from "../contexts/auth";
import { getList, update } from "../server";
import { ButtonHeron, Card, Filter } from "../components";
import { LoadingHeron } from "../components/loading";
import { NotFound } from "../components/notFound";
import { useToast } from "../contexts/toast";
import { STATUS_EVENTS, filterCalendarFields } from "../constants/schedule";


const fieldsConst = filterCalendarFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export const Schedule = () => {
  const { renderToast } = useToast();

  const [list, setList] = useState({}) as any;
  const [keys, setKeys] = useState([]) as any;
  const [loading, setLoading] = useState<boolean>(false);

  const { user } = useAuth();

  const current = new Date();
  const start = formatdateeua(current)
  const end = formatdateEuaAddDay(current)

  async function handleSubmitCheckEvent(item: any) {
    try {
      await update('/evento/check', {id: item.id});

      renderToast({
        type: 'success',
        title: '',
        message: 'Evento atualizado!',
        open: true,
      });

      setTimeout(() => {
        getDayTerapeuta()
      }, 1000);

    } catch (error) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Evento não atualizado!',
        open: true,
      });
    }
  }



  const avaliationCount = (evento: any) => {
    let text = evento.modalidade.nome;
    if (text !== 'Avaliação' || !evento?.dataInicio || !evento?.dataFim)
      return <span>{text}</span>;

    const current = diffWeek(evento.dataInicio, evento.dataAtual);
    const diffTotal = diffWeek(evento.dataInicio, evento.dataFim);

    return (
      <>
        <span>
          {text}
          <span className="font-inter ml-2">{`${current}/${diffTotal}`}</span>{' '}
        </span>
      </>
    );
  };
  
  const getDayTerapeuta = async (currentDateStart = start,  currentDateEnd = end) => {
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
    return <Card key={item.id}  type={item.especialidade.nome} customCss={'border-l-4 rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out'}>
      <div className="flex justify-between w-full item-center"> 
        <div className="flex gap-2 w-full item-center"> 
          <div className="grid text-center font-inter text-sm text-gray-400"> 
            <span> {item.data.start}</span> -
            <span>{item.data.end}</span>
          </div>
          <div className="text-gray-800 text-sm text-center grid justify-center">  
            <div className="font-base font-semibold text-primary">  { item.title } </div>

            <p className="flex gap-4 items-center justify-between">
              {avaliationCount(item)} <span>{item.statusEventos.nome}</span>
            </p>
                  
            <p className="flex gap-4 items-center">
              {item.localidade.nome}
              {item.isExterno && (
                <span className="font-bold font-inter"> {`- ${item.km}km`} </span>
              )}
            </p>
          </div>
        </div>

        { item.statusEventos.nome  == STATUS_EVENTS.atendido  &&  <ButtonHeron
        text="Atendido"
        type="transparent"
        icon="pi pi-check"
        size="icon"
        color="violet"
      />}
       { item.statusEventos.nome  == STATUS_EVENTS.confirmado ? <ButtonHeron
          text="Atendido"
          type="primary"
          icon="pi pi-check"
          size="icon"
          onClick={()=> handleSubmitCheckEvent(item)}
        /> : <ButtonHeron
        text="Sem evento"
        type="transparent"
        icon="pi pi-calendar-times"
        size="icon"
        color="red"
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
        onInclude={() => {
        }}
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