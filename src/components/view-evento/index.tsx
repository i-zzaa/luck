import { Dialog } from 'primereact/dialog';
import { diffWeek, weekDay } from '../../util/util';
import { ButtonHeron } from '../button';
import { Tag } from '../tag';

interface Props {
  evento: any;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export const ViewEvento = ({
  evento,
  open,
  onClose,
  onEdit
}: Props) => {

  const avaliationCount = (evento: any)=> {
    let text = evento.modalidade.nome
    if (text !== 'Avaliação' || !evento?.dataInicio || !evento?.dataFim)  return <span>{text}</span>

    const current =  diffWeek(evento.dataInicio, evento.dataAtual)
    const diffTotal =  diffWeek(evento.dataInicio, evento.dataFim)

    return <><span>{text}<span className='font-sans-serif ml-2'>{ `${current}/${diffTotal}`}</span> </span></>
  }

  const header = (
    <div className='flex justify-between items-center gap-8'>
      <Tag type={evento.especialidade.nome} disabled={false}/>
      <span>{ evento.paciente.nome }</span>
      <div className='mt-[-0.5rem]'>
       <ButtonHeron 
          text= "Edit"
          icon= 'pi pi-pencil'
          type= 'transparent'
          color="violet"
          size= 'icon'
          onClick={onEdit}
        />
      </div>
    </div>
  )

  return (
    <Dialog header={header} visible={open} onHide={onClose} breakpoints={{'960px': '80vw'}} >
      <div>
      <p className='flex gap-4 items-center justify-between'>{ avaliationCount(evento)} <span>{ evento.statusEventos.nome }</span></p>
      <br />

      <p className='font-sans-serif font-bold'>{ evento.date } &bull; {`${evento.start} até ${evento.end}`}</p>
      <p>{ evento.intervalo.nome } &bull; { evento.diasFrequencia.map((dia: number)=> weekDay[dia]).join('-')}</p>
      <br />
      <p className='flex gap-4 items-center'><i className='pi pi-map-marker'></i>{ evento.localidade.nome }</p>
      <br />
      <p className='flex gap-4 items-center'>{ evento.terapeuta.nome } <i className='pi pi-tag'> </i> { evento.funcao.nome }</p>
      </div>

    </Dialog>  
  )
}
