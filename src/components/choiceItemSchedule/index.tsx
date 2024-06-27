import { diffWeek } from "../../util/util";


export const ChoiceItemSchedule = ({start, end, statusEventos, title, localidade, isExterno, km, modalidade, dataInicio, dataFim, dataAtual }: any) => {
  const avaliationCount = () => {
    let text = modalidade;
    if (text !== 'Avaliação' || !dataInicio || dataFim)
      return <span>{text}</span>;

    const current = diffWeek(dataInicio, dataAtual);
    const diffTotal = diffWeek(dataInicio, dataFim);

    return (
      <>
        <span>
          {text}
          <span className="font-inter ml-2">{`${current}/${diffTotal}`}</span>{' '}
        </span>
      </>
    );
  };

  return  (
    <div className="flex gap-2 w-full item-center"> 
      <div className="grid text-center font-inter text-sm text-gray-400"> 
        <span> {start}</span> -
        <span>{end}</span>
      </div>
      <div className="text-gray-800 text-sm text-center grid justify-center">  
        <div className="font-base font-semibold text-primary">  {title} </div>

        <p className="flex gap-4 items-center justify-between">
          {avaliationCount()} <span>{statusEventos}</span>
        </p>
              
        <p className="flex gap-4 items-center">
          {localidade}
          {isExterno && (
            <span className="font-bold font-inter"> {`- ${km}km`} </span>
          )}
        </p>
      </div>
    </div>
  )
}