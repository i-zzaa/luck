import { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { Input } from '../components';
import { ButtonHeron } from '../components/button';
import { LoadingHeron } from '../components/loading';
import { AssinaturaECarimbo } from '../components/assinatura';
import { useToast } from '../contexts/toast';
import { dropDown, getList } from '../server';
import { buildErrorToast } from '../util/error';
import {
  gerarPdfResumoSessoes,
  htmlParaTexto,
  mesPorExtenso,
  terapeutasDoMes,
  type ResumosDoMes,
} from '../constants/pdfResumoSessoes';

// Menu "Resumos": a folha de "Relatório evolutivo de sessão" do paciente
// no mês, montada com os resumos registrados e assinados no app — Data,
// Hora inicial/final, o resumo e a assinatura com o carimbo de quem
// atendeu. Terapeuta vê só as sessões dela (regra do backend).
const Resumos = () => {
  const { renderToast } = useToast();
  // Vindo da tela do paciente, ele já chega escolhido.
  const { state } = useLocation() as { state: { pacienteId?: any } | null };
  const { control, watch } = useForm<any>({
    defaultValues: { pacienteId: state?.pacienteId ?? null },
  });
  const paciente = watch('pacienteId');
  const [mes, setMes] = useState(() => moment().format('YYYY-MM'));
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [dados, setDados] = useState<ResumosDoMes | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    dropDown('paciente')
      .then((lista) => setPacientes(lista || []))
      .catch((error) => renderToast(buildErrorToast(error, 'Não foi possível carregar os pacientes.')));
  }, [renderToast]);

  const buscar = useCallback(async () => {
    if (!paciente?.id || !mes) {
      setDados(null);
      return;
    }
    setCarregando(true);
    try {
      const resultado = await getList(`/sessao/resumos?pacienteId=${paciente.id}&mes=${mes}`);
      setDados(resultado);
    } catch (error) {
      setDados(null);
      renderToast(buildErrorToast(error, 'Não foi possível carregar os resumos.'));
    } finally {
      setCarregando(false);
    }
  }, [paciente?.id, mes, renderToast]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const exportar = async () => {
    if (!dados) return;
    setExportando(true);
    try {
      await gerarPdfResumoSessoes(dados);
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível gerar o PDF.'));
    } finally {
      setExportando(false);
    }
  };

  const terapeutas = dados ? terapeutasDoMes(dados.sessoes) : [];

  return (
    <div className="mt-2 flex flex-col gap-3 pb-28">
      <div className="grid grid-cols-6 gap-2">
        <Input
          labelText="Paciente"
          id="pacienteId"
          type="select"
          customCol="col-span-6"
          control={control}
          options={pacientes}
        />
        <label className="col-span-6 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-gray-800">Mês</span>
          <input
            type="month"
            value={mes}
            max={moment().format('YYYY-MM')}
            onChange={(e) => setMes(e.target.value)}
            className="h-11 rounded-[10px] border border-gray-300 bg-white px-3 text-[15px] text-black"
          />
        </label>
      </div>

      {!paciente?.id && (
        <span className="px-1 text-[13px] text-gray-800">
          Escolha o paciente para ver os resumos de sessão do mês.
        </span>
      )}

      {carregando && <LoadingHeron />}

      {!carregando && dados && (
        <article className="flex flex-col gap-3 rounded-[14px] border border-gray-200 bg-white px-3.5 py-3">
          <header className="flex flex-col gap-0.5 text-[13px] text-black">
            <span>
              <b>Cliente:</b> {dados.paciente.nome}
            </span>
            <span>
              <b>Terapeuta:</b> {terapeutas.join(', ') || '—'}
            </span>
            <span>
              <b>Mês:</b> {mesPorExtenso(dados.mes)}
            </span>
          </header>

          <h2 className="m-0 text-center text-[14px] font-bold uppercase text-red-900 underline">
            Relatório evolutivo de sessão
          </h2>

          {!dados.sessoes.length && (
            <span className="text-center text-[13px] text-gray-800">
              Nenhuma sessão registrada neste mês.
            </span>
          )}

          {dados.sessoes.map((sessao) => (
            <section
              key={sessao.id}
              className="flex flex-col gap-2 border-t border-gray-200 pt-3 first-of-type:border-t-0 first-of-type:pt-0"
            >
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-black">
                <span>
                  <b>Data:</b> {moment(sessao.data, 'YYYY-MM-DD').format('DD/MM/YY')}
                </span>
                <span>
                  <b>Hora inicial:</b> {sessao.horaInicio || '—'}
                </span>
                <span>
                  <b>Hora final:</b> {sessao.horaFim || '—'}
                </span>
              </div>
              <p className="m-0 whitespace-pre-line text-[14px] leading-5 text-black">
                {htmlParaTexto(sessao.resumo)}
              </p>
              {sessao.assinatura ? (
                <AssinaturaECarimbo
                  traco={sessao.assinatura.traco}
                  carimbo={sessao.assinatura.carimbo}
                  assinadaEm={sessao.assinatura.assinadaEm}
                />
              ) : (
                <span className="text-[12px] italic text-gray-800">
                  Registrada antes da assinatura digital — sem assinatura.
                </span>
              )}
            </section>
          ))}
        </article>
      )}

      {!carregando && dados && dados.sessoes.length > 0 && (
        <ButtonHeron
          text="Exportar PDF"
          icon="pi pi-file-pdf"
          type="primary"
          size="full"
          loading={exportando}
          onClick={exportar}
        />
      )}
    </div>
  );
};

export default Resumos;
