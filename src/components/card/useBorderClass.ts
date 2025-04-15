const borderClasses: Record<string, string> = {
  TO: 'border-to',
  FONO: 'border-fono',
  PSICO: 'border-psico',
  PSICOPEDAG: 'border-black',
  MOTRICIDADE: 'border-motricidade',
  MUSICOTERAPIA: 'border-musicoterapia',
  DEFAULT: 'border-white',
};

export function useBorderClass(type: string = 'DEFAULT'): string {
  return borderClasses[type.toUpperCase()] || borderClasses.DEFAULT;
}
