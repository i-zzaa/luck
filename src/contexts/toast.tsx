import { createContext, useState, useContext } from "react";

const container =
  "absolute animate-bounce min-w-[24rem] top-2 right-0 block flex p-4 mb-4 text-sm rounded-lg items-center gap-2 z-[70] ";

export interface ToastContextData {
  renderToast: (e: ToastState) => void;
}

export interface ToastState {
  type: "success" | "failure" | "warning" | "info";
  message: string;
  title?: string;
  open: boolean;
}

interface Props {
  children: JSX.Element;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider = ({ children }: Props) => {
  const [isShow, setIsShow] = useState<string>("hidden");
  const [icon, setIcon] = useState<any>();
  const [color, setColor] = useState<string>("");

  const [alertInfo, setAlertInfo] = useState<ToastState>({
    type: "info",
    title: "",
    message: "",
    open: false,
  });

  const renderType = (type: any): void => {
    switch (type) {
      case "success":
        setIcon(<i className="pi pi-check-circle"/>);
        break;
      case "failure":
        setIcon(<i className="pi pi-times-circle"/>);
        break;
      case "warning":
        setIcon(<i className="pi pi-exclamation-circle"/>);
        break;
      case "info":
        setIcon(<i className="pi pi-info-circle"/>);
        break;
      default:
        setIcon(<i className="pi pi-undo"/>);
        break;
    }
  };

  const renderColor = (type: any): void => {
    switch (type) {
      case "success":
        setColor(
          "text-white bg-green-400 rounded-lg  w-24 "
        );
        break;
      case "failure":
        setColor(
          "text-white bg-red-400 rounded-lg  w-24"
        );
        break;
      case "warning":
        setColor(
          "text-white bg-yellow-400 rounded-lg  w-24"
        );
        break;
      case "info":
        setColor(
          "text-white bg-gray-400 rounded-lg  w-24"
        );
        break;
      default:
        setColor(
          "text-white bg-gray-400 rounded-lg  w-24"
        );
        break;
    }
  };

  const renderToast = ({ type, message, title, open }: ToastState) => {
    renderType(type);
    renderColor(type);

    setAlertInfo({
      type,
      message,
      title,
      open,
    });

    const _open = open ? "block" : "hidden";
    setIsShow(_open);
    setTimeout(() => {
      setIsShow("hidden");
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ renderToast }}>
      <>
        {children}
        <div className={`${container} ${isShow} ${color}`} role="alert">
          {icon}
          <span>
            <span className="font-medium">{"   " + alertInfo.title}</span>
            {" " + alertInfo.message}
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
