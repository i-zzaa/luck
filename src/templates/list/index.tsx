import { ItemList } from "../../components/itemList";
import { NotFound } from "../../components/notFound";
import { clsx } from 'clsx';
import { TextSubtext } from "../../components/textSubtext";

export interface ListProps {
  onSubmit?: (e: any) => any;
  textButton: string;
  iconButton: string;
  items: any[];
  type: 'simples' | 'complete';
  onClickLink: (e: any) => any;
  onClick: (e: any) => any;
  onClickEdit:(e: any) => any;
  onClickTrash: (e: any) => any;
  onClickReturn: (e: any) => any;
}

export function List({ 
  type = 'simples', 
  onClickLink,
  onClick,
  onClickEdit,
  onClickTrash,
  onClickReturn,
  items
}: ListProps) {

  const hasPermition = (agenda: string)  => agenda == 'btnAgendar' 
  
  const renderStatus = (item: any) => {
    const status = `${item.vaga.status.nome}`;
    switch (status) {
      case "Urgente":
        return (
          <TextSubtext text="Prioridade: " subtext={(
            <strong className="text-red-800  px-1 flex">
              {status}
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-800"></span>
              </span>
            </strong>
          )} size="sm" color="gray" display="flex"/>
        );
      case "Padrao":
        return <TextSubtext text="Prioridade: " subtext=" secondText" size="sm" color="gray" display="flex"/>;
      case "Voltou ABA":
        return <TextSubtext text="Prioridade: " subtext=" secondText" size="sm" color="gray" display="flex"/>;
      default:
        return <TextSubtext text="Prioridade: " subtext=" secondText" size="sm" color="gray" display="flex"/>;
    }
  };


  const renderlistSimples = () => {
    return  items.map((item: any) => {
      const textPrimaryLeft = item?.nome || item?.casa
      const textPrimaryRight = item?.perfil.nome.toUpperCase() || item?.sala
      const textSecondLeft = item?.login || item?.id
      const ATIVO = !!item?.ativo

      return  (
        <ItemList.Simples
          key={textSecondLeft}
          textPrimaryLeft={textPrimaryLeft} 
          textPrimaryRight={textPrimaryRight}
          textSecondLeft={textSecondLeft}
          onClickLink={() => onClickLink(item)}
          onClick={() => onClick(item)}
          textButtonFooter="Reset de senha"
          iconButtonFooter="pi pi-sync"
          typeButtonFooter="second"
          sizeButtonFooter="sm"
          onClickEdit={() => onClickEdit(item)}
          onClickTrash={() => onClickTrash(item)}
          onClickReturn={() => onClickReturn(item)}
          actionEdit={ATIVO}
          actionTrash={ATIVO}
          actionReturn={!ATIVO}
        />
      )
    })
  }

  const renderlistComplete = () => {
    return  items.map((item: any) => {
      const textPrimaryLeft = item?.nome
      const textPrimaryCenter = item?.idade
      const textSecondLeft = item?.responsavel ? `Responsável: ${item.responsavel}` : '' 
      const textSecondCenter = item?.telefone 
      const textSecondRight = item?.convenio ? item?.convenio.nome : ''
      const textFooter = item?.vaga.observacao 
      const DISABLED = !!item?.disabled
      let typeButtonFooter: 'agendado'  | 'devolutiva'

      const buttonFooter = {text: '', icon: '', type: 'second', size: 'md'}
      switch (true) {
        case item.vaga.naFila &&  !item.vaga.devolutiva && hasPermition("btnAgendar"):
          buttonFooter.text = 'Agendado' 
          buttonFooter.icon = 'pi pi-calendar-minus' 
          buttonFooter.type = 'primary' 
          buttonFooter.size = 'md' 
          typeButtonFooter  =  'agendado' 
          break;
        case !item.vaga.naFila &&  !item.vaga.devolutiva && hasPermition("btnAgendar"):
          buttonFooter.text = 'Retornar' 
          buttonFooter.icon = 'pi pi-sync' 
          buttonFooter.type = 'second' 
          buttonFooter.size = 'md'
          typeButtonFooter  =  'agendado'  
          break;
        case !item.vaga.naFila &&  !item.vaga.devolutiva && hasPermition("btnDevolutiva"):
          buttonFooter.text = 'Devolutiva' 
          buttonFooter.icon = 'pi pi-check-circle' 
          buttonFooter.type = 'primary' 
          buttonFooter.size = 'md'
          typeButtonFooter  =  'devolutiva' 
          break;
        case !item.vaga.naFila && item.vaga.devolutiva && hasPermition("btnDevolutiva"):
          buttonFooter.text = 'Retornar Devolutiva' 
          buttonFooter.icon = 'pi pi-check-circle' 
          buttonFooter.type = 'second' 
          buttonFooter.size = 'md' 
          typeButtonFooter  =  'devolutiva' 
          break;
        default:
          break;
      }

      const tags = item?.vaga.especialidades.map((especialidade: any)=> {
        return {
          type: especialidade.especialidade.nome,
          disabled: especialidade.agendado,
        }
      })

      return (
        <ItemList.Complete
          key={item.id}
          textPrimaryLeft={textPrimaryLeft} 
          textPrimaryCenter={textPrimaryCenter} 
          textSecondLeft={textSecondLeft}
          textSecondCenter={textSecondCenter}
          textSecondRight={textSecondRight}
          textFooter={textFooter}
          onClick={()=> onClick({item, typeButtonFooter})}
          textButtonFooter={buttonFooter.text}
          iconButtonFooter={buttonFooter.icon}
          tags={tags}
          onClickLink={() => onClickLink(item)}
          sizeButtonFooter="sm"
          onClickEdit={() => onClickEdit(item)}
          onClickTrash={() => onClickTrash(item)}
          onClickReturn={() => onClickReturn(item)}
          actionEdit={!DISABLED}
          actionTrash={!DISABLED}
          actionReturn={DISABLED}
        > 
          <div className="flex justify-between">
            <div className="sm:flex items-center sm:gap-4">
              <TextSubtext text="Período: " subtext={item?.vaga.periodo.nome} size="sm" color="gray" display="flex"/>
              <TextSubtext text="Tipo: " subtext={item?.vaga.tipoSessao.nome} size="sm" color="gray" display="flex"/>
              { renderStatus(item) }
              {
                item.vaga.devolutiva && <TextSubtext text="Devolutiva:" subtext={item.vaga?.dataDevolutiva} size="sm" color="gray" display="flex"/>
              }
            </div>
            <div className="text-end">
              <TextSubtext text="Inclusão: " subtext={item?.vaga.dataContato} size="sm" color="gray" display="flex"/>
            </div>
          </div>
     
        </ItemList.Complete>
      )
    })
  }

  return (
    <div className="pointer-events-auto flex-1">
      <div className="flex flex-col  bg-white ">
        <div className={clsx("flex-1  overflow-y-auto py-6", {'flex  justify-center': !items.length })}>
          <div className="">
            <div className="flow-root">
             {
                items.length ? 
                ( <ul className="-my-6 divide-y divide-gray-200 grid gap-4 items-center" >
                  { type === 'simples'? renderlistSimples() : renderlistComplete() }
                 </ul> )
                 
                 : <NotFound />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}