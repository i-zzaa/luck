import { useCallback, useEffect, useState } from 'react';
import Login from '../foms/Login';
import { getList } from '../server';

import package_json from '../../package.json';
import Header from '../components/header';

export default function LoginPage() {
  const [version, setVersion] = useState('');

  const getVersion = useCallback(async () => {
    const { data } = await getList('/');
    setVersion(`versão frontend: ${package_json.version} - ${data}`);
  }, []);

  useEffect(() => {
    getVersion();
  }, [getVersion]);

  return (
    <>
      <Header heading="Prontuário" />
      <Login />
      <div className="text-xs absolute bottom-0 text-gray-300 left-0  w-full flex justify-center">
        <div className="">{version}</div>
      </div>
    </>
  );
}
