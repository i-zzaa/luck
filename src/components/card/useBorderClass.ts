export function useBorderColorClass(type: string = 'DEFAULT'): string {
  const colors: Record<string, string> = {
    TO: 'rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out border-l-4 border-to',
    FONO: 'rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out border-l-4 border-fono',
    PSICO: 'rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out border-l-4 border-psico',
    PSICOPEDAG: 'rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out border-l-4 border-psicopedag',
    MOTRICIDADE: 'rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out border-l-4 border-motricidade',
    MUSICOTERAPIA: 'rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out border-l-4 border-musicoterapia',
    DEFAULT: 'rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out border-l-4 border-gray-200',
    FREE: 'border-l-4 border-l-green-400 rounded-lg cursor-not-allowed',
  };

  return colors[type.toUpperCase()] || colors.DEFAULT;
}
