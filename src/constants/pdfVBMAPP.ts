import jsPDF from 'jspdf';
import logoLg from '../assets/logo-lg.jpg';

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

const gerarGraficoPDF = ({ data, paciente }: any): void => {
  const dados = data;
  const doc = new jsPDF();

  const logoURL = logoLg; // Se tiver o logo, insira o URL ou base64 aqui
  doc.addImage(logoURL, 'PNG', 15, 10, 50, 20); // Ajuste a posição e o tamanho do logotipo

  doc.setFontSize(9);
  doc.text('Cel: (11) 97271-6993 • E-mail: alcance.nt@yahoo.com', 15, 35);
  doc.text('CNPJ: 37.999.009/0001-68', 15, 40);

  // Título principal
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('RELATÓRIO DE INTERVENÇÃO ABA INDIVIDUALIZADO', 15, 50);

  doc.setFont('Helvetica', 'bold');
  doc.text('DADOS DE IDENTIFICAÇÃO:', 15, 60);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Nome: ${paciente.nome}`, 15, 65);
  doc.text(`Data de Nascimento: ${paciente.dataNascimento}`, 110, 65);

  const pageWidth = doc.internal.pageSize.width;
  const cellWidth = 15;
  const headerCellHeight = 10; // Altura do cabeçalho
  const activityCellHeight = 6; // Altura menor das atividades
  const spacing = 2; // Espaço menor entre os gráficos
  const maxActivities = 10; // Número máximo de atividades (linhas) por gráfico
  let startY = 70;

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

  // Define o rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.text(
    'Av. Henrique Andrés, 700 – Centro – Jundiaí-SP',
    10,
    pageHeight - 10
  ); // 10 é o espaço do rodapé a partir do final da página

  window.open(doc.output('bloburl'));
};

export default gerarGraficoPDF;
