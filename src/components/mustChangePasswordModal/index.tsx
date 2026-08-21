import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';

import { ButtonHeron } from '../button';
import { Input } from '../input';
import { useAuth } from '../../contexts/auth';
import { useToast } from '../../contexts/toast';
import { update } from '../../server';
import { buildErrorToast } from '../../util/error';

interface FormProps {
  senha: string;
  confirmarSenha: string;
}

const defaultValues: FormProps = { senha: '', confirmarSenha: '' };

// Bloqueia o uso da aplicação até o usuário definir uma nova senha quando o
// backend marca mustChangePassword (no login, ou via 403 no meio de uma
// sessão já aberta — ver util/mustChangePasswordBus). Mesmo backend do
// heron-list-web: PUT /usuarios/reset-senha sempre troca a senha do
// usuário do token, só com { senha } no corpo — sem id/login.
export const MustChangePasswordModal = () => {
  const { mustChangePassword, clearMustChangePassword } = useAuth();
  const { renderToast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);

  const {
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    control,
  } = useForm<FormProps>({ defaultValues });

  const onSubmit = async ({ senha }: FormProps) => {
    setLoading(true);

    try {
      await update('/usuarios/reset-senha', { senha });

      renderToast({
        type: 'success',
        title: '',
        message: 'Senha alterada com sucesso!',
        open: true,
      });

      reset(defaultValues);
      clearMustChangePassword();
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível alterar a senha.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header="Troca de senha obrigatória"
      visible={mustChangePassword}
      modal
      closable={false}
      closeOnEscape={false}
      onHide={() => {}}
      style={{ width: '28rem' }}
      breakpoints={{ '960px': '90vw' }}
    >
      <p className="text-sm text-gray-800 mb-4">
        Sua senha foi redefinida. Por segurança, defina uma nova senha para
        continuar.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Input
          labelText="Nova senha"
          id="senha"
          type="password"
          customCol="w-full"
          errors={errors}
          control={control}
          validate={{ required: 'Campo obrigatório!' }}
        />

        <Input
          labelText="Confirmar nova senha"
          id="confirmarSenha"
          type="password"
          customCol="w-full"
          errors={errors}
          control={control}
          validate={{
            required: 'Campo obrigatório!',
            validate: (value: string) =>
              value === watch('senha') || 'As senhas não coincidem',
          }}
        />

        <ButtonHeron text="Alterar senha" type="primary" size="full" loading={loading} />
      </form>
    </Dialog>
  );
};
