import jsPDF from 'jspdf';

type DadosAtividade = {
  [nivel: number]: {
    [data: string]: {
      [programa: string]: {
        [atividade: string]: { percentual: number };
      };
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
  const spacing = 2; // Espaço menor entre os gráficos
  const maxActivities = 10; // Número máximo de atividades (linhas) por gráfico
  let startY = 20;

  // doc.setFontSize(16);
  // doc.text(
  //   'Relatório de Avaliação - Gráfico de Progresso',
  //   pageWidth / 2,
  //   startY - 15,
  //   { align: 'center' }
  // );

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
    const datas = Object.keys(dados[nivel]);
    startY += 15; // Ajuste para o título do nível

    doc.setFontSize(14);
    doc.text(`Nível ${nivel}`, pageWidth / 2, startY, { align: 'center' });
    startY += 5;

    // Calcula a largura total necessária para centralizar os gráficos de cada nível
    const totalWidth = datas.reduce((width, data) => {
      const programas = Object.keys(dados[nivel][data]).length;
      return width + programas * cellWidth + spacing * (programas - 1) + 20;
    }, -20);

    let graficoOffsetX = (pageWidth - totalWidth) / 2; // Centraliza o conjunto de gráficos

    datas.forEach((data) => {
      const programas = Object.keys(dados[nivel][data]);

      // Adiciona a data acima de cada gráfico
      doc.setFontSize(10);
      doc.text(
        data,
        graficoOffsetX + (programas.length * cellWidth) / 2,
        startY,
        { align: 'center' }
      );
      const headerY = startY + 2;

      // Desenhar cabeçalhos dos programas
      programas.forEach((programa, colIndex) => {
        const x = graficoOffsetX + colIndex * cellWidth;
        doc.setFillColor(GRAY);
        doc.rect(x, headerY, cellWidth, headerCellHeight, 'F');
        doc.setTextColor(BLACK);
        doc.setFontSize(8);
        doc.setDrawColor(BLACK);
        doc.setLineWidth(0.2);
        doc.rect(x, headerY, cellWidth, headerCellHeight);

        doc.text(
          programa.toUpperCase(),
          x + cellWidth / 2,
          headerY + headerCellHeight / 2 + 2,
          { align: 'center' }
        );
      });

      // Desenhar 10 blocos de atividades para cada programa na data e nível
      for (let i = 0; i < maxActivities; i++) {
        programas.forEach((programa, colIndex) => {
          const atividades = Object.keys(dados[nivel][data][programa]);
          const atividade = atividades[i];
          const percentual = atividade
            ? dados[nivel][data][programa][atividade].percentual
            : 0;

          const color = getLevelColor(nivel);

          const x = graficoOffsetX + colIndex * cellWidth;
          const y = headerY + headerCellHeight + i * activityCellHeight;

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

      // Move o próximo gráfico para a direita
      graficoOffsetX += programas.length * cellWidth + 20; // Ajuste do espaçamento entre gráficos
    });

    // Ajusta a posição inicial para o próximo nível
    startY += headerCellHeight + maxActivities * spacing + 40;
  });

  window.open(doc.output('bloburl'));
};

export default gerarGraficoPDF;
