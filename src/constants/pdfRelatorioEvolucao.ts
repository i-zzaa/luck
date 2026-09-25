import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import logoLg from '../assets/logo-lg.jpg';
import { api, update } from '../server';
import { STATUS_META_COLOR_RGB, STATUS_META_LABEL_CURTO } from './protocolo';

// Relatório de Evolução — unifica num PDF só Portage, VB-MAPP e Manual,
// no mesmo espírito do "RELATÓRIO DE INTERVENÇÃO ABA" que a clínica já
// usa fora do app (documento de referência).
//
// Item 20 do pedido-frontend-fase2.md: tudo vem de uma chamada só,
// GET /paciente/:id/relatorio-evolucao — paciente, número da
// intervenção, data de emissão, `temDados`, Portage "por avaliação"
// (item 17), VB-MAPP em arrays ordenados (item 19), Manual com status
// (item 12) e a conduta sugerida persistida (item 21). Este arquivo só
// desenha o que chega: não escolhe avaliações, não ordena, não calcula
// média/percentual/classificação nem status.
//
// Fora do escopo por enquanto (não existe no backend): reforçamento diferencial e a
// tabela ABC de comportamento disruptivo, que no documento de
// referência são texto livre preenchido à mão pela terapeuta fora do
// app.

type Classificacao = 'alto' | 'medio' | 'baixo' | 'na';
type Preenchimento = 'cheio' | 'metade' | 'vazio';

type PortageAvaliacao = {
  tipo: 'primeira' | 'atual';
  titulo: string;
  data: string | null;
  faixasEtarias: string[];
  categorias: {
    nome: string;
    valores: {
      faixa: string;
      percentual: number | null;
      classificacao: Classificacao;
    }[];
  }[];
};

type PortageRelatorio = {
  avaliacoes: PortageAvaliacao[];
  comparativo: {
    categoria: string;
    sessoes: { titulo: string; media: number | null }[];
  }[];
};

type VbmappRelatorio = {
  niveis: {
    nivel: number;
    sessoes: {
      data: string;
      programas: {
        nome: string;
        slots: ({ atividade: string; preenchimento: Preenchimento } | null)[];
      }[];
    }[];
  }[];
};

type RelatorioEvolucao = {
  paciente: { nome: string; dataNascimento: string | null };
  numeroIntervencao: number;
  dataEmissao: string;
  temDados: boolean;
  portage: PortageRelatorio | null;
  vbmapp: VbmappRelatorio | null;
  manual: any[] | null;
  condutaSugerida: string | null;
};

// Item 22 do pedido-frontend-fase2.md: contato/CNPJ/endereço eram fixos
// e duplicados nos três geradores de PDF (este, pdfPortage.ts e
// pdfVBMAPP.ts) — agora fonte única no backend. Exportado pra que os
// outros dois PDFs busquem do mesmo jeito.
export type DadosClinica = {
  nome: string;
  telefone: string;
  email: string;
  cnpj: string;
  endereco: string;
};

export const buscarDadosClinica = async (): Promise<DadosClinica> => {
  const { data } = await api.get('clinica/dados');
  return data;
};

// Datas do backend chegam em ISO: `data` das avaliações/sessões e
// `dataEmissao` como "YYYY-MM-DD", dataNascimento como DateTime cheio
// (meia-noite UTC). Formatar em UTC evita o dia "voltar um" no fuso
// -03:00 — é só apresentação, o valor em si já vem pronto.
export const formatarDataPdf = (valor: string | null | undefined) =>
  valor ? moment.utc(valor).format('DD/MM/YYYY') : '';

const BLACK: [number, number, number] = [0, 0, 0];
const GRAY_HEADER: [number, number, number] = [240, 240, 240];
const GRAY_TEXT: [number, number, number] = [110, 110, 110];
// Mesmo roxo da marca (var(--violet-800) em src/styles/global.css) — dá
// pra reaproveitar no PDF pra amarrar visualmente com o resto do app,
// em vez do título sair preto puro feito o resto do texto corrido.
const BRAND_PURPLE: [number, number, number] = [102, 41, 119];
const NOTE_BG: [number, number, number] = [246, 246, 248];
const GREEN: [number, number, number] = [34, 197, 94];
const YELLOW: [number, number, number] = [202, 138, 4];
const RED: [number, number, number] = [239, 68, 68];

// Cor por `classificacao` — a classificação em si (corte 80/50) vem
// pronta do backend (item 17); aqui é só a paleta, a mesma que a tela
// usa pra "% de acertos" (ver corPorcentagem em PrimeiraResposta.tsx).
const COR_POR_CLASSIFICACAO: Record<Classificacao, [number, number, number]> =
  {
    na: GRAY_TEXT,
    alto: GREEN,
    medio: YELLOW,
    baixo: RED,
  };

const NAO_SE_APLICA = 'Não se aplica';

const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_BOTTOM = 20;

