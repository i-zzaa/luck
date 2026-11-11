// Compartilhado entre a lista de Pacientes e a tela do paciente.

export interface PacienteResumo {
  id: number | string;
  nome: string;
}

export const iniciais = (nome = '') => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return `${partes[0][0]}${ultima}`.toUpperCase();
};

// Busca sem diferenciar acento nem maiúscula ("joao" acha "João").
export const normalizar = (texto = '') =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
