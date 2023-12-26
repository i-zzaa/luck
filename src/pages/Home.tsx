import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ButtonHeron, Card, Input, TextSubtext } from '../components/index';
import { useToast } from '../contexts/toast';
import { update } from '../server';

export default function Home() {
  const [user, setUser] = useState() as any;
  const [disabled, setDisabled] = useState(false);
  const { renderToast } = useToast();

  const {
    reset,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm();

  const renderUser = () => {
    const auth: any = sessionStorage.getItem('auth');
    const parse = JSON.parse(auth);
    setUser(parse);
  };

  const handleResetSenha = async (senha: any) => {
    setDisabled(true);
    try {
      senha.id = user.login;
      const { data }: any = await update(`/usuarios/reset-senha`, senha);
      setDisabled(false);
      reset();
      renderToast({
        type: 'success',
        title: '',
        message: data.message,
        open: true,
      });
    } catch ({ message }: any) {
      renderToast({
        type: 'failure',
        title: '401',
        message: `${message}`,
        open: true,
      });
      reset();
      return;
    }
  };

  useEffect(() => {
    renderUser();
  }, []);

  return (
    <>
      <Card customCss='rounded-lg border border-gray-200 p-4'>
        <div className="grid sm:grid-cols-2">
          <TextSubtext
            text={user?.nome}
            subtext={user?.login}
            color="violet"
            size="md"
            icon="pi pi-id-card"
            display="grid"
          />
          <div className="flex gap-2  my-6 sm:my-0  items-center">
            <Input
              labelText="Alterar senha"
              id="senha"
              type="password"
              customCol=" w-full"
              errors={errors}
              validate={{ required: true }}
              control={control}
            />

            <div className=" mt-4 ">
              <ButtonHeron
                text="Alterar senha"
                type="second"
                icon="pi pi-sync"
                size="icon"
                onClick={handleSubmit(handleResetSenha)}
              />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
