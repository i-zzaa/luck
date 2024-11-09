import jsPDF from 'jspdf';

type DadosAtividade = {
  [programa: string]: {
    [atividade: string]: { nivel: number; percentual: number };
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
  const startX = 20;
  const startY = 40;
  const cellWidth = 15; // Ajuste do tamanho da célula
  const cellHeight = 10;
  const spacing = 0;

  doc.setFontSize(16);
  doc.text(
    'Relatório de Avaliação - Gráfico de Progresso',
    startX,
    startY - 15
  );

  // Função para definir a cor com base no nível
  const getLevelColor = (nivel: number): string => {
    if (nivel === 1) return ORANGE; // Laranja para nível 1
    if (nivel === 2) return GREEN; // Verde para nível 2
    if (nivel === 3) return BLUE; // Azul para nível 3
    return WHITE; // Padrão branco se o nível não estiver definido
  };

  // Configura os cabeçalhos (nomes dos programas)
  const programas = Object.keys(dados);
  const maxActivities = Math.max(
    ...Object.values(dados).map((programa) => Object.keys(programa).length)
  );

  // Desenhar cabeçalhos dos programas
  programas.forEach((programa, colIndex) => {
    const x = startX + colIndex * (cellWidth + spacing);
    doc.setFillColor(GRAY);
    doc.rect(x, startY, cellWidth, cellHeight, 'F');
    doc.setTextColor(BLACK);
    doc.setFontSize(8);

    // Adicionar borda preta ao redor do bloco
    doc.setDrawColor(BLACK);
    doc.setLineWidth(0.2);
    doc.rect(x, startY, cellWidth, cellHeight);

    doc.text(
      programa.toUpperCase(),
      x + cellWidth / 2,
      startY + cellHeight / 2 + 2,
      {
        align: 'center',
      }
    );
  });

  // Desenhar blocos de atividades
  for (let i = 0; i < maxActivities; i++) {
    programas.forEach((programa, colIndex) => {
      const atividades = Object.keys(dados[programa]);
      const atividade = atividades[i];
      const percentual = atividade ? dados[programa][atividade].percentual : 0;

      // Escolhe a cor com base no maior nível especificado
      const nivel = atividade ? dados[programa][atividade].nivel : 1;
      const color = getLevelColor(nivel);

      const x = startX + colIndex * (cellWidth + spacing);
      const y = startY + (i + 1) * (cellHeight + spacing);

      if (percentual === 100) {
        // Preenche 100% com a cor do nível
        doc.setFillColor(color);
        doc.rect(x, y, cellWidth, cellHeight, 'F');
      } else if (percentual === 50) {
        // Preenche metade com a cor do nível e metade em branco
        doc.setFillColor(color);
        doc.rect(x, y, cellWidth / 2, cellHeight, 'F'); // Metade esquerda
        doc.setFillColor(WHITE);
        doc.rect(x + cellWidth / 2, y, cellWidth / 2, cellHeight, 'F'); // Metade direita
      } else {
        // Preenche 0% em branco
        doc.setFillColor(WHITE);
        doc.rect(x, y, cellWidth, cellHeight, 'F');
      }

      // Adicionar borda preta ao redor do bloco
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.rect(x, y, cellWidth, cellHeight);
    });
  }

  window.open(doc.output('bloburl'));
};

export default gerarGraficoPDF;
