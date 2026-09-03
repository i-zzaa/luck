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
import { Confirm } from '../components/confirm';
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
  // Programa (grupo) aguardando confirmação de exclusão — null = nenhum
  // diálogo aberto. Excluir aqui apaga TODOS os registros Pei mesclados
  // naquele programa (item.peiIds), não só um; por isso passa por
  // confirmação, diferente da edição.
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<any>(null);

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

  // Edição em nível de protocolo já cobre "salvar" (consolida tudo no
  // registro canônico via peiIds — ver usePeiForm.ts), mas faltava a
  // exclusão do grupo inteiro: apaga cada registro original mesclado
  // naquele programa (item.peiIds — cai pra [item.id] se o backend não
  // mandar essa lista, por segurança).
  const handleRemovePrograma = async (item: any) => {
    setLoading(true);
    try {
      const ids: any[] = item?.peiIds?.length ? item.peiIds : [item.id];
      await Promise.all(ids.map((id: any) => deleteItem(`pei/${id}`)));

      onSubmitFilter({
        pacienteId: state?.pacienteId || pacienteCurrent,
        protocoloId: { id: tipoProtocolo },
      });
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

  // Uma meta com `procedimentoEnsino` marca o início de um novo grupo
  // (registro Pei original que foi mesclado nesse programa — cada um tem
  // seu próprio procedimento/estímulos; ver comentário no header do
  // Accordion). As metas seguintes, sem esse campo, pertencem ao mesmo
  // grupo. Agrupa aqui pra desenhar cada um como um card visualmente
  // separado, em vez de um `mb-8` solto entre elas.
  const agruparMetasPorProcedimento = (metas: any[]) => {
    const grupos: any[][] = [];
    (metas || []).forEach((meta) => {
      if (meta?.procedimentoEnsino || grupos.length === 0) {
        grupos.push([meta]);
      } else {
        grupos[grupos.length - 1].push(meta);
      }
    });
    return grupos;
  };

  const renderMetaItem = (meta: any, indexMeta: number) => (
    <div key={meta?.id ?? indexMeta}>
      <span className="flex align-items-center gap-2 w-full font-inter">
        Meta {indexMeta + 1}: {meta.value}
      </span>
      <ul className="list-disc ml-8 font-inter">
        {meta.subitems &&
          meta.subitems.map((subitem: any, index: number) => (
            <li key={subitem?.id ?? index}> {subitem.value} </li>
          ))}
      </ul>
    </div>
  );

  // Manual (pei): cada grupo (procedimento de ensino) vira seu próprio
  // card com borda — antes tudo ficava na mesma coluna com só um
  // respiro (mb-8) entre procedimentos, difícil de distinguir onde um
  // terminava e o outro começava.
  const renderMetasManual = (metas: any[]) => (
    <div className="my-2 space-y-3">
      {agruparMetasPorProcedimento(metas).map((grupo, indexGrupo) => (
        <div
          key={grupo[0]?.id ?? indexGrupo}
          className="rounded-lg border border-gray-200 p-3"
        >
          {renderHeader(grupo[0])}
          {grupo.map((meta, indexMeta) => renderMetaItem(meta, indexMeta))}
        </div>
      ))}
    </div>
  );

  const renderMetasOutroProtocolo = (metas: any[]) => (
    <div className="my-2">
      {(metas || []).map((meta: any, indexMeta: number) => (
        <div
          key={meta?.id ?? indexMeta}
          className={meta?.procedimentoEnsino && 'mb-8'}
        >
          {tipoProtocolo === TIPO_PROTOCOLO.portage && renderHeader(meta)}
          {renderMetaItem(meta, indexMeta)}
        </div>
      ))}
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
                    <div className="flex items-center w-full gap-1">
                      <span>{item.programa.nome}</span>

                      {/* Protocolo Manual: um item da lista já é o programa
                          inteiro (backend mescla todas as metas dos
                          registros daquele programa — ver
                          PeiService.agruparPeiPorPrograma). Editar abre o
                          formulário com o grupo completo; salvar consolida
                          tudo no registro canônico (peiIds). Excluir apaga
                          todos os registros mesclados nesse programa de
                          uma vez (peiIds), por isso pede confirmação. */}
                      {isManual && (
                        <div className="ml-auto flex items-center">
                          <ButtonHeron
                            text="editar"
                            type="transparent"
                            size="icon"
                            icon="pi pi-pencil"
                            color="violet"
                            onClick={() => handleEditPrograma(item)}
                            loading={loading}
                          />
                          <ButtonHeron
                            text="remove"
                            type="transparent"
                            size="icon"
                            icon="pi pi-trash"
                            color="red"
                            onClick={() => setConfirmDeleteItem(item)}
                            loading={loading}
                          />
                        </div>
                      )}
                    </div>
                  }
                  tabIndex={key}
                >
                  <div className="w-full overflow-y-auto">
                    {tipoProtocolo === TIPO_PROTOCOLO.vbMapp &&
                      renderHeader(item)}
                    {isManual
                      ? renderMetasManual(item.metas)
                      : renderMetasOutroProtocolo(item.metas)}
                  </div>
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
      <Confirm
        open={!!confirmDeleteItem}
        title="Excluir programa"
        message={`Excluir todos os registros de "${confirmDeleteItem?.programa?.nome}"? Essa ação não pode ser desfeita.`}
        icon="pi pi-trash"
        acceptLabel="Excluir"
        rejectLabel="Cancelar"
        onAccept={() => {
          const item = confirmDeleteItem;
          setConfirmDeleteItem(null);
          handleRemovePrograma(item);
        }}
        onReject={() => setConfirmDeleteItem(null)}
        onClose={() => setConfirmDeleteItem(null)}
      />
    </div>
  );
};

export default PEI;
