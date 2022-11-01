import { createContext, useContext, useCallback } from "react";
import { dropDown } from "../server";

export interface DropdownContextData {
  renderPacientes: (emAtendimento: boolean) => void;
  renderStatusEventos: () => void;
  renderModalidade: () => void;
  renderFrequencia: () => void;
  renderLocalidade: () => void;
  renderFuncao: () => void;
  renderTerapeutas: () => void;
  renderEspecialidadeFuncao: (especialidade: string) => void;
  renderEspecialidadeTerapeuta: (especialidade: string) => void;
  renderTerapeutaFuncao: (terapeutaId: number) => void;
  renderDropdownCalendario: (emAtedimento: boolean) => any;
  renderDropdownCrud: () => any;
  renderDropdownPatientCrud: (emAtedimento:boolean) => any;
}

interface Props {
  children: JSX.Element;
}

const DropdownContext = createContext<DropdownContextData>({} as DropdownContextData);

export const DropdownProvider = ({ children }: Props) => {
  const weekOption = [
    {nome: 'S', value: 1},
    {nome: 'T', value: 2},
    {nome: 'Q', value: 3},
    {nome: 'Q', value: 4},
    {nome: 'S', value: 5},
  ];

  const renderPacientes = useCallback(async (emAtendimento: boolean) => {
    const response: any = await dropDown(`paciente?emAtendimento=${emAtendimento}`);
    return response
  }, []);

  const renderEspecialidade = useCallback(async () => {
    const response: any = await dropDown("especialidade");
    return response
  }, []);

  const renderStatusEventos = useCallback(async () => {
    const response: any = await dropDown("statusEventos");
    return response
  }, []);

  const renderModalidade = useCallback(async () => {
    const response: any = await dropDown("modalidade");
    return response
  }, []);

  const renderFrequencia = useCallback(async () => {
    const response: any = await dropDown("frequencia");
    return response
  }, []);

  const renderLocalidade = useCallback(async () => {
    const response: any = await dropDown("localidade");
    return response
  }, []);

  const renderFuncao = useCallback(async () => {
    const response: any = await dropDown("funcao");
    return response
  }, []);

  const renderPerfil = useCallback(async () => {
    const response: any = await dropDown("perfil");
    return response
  }, []);

  const renderTipoSessao = useCallback(async () => {
    const response: any = await dropDown("tipo-sessao");
    return response
  }, []);

  const renderPrioridade = useCallback(async () => {
    const response: any = await dropDown("prioridade");
    return response
  }, []);

  const renderEspecialidadeFuncao = useCallback(async (especialidade: string) => {
    const response: any = await dropDown('especialidade-funcao', `especialidade=${especialidade}` );
    return response
  }, []);

  const renderEspecialidadeTerapeuta = useCallback(async (especialidade: string) => {
    const response: any = await dropDown('especialidade-terapeuta', `especialidade=${especialidade}` );
    return response
  }, []);

  const renderTerapeutaFuncao = useCallback(async (terapeutaId: number) => {
    const response: any = await dropDown('terapeuta-funcao', `terapeutaId=${terapeutaId}` );
    return response
  }, []);

  const renderConvenio = useCallback(async () => {
    const response: any = await dropDown("convenio");
    return response
  }, []);

  const renderTerapeutas = async () => {
    const response: any = await dropDown("terapeuta");
    return response
  };

  const renderIntervalos = async () => {
    const response: any = await dropDown("intervalo");
    return response
  };

  const renderDropdownCalendario = async (emAtedimento: boolean) => {
    const dropDownList= {
      pacientes: await renderPacientes(emAtedimento) ,
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(),
      frequencias:await renderFrequencia(),
      localidades:await renderLocalidade(),
      funcoes: await renderFuncao(),
      terapeutas: await renderTerapeutas(),      
      especialidades: await renderEspecialidade(),
      intervalos: await renderIntervalos(),
      diasFrequencia: weekOption,
    }

    return dropDownList
  };

  const renderDropdownPatientCrud = async (emAtedimento: boolean) => {
    const dropDownList= {
      pacientes: await renderPacientes(emAtedimento) ,
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(),
      terapeutas: await renderTerapeutas(),      
      especialidades: await renderEspecialidade(),
      convenios: await renderConvenio(),
      tipoSessao: await renderTipoSessao(),
      status: await renderPrioridade(),
    }

    return dropDownList
  };

  const renderDropdownCrud = async () => {
    const dropDownList= {
      funcoes: await renderFuncao(),
      especialidades: await renderEspecialidade(),
      perfies:await renderPerfil(),
    }

    return dropDownList
  };

  return (
    <DropdownContext.Provider value={{ 
      renderPacientes,
      renderStatusEventos,
      renderModalidade,
      renderFrequencia,
      renderLocalidade,
      renderFuncao,
      renderTerapeutas,
      renderDropdownCalendario,
      renderDropdownCrud,
      renderEspecialidadeFuncao,
      renderEspecialidadeTerapeuta,
      renderTerapeutaFuncao,
      renderDropdownPatientCrud,
     }}>
      {children}
    </DropdownContext.Provider>
  );
};

export function useDropdown() {
  const context = useContext(DropdownContext);
  return context;
}
