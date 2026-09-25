import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { loginFields } from '../constants/formFields';
import { useAuth } from '../contexts/auth';
import { getErrorInfo } from '../util/error';

const usernameField = loginFields.find((field: any) => field.id === 'username');
const passwordField = loginFields.find((field: any) => field.id === 'password');

interface FormProps {
  username: string;
  password: string;
}

// Mensagem do aviso no topo do formulário (no lugar do toast que sumia).
const mensagemDeErro = (error: any) => {
  const status = error?.response?.status;
  if (status === 401 || status === 400) return 'Login ou senha incorretos.';
  if (!error?.response) return 'Sem conexão com o servidor.';
  return getErrorInfo(error, 'Não foi possível entrar.').message;
};

const complementoDoErro = (error: any) =>
  error?.response ? 'Confira e tente de novo.' : 'Verifique a internet e tente de novo.';

// "Lembrar login" guardava usuário E senha em texto plano no
// sessionStorage — legível por qualquer script rodando na mesma origem.
// Continua lembrando só o usuário (não é dado sensível); a senha é
// digitada a cada login.
const guardarUsuario = (username: string) =>
  sessionStorage.setItem('rememberLogin', JSON.stringify({ username }));

export default function Login() {
  const [lembrar, setLembrar] = useState<boolean>(
    () => sessionStorage.getItem('rememberCheck') === 'true'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [erro, setErro] = useState<{ titulo: string; texto: string } | null>(null);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    register,
  } = useForm<FormProps>({ defaultValues: { username: '', password: '' } });
  const { Login } = useAuth();

  const onSubmit = async ({ username, password }: FormProps) => {
    setLoading(true);
    setErro(null);

    try {
      if (lembrar) guardarUsuario(username);
      await Login({ username, password });
    } catch (error) {
      setErro({ titulo: mensagemDeErro(error), texto: complementoDoErro(error) });
      // Senha errada: limpa só a senha para digitar de novo.
      setValue('password', '');
    } finally {
      setLoading(false);
    }
  };

  const alternarLembrar = (checked: boolean) => {
    setLembrar(checked);
    sessionStorage.setItem('rememberCheck', checked ? 'true' : 'false');
    if (checked) {
      guardarUsuario(getValues('username') ?? '');
    } else {
      sessionStorage.removeItem('rememberLogin');
    }
  };

  useEffect(() => {
    const rememberLogin = sessionStorage.getItem('rememberLogin');

    if (rememberLogin) {
      const { username } = JSON.parse(rememberLogin);
      setValue('username', username);
    }
  }, [setValue]);

  // Tirar o erro do aviso assim que a pessoa volta a digitar.
  const limparErro = () => erro && setErro(null);

  const campoClasse = (comErro: boolean) =>
    clsx(
      'h-[52px] flex items-center gap-2.5 rounded-[14px] bg-white pl-3.5 transition-colors',
      'focus-within:ring-2 focus-within:ring-[#662977]/25',
      comErro
        ? 'border-[1.5px] border-[#b91c1c]'
        : 'border border-[#d4d4d8] focus-within:border-[#662977]'
    );

  const usernameInput = register('username', {
    required: 'Informe o login.',
    pattern: {
      value: usernameField?.validate?.pattern?.value ?? /^([a-z]{3,})+\.([a-z]{3,})$/i,
      message: 'Use o formato nome.sobrenome.',
    },
  });
  const passwordInput = register('password', { required: 'Informe a senha.' });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {erro && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-[14px] leading-[1.4] text-[#991b1b]"
        >
          <i className="pi pi-exclamation-circle mt-0.5" style={{ fontSize: 16 }} />
          <span>
            <strong className="font-bold">{erro.titulo}</strong> {erro.texto}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-[14px] font-semibold text-[#3f3f46]">
          {usernameField?.labelText || 'Login'}
        </label>
        <div
          data-testid="username-field"
          className={campoClasse(!!errors.username || !!erro)}
        >
          <i className="pi pi-user text-primary" style={{ fontSize: 16 }} />
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nome.sobrenome"
            aria-invalid={!!errors.username}
            className="auth-input flex-1 min-w-0 h-12 pr-3.5 text-[16px] text-[#27272a] outline-none bg-transparent placeholder:text-[#a1a1aa]"
            {...usernameInput}
            onChange={(e) => {
              limparErro();
              usernameInput.onChange(e);
            }}
          />
        </div>
        {errors.username && (
          <p className="m-0 text-[13px] text-[#b91c1c]">{errors.username.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[14px] font-semibold text-[#3f3f46]">
          {passwordField?.labelText || 'Senha'}
        </label>
        <div
          data-testid="password-field"
          className={campoClasse(!!errors.password || !!erro)}
        >
          <i className="pi pi-lock text-primary" style={{ fontSize: 16 }} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Sua senha"
            aria-invalid={!!errors.password}
            className="auth-input flex-1 min-w-0 h-12 text-[16px] text-[#27272a] outline-none bg-transparent placeholder:text-[#a1a1aa]"
            {...passwordInput}
            onChange={(e) => {
              limparErro();
              passwordInput.onChange(e);
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="w-11 h-11 mr-1 shrink-0 flex items-center justify-center rounded-xl text-gray-800 hover:text-primary"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <i className={showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'} style={{ fontSize: 18 }} />
          </button>
        </div>
        {errors.password && (
          <p className="m-0 text-[13px] text-[#b91c1c]">{errors.password.message}</p>
        )}
      </div>

      <label className="min-h-[44px] flex items-center gap-3 text-[15px] text-[#3f3f46] cursor-pointer select-none">
        <input
          id="checkbox-login"
          type="checkbox"
          checked={lembrar}
          onChange={(e) => alternarLembrar(e.target.checked)}
          className="w-[22px] h-[22px] m-0 accent-[#662977] cursor-pointer"
        />
        Lembrar meu login neste celular
      </label>

      <button
        type="submit"
        disabled={loading}
        className="h-[52px] flex items-center justify-center gap-2.5 rounded-[14px] bg-primary text-white text-[16px] font-bold disabled:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#662977]"
      >
        {loading && <i className="pi pi-spin pi-spinner" style={{ fontSize: 16 }} />}
        {loading ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="m-0 flex items-start justify-center gap-2 text-center text-[13px] leading-[1.45] text-gray-800">
        <i className="pi pi-key text-primary mt-0.5" style={{ fontSize: 14 }} />
        <span>Esqueceu a senha? Peça à recepção para gerar uma nova.</span>
      </p>
    </form>
  );
}
