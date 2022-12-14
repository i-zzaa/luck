import { createContext, useContext, useCallback } from "react";
import { dropDown } from "../server";
import { COORDENADOR, COORDENADOR_TERAPEUTA, permissionAuth, TERAPEUTA } from "./permission";

export interface DropdownContextData {
  renderPacientes: (statusPacienteId: number) => void;
  renderStatusEventos: () => void;
  renderModalidade: () => void;
  renderFrequencia: () => void;
  renderLocalidade: () => void;
  renderFuncao: () => void;
  renderTerapeutas: () => void;
  renderEspecialidadeFuncao: (especialidade: string) => void;
  renderEspecialidadeTerapeuta: (especialidade: string) => void;
  renderTerapeutaFuncao: (terapeutaId: number) => void;
  renderDropdownCalendario: (statusPacienteId: number) => any;
  renderDropdownCrud: () => any;
  renderDropdownPatientCrud: (statusPacienteId:number) => any;
  renderPacienteEspecialidade: (pacienteId:number, statusPacienteId: number) => any;
  renderDropdownQueue: (statusPacienteId:number) => any;
  renderDropdownCalendar: (statusPacienteId:number) => any;
  renderDropdownQueueCalendar : (statusPacienteId:number,  pacienteId: number) => any;
}

interface Props {
  children: JSX.Element;
}

const DropdownContext = createContext<DropdownContextData>({} as DropdownContextData);

export const DropdownProvider = ({ children }: Props) => {
  const { perfil } = permissionAuth();

  const weekOption = [
    {nome: 'S', value: 1},
    {nome: 'T', value: 2},
    {nome: 'Q', value: 3},
    {nome: 'Q', value: 4},
    {nome: 'S', value: 5},
  ];

  const renderPacientes = useCallback(async (statusPacienteId: number) => {
    const response: any = await dropDown(`paciente?statusPacienteId=${statusPacienteId}`);
    return response
  }, []);

  const renderPacientesTerapeuta = useCallback(async (terapeutaId: number) => {
    const response: any = await dropDown(`paciente-terapeuta?terapeutaId=${terapeutaId}`);
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

  const renderPeriodo = useCallback(async () => {
    const response: any = await dropDown("periodo");
    return response
  }, []);

  const renderStatus = useCallback(async (statusPacienteId: number) => {
    const response: any = await dropDown(`status?statusPacienteId=${statusPacienteId}`);
    return response
  }, []);

  const renderTipoSessao = useCallback(async () => {
    const response: any = await dropDown("tipo-sessao");
    return response
  }, []);

  const renderPacienteEspecialidade = useCallback(async (pacienteId: number, statusPacienteId: number) => {
    const response: any = await dropDown('paciente-especialidade', `pacienteId=${pacienteId}&statusPacienteId=${statusPacienteId}` );
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

  const renderPermissao = useCallback(async () => {
    const response: any = await dropDown("permissao");
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

  const renderDropdownCalendario = async (statusPacienteId: number) => {
    const dropDownList= {
      pacientes: await renderPacientes(statusPacienteId) ,
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

  const renderDropdownQueueCalendar = async (statusPacienteId: number, pacienteId: number ) => {
    const dropDownList= {
      pacientes: await renderPacientes(statusPacienteId) ,
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(),
      frequencias:await renderFrequencia(),
      localidades:await renderLocalidade(),
      funcoes: await renderFuncao(),
      terapeutas: await renderTerapeutas(),      
      especialidades: await renderPacienteEspecialidade(pacienteId, statusPacienteId),
      intervalos: await renderIntervalos(),
      diasFrequencia: weekOption,
    }

    return dropDownList
  };

  const renderDropdownQueue = async (statusPacienteId: number) => {
    const dropDownList= {
      pacientes: await renderPacientes(statusPacienteId) ,
      convenios: await renderConvenio(),
      especialidades: await renderEspecialidade(),
      tipoSessao: await renderTipoSessao(),
      periodos: await renderPeriodo(),
      status: await renderStatus(statusPacienteId),
    }

    return dropDownList
  }

  const renderDropdownPatientCrud = async (statusPacienteId: number) => {
    const dropDownList= {
      pacientes: await renderPacientes(statusPacienteId) ,
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(),
      terapeutas: await renderTerapeutas(),      
      especialidades: await renderEspecialidade(),
      convenios: await renderConvenio(),
      tipoSessao: await renderTipoSessao(),
      status: await renderStatus(statusPacienteId),
    }

    return dropDownList
  };

  const renderDropdownCalendar = async (statusPacienteId: number) => {

    let pacientes;
    if (perfil === COORDENADOR || perfil === COORDENADOR_TERAPEUTA || perfil === TERAPEUTA) {
      const auth: any = await sessionStorage.getItem('auth')
      const user = JSON.parse(auth)
      pacientes = await renderPacientesTerapeuta(user.id)
    }else {
      pacientes = await renderPacientes(statusPacienteId)
    }

    const dropDownList= {
      pacientes: pacientes ,
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(),
      terapeutas: await renderTerapeutas(),      
    }

    return dropDownList
  };


  const renderDropdownCrud = async () => {
    const dropDownList= {
      funcoes: await renderFuncao(),
      especialidades: await renderEspecialidade(),
      perfies:await renderPerfil(),
      permissoes: await renderPermissao()
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
      renderPacienteEspecialidade,
      renderDropdownQueue,
      renderDropdownQueueCalendar,
      renderDropdownCalendar
     }}>
      {children}
    </DropdownContext.Provider>
  );
};

export function useDropdown() {
  const context = useContext(DropdownContext);
  return context;
}
