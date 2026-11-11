import jsPDF from 'jspdf';
import moment from 'moment';
import { buscarDadosClinica, carregarLogoBase64 } from './pdfRelatorioEvolucao';
import { nomeDoCarimbo, type AssinaturaSessao } from '../components/assinatura';

// "Relatório evolutivo de sessão" — a folha que a clínica preenchia à mão:
// cabeçalho com Cliente, Terapeuta e Mês; para cada sessão, Data, Hora
// inicial, Hora final, o texto do resumo e "Assinatura e Carimbo".
// Os dados vêm prontos de GET /sessao/resumos; aqui só desenha.

export interface ResumoSessao {
  id: number;
  data: string;
  horaInicio: string | null;
  horaFim: string | null;
  resumo: string;
  terapeuta: string | null;
  assinatura: AssinaturaSessao | null;
}

export interface ResumosDoMes {
  paciente: { id: number; nome: string };
  mes: string;
  sessoes: ResumoSessao[];
}

const PRETO: [number, number, number] = [0, 0, 0];
const CINZA: [number, number, number] = [110, 110, 110];
const VERMELHO_TITULO: [number, number, number] = [176, 30, 45];
const ROXO: [number, number, number] = [102, 41, 119];

const MARGEM = 15;
const MARGEM_BAIXO = 18;
const ALTURA_LINHA = 5.2;

/** Resumo vem em HTML do editor; no PDF sai texto corrido, parágrafo por parágrafo. */
export const htmlParaTexto = (html: string) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(
    html.replace(/<\/(p|li|h\d)>/gi, '</$1>\n').replace(/<br\s*\/?>/gi, '\n'),
    'text/html'
  );
  return (doc.body.textContent || '')
    .replace(/ /g, ' ')
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)
    .join('\n');
};

