import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import logoLg from '../assets/logo-lg.jpg';
import { filter } from '../server';
import {
  STATUS_META_COLOR_RGB,
  STATUS_META_LABEL,
  TIPO_PROTOCOLO,
  VALOR_PORTAGE,
} from './protocolo';

// Relatório de Evolução — unifica num PDF só o que hoje são 3 exports
// separados (Portage, VB-MAPP e a listagem do Manual em pages/PEI.tsx),
// no mesmo espírito do "RELATÓRIO DE INTERVENÇÃO ABA" que a clínica já
// usa fora do app (documento de referência). Reaproveita os MESMOS
// endpoints que os botões "Gerar Relatório" de Portage.tsx/VBMapp.tsx e
// a listagem de PEI.tsx já usam — não é uma fonte de dado nova.
//
// Fora do escopo por enquanto (não existe no backend hoje — ver
// docs/pedido-backend-formatacao.md): reforçamento diferencial e a
// tabela ABC de comportamento disruptivo, que no documento de
// referência são texto livre preenchido à mão pela terapeuta fora do
// app.

const BLACK: [number, number, number] = [0, 0, 0];
const GRAY_HEADER: [number, number, number] = [240, 240, 240];
const GRAY_TEXT: [number, number, number] = [110, 110, 110];
// Mesmo roxo da marca (var(--violet-800) em src/styles/global.css) — dá
// pra reaproveisar no PDF pra amarrar visualmente com o resto do app,
// em vez do título sair preto puro feito o resto do texto corrido.
const BRAND_PURPLE: [number, number, number] = [102, 41, 119];
const NOTE_BG: [number, number, number] = [246, 246, 248];
const GREEN: [number, number, number] = [34, 197, 94];
const YELLOW: [number, number, number] = [202, 138, 4];
const RED: [number, number, number] = [239, 68, 68];

// Mesma faixa de cor que a tela usa pra "% de acertos" (ver
// corPorcentagem em PrimeiraResposta.tsx) — verde/amarelo/vermelho
// conforme o valor, cinza quando não é um percentual de verdade
// ("Não se aplica").
const corPercentualRGB = (valor: string): [number, number, number] => {
  const numero = parseFloat(valor);
  if (Number.isNaN(numero)) return GRAY_TEXT;
  if (numero >= 80) return GREEN;
  if (numero >= 50) return YELLOW;
  return RED;
};

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
    console.error('Não foi possível carregar o logo do Relatório de Evolução', error);
    return null; // sem logo é melhor que travar o relatório inteiro
  }
};