// jsPDF.addImage recebendo a URL do asset (o que pdfPortage.ts/
// pdfVBMAPP.ts sempre fizeram) só funciona de verdade se o navegador já
// tiver essa imagem em cache — nas telas onde o logo já aparece em
// outro lugar da página, dá a impressão de sempre ter funcionado. Na
// tela de PEI (Relatório de Evolução) pode ser a primeira vez que esse
// asset é referenciado na sessão, e nesse caso addImage roda antes da
// imagem terminar de carregar: a página some sem erro nenhum. Buscar o
// arquivo e converter pra data URI (base64) garante que o jsPDF sempre
// recebe o pixel de verdade, não uma URL que pode ou não já estar
// pronta.
let logoDataUriCache: string | null = null;
const carregarLogoBase64 = async (): Promise<string | null> => {
  if (logoDataUriCache) return logoDataUriCache;
  try {
    const response = await fetch(logoLg);
    const blob = await response.blob();
    logoDataUriCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return logoDataUriCache;
  } catch (error) {
    console.error(
      'Não foi possível carregar o logo do Relatório de Evolução',
      error
    );
    return null; // sem logo é melhor que travar o relatório inteiro
  }
};

// Dados da clínica do relatório sendo gerado agora — o timbre é
// redesenhado a cada quebra de página (novaPagina/ensureSpace), bem
// longe de onde os dados foram buscados; guardar aqui evita ter que
// passar a clínica por todas as funções de seção só pra chegar nele.
let clinicaAtual: DadosClinica | null = null;

// Y da linha divisória sob o timbre — mesma referência usada tanto pra
// desenhar o timbre quanto pra saber onde o conteúdo de cada página
// pode começar (logo abaixo dela).
const TIMBRE_DIVIDER_Y = 33;

// Timbre clássico (logo + dados de contato + divisória) — repetido em
// TODA página do relatório, não só na primeira, pra ficar claro de
// qual clínica/profissional é cada folha se as páginas forem impressas
// ou compartilhadas separadas.
const desenharTimbre = (doc: any) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - MARGIN_RIGHT;

  if (logoDataUriCache) {
    doc.addImage(logoDataUriCache, 'JPEG', MARGIN_LEFT, 12, 38, 15.2);
  }

  let ry = 18;
  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    `Cel: ${clinicaAtual?.telefone || ''} – Email: ${clinicaAtual?.email || ''}`,
    rightX,
    ry,
    { align: 'right' }
  );
  ry += 3.5;
  doc.text(`CNPJ: ${clinicaAtual?.cnpj || ''}`, rightX, ry, { align: 'right' });

  // Linha divisória sob o timbre inteiro — separa "quem assina" do
  // conteúdo do relatório em si, em vez de tudo escorrer junto.
  doc.setDrawColor(...BRAND_PURPLE);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_LEFT, TIMBRE_DIVIDER_Y, rightX, TIMBRE_DIVIDER_Y);

  // Reseta cor/fonte antes de devolver o controle pro resto da página —
  // sem isso o próximo texto herdaria o roxo/cinza usado aqui.
  doc.setTextColor(...BLACK);
  doc.setFont('Helvetica', 'normal');
};

// Abre uma nova página já com o timbre desenhado, devolvendo o Y logo
// abaixo dele — ponto de partida padrão pra qualquer conteúdo que
// precise de página nova (seção nova ou quebra automática dentro de
// uma seção, ver ensureSpace).
const novaPagina = (doc: any) => {
  doc.addPage();
  desenharTimbre(doc);
  return TIMBRE_DIVIDER_Y + 8;
};

// Garante que o próximo bloco de altura `needed` cabe na página atual —
// se não couber, quebra pra uma nova (com timbre) e devolve o Y do topo
// dela. Preciso só pro conteúdo desenhado "na mão" (texto solto, grade
// do VB-MAPP); autoTable já pagina sozinho.
const ensureSpace = (doc: any, y: number, needed: number) => {
  const pageHeight = doc.internal.pageSize.height;
  if (y + needed > pageHeight - MARGIN_BOTTOM) {
    return novaPagina(doc);
  }
  return y;
};

// Respiro entre um protocolo e o próximo (Portage -> VB-MAPP -> Manual)
// quando os dois cabem na mesma página — grande o bastante pra não
// embolar visualmente, mas sem forçar página nova só porque começou
// outro protocolo (isso é papel do ensureSpace, quando o conteúdo de
// verdade não cabe mais).
const SECTION_GAP = 14;

const iniciarNovaSecao = (doc: any, y: number) => {
  const paginasAntes = doc.internal.getNumberOfPages();
  const proximoY = ensureSpace(doc, y, SECTION_GAP + 20);
  const quebrouPagina = doc.internal.getNumberOfPages() > paginasAntes;

  // Quebrou de página: o timbre repetido no topo já separa visualmente
  // as seções, não precisa de mais nada.
  if (quebrouPagina) return proximoY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - MARGIN_RIGHT;
  const linhaY = proximoY + SECTION_GAP / 2;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, linhaY, rightX, linhaY);

  return proximoY + SECTION_GAP;
};

