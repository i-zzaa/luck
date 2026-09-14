import jsPDF from 'jspdf';
import logoLg from '../assets/logo-lg.jpg';
import { api } from '../server';
import {
  NIVEL_COR,
  buscarDadosClinica,
  desenharSlotVbmapp,
  formatarDataPdf,
} from './pdfRelatorioEvolucao';

type VbmappOrdenado = {
  niveis: {
    nivel: number;
    sessoes: {
      data: string;
      programas: {
        nome: string;
        slots: ({
          atividade: string;
          preenchimento: 'cheio' | 'metade' | 'vazio';
        } | null)[];
      }[];
    }[];
  }[];
};

const GRAY = '#d9d9d9';
const BLACK = '#000000';

// Chamado por foms/VBMapp.tsx com o corpo de POST /protocolo/filtro
// {type:'pdf'} — desse payload só `paciente` é usado agora. A grade vem
// de GET /protocolo/vbmapp/:pacienteId/ordenado (item 19 do
// pedido-frontend-fase2.md): níveis decrescentes, sessões cronológicas,
// programas e slots de tamanho fixo com `preenchimento` pronto — o
// dicionário {nivel: {data: {programa: {atividade: {percentual}}}}} do
// filtro dependia de Object.keys pra ordem, de corte em 10 e de
// converter percentual em preenchimento aqui.
const gerarGraficoPDF = async ({ paciente }: any): Promise<void> => {
  // Item 22: contato/CNPJ/endereço de GET /clinica/dados, não mais fixos.
  const [{ data: dados }, clinica] = await Promise.all([
    api.get<VbmappOrdenado>(`protocolo/vbmapp/${paciente.id}/ordenado`),
    buscarDadosClinica(),
  ]);

  // const doc = new jsPDF({ orientation: 'landscape' });
  const doc = new jsPDF();

  const logoURL = logoLg; // Se tiver o logo, insira o URL ou base64 aqui
  // logo-lg.jpg é JPEG, não PNG — formato errado aqui podia corromper a
  // decodificação da imagem embutida no PDF.
  doc.addImage(logoURL, 'JPEG', 15, 10, 50, 20); // Ajuste a posição e o tamanho do logotipo

  doc.setFontSize(9);
  doc.text(`Cel: ${clinica.telefone} • E-mail: ${clinica.email}`, 15, 35);
  doc.text(`CNPJ: ${clinica.cnpj}`, 15, 40);

  // Título principal
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('RELATÓRIO DE INTERVENÇÃO ABA INDIVIDUALIZADO', 15, 50);

  doc.setFont('Helvetica', 'bold');
  doc.text('DADOS DE IDENTIFICAÇÃO:', 15, 60);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Nome: ${paciente.nome}`, 15, 65);
  doc.text(`Data de Nascimento: ${paciente.dataNascimento}`, 110, 65);

  const pageWidth = doc.internal.pageSize.getWidth();
  const cellWidth = 6;
  const headerCellHeight = 2; // Altura do cabeçalho
  const activityCellHeight = 2; // Altura menor das atividades
  const spacing = 1; // Espaço menor entre os gráficos
  let startY = 70;

  // Níveis já vêm ordenados (decrescente) e só com dado — itera direto.
  dados.niveis.forEach(({ nivel, sessoes }) => {
    startY += 15; // Ajuste para o título do nível

    doc.setFontSize(10);
    doc.text(`Nível ${nivel}`, pageWidth / 2, startY, { align: 'center' });
    startY += 5;

    // Calcula a largura total necessária para centralizar os gráficos de cada nível
    const totalWidth = sessoes.reduce(
      (width, sessao) => width + sessao.programas.length * cellWidth + 5,
      -5
    );

    let graficoOffsetX = (pageWidth - totalWidth) / 2; // Centraliza o conjunto de gráficos
    // Mesma cor por nível da tela e do Relatório de Evolução (NIVEL_COR).
    const color = NIVEL_COR[nivel] || '#ffffff';
    let quantidadeSlots = 0;

    sessoes.forEach((sessao) => {
      const { programas } = sessao;

      // Adiciona a data acima de cada gráfico
      doc.setFontSize(8);
      doc.text(
        formatarDataPdf(sessao.data),
        graficoOffsetX + (programas.length * cellWidth) / 2,
        startY,
        { align: 'center' }
      );
      const headerY = startY + 2;

      programas.forEach((programa, colIndex) => {
        const x = graficoOffsetX + colIndex * cellWidth;

        // Cabeçalho do programa
        doc.setFillColor(GRAY);
        doc.rect(x, headerY, cellWidth, headerCellHeight, 'F');
        doc.setTextColor(BLACK);
        doc.setFontSize(3);
        doc.setDrawColor(BLACK);
        doc.setLineWidth(0.2);
        doc.rect(x, headerY, cellWidth, headerCellHeight);

        doc.text(
          programa.nome.toUpperCase(),
          x + cellWidth / 2,
          headerY + headerCellHeight / 2 + 0.5,
          { align: 'center' }
        );

        // Slots já com tamanho fixo e `preenchimento` pronto.
        programa.slots.forEach((slot, i) => {
          desenharSlotVbmapp(
            doc,
            slot,
            color,
            x,
            headerY + headerCellHeight + i * activityCellHeight,
            cellWidth,
            activityCellHeight
          );
        });
        quantidadeSlots = programa.slots.length;
      });

      // Move o próximo gráfico para a direita
      graficoOffsetX += programas.length * cellWidth + 5; // Ajuste do espaçamento entre gráficos
    });

    // Ajusta a posição inicial para o próximo nível — mesmo espaçamento
    // de sempre, só que com a quantidade de slots que o backend manda
    // (tamanho fixo) em vez do 10 repetido aqui.
    startY += headerCellHeight + quantidadeSlots * spacing + 1;
  });

  // Define o rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(clinica.endereco, 10, pageHeight - 10); // 10 é o espaço do rodapé a partir do final da página

  window.open(doc.output('bloburl'));
};

export default gerarGraficoPDF;
