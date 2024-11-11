import jsPDF from 'jspdf';

type DadosAtividade = {
  [nivel: number]: {
    [programa: string]: {
      [atividade: string]: { percentual: number };
    };
  };
};

const GREEN = '#03ae4e';
const BLUE = '#0071bd';
const ORANGE = '#e36b05';
const GRAY = '#d9d9d9';
const WHITE = '#ffffff';
const BLACK = '#000000';

const gerarGraficoPDF = (dados: DadosAtividade): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const cellWidth = 15;
  const headerCellHeight = 10; // Altura do cabeçalho
  const activityCellHeight = 6; // Altura menor das atividades
  const spacing = 0;
  let startY = 40;

  doc.setFontSize(16);
  doc.text(
    'Relatório de Avaliação - Gráfico de Progresso',
    pageWidth / 2,
    startY - 15,
    { align: 'center' }
  );

  // Função para definir a cor com base no nível
  const getLevelColor = (nivel: number): string => {
    if (nivel === 1) return ORANGE;
    if (nivel === 2) return GREEN;
    if (nivel === 3) return BLUE;
    return WHITE;
  };

  // Ordena os níveis em ordem decrescente
  const niveisOrdenados = Object.keys(dados)
    .map(Number)
    .sort((a, b) => b - a);

  // Itera sobre os níveis para gerar o título e gráficos para cada nível
  niveisOrdenados.forEach((nivel) => {
    const programas = Object.keys(dados[nivel]);
    const numProgramas = programas.length;
    const startX = (pageWidth - numProgramas * (cellWidth + spacing)) / 2;

    // Título do nível
    startY += 5;
    doc.setFontSize(14);
    doc.text(`Nível ${nivel}`, pageWidth / 2, startY, { align: 'center' });
    startY += 2;

    // Configura cabeçalhos (nomes dos programas)
    const maxActivities = 10;

    // Desenhar cabeçalhos dos programas
    programas.forEach((programa, colIndex) => {
      const x = startX + colIndex * (cellWidth + spacing);
      doc.setFillColor(GRAY);
      doc.rect(x, startY, cellWidth, headerCellHeight, 'F');
      doc.setTextColor(BLACK);
      doc.setFontSize(8);
      doc.setDrawColor(BLACK);
      doc.setLineWidth(0.2);
      doc.rect(x, startY, cellWidth, headerCellHeight);

      doc.text(
        programa.toUpperCase(),
        x + cellWidth / 2,
        startY + headerCellHeight / 2 + 2,
        { align: 'center' }
      );
    });

    // Desenhar 10 blocos de atividades para cada programa no nível
    for (let i = 0; i < maxActivities; i++) {
      programas.forEach((programa, colIndex) => {
        const atividades = Object.keys(dados[nivel][programa]);
        const atividade = atividades[i];
        const percentual = atividade
          ? dados[nivel][programa][atividade].percentual
          : 0;

        const color = getLevelColor(nivel);

        const x = startX + colIndex * (cellWidth + spacing);
        const y =
          startY + headerCellHeight + i * (activityCellHeight + spacing);

        if (percentual === 100) {
          doc.setFillColor(color);
          doc.rect(x, y, cellWidth, activityCellHeight, 'F');
        } else if (percentual === 50) {
          // Preenche metade inferior com a cor do nível e metade superior em branco
          doc.setFillColor(color);
          doc.rect(
            x,
            y + activityCellHeight / 2,
            cellWidth,
            activityCellHeight / 2,
            'F'
          ); // Metade inferior
          doc.setFillColor(WHITE);
          doc.rect(x, y, cellWidth, activityCellHeight / 2, 'F'); // Metade superior
        } else {
          // Preenche 0% em branco
          doc.setFillColor(WHITE);
          doc.rect(x, y, cellWidth, activityCellHeight, 'F');
        }

        // Adicionar borda preta ao redor do bloco
        doc.setDrawColor(BLACK);
        doc.setLineWidth(0.2);
        doc.rect(x, y, cellWidth, activityCellHeight);
      });
    }

    // Ajusta a posição inicial para o próximo nível
    startY +=
      headerCellHeight + maxActivities * (activityCellHeight + spacing) + 20;
  });

  window.open(doc.output('bloburl'));
};

export default gerarGraficoPDF;