// Primeira página: timbre + título/data/nota de confidencialidade +
// identificação do paciente — só aparece uma vez (as demais páginas só
// repetem o timbre, ver desenharTimbre/novaPagina).
const desenharCabecalho = (doc: any, relatorio: RelatorioEvolucao) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - MARGIN_RIGHT;
  const { paciente } = relatorio;

  desenharTimbre(doc);

  // Título na cor de marca (não preto puro, igual o resto do texto
  // corrido) com a data alinhada à direita na mesma linha — lê como
  // cabeçalho de documento, não como mais uma frase solta.
  //
  // "RELATÓRIO DE INTERVENÇÃO ABA <N> – <data>" no documento de
  // referência — número e data de emissão vêm do backend
  // (numeroIntervencao/dataEmissao, item 20), não mais a data do
  // navegador nem um número omitido por não existir como dado.
  const tituloY = TIMBRE_DIVIDER_Y + 8;
  doc.setFontSize(13);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BRAND_PURPLE);
  doc.text(
    `RELATÓRIO DE INTERVENÇÃO ABA ${relatorio.numeroIntervencao}`,
    MARGIN_LEFT,
    tituloY
  );

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(...GRAY_TEXT);
  doc.text(formatarDataPdf(relatorio.dataEmissao), rightX, tituloY, {
    align: 'right',
  });

  // Nota de confidencialidade dentro de uma caixa cinza clara — lê como
  // aviso/rodapé legal, não compete com o título nem se mistura ao
  // texto corrido do relatório.
  const notaTexto = doc.splitTextToSize(
    '* Confidencial conforme ética profissional, não possui fins jurídicos e todos os dados obtidos devem ser considerados relativos ao atual momento desta avaliação e consequentemente do desenvolvimento da criança.',
    rightX - MARGIN_LEFT - 6
  );
  const notaY = tituloY + 5;
  const notaAltura = notaTexto.length * 3.4 + 4;
  doc.setFillColor(...NOTE_BG);
  doc.roundedRect(
    MARGIN_LEFT,
    notaY,
    rightX - MARGIN_LEFT,
    notaAltura,
    1,
    1,
    'F'
  );
  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'italic');
  doc.setTextColor(...GRAY_TEXT);
  doc.text(notaTexto, MARGIN_LEFT + 3, notaY + 4.5);

  let y = notaY + notaAltura + 9;

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('DADOS DE IDENTIFICAÇÃO', MARGIN_LEFT, y);
  y += 6;

  doc.setFont('Helvetica', 'normal');
  doc.text(`Nome: ${paciente?.nome || ''}`, MARGIN_LEFT, y);
  if (paciente?.dataNascimento) {
    doc.text(
      `Data de Nascimento: ${formatarDataPdf(paciente.dataNascimento)}`,
      rightX,
      y,
      { align: 'right' }
    );
  }
  y += 4;

  // Linha fina fechando o bloco — sem fundo (achava pesado e ficava
  // desalinhado com o texto flush-left do resto da página). Só isso já
  // separa "identificação do paciente" do corpo do relatório logo
  // abaixo, com respiro suficiente antes do título da próxima seção.
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, y, rightX, y);
  y += 9;

  // Reseta cor/fonte antes de devolver o controle pras seções seguintes
  // (Portage/VB-MAPP/Manual) — sem isso elas herdariam o roxo/cinza
  // usado aqui.
  doc.setTextColor(...BLACK);
  doc.setFont('Helvetica', 'normal');

  return y;
};

// ------------------ Portage (tabela Socialização/Cognição) ------------------
// O relatório de referência desenha uma tabelinha POR avaliação, com as
// CATEGORIAS (Socialização/Cognição) como linha e as faixas etárias
// daquela avaliação como coluna — e só DUAS: a primeira aplicação e a
// mais recente. Quais avaliações entram, quais faixas cada uma tem,
// percentual numérico e classificação vêm prontos do backend (item 17:
// portage.avaliacoes); aqui só desenha.

// Valor de uma categoria numa faixa etária da avaliação. A busca por
// `faixa` é só pra alinhar a célula com a coluna do cabeçalho
// (faixasEtarias) — uma categoria pode não ter aquela faixa, e aí a
// célula sai como "Não se aplica", igual a percentual null.
const valorNaFaixa = (
  categoria: PortageAvaliacao['categorias'][number],
  faixa: string
) => categoria.valores.find((valor) => valor.faixa === faixa);

const textoPercentual = (percentual: number | null | undefined) =>
  percentual === null || percentual === undefined
    ? NAO_SE_APLICA
    : `${percentual}%`;

// Uma avaliação só preenche UMA faixa etária na grande maioria dos
// casos (é a faixa que faz sentido pra idade da criança naquele
// momento) — nesse caso a tabela degenera pra 2 linhas (Socialização/
// Cognição) numa única coluna de dado, com um cabeçalho de tabela
// ("Áreas" | "0 a 1") meio artificial pra só 2 números. Em vez disso,
// desenha como uma lista compacta: categoria à esquerda, percentual
// (colorido) à direita, com a faixa etária junto do título — lê mais
// rápido e não fica com "cara de tabela vazia". Com MAIS de uma faixa
// etária na mesma avaliação (caso raro, mas possível), volta pra
// tabela — aí a comparação lado a lado entre faixas é que importa.
const desenharAvaliacaoCompacta = (
  doc: any,
  avaliacao: PortageAvaliacao,
  faixa: string,
  y: number,
  rightX: number
) => {
  avaliacao.categorias.forEach((categoria, index) => {
    const valor = valorNaFaixa(categoria, faixa);
    const naoSeAplica = valor?.percentual == null;

    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(categoria.nome, MARGIN_LEFT, y);

    doc.setFont('Helvetica', naoSeAplica ? 'italic' : 'bold');
    doc.setTextColor(
      ...COR_POR_CLASSIFICACAO[naoSeAplica ? 'na' : valor!.classificacao]
    );
    doc.text(textoPercentual(valor?.percentual), rightX, y, {
      align: 'right',
    });

    if (index < avaliacao.categorias.length - 1) {
      y += 3;
      doc.setDrawColor(235, 235, 235);
      doc.setLineWidth(0.2);
      doc.line(MARGIN_LEFT, y, rightX, y);
      y += 4;
    }
  });

  doc.setTextColor(...BLACK);
  doc.setFont('Helvetica', 'normal');
  return y + 8;
};

