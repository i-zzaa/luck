import { useEffect } from 'react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/toast';
import { ButtonHeron } from '../components';
import { ChoiceItemSchedule } from '../components/choiceItemSchedule';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { useMetasSelection } from './metas/useMetasSelection';
import { MetasSelectionFields } from './metas/MetasSelectionFields';

// Tela dedicada de seleção de metas (acessada pelo botão "Pesquisar" na
// Agenda). A lógica de busca/seleção/salvamento mora em
// pages/metas/useMetasSelection.ts — reaproveitada também pelo bottom
// sheet dentro da tela de Sessão (ver components/metasBottomSheet), que
// oferece o mesmo fluxo sem sair da Sessão.
export default function Metas() {
  const { renderToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location as any;

  const selection = useMetasSelection({
    paciente: state?.paciente,
    calendarioId: state?.id,
    onSaved: () => navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`),
  });

  useEffect(() => {
    // location.state some ao dar F5/abrir link direto, e sem esse guard
    // renderHeader e o hook liam state.paciente/state.id de um state
    // ausente e derrubavam a página inteira (sem Error Boundary no
    // projeto).
    if (!state?.paciente) {
      renderToast({
        type: 'failure',
        title: 'Erro',
        message: 'Paciente não encontrado. Acesse pelo PEI.',
        open: true,
      });
      navigate(`/${CONSTANTES_ROUTERS.PEI}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state?.paciente) return null;

  return (
    <div
      className={clsx(
        'h-[90vh] flex flex-col overflow-y-auto',
        selection.hasAnyContent && 'pb-24'
      )}
    >
      <ChoiceItemSchedule
        start={state?.data?.start}
        end={state?.data?.end}
        statusEventos={state?.statusEventos}
        title={state?.title}
        localidade={state?.localidade?.nome}
        localExternoDescricao={state?.localExternoDescricao}
        localExibicao={state?.localExibicao}
        isExterno={state?.isExterno}
        km={state?.km}
        modalidade={state?.modalidade?.nome}
        dataInicio={state?.dataInicio}
        dataFim={state?.dataFim}
        dataAtual={state?.dataAtual}
      />

      <div className="text-gray-400 text-xs mt-4 mx-2">
        Selecione os programas para a sessão
      </div>

      <MetasSelectionFields
        selection={selection}
        notFoundExtra={
          <ButtonHeron
            text="Cadastrar Protocolo"
            icon="pi pi-book"
            type="primary"
            color="white"
            size="sm"
            onClick={() =>
              navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
                state: { item: { paciente: state.paciente } },
              })
            }
          />
        }
      />

      {selection.hasAnyContent && (
        <div className="fixed inset-x-0 bottom-0 z-10 px-4 pt-3 bg-background border-t border-gray-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <ButtonHeron
            text="Salvar"
            type="primary"
            size="full"
            onClick={() => selection.onSubmit()}
            loading={selection.loading}
            typeButton="button"
          />
        </div>
      )}
    </div>
  );
}
