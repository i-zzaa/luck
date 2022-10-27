import { createContext, useContext, useCallback, useState } from "react";
import { dropDown, getList } from "../server";


export interface DropdownContextData {
  renderPacientes: () => void;
  renderStatusEventos: () => void;
  renderModalidade: () => void;
  renderFrequencia: () => void;
  renderLocalidade: () => void;
  renderFuncao: () => void;
  renderTerapeutas: () => void;
  renderDropdownCalendario: () => any;
}

interface Props {
  children: JSX.Element;
}

const DropdownContext = createContext<DropdownContextData>({} as DropdownContextData);

export const DropdownProvider = ({ children }: Props) => {
  const renderPacientes = useCallback(async () => {
    const response: any = await dropDown("paciente");
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

  const renderTerapeutas = async () => {
    const response: any = await getList("/usuarios/terapeutas");
    return response
  };

  const renderDropdownCalendario = async () => {
    const dropDownList= {
      pacientes: await renderPacientes() ,
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(),
      frequencias:await renderFrequencia(),
      localidades:await renderLocalidade(),
      funcoes: await renderFuncao(),
      terapeutas: await renderTerapeutas(),
      especialidades: await renderEspecialidade()
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
      renderDropdownCalendario
     }}>
      {children}
    </DropdownContext.Provider>
  );
};

export function useDropdown() {
  const context = useContext(DropdownContext);
  return context;
}
