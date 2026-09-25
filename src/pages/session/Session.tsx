import { useMemo, useState } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { useSearchParams } from 'react-router-dom';
import { RichTextEditor } from '../../components/richTextEditor';
import { Card } from '../../components/card';
import { ButtonHeron } from '../../components/button';
import { useSessionForm } from './useSessionForm';
import { SessionActivity } from './SessionActivity';
import { SessionPortage } from './SessionPortage';
import { SessionVBMapp } from './SessionVBMapp';
import { SessionMaintenance } from './SessionMaintenance';
import { MetasBottomSheet } from '../../components/metasBottomSheet';
import { Segmentado } from '../../foms/protocolo/avaliacao';
import { colorsData, firtUpperCase } from '../../util/util';
import { contarComTentativa } from './sessaoUi';
import { resolveEspecialidadeCodigo } from '../../util/especialidade';

type Protocolo = 'manual' | 'portage' | 'vbmapp';

const ROTULO: Record<Protocolo, string> = {
  manual: 'Manual',
  portage: 'Portage',
  vbmapp: 'VB-MAPP',
};


export const Session = () => {
  const {
    calendarioId,
    evento,
    minResumoLength,
    content,
    setContent,
    list,
    listMaintenance,
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
    setListMaintenance,
    handleSubmitSumary,
    refreshMetas,
  } = useSessionForm();

  const [metasSheetOpen, setMetasSheetOpen] = useState(false);
  const [escolhido, setEscolhido] = useState<Protocolo | null>(null);
  const [searchParams] = useSearchParams();

  // Mesma regra de exibição das seções: o estado editável quando existe,
  // senão a árvore carregada.
  const arvores: Record<Protocolo, any[]> = {
    manual: dtt.length ? dtt : list,
    portage: portage.length ? portage : listPortage,
    vbmapp: vbmapp.length ? vbmapp : listVBMapp,
  };

  const contagens = useMemo(
    () => ({
      manual: contarComTentativa(arvores.manual),
      portage: contarComTentativa(arvores.portage),
      vbmapp: contarComTentativa(arvores.vbmapp),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dtt, list, portage, listPortage, vbmapp, listVBMapp]
  );

  // Protocolos que têm tarefa ou manutenção nesta sessão, na ordem fixa.
  const disponiveis = (['manual', 'portage', 'vbmapp'] as Protocolo[]).filter(
    (p) => contagens[p].total > 0 || (listMaintenance?.[p] || []).length > 0
  );
  const protocolo: Protocolo | null =
    escolhido && disponiveis.includes(escolhido) ? escolhido : disponiveis[0] ?? null;

  const total = contagens.manual.total + contagens.portage.total + contagens.vbmapp.total;
  const comTentativa =
    contagens.manual.comTentativa + contagens.portage.comTentativa + contagens.vbmapp.comTentativa;

  // Evento vem de GET /sessao/calendario/:id (não mais de location.state),
  // então só existe depois da carga.
  const renderCabecalho = () => {
    if (!evento) return null;
    const data = searchParams.get('data');
    const dataTexto = data
      ? `${firtUpperCase(moment(data).format('dddd').replace('-feira', ''))}, ${moment(data).format('DD/MM')} · `
      : '';
    const codigo = resolveEspecialidadeCodigo(evento?.especialidade);
    const detalhes = [evento?.modalidadeExibicao, evento?.localExibicao].filter(Boolean).join(' · ');
    const status = isEdit
      ? { label: 'Atendida', className: 'bg-[#dcfce7] text-[#15803d]' }
      : evento?.statusEventos?.nome
        ? { label: evento.statusEventos.nome, className: 'bg-[#f4f4f5] text-[#3f3f46]' }
        : null;

    return (
      <section className="flex items-stretch bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        <span
          className="w-1 shrink-0"
          style={{ background: codigo ? colorsData[codigo] : '#d3d3d3' }}
          aria-hidden
        />
        <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[17px] font-bold text-[#27272a] truncate">{evento.title}</span>
            {status && (
              <span
                className={clsx(
                  'shrink-0 rounded-full px-2 py-px text-[11px] font-bold',
                  status.className
                )}
              >
                {status.label}
              </span>
            )}
          </div>
          <span className="text-[13px] text-gray-800">
            {dataTexto}
            {evento.data?.start}–{evento.data?.end}
          </span>
          {detalhes && <span className="text-[12px] text-gray-800">{detalhes}</span>}
        </div>
      </section>
    );
  };

  return (
    <div className="mt-2 flex flex-col gap-3 overflow-x-hidden pb-24">
      {renderCabecalho()}

      {!isEdit && total > 0 && (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-[#27272a]">
                {comTentativa} de {total} {total === 1 ? 'item com tentativas' : 'itens com tentativas'}
              </span>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${Math.round((comTentativa / total) * 100)}%` }}
                />
              </div>
            </div>
            {/* Atalho pra complementar as metas sem sair da Sessão. */}
            <button
              type="button"
              onClick={() => setMetasSheetOpen(true)}
              className="h-10 shrink-0 flex items-center gap-1.5 px-3 rounded-[10px] border border-primary bg-white text-[13px] font-bold text-primary"
            >
              <i className="pi pi-plus text-[11px]" />
              Metas
            </button>
          </div>
          {/* No lugar do aviso vermelho fixo no topo: uma linha curta; o
              item ganha a etiqueta "4 seguidas" quando chega lá. */}
          <span className="-mt-1 px-1 text-[12px] text-gray-800">
            Interrompa o item ao atingir 4 corretas seguidas.
          </span>
        </>
      )}

      {!isEdit && total === 0 && (
        <button
          type="button"
          onClick={() => setMetasSheetOpen(true)}
          className="self-start h-10 flex items-center gap-1.5 px-3 rounded-[10px] border border-primary bg-white text-[13px] font-bold text-primary"
        >
          <i className="pi pi-plus text-[11px]" />
          Adicionar metas
        </button>
      )}

      {disponiveis.length > 1 && protocolo && (
        <Segmentado
          rotulo="Protocolo"
          variante="forte"
          opcoes={disponiveis.map((p) => ({
            valor: p,
            label: `${ROTULO[p]} · ${contagens[p].comTentativa}/${contagens[p].total}`,
          }))}
          valor={protocolo}
          onChange={(p) => setEscolhido(p)}
        />
      )}

      {protocolo === 'manual' && (
        <SessionActivity list={list} dtt={dtt} isEdit={isEdit} setDTT={setDTT} />
      )}
      {protocolo === 'portage' && (
        <SessionPortage
          listPortage={listPortage}
          portage={portage}
          isEdit={isEdit}
          setPortage={setPortage}
        />
      )}
      {protocolo === 'vbmapp' && (
        <SessionVBMapp
          listVBMapp={listVBMapp}
          vbmapp={vbmapp}
          isEdit={isEdit}
          setVBMapp={setVBMapp}
        />
      )}
      {protocolo && (
        <SessionMaintenance
          listMaintenance={listMaintenance}
          isEdit={isEdit}
          setListMaintenance={setListMaintenance}
          categoria={protocolo}
        />
      )}

      {/* Resumo: o mesmo componente de antes. */}
      <div>
        <div className="flex items-center justify-between mx-2 mt-3">
          <span className="text-gray-800 font-inter font-bold leading-4">
            Resumo
            {!isEdit && <span className="text-red-400"> *</span>}
            {!isEdit && !!minResumoLength && (
              <span className="text-gray-400 font-normal text-xs">
                {' '}
                (mínimo {minResumoLength} caracteres)
              </span>
            )}
          </span>
          {isEdit && (
            <span className="text-gray-800 font-inter leading-4 bg-gray-300 rounded-full px-2 py-0.5">
              Somente leitura
            </span>
          )}
        </div>
        <Card
          className={clsx(
            'rounded-lg w-full border border-gray-300',
            isEdit && 'cursor-not-allowed bg-gray-200'
          )}
        >
          <RichTextEditor
            value={content}
            readOnly={isEdit}
            placeholder="Descreva como foi a sessão, a evolução do paciente e observações relevantes."
            onBlur={(newContent) => setContent(newContent)}
            minLength={minResumoLength}
          />
        </Card>
      </div>

      {!isEdit && (
        <div className="fixed inset-x-0 bottom-0 z-10 px-4 pt-3 bg-background border-t border-gray-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <ButtonHeron
            text="Salvar"
            icon="pi pi-check"
            type="primary"
            size="full"
            loading={loading}
            onClick={handleSubmitSumary}
            disabled={isEdit}
          />
        </div>
      )}

      <MetasBottomSheet
        open={metasSheetOpen}
        onClose={() => setMetasSheetOpen(false)}
        calendarioId={calendarioId}
        onSaved={refreshMetas}
      />
    </div>
  );
};