export const mesPorExtenso = (mes: string) => {
  const texto = moment(`${mes}-01`, 'YYYY-MM-DD').locale('pt-br').format('MMMM [de] YYYY');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/** Terapeutas do mês, na ordem em que aparecem (normalmente uma só). */
export const terapeutasDoMes = (sessoes: ResumoSessao[]) =>
  Array.from(
    new Set(
      sessoes
        .map((s) => s.assinatura?.carimbo?.nome || s.terapeuta)
        .filter(Boolean)
        .map((nome) => nomeDoCarimbo(nome as string))
    )
  );

export async function gerarPdfResumoSessoes(dados: ResumosDoMes) {
  const [logo, clinica] = await Promise.all([
    carregarLogoBase64(),
    buscarDadosClinica().catch(() => null),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const direita = largura - MARGEM;
  const terapeutas = terapeutasDoMes(dados.sessoes).join(', ');
  let y = 0;

  const cabecalho = () => {
    if (logo) doc.addImage(logo, 'JPEG', MARGEM, 10, 34, 13.6);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...CINZA);
    if (clinica) {
      doc.text(`Cel: ${clinica.telefone || ''} – Email: ${clinica.email || ''}`, direita, 15, {
        align: 'right',
      });
      doc.text(`CNPJ: ${clinica.cnpj || ''}`, direita, 18.5, { align: 'right' });
    }

    y = 31;
    const campo = (rotulo: string, valor: string) => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...PRETO);
      doc.text(rotulo, MARGEM, y);
      const x = MARGEM + doc.getTextWidth(rotulo) + 2;
      doc.setFont('Helvetica', 'normal');
      doc.text(valor, x, y - 0.6);
      doc.setDrawColor(...PRETO);
      doc.setLineWidth(0.2);
      doc.line(x, y + 0.8, direita, y + 0.8);
      y += 6;
    };
    campo('Cliente:', nomeDoCarimbo(dados.paciente.nome));
    campo('Terapeuta:', terapeutas);
    campo('Mês:', mesPorExtenso(dados.mes));

    y += 4;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...VERMELHO_TITULO);
    doc.text('RELATÓRIO EVOLUTIVO DE SESSÃO', largura / 2, y, { align: 'center' });
    const larguraTitulo = doc.getTextWidth('RELATÓRIO EVOLUTIVO DE SESSÃO');
    doc.setDrawColor(...VERMELHO_TITULO);
    doc.line(largura / 2 - larguraTitulo / 2, y + 1, largura / 2 + larguraTitulo / 2, y + 1);
    y += 9;
  };

  const rodape = () => {
    if (!clinica?.endereco) return;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...CINZA);
    doc.text(clinica.endereco, largura / 2, altura - 8, { align: 'center' });
  };

  const garantirEspaco = (necessario: number) => {
    if (y + necessario <= altura - MARGEM_BAIXO) return;
    rodape();
    doc.addPage();
    cabecalho();
  };

  cabecalho();

  if (!dados.sessoes.length) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...CINZA);
    doc.text('Nenhuma sessão registrada neste mês.', MARGEM, y);
  }

  for (const sessao of dados.sessoes) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    const linhas: string[] = doc.splitTextToSize(htmlParaTexto(sessao.resumo), direita - MARGEM);
    const ALTURA_ASSINATURA = 26;

    // Cabeçalho da sessão + ao menos 3 linhas de texto na mesma página.
    garantirEspaco(10 + ALTURA_LINHA * Math.min(3, linhas.length));

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...PRETO);
    const itens: [string, string][] = [
      ['Data:', moment(sessao.data, 'YYYY-MM-DD').format('DD/MM/YY')],
      ['Hora inicial:', sessao.horaInicio || '—'],
      ['Hora final:', sessao.horaFim || '—'],
    ];
    let x = MARGEM;
    itens.forEach(([rotulo, valor]) => {
      doc.setFont('Helvetica', 'bold');
      doc.text(rotulo, x, y);
      x += doc.getTextWidth(rotulo) + 2;
      doc.setFont('Helvetica', 'normal');
      doc.text(valor, x, y);
      doc.setLineWidth(0.2);
      doc.line(x - 0.5, y + 0.8, x + 22, y + 0.8);
      x += 30;
    });
    y += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    for (const linha of linhas) {
      garantirEspaco(ALTURA_LINHA);
      doc.text(linha, MARGEM, y);
      doc.setDrawColor(190, 190, 190);
      doc.setLineWidth(0.15);
      doc.line(MARGEM, y + 1.2, direita, y + 1.2);
      y += ALTURA_LINHA;
    }

    garantirEspaco(ALTURA_ASSINATURA);
    y += 2;
    const topo = y;
    const caixa = { x: MARGEM, y: topo, w: 55, h: 18 };

    if (sessao.assinatura?.traco?.length) {
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.35);
      for (const traco of sessao.assinatura.traco) {
        for (let i = 1; i < traco.length; i++) {
          doc.line(
            caixa.x + traco[i - 1].x * caixa.w,
            caixa.y + traco[i - 1].y * caixa.h,
            caixa.x + traco[i].x * caixa.w,
            caixa.y + traco[i].y * caixa.h
          );
        }
      }
    }

    doc.setDrawColor(...PRETO);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, topo + caixa.h + 1, MARGEM + caixa.w, topo + caixa.h + 1);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PRETO);
    doc.text(
      sessao.assinatura ? 'Assinatura e Carimbo' : 'Assinatura e Carimbo (sem assinatura digital)',
      MARGEM,
      topo + caixa.h + 4.5
    );

    // Carimbo: nome, especialidade e registro, centralizados e emoldurados.
    const carimbo = sessao.assinatura?.carimbo;
    if (carimbo) {
      const linhasCarimbo = [
        nomeDoCarimbo(carimbo.nome),
        carimbo.especialidade || '',
        carimbo.registro || '',
      ].filter(Boolean);
      const cx = MARGEM + caixa.w + 30;
      doc.setFontSize(9);
      const larguraCarimbo =
        Math.max(...linhasCarimbo.map((l) => doc.getTextWidth(l))) + 8;
      const alturaCarimbo = linhasCarimbo.length * 4.2 + 3;
      const cy = topo + 2;
      doc.setDrawColor(...ROXO);
      doc.setLineWidth(0.5);
      doc.roundedRect(cx - larguraCarimbo / 2, cy, larguraCarimbo, alturaCarimbo, 1.2, 1.2);
      doc.setTextColor(...ROXO);
      linhasCarimbo.forEach((texto, i) => {
        doc.setFont('Helvetica', i === 0 ? 'bold' : 'normal');
        doc.text(texto, cx, cy + 4.6 + i * 4.2, { align: 'center' });
      });
    }

    y = topo + ALTURA_ASSINATURA;
  }

  rodape();
  const nomeArquivo = `resumo-sessoes-${nomeDoCarimbo(dados.paciente.nome)
    .toLowerCase()
    .replace(/\s+/g, '-')}-${dados.mes}.pdf`;
  doc.save(nomeArquivo);
}
