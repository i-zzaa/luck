import moment from 'moment';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { ATENDENTE, DESENVOLVEDOR, TERAPEUTA, permissionAuth } from '../../contexts/permission';
import { diffWeek, isInPast, weekDay } from '../../util/util';
import { ButtonHeron } from '../button';
import { Tag } from '../tag';
import { STATUS_EVENTS } from '../../constants/schedule';

interface Props {
  evento: any;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  onClickSecond: () => void;
}

export const ViewEvento = ({
  evento,
  open,
  onClose,
  onEdit,
  onDelete,
  onClick,
  onClickSecond
}: Props) => {
  const [buttonEdit, setButtonEdit] = useState(true);
  const { hasPermition, perfil } = permissionAuth();

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

  const header = (
    <div className="flex justify-between items-center gap-8">
   {  evento.paciente.nome !== STATUS_EVENTS.livre ? <Tag type={evento.especialidade.nome} disabled={false} /> : <div></div>}
      <span>{evento.paciente.nome}</span>

      <div className="flex mt-[-0.5rem]">
        {hasPermition('AGENDA_LISTA_EDITAR') ? (
          <div>
            {buttonEdit && (
              <ButtonHeron
                text="Edit"
                icon="pi pi-pencil"
                type="transparent"
                color="violet"
                size="icon"
                onClick={onEdit}
              />
            )}
          </div>
        ) : null}

        {hasPermition('AGENDA_LISTA_EXCLUIR') && evento?.canDelete ? (
          <div>
            {buttonEdit && (
              <ButtonHeron
                text="Edit"
                icon="pi pi-trash"
                type="transparent"
                color="red"
                size="icon"
                onClick={onDelete}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  useEffect(() => {
    const dateNow = moment().format('YYYY-MM-DD');
    setButtonEdit(dateNow <= evento.dataAtual);
  });
  return (
    <Dialog
      header={header}
      visible={open}
      onHide={onClose}
      breakpoints={{ '960px': '80vw' }}
    >
      <div>
        <p className="flex gap-4 items-center justify-between">
          {avaliationCount(evento)} <span>{evento.statusEventos.nome}</span>
        </p>
        <br />

        <p className="font-inter font-bold">
          {evento.date} &bull; {`${evento.start} até ${evento.end}`}
        </p>
        {evento.frequencia.id !== 1 && (
          <p>
            {evento.intervalo.nome} &bull;{' '}
            {evento?.diasFrequencia
              .map((dia: number) => weekDay[dia - 1])
              .join('-')}
          </p>
        )}
        <br />
        <p className="flex gap-4 items-center">
          <i className="pi pi-map-marker"></i>
          {evento.localidade.nome}
          {evento.isExterno && (
            <span className="font-bold font-inter"> {`- ${evento.km}km`} </span>
          )}
        </p>
        <br />
        {evento.observacao ? (
          <>
            <p className="flex gap-4 items-center">
              <i className="pi pi-bars"></i>
              {evento.observacao}
            </p>
            <br />
          </>
        ) : null}
        <p className="flex gap-4 items-center ">
          {evento.terapeuta.nome} <i className="pi pi-tag"> </i>{' '}
          {evento.funcao.nome}
        </p>


<div className='flex justify-between mt-8 gap-2'>

        { (perfil === DESENVOLVEDOR ||  perfil === TERAPEUTA) && evento.statusEventos.nome !== STATUS_EVENTS.atendido &&  !isInPast(evento.date) &&  evento.paciente.nome !== STATUS_EVENTS.livre ? (
               <ButtonHeron
                text="Atendido"
                icon="pi pi-check"
                type="primary"
                color="white"
                size="full"
                onClick={onClick}
              />
        ) : null}
        { (perfil == DESENVOLVEDOR ||  perfil === ATENDENTE  ) &&  isInPast(evento.date) &&  evento.paciente.nome !== STATUS_EVENTS.livre && evento.statusEventos.nome !== STATUS_EVENTS.atendido && evento.statusEventos.nome !== STATUS_EVENTS.atestado? (
               <ButtonHeron
                text="Atestado"
                icon="pi pi-book"
                type="second"
                color="white"
                size="full"
                onClick={onClickSecond}
              />
        ) : null}
      </div>
      </div>
    </Dialog>
  );
};