// Bloco de identificação profissional — mesmo texto que assina o
// relatório de referência que a clínica já usa fora do app.
const RESPONSAVEL_NOME = 'Talita Balbino Correa Cunico';
const RESPONSAVEL_CARGO = 'Psicóloga/Supervisora ABA - Analista do Comportamento';
const RESPONSAVEL_CARGO_LINHA2 = 'e Neuropsicóloga - CRP: 06/103406';
const RESPONSAVEL_CONTATO = 'Cel: (11) 97271-6993 – Email: alcance.nt@yahoo.com';

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

  let ry = 15;
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BRAND_PURPLE);
  doc.text(RESPONSAVEL_NOME, rightX, ry, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(...GRAY_TEXT);
  ry += 4.5;
  doc.text(RESPONSAVEL_CARGO, rightX, ry, { align: 'right' });
  ry += 3.5;
  doc.text(RESPONSAVEL_CARGO_LINHA2, rightX, ry, { align: 'right' });
  ry += 3.5;
  doc.text(RESPONSAVEL_CONTATO, rightX, ry, { align: 'right' });
  ry += 3.5;
  doc.text('CNPJ: 37.999.009/0001-68', rightX, ry, { align: 'right' });

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
const desenharCabecalho = (doc: any, paciente: any) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - MARGIN_RIGHT;

  desenharTimbre(doc);

  // Título na cor de marca (não preto puro, igual o resto do texto
  // corrido) com a data alinhada à direita na mesma linha — lê como
  // cabeçalho de documento, não como mais uma frase solta.
  //
  // "RELATÓRIO DE INTERVENÇÃO ABA <N> – <data>" no documento de
  // referência — o "<N>" é um número sequencial de intervenção que a
  // clínica controla à mão fora do app (não existe hoje como dado
  // rastreado em lugar nenhum do sistema, então não dá pra numerar
  // certo aqui); a data usada é a de hoje, dia em que o relatório está
  // sendo gerado.
  const tituloY = TIMBRE_DIVIDER_Y + 8;
  doc.setFontSize(13);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BRAND_PURPLE);
  doc.text('RELATÓRIO DE INTERVENÇÃO ABA', MARGIN_LEFT, tituloY);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(...GRAY_TEXT);
  doc.text(moment().format('DD/MM/YYYY'), rightX, tituloY, { align: 'right' });

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
  doc.roundedRect(MARGIN_LEFT, notaY, rightX - MARGIN_LEFT, notaAltura, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'italic');
  doc.setTextColor(...GRAY_TEXT);
  doc.text(notaTexto, MARGIN_LEFT + 3, notaY + 4.5);

  let y = notaY + notaAltura + 9;

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('DADOS DE IDENTIFICAÇÃO', MARGIN_LEFT, y);
  y += 5;

  // Nome/Data de Nascimento dentro de uma caixinha (mesmo tratamento da
  // nota de confidencialidade) — antes era só texto solto colado no
  // título da primeira seção (Portage) logo abaixo, sem separação
  // nenhuma. Assim fica claro onde a identificação do paciente termina
  // e o corpo do relatório começa.
  doc.setFillColor(...NOTE_BG);
  doc.roundedRect(MARGIN_LEFT, y - 4.5, rightX - MARGIN_LEFT, 9, 1, 1, 'F');
  doc.setFont('Helvetica', 'normal');
  doc.text(`Nome: ${paciente?.nome || ''}`, MARGIN_LEFT + 3, y);
  if (paciente?.dataNascimento) {
    doc.text(`Data de Nascimento: ${paciente.dataNascimento}`, rightX - 3, y, {
      align: 'right',
    });
  }
  y += 14;

  // Reseta cor/fonte antes de devolver o controle pras seções seguintes
  // (Portage/VB-MAPP/Manual) — sem isso elas herdariam o roxo/cinza
  // usado aqui.
  doc.setTextColor(...BLACK);
  doc.setFont('Helvetica', 'normal');

  return y;
};

// ------------------ Portage (tabela Socialização/Cognição) ------------------
// O backend devolve uma tabela por categoria com LINHA=faixa etária,
// COLUNA=avaliação (data.headers[0] é o canto vazio da tabela original;
// data.headers[i], i>=1, é o rótulo de cada avaliação — "Avaliação
// <data>"/"Reavaliação <data>"). Renderizar direto assim faz uma
// tabela enorme, cheia de "Não se aplica" (cada avaliação só preenche
// as faixas etárias que faziam sentido pra idade da criança NAQUELE
// momento — quanto mais avaliações, mais colunas ficam quase vazias).
//
// O relatório de referência inverte isso: uma tabelinha POR avaliação,
// com as CATEGORIAS (Socialização/Cognição) como linha e só as faixas
// etárias que aquela avaliação realmente preencheu como coluna — dá
// pra comparar evolução por sessão sem ruído de "Não se aplica".
//
// E só desenha DUAS: a primeira aplicação e a mais recente — igual o
// documento de referência ("Primeira Aplicação"/"Aplicação Atual").
// O backend pode devolver até 4 (reavaliações no meio do caminho); com
// todas na página, o relatório fica poluído sem agregar muito — o que
// importa pra evolução geral é o ponto de partida e o estado atual.
const extrairDataDoRotulo = (rotulo: string) => rotulo.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || '';

