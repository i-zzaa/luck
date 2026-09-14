import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoLg from '../assets/logo-lg.jpg';
import { buscarDadosClinica } from './pdfRelatorioEvolucao';

// `data`: corpo de POST /protocolo/filtro {type:'pdf'} do Portage —
// {headers, Socializacao, Cognicao, paciente, numeroEvolucao}.
const gerarPdf = async (data: any) => {
  // Item 22 do pedido-frontend-fase2.md: contato/CNPJ/endereço vêm de
  // GET /clinica/dados — antes fixos aqui (e duplicados nos outros dois
  // PDFs).
  const clinica = await buscarDadosClinica();

  const doc: any = new jsPDF();

  // Cabeçalho com logotipo e contato
  const logoURL = logoLg; // Se tiver o logo, insira o URL ou base64 aqui
  // logo-lg.jpg é JPEG, não PNG — formato errado aqui podia corromper a
  // decodificação da imagem embutida no PDF.
  doc.addImage(logoURL, 'JPEG', 15, 10, 50, 20); // Ajuste a posição e o tamanho do logotipo

  doc.setFontSize(9);
  doc.text(`Cel: ${clinica.telefone} • E-mail: ${clinica.email}`, 15, 35);
  doc.text(`CNPJ: ${clinica.cnpj}`, 15, 40);

  // Título principal — número da evolução real (item 18: contagem de
  // avaliações do paciente no backend), não mais "EVOLUÇÃO 1" fixo.
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text(
    `RELATÓRIO DE INTERVENÇÃO ABA INDIVIDUALIZADO – EVOLUÇÃO ${data.numeroEvolucao}`,
    15,
    55
  );

  // Observação
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.text(
    '* Confidencial conforme ética profissional, não possui fins jurídicos e todos os dados obtidos devem ser considerados relativos ao atual momento desta avaliação e consequentemente do desenvolvimento da criança.',
    15,
    60,
    { maxWidth: 180 }
  );

  // Informações de Identificação
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text('Interessados:', 15, 75);
  doc.setFont('Helvetica', 'normal');
  doc.text('- Aos Pais , aplicadores e médica neuropediatra', 45, 75);

  doc.setFont('Helvetica', 'bold');
  doc.text('DADOS DE IDENTIFICAÇÃO:', 15, 85);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Nome: ${data.paciente.nome}`, 15, 90);
  doc.text(`Data de Nascimento: ${data.paciente.dataNascimento}`, 110, 90);

  // Título das tabelas de resultados
  doc.setFont('Helvetica', 'bold');
  doc.text('Resultados das áreas reavaliadas:', 15, 100);
  doc.setFont('Helvetica', 'italic');
  doc.text(
    '- Desenvolvimento Infantil: Reaplicada a Escala de Desenvolvimento Infantil Portage:',
    15,
    105
  );

  // Tabela de Socialização
  autoTable(doc, {
    head: [['Socialização']],
    theme: 'plain',
    styles: { fontSize: 12, fontStyle: 'bold', halign: 'center' },
    startY: 115,
  });

  autoTable(doc, {
    head: [data.headers],
    body: data['Socializacao'],
    startY: doc.lastAutoTable.finalY + 5,
    styles: { fontSize: 10, halign: 'center' },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
  });

  // Tabela de Cognição
  autoTable(doc, {
    head: [['Cognição']],
    theme: 'plain',
    styles: { fontSize: 12, fontStyle: 'bold', halign: 'center' },
    startY: doc.lastAutoTable.finalY + 10,
  });

  autoTable(doc, {
    head: [data.headers],
    body: data['Cognicao'],
    startY: doc.lastAutoTable.finalY + 5,
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
  });

  // Define o rodapé
  const pageHeight = doc.internal.pageSize.height;
  doc.text(clinica.endereco, 10, pageHeight - 10); // 10 é o espaço do rodapé a partir do final da página

  // Salvar o PDF
  // doc.save('relatorio_aba.pdf');
  window.open(doc.output('bloburl'));
};

export default gerarPdf;
