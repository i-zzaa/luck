import { useCallback, useEffect, useState } from 'react';
import { Filter } from '../templates/filter';
import { PEIFields } from '../constants/formFields';
import { deleteItem, dropDown, filter } from '../server';
import { useToast } from '../contexts/toast';
import { Card } from '../components/card';
import { NotFound } from '../components/notFound';
import { LoadingHeron } from '../components/loading';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Fieldset } from 'primereact/fieldset';
import { ButtonHeron } from '../components/button';
import { TIPO_PROTOCOLO, VALOR_PORTAGE } from '../constants/protocolo';
import { useForm } from 'react-hook-form';

const fieldsConst = PEIFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

const PEI = () => {
  const { renderToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);
  const [list, setList] = useState({}) as any;

  const [tipoProtocolo, setTipoProtocolo] = useState();
  const [pacienteCurrent, setPacienteCurrent] = useState();

  const handleEditPrograma = (item: any) => {
    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: {
        edit: true,
        item,
        programa: item.programa,
        tipoProtocolo: TIPO_PROTOCOLO.pei,
      },
    });
  };

  const handleRemovePrograma = async (item: any) => {
    setLoading(true);
    try {
      const pacienteId = item.paciente;
      await deleteItem(`pei/${item.id}`);

      onSubmitFilter({ pacienteId, protocoloId: tipoProtocolo });
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'PEI removido!',
        open: true,
      });
    } catch (error) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'PEI não encontrado!',
        open: true,
      });
    }
    setLoading(false);
  };

  const renderFiledSet = (title: string, text: string) => (
    <Fieldset className="text-[8px]">
      <div className="font-bold text-wrap"> {title} </div>
      <div className="font-normal text-wrap"> {text}</div>
    </Fieldset>
  );

  const renderHeader = (item: any) => {
    return (
      <>
        {
          <div className="font-bold my-2">
            {' '}
            {item.procedimentoEnsino?.nome || ''}
          </div>
        }

        <div className=" grid grid-cols-3 gap-1">
          {item.estimuloDiscriminativo &&
            renderFiledSet(
              'SD (estímulo discriminativo)',
              item.estimuloDiscriminativo
            )}
          {item.resposta && renderFiledSet('Resposta', item.resposta)}
          {item.estimuloReforcadorPositivo &&
            renderFiledSet(
              'SR+ (estímulo reforçador positivo)',
              item.estimuloReforcadorPositivo
            )}
        </div>
      </>
    );
  };

  // Protocolo Manual (pei): o backend agora agrupa por programa — cada
  // item da lista carrega `entries`, um por registro Pei original que
  // compõe aquele programa (podem ser vários, cada um com suas próprias
  // metas). Editar/excluir agem sobre o `entry`, não sobre o grupo
  // inteiro, pra não apagar as metas dos outros registros do mesmo
  // programa. Os outros protocolos (VB-MAPP/Portage) continuam com o
  // formato antigo (metas direto no item).
  const renderMetas = (metas: any[]) => (
    <div className="my-2">
      {(metas || []).map((meta: any, indexMeta: number) => (
        <div
          key={meta?.id ?? indexMeta}
          className={meta?.procedimentoEnsino && 'mb-8'}
        >
          {tipoProtocolo === TIPO_PROTOCOLO.portage && renderHeader(meta)}

          <span className="flex align-items-center gap-2 w-full font-inter">
            Meta {indexMeta + 1}: {meta.value}
          </span>
          <ul className="list-disc	ml-8 font-inter">
            {meta.subitems &&
              meta.subitems.map((subitem: any, index: number) => (
                <li key={subitem?.id ?? index}> {subitem.value} </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );

  const renderEntryActions = (entry: any) => (
    <div className="ml-auto">
      <ButtonHeron
        text="editar"
        type="transparent"
        size="icon"
        icon="pi pi-pencil"
        color="violet"
        onClick={() => handleEditPrograma(entry)}
        loading={loading}
      />
      <ButtonHeron
        text="remove"
        icon="pi pi-trash"
        type="transparent"
        color="red"
        size="icon"
        onClick={() => handleRemovePrograma(entry)}
        loading={loading}
      />
    </div>
  );

  const renderManualEntries = (item: any) => (
    <div className="w-full overflow-y-auto">
      {(item.entries || []).map((entry: any, indexEntry: number) => (
        <div
          key={entry?.id ?? indexEntry}
          className={indexEntry > 0 ? 'mt-6 pt-4 border-t' : ''}
        >
          <div className="flex items-center w-full">
            <div className="flex-1">{renderHeader(entry)}</div>
            {renderEntryActions(entry)}
          </div>
          {renderMetas(entry.metas)}
        </div>
      ))}
    </div>
  );

  const renderOutroProtocolo = (item: any) => (
    <div className="w-full overflow-y-auto">
      {tipoProtocolo !== TIPO_PROTOCOLO.portage && renderHeader(item)}
      {renderMetas(item.metas)}
    </div>
  );

  const renderContent = () => {
    if (!loading) {
      return list.length ? (
        <Card>
          <Accordion>
            {list.map((item: any, key: number) => {
              const isManual = tipoProtocolo === TIPO_PROTOCOLO.pei;

              return (
                <AccordionTab
                  key={item?.id ?? key}
                  header={
                    <div className="flex items-center  w-full">
                      <span>{item.programa.nome}</span>
                    </div>
                  }
                  tabIndex={key}
                >
                  {isManual
                    ? renderManualEntries(item)
                    : renderOutroProtocolo(item)}
                </AccordionTab>
              );
            })}
          </Accordion>
        </Card>
      ) : (
        <Card>
          {' '}
          <NotFound />{' '}
        </Card>
      );
    } else {
      return <LoadingHeron />;
    }
  };

  const onSubmitFilter = async ({ pacienteId, protocoloId }: any) => {
    if (!protocoloId) return;

    setLoading(true);

    protocoloId && setTipoProtocolo(protocoloId.id);
    pacienteId && setPacienteCurrent(pacienteId);

    try {
      const { data }: any = await filter('pei', {
        paciente: pacienteId,
        protocoloId: protocoloId,
        notSelected: [VALOR_PORTAGE.sim],
      });

      setList(data);
    } catch (error) {
      setList([]);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'PEI não encontrado!',
        open: true,
      });
    }
    setLoading(false);
  };

  const renderFilter = () => {
    return (
      <Filter
        id="form-filter-pei"
        legend="Filtro"
        nameButton="Cadastrar"
        fields={fieldsConst}
        dropdown={dropDownList}
        onSubmit={(value) => onSubmitFilter(value)}
        onReset={() => setList([])}
        screen="PEI"
        loading={loading}
        onInclude={() => {
          navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
            state: {
              edit: false,
              pacienteId: state?.pacienteId || pacienteCurrent,
              tipoProtocolo,
            },
          });
        }}
        defaultValues={state}
      />
    );
  };

  const renderPrograma = useCallback(async () => {
    const [paciente, protocolo]: any = await Promise.all([
      dropDown('paciente'),
      dropDown('protocolo'),
    ]);

    setDropDownList({
      paciente,
      protocolo,
    });

    if (state) {
      onSubmitFilter(state);
    }
  }, []);

  useEffect(() => {
    renderPrograma();
  }, []);

  return (
    <div>
      {renderFilter()}
      {renderContent()}
    </div>
  );
};

export default PEI;