const transformarPortagePorAvaliacao = (data: any) => {
  const headers: string[] = data?.headers || [];
  const linhasPorCategoria: Record<string, any[]> = {
    Socialização: data?.Socializacao || [],
    Cognição: data?.Cognicao || [],
  };

  // headers[0] é o canto vazio da tabela original; headers[1] é sempre
  // a avaliação mais recente e headers[headers.length - 1] a mais
  // antiga (o backend busca orderBy id desc). Só pega essas duas
  // pontas — com só 1 avaliação cadastrada, os dois índices coincidem
  // e o loop abaixo desenha uma vez só.
  const totalAvaliacoes = headers.length - 1;
  const indicesEscolhidos =
    totalAvaliacoes <= 0
      ? []
      : Array.from(new Set([headers.length - 1, 1])).sort((a, b) => b - a);

  const avaliacoes: { titulo: string; colunas: string[]; linhas: string[][] }[] = [];

  indicesEscolhidos.forEach((indiceAvaliacao, posicao) => {
    // Faixas etárias com dado de verdade nessa avaliação (em qualquer
    // categoria), na mesma ordem em que o backend já as manda.
    const faixasComDado = new Set<string>();
    Object.values(linhasPorCategoria).forEach((linhas) => {
      linhas.forEach((linha) => {
        const percentual = linha[indiceAvaliacao];
        if (percentual && percentual !== 'Não se aplica') {
          faixasComDado.add(linha[0]);
        }
      });
    });
    if (!faixasComDado.size) return; // avaliação sem nada preenchido — não desenha tabela vazia

    const faixasOrdenadas = (linhasPorCategoria.Socialização.length
      ? linhasPorCategoria.Socialização
      : linhasPorCategoria.Cognição
    )
      .map((linha) => linha[0])
      .filter((faixaEtaria) => faixasComDado.has(faixaEtaria));

    const linhas = Object.entries(linhasPorCategoria)
      .filter(([, linhasCategoria]) => linhasCategoria.length)
      .map(([categoria, linhasCategoria]) => [
        categoria,
        ...faixasOrdenadas.map((faixaEtaria) => {
          const linha = linhasCategoria.find((l) => l[0] === faixaEtaria);
          return linha ? linha[indiceAvaliacao] : '';
        }),
      ]);

    const dataAvaliacao = extrairDataDoRotulo(headers[indiceAvaliacao]);
    // Com as duas pontas escolhidas, nomeia como a referência
    // ("Primeira Aplicação"/"Aplicação Atual"); com só uma (paciente
    // com uma única avaliação cadastrada), mantém o rótulo original do
    // backend — não faz sentido chamar de "primeira" e "atual" a mesma
    // coisa.
    const titulo =
      indicesEscolhidos.length === 2
        ? `${posicao === 0 ? 'Primeira Aplicação' : 'Aplicação Atual'}${dataAvaliacao ? `: ${dataAvaliacao}` : ''}`
        : headers[indiceAvaliacao];

    avaliacoes.push({
      titulo,
      colunas: ['Áreas', ...faixasOrdenadas],
      linhas,
    });
  });

  return avaliacoes;
};

