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
  renderEspecialidadeFuncao: (especialidade: string) => void;
  renderDropdownCalendario: () => any;
  renderDropdownCrud: () => any;
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

  const intervaloOption = [
    {nome: '2 semanas', value: 2},
    {nome: '3 semanas', value: 3}
  ];


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

  const renderPerfil = useCallback(async () => {
    const response: any = await dropDown("perfil");
    return response
  }, []);

  const renderEspecialidadeFuncao = useCallback(async (especialidade: string) => {
    const response: any = await dropDown('especialidade-funcao', `especialidade=${especialidade}` );
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
      especialidades: await renderEspecialidade(),
      intervalos: intervaloOption,
      diasFrequencia: weekOption,
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
      renderEspecialidadeFuncao
     }}>
      {children}
    </DropdownContext.Provider>
  );
};

export function useDropdown() {
  const context = useContext(DropdownContext);
  return context;
}