// Gráfico de barras comparando as sessões por categoria — as médias
// (só faixas aplicáveis) já vêm calculadas em portage.comparativo (item
// 17). Só desenha com 2+ sessões — com 1 só não tem o que comparar.
const CORES_SESSAO: [number, number, number][] = [
  [205, 205, 210], // sessão mais antiga — cinza, de referência
  BRAND_PURPLE, // sessão mais recente — cor de marca, em destaque
];

const desenharGraficoComparativoPortage = (
  doc: any,
  comparativo: PortageRelatorio['comparativo'],
  startY: number
) => {
  const sessoesLegenda = comparativo[0]?.sessoes || [];
  if (sessoesLegenda.length < 2) return startY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - MARGIN_RIGHT;

  const alturaGrafico = 38;
  const eixoX = MARGIN_LEFT + 12;
  let y = ensureSpace(doc, startY, 10 + alturaGrafico + 12);

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('Comparativo entre as sessões', MARGIN_LEFT, y);
  y += 7;

  const baseY = y + alturaGrafico;

  // Linhas guia + rótulos do eixo (0/25/50/75/100%) — sem isso a altura
  // de cada barra não tem referência nenhuma pra ler o valor exato.
  doc.setFontSize(6.5);
  doc.setFont('Helvetica', 'normal');
  [0, 25, 50, 75, 100].forEach((marca) => {
    const marcaY = baseY - (marca / 100) * alturaGrafico;
    doc.setDrawColor(232, 232, 232);
    doc.setLineWidth(0.15);
    doc.line(eixoX, marcaY, rightX, marcaY);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`${marca}%`, eixoX - 2, marcaY + 1, { align: 'right' });
  });

  const larguraGrupo = (rightX - eixoX) / comparativo.length;

  comparativo.forEach((grupo, indiceCategoria) => {
    const larguraBarra = Math.min(
      10,
      (larguraGrupo - 8) / grupo.sessoes.length
    );
    const centroGrupo =
      eixoX + larguraGrupo * indiceCategoria + larguraGrupo / 2;
    const larguraTotalBarras =
      larguraBarra * grupo.sessoes.length + 2 * (grupo.sessoes.length - 1);
    let xBarra = centroGrupo - larguraTotalBarras / 2;

    grupo.sessoes.forEach((sessao, indiceSerie) => {
      const cor = CORES_SESSAO[indiceSerie] || BRAND_PURPLE;

      if (sessao.media !== null) {
        const alturaBarra = (sessao.media / 100) * alturaGrafico;
        doc.setFillColor(...cor);
        doc.rect(xBarra, baseY - alturaBarra, larguraBarra, alturaBarra, 'F');
        doc.setFontSize(6);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(...cor);
        doc.text(
          `${sessao.media}%`,
          xBarra + larguraBarra / 2,
          baseY - alturaBarra - 1.5,
          { align: 'center' }
        );
      } else {
        doc.setFontSize(6);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(...GRAY_TEXT);
        doc.text('-', xBarra + larguraBarra / 2, baseY - 2, {
          align: 'center',
        });
      }
      xBarra += larguraBarra + 2;
    });

    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(grupo.categoria, centroGrupo, baseY + 5, { align: 'center' });
  });

  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.3);
  doc.line(eixoX, baseY, rightX, baseY);

  y = baseY + 9;

  // Legenda — sem isso não dá pra saber qual barra (cinza/roxa) é qual
  // sessão, só olhando as cores.
  let xLegenda = MARGIN_LEFT;
  sessoesLegenda.forEach((sessao, indice) => {
    const cor = CORES_SESSAO[indice] || BRAND_PURPLE;
    doc.setFillColor(...cor);
    doc.rect(xLegenda, y - 2.5, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(sessao.titulo, xLegenda + 4.5, y);
    xLegenda += doc.getTextWidth(sessao.titulo) + 14;
  });

  doc.setTextColor(...BLACK);
  return y + 6;
};