const desenharPortage = (doc: any, data: any, startY: number) => {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('Desenvolvimento Infantil — Escala Portage', MARGIN_LEFT, y);
  y += 7;

  transformarPortagePorAvaliacao(data).forEach((avaliacao) => {
    y = ensureSpace(doc, y, 18);

    // Título com uma faixa lateral na cor de marca (mesmo tratamento
    // visual do resto do relatório) — antes era só texto solto, sem
    // separação clara de onde uma avaliação termina e a próxima começa.
    doc.setFillColor(...BRAND_PURPLE);
    doc.rect(MARGIN_LEFT, y - 3.2, 1.2, 4.2, 'F');
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_PURPLE);
    doc.text(avaliacao.titulo, MARGIN_LEFT + 3, y);
    doc.setTextColor(...BLACK);
    y += 4;

    autoTable(doc, {
      head: [avaliacao.colunas],
      body: avaliacao.linhas,
      startY: y,
      // Número fixo (não 'auto'/'wrap') é o que faz a tabela esticar
      // até preencher a largura útil da página de verdade — só 2-3
      // colunas curtas ("Áreas" + faixas etárias) ficavam bem menores
      // que isso por padrão, sobrando bastante vazio à direita.
      tableWidth: contentWidth,
      styles: { fontSize: 9, halign: 'center', cellPadding: 2.5 },
      headStyles: { fillColor: GRAY_HEADER, textColor: BLACK, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      // Colore cada percentual (verde/amarelo/vermelho, mesma faixa da
      // tela) e deixa "Não se aplica" em itálico cinza — sem isso os
      // números ficavam todos pretos, iguais entre si, difícil de
      // escanear rápido qual faixa está bem e qual precisa de atenção.
      didParseCell: (hookData: any) => {
        if (hookData.section !== 'body' || hookData.column.index === 0) return;
        const valor = String(hookData.cell.raw ?? '');
        if (valor === 'Não se aplica') {
          hookData.cell.styles.fontStyle = 'italic';
          hookData.cell.styles.textColor = GRAY_TEXT;
        } else if (valor) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.textColor = corPercentualRGB(valor);
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;
  });

  return y;
};

// ------------------ VB-MAPP (grade colorida por nível) ------------------
const NIVEL_COR: Record<number, string> = {
  1: '#e36b05',
  2: '#03ae4e',
  3: '#0071bd',
};

const desenharVBMapp = (doc: any, dados: any, startY: number) => {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const cellWidth = 6;
  const headerCellHeight = 3;
  const activityCellHeight = 2.5;
  const maxActividades = 10;

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('Marcos do Desenvolvimento — VB-MAPP', MARGIN_LEFT, y);
  y += 8;

  const niveisOrdenados = Object.keys(dados || {})
    .map(Number)
    .sort((a, b) => b - a);

  niveisOrdenados.forEach((nivel) => {
    const datas = Object.keys(dados[nivel]);
    if (!datas.length) return;

    y = ensureSpace(doc, y, 15);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Nível ${nivel}`, pageWidth / 2, y, { align: 'center' });
    y += 5;

    const totalWidth = datas.reduce((width, data) => {
      const programas = Object.keys(dados[nivel][data]).length;
      return width + programas * cellWidth + 5;
    }, -5);
    let offsetX = (pageWidth - totalWidth) / 2;

    const alturaGrade =
      headerCellHeight + maxActividades * activityCellHeight + 6;
    y = ensureSpace(doc, y, alturaGrade);

    datas.forEach((data) => {
      const programas = Object.keys(dados[nivel][data]);

      // Data da sessão — era o maior texto perto da grade (7pt contra
      // as células de ~2-3mm), destoando do resto; menor aqui fica
      // proporcional ao tamanho real da grade abaixo.
      doc.setFontSize(5);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(...BLACK);
      doc.text(data, offsetX + (programas.length * cellWidth) / 2, y, {
        align: 'center',
      });
      const headerY = y + 2;

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
        const rotulo = String(programa || '').toUpperCase();
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
      });

      for (let i = 0; i < maxActividades; i++) {
        programas.forEach((programa, colIndex) => {
          const atividades = Object.keys(dados[nivel][data][programa]);
          const atividade = atividades[i];
          const percentual = atividade
            ? dados[nivel][data][programa][atividade].percentual
            : 0;
          const x = offsetX + colIndex * cellWidth;
          const cellY = headerY + headerCellHeight + i * activityCellHeight;
          const cor = NIVEL_COR[nivel] || '#ffffff';

          if (percentual === 100) {
            doc.setFillColor(cor);
            doc.rect(x, cellY, cellWidth, activityCellHeight, 'F');
          } else if (percentual === 50) {
            doc.setFillColor(cor);
            doc.rect(
              x,
              cellY + activityCellHeight / 2,
              cellWidth,
              activityCellHeight / 2,
              'F'
            );
            doc.setFillColor('#ffffff');
            doc.rect(x, cellY, cellWidth, activityCellHeight / 2, 'F');
          } else {
            doc.setFillColor('#ffffff');
            doc.rect(x, cellY, cellWidth, activityCellHeight, 'F');
          }
          doc.setDrawColor(0);
          doc.setLineWidth(0.2);
          doc.rect(x, cellY, cellWidth, activityCellHeight);
        });
      }

      offsetX += programas.length * cellWidth + 5;
    });

    y += alturaGrade;
  });

  return y + 4;
};

// ------------------ Manual/PEI (programas + metas) ------------------
// Mesmo agrupamento por procedimento de ensino que pages/PEI.tsx usa na
// tela (uma meta com `procedimentoEnsino` marca o início de um novo
// grupo/registro mesclado) — duplicado aqui em vez de importado porque
// o PDF desenha diferente da tela (autoTable em vez de <Fieldset>), mas
// a REGRA de agrupamento é a mesma.
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

const desenharPei = (doc: any, sections: any[], startY: number) => {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('Programas ABA (Metas) — Protocolo Manual', MARGIN_LEFT, y);
  y += 8;

  (sections || []).forEach((section) => {
    y = ensureSpace(doc, y, 12);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(section.programa?.nome || '', MARGIN_LEFT, y);
    y += 5;

    agruparMetasPorProcedimento(section.metas).forEach((grupo) => {
      const cabecalho = grupo[0];

      y = ensureSpace(doc, y, 14);
      if (cabecalho?.procedimentoEnsino?.nome) {
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'bold');
        const linhas = doc.splitTextToSize(
          `PROCEDIMENTO DE ENSINO: ${cabecalho.procedimentoEnsino.nome}`,
          contentWidth
        );
        doc.text(linhas, MARGIN_LEFT, y);
        y += linhas.length * 4 + 2;
      }

      const sd = cabecalho?.estimuloDiscriminativo;
      const resposta = cabecalho?.resposta;
      const sr = cabecalho?.estimuloReforcadorPositivo;
      if (sd || resposta || sr) {
        autoTable(doc, {
          head: [['SD (estímulo discriminativo)', 'Resposta', 'SR+ (reforçador)']],
          body: [[sd || '', resposta || '', sr || '']],
          startY: y,
          styles: { fontSize: 8, halign: 'center' },
          headStyles: { fillColor: GRAY_HEADER, textColor: BLACK, fontStyle: 'bold' },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        });
        y = doc.lastAutoTable.finalY + 3;
      }

      grupo.forEach((meta, indexMeta) => {
        y = ensureSpace(doc, y, 10);
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');

        const statusCor = meta.status ? STATUS_META_COLOR_RGB[meta.status] : null;
        const textoMeta = `Meta ${indexMeta + 1}: ${meta.value || ''}`;
        const linhasMeta = doc.splitTextToSize(textoMeta, contentWidth);
        doc.setTextColor(...BLACK);
        doc.text(linhasMeta, MARGIN_LEFT, y);
        y += linhasMeta.length * 4;

        if (statusCor) {
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(...statusCor);
          doc.text(STATUS_META_LABEL[meta.status], MARGIN_LEFT + 4, y);
          doc.setTextColor(...BLACK);
          doc.setFont('Helvetica', 'normal');
          y += 4;
        }

        if (meta.observacao) {
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(...GRAY_TEXT);
          const linhasObs = doc.splitTextToSize(meta.observacao, contentWidth - 4);
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
    });

    y += 3;
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
    doc.text('Av. Henrique Andrés, 700 – Centro – Jundiaí-SP', 10, pageHeight - 10);
    doc.text(String(i), doc.internal.pageSize.getWidth() - 15, pageHeight - 10);
  }
};

export const gerarRelatorioEvolucao = async (
  paciente: { id: number; nome: string },
  renderToast: (args: any) => void
) => {
  // Precisa terminar de carregar ANTES de desenhar a primeira página —
  // ver comentário em carregarLogoBase64.
  const [, portageRes, vbmappRes, peiRes] = await Promise.allSettled([
    carregarLogoBase64(),
    filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.portage,
      type: 'pdf',
    }),
    filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.vbMapp,
      type: 'pdf',
    }),
    filter('pei', {
      paciente: { id: paciente.id },
      protocoloId: { id: TIPO_PROTOCOLO.pei },
      notSelected: [VALOR_PORTAGE.sim],
    }),
  ]);

  const portageData =
    portageRes.status === 'fulfilled' ? portageRes.value?.data : null;
  const vbmappBody =
    vbmappRes.status === 'fulfilled' ? vbmappRes.value?.data : null;
  // GET pei/filtro devolve o array direto no corpo (não um {data:[...]}
  // por fora) — mesma leitura que pages/PEI.tsx: `const { data } = await
  // filter('pei', ...)` já extrai o corpo inteiro como a lista.
  const peiData = peiRes.status === 'fulfilled' ? peiRes.value?.data : null;

  if (!portageData && !vbmappBody?.data && !peiData?.length) {
    renderToast({
      type: 'failure',
      title: 'Sem dados',
      message: 'Não há Portage, VB-MAPP ou Manual cadastrados pra esse paciente.',
      open: true,
    });
    return;
  }

  const doc: any = new jsPDF();
  const pacienteInfo = portageData?.paciente || vbmappBody?.paciente || paciente;

  let y = desenharCabecalho(doc, pacienteInfo);

  if (portageData) {
    y = desenharPortage(doc, portageData, y);
  }

  if (vbmappBody?.data) {
    y = iniciarNovaSecao(doc, y);
    y = desenharVBMapp(doc, vbmappBody.data, y);
  }

  if (peiData?.length) {
    y = iniciarNovaSecao(doc, y);
    y = desenharPei(doc, peiData, y);
  }

  desenharRodape(doc);

  window.open(doc.output('bloburl'));
};
