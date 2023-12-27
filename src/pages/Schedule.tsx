import { useEffect, useMemo, useState } from "react";
import { diffWeek, formatdate, getPrimeiroDoMes, getUltimoDoMes } from "../util/util";
import { useAuth } from "../contexts/auth";
import { getList } from "../server";
import { Card } from "../components";
import { clsx } from 'clsx';
import { useNavigate } from "react-router-dom";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { LoadingHeron } from "../components/loading";
import { NotFound } from "../components/notFound";

export const Schedule = () => {
  const navigator = useNavigate()
  const [list, setList] = useState({}) as any;
  const [keys, setKeys] = useState([]) as any;
  const [loading, setLoading] = useState<boolean>(false);

  const { user } = useAuth();

  const current = new Date();
  const [currentDate, setCurrentDate] = useState<any>({
    start: getPrimeiroDoMes(current.getFullYear(), current.getMonth() + 1),
    end: getUltimoDoMes(current.getFullYear(), current.getMonth() + 1),
  });

  const handleClick  = (event: any) => {
    navigator(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: {
        event
      }
    });
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
  
  const getAllTerapeuta = useMemo( async () => {
    setLoading(true)
    const response: any = await getList(`/evento/filtro/${currentDate.start}/${currentDate.end}?terapeutaId=${user.id}`);
    let clavesOrdenadas = Object.keys(response).sort();

    setList(response);
    setKeys(clavesOrdenadas);
    setLoading(false)
  }, [])


  const cardFree = (item: any) => {
    return <Card customCss="border-l-4 border-l-green-400 rounded-lg cursor-not-allowed">
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
    return <Card key={item.id} customCss={clsx('border-l-4 rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out',  item.borderColor)} onClick={()=>handleClick(item)}>
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


  useEffect(()=> {
    getAllTerapeuta
  }, [])

  return (
    <>
    { renderHeader }
    { renderContent() }
    </>
  )
}