const desenharPortage = (
  doc: any,
  portage: PortageRelatorio,
  startY: number
) => {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;
  const rightX = pageWidth - MARGIN_RIGHT;

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text(
    'Desenvolvimento Infantil: Escala de Desenvolvimento Infantil Portage',
    MARGIN_LEFT,
    y
  );
  // Respiro entre o título da seção e a primeira avaliação — 7 ficava
  // colado, quase reduzindo o título a mais uma linha do bloco de
  // avaliações abaixo, sem ler como um título de seção de verdade.
  y += 11;

  portage.avaliacoes.forEach((avaliacao) => {
    const faixaUnica =
      avaliacao.faixasEtarias.length === 1 ? avaliacao.faixasEtarias[0] : null;

    y = ensureSpace(doc, y, faixaUnica ? 24 : 18);

    // Título ("Primeira Aplicação"/"Avaliação Atual", do backend) + a
    // data da avaliação, igual o documento de referência.
    const tituloAvaliacao = avaliacao.data
      ? `${avaliacao.titulo}: ${formatarDataPdf(avaliacao.data)}`
      : avaliacao.titulo;

    // Título com uma faixa lateral na cor de marca (mesmo tratamento
    // visual do resto do relatório) — antes era só texto solto, sem
    // separação clara de onde uma avaliação termina e a próxima começa.
    // Com uma faixa etária só, ela entra junto do título (evita repetir
    // "Áreas" | faixa como cabeçalho de tabela pra só 2 números).
    doc.setFillColor(...BRAND_PURPLE);
    doc.rect(MARGIN_LEFT, y - 3.2, 1.2, 4.2, 'F');
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_PURPLE);
    doc.text(
      faixaUnica ? `${tituloAvaliacao} · ${faixaUnica}` : tituloAvaliacao,
      MARGIN_LEFT + 3,
      y
    );
    doc.setTextColor(...BLACK);
    y += 7;

    if (faixaUnica) {
      y = desenharAvaliacaoCompacta(doc, avaliacao, faixaUnica, y, rightX);
      return;
    }

    autoTable(doc, {
      head: [['Áreas', ...avaliacao.faixasEtarias]],
      // Cada célula já sai com o estilo dela (cor pela `classificacao`
      // do backend, itálico cinza pra "Não se aplica") — em vez de
      // reinterpretar o texto "80%" depois, num didParseCell.
      body: avaliacao.categorias.map((categoria) => [
        categoria.nome,
        ...avaliacao.faixasEtarias.map((faixa) => {
          const valor = valorNaFaixa(categoria, faixa);
          const naoSeAplica = valor?.percentual == null;
          return {
            content: textoPercentual(valor?.percentual),
            styles: {
              fontStyle: naoSeAplica ? 'italic' : 'bold',
              textColor:
                COR_POR_CLASSIFICACAO[
                  naoSeAplica ? 'na' : valor!.classificacao
                ],
            },
          };
        }),
      ]) as any,
      startY: y,
      // Número fixo (não 'auto'/'wrap') é o que faz a tabela esticar
      // até preencher a largura útil da página de verdade — só 2-3
      // colunas curtas ("Áreas" + faixas etárias) ficavam bem menores
      // que isso por padrão, sobrando bastante vazio à direita.
      tableWidth: contentWidth,
      styles: { fontSize: 9, halign: 'center', cellPadding: 2.5 },
      headStyles: {
        fillColor: GRAY_HEADER,
        textColor: BLACK,
        fontStyle: 'bold',
      },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    });

    y = doc.lastAutoTable.finalY + 8;
  });

  y = desenharGraficoComparativoPortage(doc, portage.comparativo, y);

  return y;
};

// ------------------ VB-MAPP (grade colorida por nível) ------------------
// Exportado — pages/pei/TabelaVBMapp.tsx e pdfVBMAPP.ts usam a mesma
// cor por nível. O backend (item 19) não devolve cor, só nível — a
// paleta continua sendo decisão visual do front.
export const NIVEL_COR: Record<number, string> = {
  1: '#e36b05',
  2: '#03ae4e',
  3: '#0071bd',
};

