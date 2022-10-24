export const colorsData: any = {
  TO: "#ef6c00",
  FONO: "#f6bf26",
  PSICO: "#8e24aa",
  PSICOPEDAG: "#000000",
};

export const colorsTextData: any = {
  TO: "#ffffff",
  FONO: "#ffffff",
  PSICO: "#ffffff",
  PSICOPEDAG: "#ffffff",
};

export const corEspecialidade = (type: string) => {
  let tipo = "";
  switch (type.toUpperCase()) {
    case "TO":
      tipo = "bg-to";
      break;
    case "FONO":
      tipo = "bg-fono";
      break;
    case "PSICO":
      tipo = "bg-psico";
      break;
    case "PSICOPEDAG":
      tipo = "bg-psico-pdeg";
      break;
    default:
      tipo = "p-multiselect-token";
      break;
  }

  return tipo;
};

export const firtUpperCase = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const setColorChips = () => {
  setTimeout(() => {
    const chips: any = document.querySelectorAll(".p-multiselect-token") || [];
    chips.forEach((chip: any) => {
      const color = colorsData[chip.textContent.toUpperCase()];
      const text = colorsTextData[chip.textContent.toUpperCase()];

      chip.style.background = color;
      chip.style.color = text;
    });
  }, 0);
};
