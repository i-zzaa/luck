/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// A referência acima (vite-plugin-pwa/client) expõe os tipos via
// package.json "exports" condicional — o tsconfig deste projeto usa
// moduleResolution: "Node" (clássico), que não respeita esse campo, então
// `import ... from 'virtual:pwa-register'` em main.tsx não resolvia
// ("Cannot find module 'virtual:pwa-register'"), quebrando `tsc` (e por
// tabela `yarn build`, que roda `tsc && vite build`). Declarando aqui
// direto, sem depender de nenhum subpath da lib, garante que resolve
// independente do moduleResolution.
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisteredSW?: (
      swScriptUrl: string,
      registration: ServiceWorkerRegistration | undefined
    ) => void;
    onRegisterError?: (error: any) => void;
  }

  export function registerSW(
    options?: RegisterSWOptions
  ): (reloadPage?: boolean) => Promise<void>;
}