// Desenha um slot da grade conforme `preenchimento` (item 19 — antes o
// front convertia percentual 100/50 nisso). null = slot sem atividade,
// sai em branco igual "vazio".
export const desenharSlotVbmapp = (
  doc: any,
  slot: { preenchimento: Preenchimento } | null,
  cor: string,
  x: number,
  y: number,
  largura: number,
  altura: number
) => {
  if (slot?.preenchimento === 'cheio') {
    doc.setFillColor(cor);
    doc.rect(x, y, largura, altura, 'F');
  } else if (slot?.preenchimento === 'metade') {
    // Metade inferior com a cor do nível, metade superior em branco.
    doc.setFillColor(cor);
    doc.rect(x, y + altura / 2, largura, altura / 2, 'F');
    doc.setFillColor('#ffffff');
    doc.rect(x, y, largura, altura / 2, 'F');
  } else {
    doc.setFillColor('#ffffff');
    doc.rect(x, y, largura, altura, 'F');
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(x, y, largura, altura);
};

const desenharVBMapp = (
  doc: any,
  vbmapp: VbmappRelatorio,
  startY: number
) => {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - MARGIN_RIGHT;
  const contentWidth = rightX - MARGIN_LEFT;
  const cellWidth = 6;
  const headerCellHeight = 3;
  const activityCellHeight = 2.5;
  // `slots` já chega com tamanho fixo (SLOT_COUNT_ATIVIDADE no backend),
  // igual em todo programa — lê do próprio dado pra altura da grade em
  // vez de repetir o 10 aqui.
  const quantidadeSlots =
    vbmapp.niveis[0]?.sessoes[0]?.programas[0]?.slots.length || 0;
  // Título "Nível X" + data da sessão, antes da grade em si começar.
  const topoAteGrade = 7;
  const alturaGrade = headerCellHeight + quantidadeSlots * activityCellHeight;
  const alturaBloco = topoAteGrade + alturaGrade + 4;
  const espacamentoEntreNiveis = 8;

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('Marcos do Desenvolvimento Infantil', MARGIN_LEFT, y);
  y += 10;

  type Nivel = VbmappRelatorio['niveis'][number];

  // Largura do bloco inteiro de um nível — todas as suas sessões lado a
  // lado. Precisa saber isso ANTES de desenhar: tanto pra decidir se
  // cabe na linha atual quanto pra centralizar a linha inteira depois.
  const larguraNivel = (nivel: Nivel) =>
    nivel.sessoes.reduce(
      (width, sessao) => width + sessao.programas.length * cellWidth + 5,
      -5
    );

  // 1ª passada: agrupa os níveis (já ordenados pelo backend) em linhas
  // só pela largura (nunca quebra um nível no meio — cada um é uma
  // unidade única, ou entra inteiro numa linha ou vai pra próxima). Sem
  // desenhar nada ainda, porque a centralização de cada linha só dá pra
  // calcular depois de saber TODOS os níveis que cabem nela.
  const linhas: { nivel: Nivel; largura: number }[][] = [[]];
  let larguraLinhaAtual = 0;
  vbmapp.niveis.forEach((nivel) => {
    const largura = larguraNivel(nivel);
    const proximaLargura =
      larguraLinhaAtual === 0
        ? largura
        : larguraLinhaAtual + espacamentoEntreNiveis + largura;

    if (larguraLinhaAtual > 0 && proximaLargura > contentWidth) {
      linhas.push([]);
      larguraLinhaAtual = largura;
    } else {
      larguraLinhaAtual = proximaLargura;
    }
    linhas[linhas.length - 1].push({ nivel, largura });
  });

  // 2ª passada: desenha cada linha já centralizada na largura útil da
  // página.
  linhas.forEach((linha) => {
    if (!linha.length) return;

    const larguraLinha =
      linha.reduce((soma, item) => soma + item.largura, 0) +
      espacamentoEntreNiveis * (linha.length - 1);

    y = ensureSpace(doc, y, alturaBloco);

    let currentX = MARGIN_LEFT + (contentWidth - larguraLinha) / 2;
    const rowY = y;

    linha.forEach(({ nivel, largura }) => {
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(...BLACK);
      doc.text(`Nível ${nivel.nivel}`, currentX + largura / 2, rowY, {
        align: 'center',
      });

      const cor = NIVEL_COR[nivel.nivel] || '#ffffff';
      let offsetX = currentX;

      nivel.sessoes.forEach((sessao) => {
        const { programas } = sessao;

        // Data da sessão — era o maior texto perto da grade (7pt contra
        // as células de ~2-3mm), destoando do resto; menor aqui fica
        // proporcional ao tamanho real da grade abaixo.
        doc.setFontSize(5);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(...BLACK);
        doc.text(
          formatarDataPdf(sessao.data),
          offsetX + (programas.length * cellWidth) / 2,
          rowY + topoAteGrade - 2,
          { align: 'center' }
        );
        const headerY = rowY + topoAteGrade;

        programas.forEach((programa, colIndex) => {
          const x = offsetX + colIndex * cellWidth;
          doc.setFillColor(GRAY_HEADER[0], GRAY_HEADER[1], GRAY_HEADER[2]);
          doc.rect(x, headerY, cellWidth, headerCellHeight, 'F');
          doc.setDrawColor(0);
          doc.setLineWidth(0.2);
          doc.rect(x, headerY, cellWidth, headerCellHeight);
          doc.setFontSize(3);
          doc.setTextColor(0);
          // programa pode vir maior que a célula (6mm) — em vez de
          // estourar/cortar sem aviso, encolhe o texto pra caber (mesma
          // ideia do fitContent do jsPDF, feita na mão porque addImage/
          // text não tem isso pra fonte).
          const rotulo = String(programa.nome || '').toUpperCase();
          let larguraTexto = doc.getTextWidth(rotulo);
          let tamanhoFonte = 3;
          while (larguraTexto > cellWidth - 0.5 && tamanhoFonte > 1.5) {
            tamanhoFonte -= 0.25;
            doc.setFontSize(tamanhoFonte);
            larguraTexto = doc.getTextWidth(rotulo);
          }
          doc.text(
            rotulo,
            x + cellWidth / 2,
            headerY + headerCellHeight / 2 + 0.5,
            { align: 'center' }
          );

          programa.slots.forEach((slot, i) => {
            desenharSlotVbmapp(
              doc,
              slot,
              cor,
              x,
              headerY + headerCellHeight + i * activityCellHeight,
              cellWidth,
              activityCellHeight
            );
          });
        });

        offsetX += programas.length * cellWidth + 5;
      });

      currentX += largura + espacamentoEntreNiveis;
    });

    y = rowY + alturaBloco;
  });

  return y + 4;
};

// ------------------ Manual/PEI (programas + metas) ------------------
// Rótulo curto (STATUS_META_LABEL_CURTO) mora em constants/protocolo.ts
// — mesmo texto usado na pílula daqui e na pílula da tela do PEI
// (pages/PEI.tsx), um lugar só pra não divergir. Fundo bem claro da
// mesma cor do texto — não dá pra usar opacidade em jsPDF, então a cor
// de fundo é fixa, não um "verde com 10% de alpha" de verdade.
const STATUS_META_BG_RGB: Record<string, [number, number, number]> = {
  atingida: [220, 252, 231],
  manutencao: [220, 252, 231],
  aquisicao: [254, 226, 226],
};

const desenharPei = (doc: any, sections: any[], startY: number) => {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('Programas ABA (metas) para serem trabalhadas', MARGIN_LEFT, y);
  y += 8;

  sections.forEach((section) => {
    // 40 (não só a altura do título) — reserva espaço suficiente pra
    // pelo menos o começo do primeiro procedimento também, senão o
    // título do programa ficava sozinho no fim da página, órfão, com
    // todo o conteúdo dele começando já na página seguinte.
    y = ensureSpace(doc, y, 40);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(section.programa?.nome || '', MARGIN_LEFT, y);
    y += 5;

    // PROCEDIMENTO DE ENSINO + SD/Resposta/SR+ vivem no nível da SEÇÃO
    // (do programa), não em cada meta — o backend mescla vários
    // registros Pei num programa só (ver PeiService.agruparPeiPorPrograma/
    // mesclarMetas), e só o PRIMEIRO registro mesclado empresta esses
    // campos pro grupo; nenhuma meta individual carrega isso.
    {
      y = ensureSpace(doc, y, 14);
      if (section?.procedimentoEnsino?.nome) {
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'bold');
        // O catálogo (PROCEDIMENTO_ENSINO no heron-list-nest) já grava o
        // nome COM o prefixo "PROCEDIMENTO DE ENSINO:" embutido — prefixar
        // de novo aqui duplicava o texto.
        const linhas = doc.splitTextToSize(
          section.procedimentoEnsino.nome,
          contentWidth
        );
        doc.text(linhas, MARGIN_LEFT, y);
        y += linhas.length * 4 + 2;
      }

      const sd = section?.estimuloDiscriminativo;
      const resposta = section?.resposta;
      const sr = section?.estimuloReforcadorPositivo;
      if (sd || resposta || sr) {
        autoTable(doc, {
          head: [
            ['SD (estímulo discriminativo)', 'Resposta', 'SR+ (reforçador)'],
          ],
          body: [[sd || '', resposta || '', sr || '']],
          startY: y,
          styles: { fontSize: 8, halign: 'center' },
          headStyles: {
            fillColor: GRAY_HEADER,
            textColor: BLACK,
            fontStyle: 'bold',
          },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        });
        // 6 (não 3) — a última linha da tabela e o "Meta 1:" ficavam
        // colados, sem respiro nenhum entre o fim de uma coisa e o
        // começo da outra.
        y = doc.lastAutoTable.finalY + 6;
      }

      (section.metas || []).forEach((meta: any, indexMeta: number) => {
        y = ensureSpace(doc, y, 10);

        // Pílula do status ao lado da descrição, na mesma linha — não
        // embaixo. Mede a largura dela ANTES de quebrar o texto da
        // meta, reservando esse espaço só na primeira linha (onde a
        // pílula de fato fica); as linhas seguintes (se a descrição
        // for longa o bastante pra quebrar) usam a largura cheia.
        //
        // `meta.status` vem resolvido do backend (item 12) — sem mais
        // derivar de `selected` aqui (statusMetaExibicao). null = meta
        // sem status, não mostra pílula.
        const status: string | null = meta.status ?? null;
        const pilulaTexto = status ? STATUS_META_LABEL_CURTO[status] : null;
        let pilulaLargura = 0;
        if (status && pilulaTexto) {
          doc.setFontSize(7.5);
          doc.setFont('Helvetica', 'bold');
          pilulaLargura = doc.getTextWidth(pilulaTexto) + 6;
        }

        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(...BLACK);

        const textoMeta = `Meta ${indexMeta + 1}: ${meta.value || ''}`;
        const primeiraLinhaLargura = pilulaTexto
          ? contentWidth - pilulaLargura - 3
          : contentWidth;
        const primeiraLinha = doc.splitTextToSize(
          textoMeta,
          primeiraLinhaLargura
        )[0];
        const resto = textoMeta.slice(primeiraLinha.length).trim();
        const linhasResto = resto
          ? doc.splitTextToSize(resto, contentWidth)
          : [];
        const linhasMeta = [primeiraLinha, ...linhasResto];

        doc.text(linhasMeta, MARGIN_LEFT, y);

        if (status && pilulaTexto) {
          // Logo depois do texto (medido de verdade, não fixa na
          // margem direita) — com descrição curta, ficava um vão
          // enorme entre o fim do texto e a pílula lá na ponta.
          doc.setFontSize(9);
          doc.setFont('Helvetica', 'normal');
          const larguraTextoLinha1 = doc.getTextWidth(primeiraLinha);

          const pilulaAltura = 4.2;
          const pilulaX = MARGIN_LEFT + larguraTextoLinha1 + 3;
          const pilulaY = y - 3.4;
          doc.setFillColor(...STATUS_META_BG_RGB[status]);
          doc.roundedRect(
            pilulaX,
            pilulaY,
            pilulaLargura,
            pilulaAltura,
            pilulaAltura / 2,
            pilulaAltura / 2,
            'F'
          );
          doc.setFontSize(7.5);
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(...STATUS_META_COLOR_RGB[status]);
          // Centralizada dentro da pílula nos dois eixos — horizontal
          // via align:'center', vertical calculando o baseline a partir
          // do centro da caixa (texto ficava puxado pro topo antes).
          doc.text(
            pilulaTexto,
            pilulaX + pilulaLargura / 2,
            pilulaY + pilulaAltura / 2 + 1,
            { align: 'center' }
          );
          doc.setTextColor(...BLACK);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
        }

        y += linhasMeta.length * 4;

        if (meta.observacao) {
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(...GRAY_TEXT);
          const linhasObs = doc.splitTextToSize(
            meta.observacao,
            contentWidth - 4
          );
          y = ensureSpace(doc, y, linhasObs.length * 3.5 + 2);
          doc.text(linhasObs, MARGIN_LEFT + 4, y);
          y += linhasObs.length * 3.5 + 1;
          doc.setTextColor(...BLACK);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
        }

        (meta.subitems || []).forEach((subitem: any) => {
          y = ensureSpace(doc, y, 5);
          const linhasSub = doc.splitTextToSize(
            `- ${subitem.value}`,
            contentWidth - 8
          );
          doc.text(linhasSub, MARGIN_LEFT + 6, y);
          y += linhasSub.length * 4;
        });

        y += 1;
      });

      y += 3;
    }

    y += 3;
  });

  return y;
};

