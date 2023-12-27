import { ItemList } from '../../components/itemList';
import { NotFound } from '../../components/notFound';
import { clsx } from 'clsx';
import { TextSubtext } from '../../components/textSubtext';
import { permissionAuth } from '../../contexts/permission';
import { formatdate } from '../../util/util';
import { LoadingHeron } from '../../components/loading';
import { STATUS_PACIENT_COD } from '../../constants/patient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact';

export interface ListProps {
  onSubmit?: (e: any) => any;
  loading: boolean;
  textButtonFooter?: string;
  iconButtonFooter?: string;
  screen: string;
  items: any[];
  type: 'simples' | 'complete';
  onClickLink: (e: any) => any;
  onClick: (e: any) => any;
  onClickEdit: (e: any) => any;
  onClickTrash: (e: any) => any;
  onClickReturn: (e: any) => any;
}

export function List({
  type = 'simples',
  iconButtonFooter,
  textButtonFooter,
  onClickLink,
  onClick,
  onClickEdit,
  onClickTrash,
  onClickReturn,
  items,
  screen,
  loading = false,
}: ListProps) {
  const { hasPermition } = permissionAuth();

  const renderStatus = (item: any) => {
    if (
      !item.status ||
      item.statusPacienteCod === STATUS_PACIENT_COD.crud_therapy
    )
      return null;

    const status = `${item.status?.nome}`;
    switch (status) {
      case 'Urgente':
        return (
          <TextSubtext
            text="Prioridade: "
            subtext={
              <strong className="text-red-900  px-1 flex">
                {status}
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-900"></span>
                </span>
              </strong>
            }
            size="sm"
            color="gray-dark"
            display="flex"
          />
        );
      case 'Padrão':
        return (
          <TextSubtext
            text="Prioridade: "
            subtext="Padrão"
            size="sm"
            color="gray-dark"
            display="flex"
          />
        );
      case 'Voltou ABA':
        return (
          <TextSubtext
            text="Prioridade: "
            subtext="Voltou ABA"
            size="sm"
            color="gray-dark"
            display="flex"
          />
        );
    }
  };

  const renderlistSimples = () => {
    return items.map((item: any) => {
      const textPrimaryLeft = item?.nome || item?.casa;
      const textPrimaryRight =
        item?.perfil?.nome.toUpperCase() ||
        item?.sala ||
        item?.especialidade?.nome;
      const textSecondLeft = item?.login || '';
      const ATIVO = !!item?.ativo;

      return (
       <>
        <ItemList.Simples
          key={item?.login || item.id}
          textPrimaryLeft={textPrimaryLeft}
          textPrimaryRight={textPrimaryRight}
          textSecondLeft={textSecondLeft}
          onClickLink={() => onClickLink(item)}
          onClick={() => onClick(item)}
          textButtonFooter={textButtonFooter}
          iconButtonFooter={iconButtonFooter}
          typeButtonFooter="second"
          sizeButtonFooter="sm"
          onClickEdit={() => onClickEdit(item)}
          onClickTrash={() => onClickTrash(item)}
          onClickReturn={() => onClickReturn(item)}
          actionEdit={ATIVO}
          actionTrash={ATIVO}
          actionReturn={!ATIVO}
          screen={screen}
        />

      {
        screen === 'CADASTRO_PROGRAMA' && (
          <>
           <> Atividades </>
            <DataTable value={item.atividades} size='small' responsiveLayout='scroll' className='-mt-4' showGridlines>
              <Column field="id" header="Id"></Column>
              <Column field="nome" header="Nome"></Column>
            </DataTable>
          </>
          )
        }
       </>
      );
    });
  };

  const renderlistComplete = () => {
    return items.map((item: any) => {
      const textPrimaryLeft = item?.nome;
      const textPrimaryCenter = item?.idade;
      const textSecondLeft = item?.responsavel
        ? `Responsável: ${item.responsavel}`
        : '';
      const textSecondCenter = item?.telefone;
      let textSecondRight = item?.convenio ? item?.convenio.nome : '';

      const textFooter = item?.vaga?.observacao;
      const DISABLED = !!item?.disabled;
      let typeButtonFooter:
        | 'programa'

      const buttonFooter = { text: '', icon: '', type: 'second', size: 'md' };
      let isDevolutiva = false;

      if (screen === 'CADASTRO_PACIENTES') {
        buttonFooter.text = 'Cadastrar Programa';
        buttonFooter.icon = 'pi pi-palette';
        buttonFooter.type = 'primary';
        buttonFooter.size = 'md';
        typeButtonFooter = 'programa';
      }

      const tags = item?.vaga.especialidades.map((especialidade: any) => {
        return {
          type: especialidade.especialidade.nome,
          disabled: especialidade.agendado,
        };
      });

      return (
        <ItemList.Complete
          key={item.id}
          textPrimaryLeft={textPrimaryLeft}
          textPrimaryCenter={textPrimaryCenter}
          textSecondLeft={textSecondLeft}
          textSecondCenter={textSecondCenter}
          textPrimaryRight={
            <TextSubtext
              text="Carteirinha: "
              subtext={item.carteirinha}
              size="sm"
              color="gray-dark"
              display="flex"
            />
          }
          textSecondRight={textSecondRight}
          textFooter={textFooter}
          onClick={() => onClick({ item, typeButtonFooter })}
          textButtonFooter={buttonFooter.text}
          iconButtonFooter={buttonFooter.icon}
          typeButtonFooter={buttonFooter.type}
          isDevolutiva={isDevolutiva}
          tags={tags}
          onClickLink={() => onClickLink(item)}
          sizeButtonFooter="sm"
          onClickEdit={() => onClickEdit(item)}
          onClickTrash={() => onClickTrash(item)}
          onClickReturn={() => onClickReturn({ item, typeButtonFooter })}
          actionEdit={!DISABLED}
          actionTrash={!DISABLED}
          actionReturn={DISABLED}
          screen={screen}
        >
          {!item.emAtendimento && (
            <div className="flex justify-between">
              <div className="sm:flex items-center sm:gap-4">
                {STATUS_PACIENT_COD.crud_therapy !==
                  item?.statusPacienteCod && (
                  <>
                    <TextSubtext
                      text="Período: "
                      subtext={item?.vaga?.periodo?.nome}
                      size="sm"
                      color="gray-dark"
                      display="flex"
                    />
                    <TextSubtext
                      text="Tipo: "
                      subtext={item?.tipoSessao?.nome}
                      size="sm"
                      color="gray-dark"
                      display="flex"
                    />
                  </>
                )}
                {renderStatus(item)}
                {item.vaga?.dataDevolutiva && (
                  <TextSubtext
                    className="font-inter"
                    text="Devolutiva:"
                    subtext={formatdate(item.vaga?.dataDevolutiva)}
                    size="sm"
                    color="gray-dark"
                    display="flex"
                  />
                )}
                {/* {item.vaga?.dataVoltouAba &&
                  item.statusPacienteCod < STATUS_PACIENT_COD.crud_therapy && (
                    <TextSubtext
                      className="font-inter"
                      text="Voltou Aba:"
                      subtext={formatdate(item.vaga?.dataVoltouAba)}
                      size="sm"
                      color="gray-dark"
                      display="flex"
                    />
                  )} */}
              </div>
              {item?.vaga?.dataContato && (
                <div className="text-end">
                  <TextSubtext
                    className="font-inter"
                    text="Inclusão: "
                    subtext={formatdate(item?.vaga?.dataContato)}
                    size="sm"
                    color="gray-dark"
                    display="flex"
                  />
                </div>
              )}
            </div>
          )}
        </ItemList.Complete>
      );
    });
  };

  const renderList = () => {
    if (!loading) {
      return items.length ? (
        <ul className="-my-6 divide-y divide-gray-200 grid gap-4 items-center">
          {type === 'simples' ? renderlistSimples() : renderlistComplete()}
        </ul>
      ) : (
        <NotFound />
      );
    } else {
      return <LoadingHeron />;
    }
  };

  return (
    <div className="pointer-events-auto flex-1">
      <div className="flex flex-col  bg-white ">
        <div
          className={clsx('flex-1  overflow-y-auto py-6', {
            'flex  justify-center': !items.length,
          })}
        >
          <div className="">
            <div className="flow-root">{renderList()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
