export interface TabProps {
  components: ItemTabProps[];
}
export interface ItemTabProps {
  id: CodProps;
  icon: any;
  title: string;
}

export interface CRUDProps {
  formImputs: any;
  list: any[];
}

export type CodProps =
  | "paciente"
  | "usuario"
  | "modalidade"
  | "status-eventos"
  | "frequencia"
  | "funcao"
  | "localidade"
  | "convenio"
  | "especialidade"
  | "avaliacao"
  | "terapia"
  | "terapeuta"
  | "devolutiva";