// Última seção do relatório, por pedido explícito — vem depois de
// Portage/VB-MAPP/Manual, nessa ordem fixa. O texto já chega sanitizado
// (sem HTML/&nbsp;) do backend (item 21) — sem conversão HTML->texto
// por regex aqui; só respeita as quebras de linha que vierem.
const desenharCondutaSugerida = (
  doc: any,
  texto: string,
  startY: number
) => {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;

  y = ensureSpace(doc, y, 20);
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('Conduta Sugerida', MARGIN_LEFT, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');

  texto.split('\n').forEach((paragrafo) => {
    if (!paragrafo.trim()) {
      y += 3;
      return;
    }
    const linhas = doc.splitTextToSize(paragrafo, contentWidth);
    y = ensureSpace(doc, y, linhas.length * 4.5 + 2);
    doc.text(linhas, MARGIN_LEFT, y);
    y += linhas.length * 4.5 + 2;
  });

  return y;
};

const desenharRodape = (doc: any) => {
  const pageHeight = doc.internal.pageSize.height;
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(clinicaAtual?.endereco || '', 10, pageHeight - 10);
    doc.text(String(i), doc.internal.pageSize.getWidth() - 15, pageHeight - 10);
  }
};

// `condutaSugerida`: texto do editor da tela. Quando informado, é
// persistido ANTES de gerar (PUT /paciente/:id/relatorio-evolucao, item
// 21) e o PDF usa a versão sanitizada que o GET devolve logo em seguida.
// `undefined` = não mexe na conduta salva — importante porque o PUT
// sobrescreve: string vazia APAGA a conduta persistida.
export const gerarRelatorioEvolucao = async (
  paciente: { id: number; nome?: string },
  condutaSugerida: string | undefined,
  renderToast: (args: any) => void
) => {
  if (condutaSugerida !== undefined) {
    await update(`paciente/${paciente.id}/relatorio-evolucao`, {
      condutaSugerida,
    });
  }

  // Logo precisa terminar de carregar ANTES de desenhar a primeira
  // página (ver carregarLogoBase64). Sem allSettled: se o relatório ou
  // os dados da clínica falharem, o erro sobe pro chamador (PEI.tsx já
  // mostra o toast de falha) — não gera PDF parcial.
  const [, relatorioRes, clinica] = await Promise.all([
    carregarLogoBase64(),
    api.get(`paciente/${paciente.id}/relatorio-evolucao`),
    buscarDadosClinica(),
  ]);
  const relatorio: RelatorioEvolucao = relatorioRes.data;

  // `temDados` só olha Portage/VB-MAPP/Manual; um relatório só com a
  // conduta sugerida continua valendo a pena gerar.
  if (!relatorio.temDados && !relatorio.condutaSugerida) {
    renderToast({
      type: 'failure',
      title: 'Sem dados',
      message:
        'Não há Portage, VB-MAPP ou Manual cadastrados pra esse paciente.',
      open: true,
    });
    return;
  }

  clinicaAtual = clinica;

  const doc: any = new jsPDF();

  // Nome do arquivo (metadado /Title do PDF, não o nome do blob em si —
  // um blob: URL não carrega nome de arquivo próprio). É esse título
  // que o visualizador de PDF do navegador usa como sugestão ao salvar
  // o PDF aberto em nova aba (ver window.open(bloburl) logo abaixo).
  doc.setProperties({
    title: `${relatorio.paciente?.nome || 'Paciente'} - ${moment
      .utc(relatorio.dataEmissao)
      .format('DD-MM-YYYY')} - RELATÓRIO DE INTERVENÇÃO ABA`,
  });

  let y = desenharCabecalho(doc, relatorio);

  // Seção null = sem dado daquele protocolo (o backend já decide isso).
  if (relatorio.portage) {
    y = desenharPortage(doc, relatorio.portage, y);
  }

  if (relatorio.vbmapp) {
    y = iniciarNovaSecao(doc, y);
    y = desenharVBMapp(doc, relatorio.vbmapp, y);
  }

  if (relatorio.manual) {
    y = iniciarNovaSecao(doc, y);
    y = desenharPei(doc, relatorio.manual, y);
  }

  if (relatorio.condutaSugerida) {
    y = iniciarNovaSecao(doc, y);
    y = desenharCondutaSugerida(doc, relatorio.condutaSugerida, y);
  }

  desenharRodape(doc);

  window.open(doc.output('bloburl'));
};
