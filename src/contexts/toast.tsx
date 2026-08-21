import { createContext, useState, useContext, useRef, useCallback, useMemo } from 'react';

const container =
  'absolute animate-bounce min-w-[24rem] top-2 right-0 block flex p-4 mb-4 text-sm rounded-lg items-center gap-2 z-[70] ';

export interface ToastContextData {
  renderToast: (e: ToastState) => void;
}

export interface ToastState {
  type: 'success' | 'failure' | 'warning' | 'info';
  message: string;
  title?: string;
  open: boolean;
}

interface Props {
  children: JSX.Element;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider = ({ children }: Props) => {
  const [isShow, setIsShow] = useState<string>('hidden');
  const [icon, setIcon] = useState<any>();
  const [color, setColor] = useState<string>('');

  const [alertInfo, setAlertInfo] = useState<ToastState>({
    type: 'info',
    title: '',
    message: '',
    open: false,
  });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderType = (type: any): void => {
    switch (type) {
      case 'success':
        setIcon(<i className="pi pi-check-circle" />);
        break;
      case 'failure':
        setIcon(<i className="pi pi-times-circle" />);
        break;
      case 'warning':
        setIcon(<i className="pi pi-exclamation-circle" />);
        break;
      case 'info':
        setIcon(<i className="pi pi-info-circle" />);
        break;
      default:
        setIcon(<i className="pi pi-undo" />);
        break;
    }
  };

  const renderColor = (type: any): void => {
    switch (type) {
      case 'success':
        setColor('z-[10000] text-white bg-green-400 rounded-lg  w-24 ');
        break;
      case 'failure':
        setColor('z-[10000] text-white bg-red-400 rounded-lg  w-24');
        break;
      case 'warning':
        setColor('z-[10000] text-white bg-yellow-400 rounded-lg  w-24');
        break;
      case 'info':
        setColor('z-[10000] text-white bg-gray-400 rounded-lg  w-24');
        break;
      default:
        setColor('z-[10000] text-white bg-gray-400 rounded-lg  w-24');
        break;
    }
  };

  // useCallback com deps fixas (só mexe em setters e num ref, ambos
  // estáveis) porque renderToast entra na lista de dependências de
  // useEffect/useCallback em telas por todo o app (ex.: useSessionForm).
  // Sem isso, essa função nascia com identidade nova a cada render do
  // ToastProvider — e como ele fica na raiz da árvore, qualquer toast
  // disparado em qualquer lugar recriava `renderToast`, o que reexecutava
  // os efeitos de busca de dados que dependem dela (parecendo "a tela
  // renderiza/busca os dados duas vezes").
  const renderToast = useCallback(
    ({ type, message, title, open }: ToastState) => {
      renderType(type);
      renderColor(type);

      setAlertInfo({
        type,
        message,
        title,
        open,
      });

      const _open = open ? 'block' : 'hidden';
      setIsShow(_open);

      // Sem isso, dois toasts em sequência rápida (ex: erro de login seguido
      // de outro alerta) tinham cada um seu próprio setTimeout de 3s — o do
      // primeiro toast podia disparar depois do segundo já estar visível e
      // escondê-lo antes da hora.
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setIsShow('hidden');
      }, 3000);
    },
    []
  );

  // value memoizado: como renderToast agora é estável, esse objeto só
  // muda de identidade quando renderToast realmente mudar (nunca, na
  // prática) — evita recriar o context value (e disparar re-render em
  // todo consumidor) a cada render do provider.
  const value = useMemo(() => ({ renderToast }), [renderToast]);

  return (
    <ToastContext.Provider value={value}>
      <>
        {children}
        <div className={`${container} ${isShow} ${color}`} role="alert">
          {icon}
          <span>
            <span className="font-medium">{'   ' + alertInfo.title}</span>
            {' ' + alertInfo.message}
          </span>
        </div>
      </>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  return context;
}
