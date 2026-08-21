import moment from 'moment';

// moment.locale('pt-br') sozinho não basta: o pacote "moment" só traz os
// dados do locale en-us embutidos, então isso normalmente pediria um
// `import 'moment/locale/pt-br'`. MAS nesse projeto (Vite 3), esse import
// vira um chunk pré-empacotado separado (node_modules/.vite/deps/...) que
// embute sua PRÓPRIA cópia isolada do moment.js — registrar o locale
// nessa cópia não afeta a instância real que o resto do app usa, e tudo
// continua saindo em inglês mesmo com o import presente. Definindo o
// locale direto aqui (mesmos dados do moment/locale/pt-br.js oficial) não
// depende de nenhum módulo separado, então não tem como duplicar.
moment.defineLocale('pt-br', {
  months:
    'janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split(
      '_'
    ),
  monthsShort: 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
  weekdays:
    'domingo_segunda-feira_terça-feira_quarta-feira_quinta-feira_sexta-feira_sábado'.split(
      '_'
    ),
  weekdaysShort: 'dom_seg_ter_qua_qui_sex_sáb'.split('_'),
  weekdaysMin: 'do_2ª_3ª_4ª_5ª_6ª_sá'.split('_'),
  weekdaysParseExact: true,
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D [de] MMMM [de] YYYY',
    LLL: 'D [de] MMMM [de] YYYY [às] HH:mm',
    LLLL: 'dddd, D [de] MMMM [de] YYYY [às] HH:mm',
  },
  calendar: {
    sameDay: '[Hoje às] LT',
    nextDay: '[Amanhã às] LT',
    nextWeek: 'dddd [às] LT',
    lastDay: '[Ontem às] LT',
    lastWeek: function (this: moment.Moment) {
      return this.day() === 0 || this.day() === 6
        ? '[Último] dddd [às] LT' // sábado + domingo
        : '[Última] dddd [às] LT'; // segunda - sexta
    },
    sameElse: 'L',
  },
  relativeTime: {
    future: 'em %s',
    past: 'há %s',
    s: 'poucos segundos',
    ss: '%d segundos',
    m: 'um minuto',
    mm: '%d minutos',
    h: 'uma hora',
    hh: '%d horas',
    d: 'um dia',
    dd: '%d dias',
    M: 'um mês',
    MM: '%d meses',
    y: 'um ano',
    yy: '%d anos',
  },
  dayOfMonthOrdinalParse: /\d{1,2}º/,
  ordinal: (n: number) => `${n}º`,
  invalidDate: 'Data inválida',
});
moment.locale('pt-br');

export const colorsData: any = {
  TO: '#ef6c00',
  FONO: '#f6bf26',
  PSICO: '#8e24aa',
  PSICOPEDAG: '#000000',
};

export const bgData: any = {
  TO: 'bg-to',
  FONO: 'bg-fono',
  PSICO: 'bg-psico',
  PSICOPEDAG: 'bg-psico-pdeg',
};

export const colorsTextData: any = {
  TO: '#ffffff',
  FONO: '#ffffff',
  PSICO: '#ffffff',
  PSICOPEDAG: '#ffffff',
};

export const corEspecialidade = (type: string): string => {
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
  moment.locale('pt-br');
  // return moment(date).add(1, 'days').format('YYYY-MM-DD');
  return moment(date).format('YYYY-MM-DD');
};

export const formatdateEuaAddDay = (date: any) => {
  return moment(date).add(1, 'days').format('YYYY-MM-DD');
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

export const horariosUteis = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

export const horariosUteisObj = {
  '08:00': false,
  '09:00': false,
  '10:00': false,
  '11:00': false,
  '12:00': false,
  '13:00': false,
  '14:00': false,
  '15:00': false,
  '16:00': false,
  '17:00': false,
  '18:00': false,
  '19:00': false,
  '20:00': false,
};

export const getDateFormat = (date: any) => {
  const dateFormat = moment(date); //.add(1, 'days'); // Thursday Feb 2015
  const dow = Number(dateFormat.day() - 1);

  return `${weekDay[dow]}, ${dateFormat.format('ll')}`;
};

export const getPrimeiroDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes - 1, 1)).format('YYYY-MM-DD');
};

export const getUltimoDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes, 0)).format('YYYY-MM-DD');
};

export const formaTime = (duration: any) => {
  const time = moment.duration(duration);
  return `${time.hours().toString().padStart(2, '0')}:${time
    .minutes()
    .toString()
    .padStart(2, '0')}:${time.seconds().toString().padStart(2, '0')}`;
};

export const moneyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const isInPast = (date: string) => {
  return moment(date).isBefore(new Date());
};

export const formatDateHours = (hours: any, date: any) => {
  const arrTime = hours.split(':');
  return moment(date)
    .add(arrTime[0], 'hours')
    .add(arrTime[1], 'minutes')
    .format('DD/MM/YY HH:mm');
};

export enum DEVICE {
  mobile = 'DEVICE_MOBILE',
  web = 'DEVICE_WEB',
}


export const OBJ_META = {
  id: "",
  name: "meta",
  type: "input-add",
  value: "",
  labelFor: "meta",
  subitems: [],
  buttonAdd: true,
  customCol: "col-span-5 sm:col-span-5",
  labelText: "Meta"
}

export const OBJ_ITEM = {
  id: "",
  name: "item",
  type: "input-add",
  value: "",
  labelFor: "item",
  buttonAdd: true,
  customCol: "col-span-5 sm:col-span-5",
  labelText: "Item"
}