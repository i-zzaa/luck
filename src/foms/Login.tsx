import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ButtonHeron, Input } from '../components';
import { loginFields } from '../constants/formFields';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/toast';

interface FormProps {
  username: string;
  password: string;
}

export default function Login() {
  const defaultValues: FormProps = {
    username: 'cristiane.graff',
    password: '12345678',
  };

  const [checkState, setCheck] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { renderToast } = useToast();
  const { Login } = useAuth();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormProps>({ defaultValues });

  const onSubmit = async ({ username, password }: FormProps) => {
    setLoading(true);
    try {
      await Login({ username, password });
    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha na conexão',
        open: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRememberPassword = (checked: boolean) => {
    setCheck(checked);
    localStorage.setItem('rememberCheck', JSON.stringify(checked));

    if (checked) {
      localStorage.setItem('rememberLogin', JSON.stringify({
        username: watch('username'),
        password: watch('password'),
      }));
    } else {
      localStorage.removeItem('rememberLogin');
    }
  };

  useEffect(() => {
    const rememberLogin = localStorage.getItem('rememberLogin');
    if (rememberLogin) {
      const { username, password } = JSON.parse(rememberLogin);
      setCheck(true);
      setValue('username', username);
      setValue('password', password);
    }
  }, []);

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        {loginFields.map((field) => (
          <Input
            key={field.id}
            id={field.id}
            type={field.type}
            labelText={field.labelText}
            control={control}
            validate={field.validate}
            errors={errors}
          />
        ))}
      </div>

      <Input
        id="checkbox-login"
        labelText="Lembrar login"
        type="checkbox"
        control={control}
        onChange={handleRememberPassword}
        value={checkState}
      />

      <ButtonHeron
        text="Entrar"
        type="primary"
        size="full"
        onClick={handleSubmit(onSubmit)}
        loading={loading}
      />
    </form>
  );
}
