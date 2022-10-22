import { useCallback, useEffect, useState } from "react";
import Header from "../foms/Header";
import Login from "../foms/Login";
import { getList } from "../server";

export default function LoginPage() {
  const [version, setVersion] = useState('')

  const getVersion = useCallback(async()=>{
    const data = await getList('/')
    setVersion(data)
  }, [])

  useEffect(()=> {
    getVersion()
  }, [getVersion])

  return (
    <>
      <Header
        heading="Fila de Espera"
        paragraph="Não tem cadastro? "
        linkName="Cadastrar"
        linkUrl="/signup"
      />
      <Login />
      <div className="absolute bottom-0 text-gray-300 left-0  w-full flex justify-center">
        <div className="">{version}</div>
      </div>
    </>
  );
}
