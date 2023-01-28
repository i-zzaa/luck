import moment from 'moment';
moment.locale('pt-br');
import { PacientsProps } from '../foms/PatientForm';

export const colorsData: any = {
  TO: '#ef6c00',
  FONO: '#f6bf26',
  PSICO: '#8e24aa',
  PSICOPEDAG: '#000000',
};

export const colorsTextData: any = {
  TO: '#ffffff',
  FONO: '#ffffff',
  PSICO: '#ffffff',
  PSICOPEDAG: '#ffffff',
};

export const corEspecialidade = (type: string) => {
  let tipo = '';
  switch (type.toUpperCase()) {
    case 'TO':
      tipo = 'bg-to';
      break;
    case 'FONO':
      tipo = 'bg-fono';
      break;
    case 'PSICO':
      tipo = 'bg-psico';
      break;
    case 'PSICOPEDAG':
      tipo = 'bg-psico-pdeg';
      break;
    default:
      tipo = 'p-multiselect-token';
      break;
  }

  return tipo;
};

export const firtUpperCase = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const setColorChips = () => {
  setTimeout(() => {
    const chips: any = document.querySelectorAll('.p-multiselect-token') || [];
    chips.forEach((chip: any) => {
      const color = colorsData[chip.textContent.toUpperCase()];
      const text = colorsTextData[chip.textContent.toUpperCase()];

      chip.style.background = color;
      chip.style.color = text;
    });
  }, 0);
};

export const formatdate = (date: any) => {
  return moment(date).format('DD/MM/YYYY');
};

export const formatdateeua = (date: any) => {
  return moment(date).format('YYYY-MM-DD');
};

export const diffWeek = (dataInicio: any, dataAtual: any) => {
  const inicio = moment(dataInicio);
  const atual = moment(dataAtual);
  return atual.diff(inicio, 'weeks') + 1;
};

export const weekDay = [
  'Segunda-feira',
  'Terca-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const getDateFormat = (date: any) => {
  const dateFormat = moment(date); // Thursday Feb 2015
  const dow = Number(dateFormat.day());

  return `${weekDay[dow]}, ${dateFormat.format('ll')}`;
};

export const formtDatePatient = (value: PacientsProps) => {
  return {
    id: value.id,
    nome: value.nome,
    dataNascimento: value.dataNascimento,
    telefone: value.telefone,
    responsavel: value.responsavel,
    periodoId: value.vaga.periodo,
    convenioId: value.convenio,
    statusId: value.status,
    dataContato: value.vaga.dataContato,
    dataVoltouAba: value?.vaga?.dataVoltouAba,
    especialidades: value.vaga.especialidades.map((item: any) => {
      return {
        nome: item.especialidade.nome,
        id: item.especialidade.id,
      };
    }),
    tipoSessaoId: value.tipoSessao,
    observacao: value.vaga.observacao,
  };
};

export const getPrimeiroDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes - 1, 1)).format('YYYY-MM-DD');
};

export const getUltimoDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes, 0)).format('YYYY-MM-DD');
};
