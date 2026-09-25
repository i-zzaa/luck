// src/hooks/useSessionForm.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../../routes/OtherRoutes';
import { useToast } from '../../contexts/toast';
import { getList, update } from '../../server';
import { buildErrorToast } from '../../util/error';
import {
  extractRespostas,
  mesclarRespostas,
  resumoTextLength,
} from '../../util/sessionTree';

const MAINTENANCE_VAZIA = { manual: [], vbmapp: [], portage: [] };

export const useSessionForm = () => {
  const { renderToast } = useToast();
  const navigate = useNavigate();
  // O id na URL basta pra abrir a sessão (sobrevive a F5/link direto) — o
  // evento vem de GET /sessao/calendario/:id.
  const { calendarioId } = useParams();
  // Dia do atendimento, posto na URL pela agenda: em série recorrente o
  // id da rota é o da série inteira, então é a data que diz qual
  // ocorrência está sendo registrada (e é ela que o servidor marca como
  // atendida). Ausente em link antigo — aí o servidor assume hoje.
  const [searchParams] = useSearchParams();
  const dataSessao = searchParams.get('data') || undefined;
  // O mesmo dia vai também no GET: numa série, é ele que diz qual registro
  // de sessão abrir (sem ele o servidor devolvia o mais recente da série —
  // o dia abria em leitura com a sessão de outro dia).
  const urlSessao = `/sessao/calendario/${calendarioId}${
    dataSessao ? `?data=${encodeURIComponent(dataSessao)}` : ''
  }`;
  const editor = useRef(null);

  const [evento, setEvento] = useState<any>(null);
  // Mínimo do resumo vem do servidor (GET /sessao/config), que é quem
  // valida de verdade — aqui é só UX (contador e aviso antes de enviar).
  const [minResumoLength, setMinResumoLength] = useState<number | undefined>();
  const [content, setContent] = useState('');
  const [list, setList] = useState<any[]>([]);
  const [listMaintenance, setListMaintenance] = useState<any>(MAINTENANCE_VAZIA);
  const [listPortage, setListPortage] = useState<any[]>([]);
  const [listVBMapp, setListVBMapp] = useState<any[]>([]);
  const [dtt, setDTT] = useState<any[]>([]);
  const [portage, setPortage] = useState<any[]>([]);
  const [vbmapp, setVBMapp] = useState<any[]>([]);
  // true = modo "leitura" decidido pelo servidor (já existe registro de
  // sessão pra esse calendário).
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  // As árvores já chegam no formato final de slots (item 7 da fase 1),
  // tanto da sessão gravada quanto do planejamento — só distribui nos
  // estados. O estado editável (dtt/portage/vbmapp) é reiniciado junto:
  // senão uma edição antiga "sombreava" a árvore nova depois de adicionar
  // metas (as seções exibem o estado editável quando ele não está vazio).
  const applyTrees = useCallback((trees: any) => {
    const maintenanceObj = trees?.maintenance || {};

    setList(trees?.sessao || []);
    setDTT(trees?.sessao || []);
    setListMaintenance({
      manual: maintenanceObj.manual || [],
      vbmapp: maintenanceObj.vbmapp || [],
      portage: maintenanceObj.portage || [],
    });
    setListPortage(trees?.portage || []);
    setPortage([]);
    setListVBMapp(trees?.vbmapp || []);
    setVBMapp(trees?.vbmapp || []);
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const [result, config]: any = await Promise.all([
        getList(urlSessao),
        // Config é só UX: se falhar, a tela abre sem o contador e o
        // servidor continua barrando resumo curto no salvar.
        getList('/sessao/config').catch(() => null),
      ]);

      if (!result?.evento) {
        renderToast({
          type: 'failure',
          title: 'Erro',
          message: 'Sessão não encontrada. Acesse pela agenda.',
          open: true,
        });
        navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`);
        return;
      }

      setEvento(result.evento);
      setMinResumoLength(config?.minResumoLength);

      // Nos dois modos as árvores vêm desta mesma resposta: em "leitura",
      // da sessão gravada; em "nova", do planejamento DESTE calendário.
      // Não usar GET /pei/activity/session/:pacienteId — ele devolve o
      // planejamento mais recente do paciente, que pode ser de outro
      // calendário, e aí o PUT responde 422.
      const leitura = result.modo === 'leitura';
      setIsEdit(leitura);
      if (leitura) setContent(result.resumo ?? '');
      applyTrees(result);
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível carregar a sessão.'));
    }
  }, [urlSessao, applyTrees, navigate, renderToast]);

  // Recarrega só as árvores de metas, sem tocar no resumo que a terapeuta
  // pode estar digitando — chamado depois de salvar metas pelo bottom
  // sheet (MetasBottomSheet). O atalho só aparece no modo "nova", então
  // a resposta traz o planejamento recém-salvo deste calendário.
  const refreshMetas = useCallback(async () => {
    if (!calendarioId) return;
    try {
      const result: any = await getList(urlSessao);
      const maintenanceObj = result?.maintenance || {};

      // Diferente do carregamento inicial (applyTrees), aqui já pode
      // haver treino preenchido na tela: o planejamento volta do servidor
      // com os slots vazios, então as respostas atuais são remontadas por
      // cima da árvore nova (que é quem traz as metas recém-adicionadas).
      setList(result?.sessao || []);
      setDTT((atual: any[]) => mesclarRespostas(result?.sessao || [], atual));

      setListPortage(result?.portage || []);
      setPortage((atual: any[]) =>
        atual.length ? mesclarRespostas(result?.portage || [], atual) : atual
      );

      setListVBMapp(result?.vbmapp || []);
      setVBMapp((atual: any[]) => mesclarRespostas(result?.vbmapp || [], atual));

      setListMaintenance((atual: any) => ({
        manual: mesclarRespostas(maintenanceObj.manual || [], atual?.manual || []),
        vbmapp: mesclarRespostas(maintenanceObj.vbmapp || [], atual?.vbmapp || []),
        portage: mesclarRespostas(maintenanceObj.portage || [], atual?.portage || []),
      }));
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível atualizar as metas.'));
    }
  }, [calendarioId, urlSessao, renderToast]);

  const handleSubmitSumary = useCallback(async () => {
    const tamanhoResumo = resumoTextLength(content);
    if (minResumoLength && tamanhoResumo < minResumoLength) {
      renderToast({
        type: 'failure',
        title: 'Resumo obrigatório',
        message:
          tamanhoResumo === 0
            ? 'Escreva o resumo da sessão antes de salvar.'
            : `O resumo precisa de pelo menos ${minResumoLength} caracteres (faltam ${
                minResumoLength - tamanhoResumo
              }).`,
        open: true,
      });
      return;
    }

    // Só as respostas (onde + o quê): a topologia das árvores, pacienteId
    // e data o servidor tira do planejamento/calendário. Cada seção edita
    // um estado próprio e cai na árvore carregada quando nada foi mexido
    // — mesma regra de exibição de SessionActivity/Portage/VBMapp.
    const respostas = [
      ...extractRespostas(dtt.length ? dtt : list, 'manual'),
      ...extractRespostas(portage.length ? portage : listPortage, 'portage'),
      ...extractRespostas(vbmapp.length ? vbmapp : listVBMapp, 'vbmapp'),
      ...extractRespostas(
        [...listMaintenance.manual, ...listMaintenance.vbmapp, ...listMaintenance.portage],
        'manutencao'
      ),
    ];

    setLoading(true);
    try {
      await update(`/sessao/calendario/${calendarioId}`, {
        resumo: content,
        respostas,
        data: dataSessao,
      });
      renderToast({
        type: 'success',
        message: 'Sessão atualizada!',
        open: true,
        title: '',
      });
      navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`);
    } catch (error) {
      // Mensagem do servidor (ex.: resumo abaixo do mínimo, sessão sem
      // planejamento de metas) vai direto pro toast.
      renderToast(buildErrorToast(error, 'Sessão não atualizada!'));
    } finally {
      setLoading(false);
    }
  }, [
    calendarioId,
    dataSessao,
    content,
    minResumoLength,
    dtt,
    list,
    portage,
    listPortage,
    vbmapp,
    listVBMapp,
    listMaintenance,
    navigate,
    renderToast,
  ]);

  useEffect(() => {
    // Sem id na URL não há o que carregar — volta pra agenda em vez de
    // deixar a tela em branco.
    if (!calendarioId) {
      renderToast({
        type: 'failure',
        title: 'Erro',
        message: 'Sessão não encontrada. Acesse pela agenda.',
        open: true,
      });
      navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`);
      return;
    }

    loadSession();
  }, [calendarioId, loadSession, navigate, renderToast]);

  return {
    editor,
    calendarioId,
    evento,
    minResumoLength,
    content,
    setContent,
    list,
    listMaintenance, // objeto { manual, vbmapp, portage }
    listPortage,
    listVBMapp,
    dtt,
    portage,
    vbmapp,
    isEdit,
    loading,
    setPortage,
    setVBMapp,
    setDTT,
    // setter da árvore listMaintenance — é o que SessionMaintenance edita.
    setListMaintenance,
    handleSubmitSumary,
    refreshMetas,
  };
};
