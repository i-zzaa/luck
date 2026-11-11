import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { ButtonHeron } from '../button';
import { Confirm } from '../confirm';
import { usePageTitle } from './usePageTitle';
import { useIsTabRoute } from './useIsTabRoute';
import { BottomTabBar } from './BottomTabBar';
import { CONSTANTES_ROUTERS } from '../../routes/OtherRoutes';

export const Nav = () => {
  const navigate = useNavigate();
  const { Logout } = useContext(AuthContext);
  const pageTitle = usePageTitle();
  const isTabRoute = useIsTabRoute();
  const { pathname } = useLocation();
  // No Início a saudação já diz onde a pessoa está — o título repetia.
  const isInicio = pathname === '/' || pathname === `/${CONSTANTES_ROUTERS.HOME}`;
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  return (
    <>
      <nav className="fixed h-12 w-full bg-primary mb-8 z-20">
        <aside className="fixed w-full right-2 shadow-3xl h-12 z-20 bg-primary duration-700 ease-in-out">
          <div className="flex justify-between items-center">
            <div className="sm:text-end ml-2">
              {/* Nas 5 telas principais (isTabRoute) não tem "voltar":
                  são a raiz de cada seção, navegável só pela tab bar do
                  rodapé — mostrar a seta ali sugeria uma hierarquia que
                  não existe. Só aparece nas telas de detalhe/edição
                  (Sessão, DTT, Metas, Cadastro de PEI). */}
              {!isTabRoute && (
                <ButtonHeron
                  text=""
                  icon="pi pi-arrow-left"
                  type="primary"
                  color="white"
                  size="icon"
                  onClick={() => navigate(-1)}
                />
              )}
            </div>
            <span className="flex-1 text-center font-inter font-semibold text-primary-text truncate px-2">
              {!isInicio && pageTitle}
            </span>
            {/* Avatar = acesso ao logout (a sidebar antiga não existe
                mais, era a única outra coisa que ela oferecia) — mas
                deslogar direto no clique era perigoso demais pra um
                toque sem querer, então pede confirmação antes. */}
            {/* 36px dentro da barra de 48px (antes 48px com margem, e
                saía pela borda de baixo). */}
            <button
              type="button"
              className="w-11 h-12 flex items-center justify-center cursor-pointer"
              onClick={() => setConfirmLogoutOpen(true)}
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              <span className="bg-logo-mini bg-no-repeat bg-cover rounded-full h-9 w-9 ring-1 ring-white/40" />
            </button>
          </div>
        </aside>
      </nav>
      {isTabRoute && <BottomTabBar />}
      <Confirm
        open={confirmLogoutOpen}
        title="Sair"
        message="Deseja realmente sair da sua conta?"
        icon="pi pi-sign-out"
        acceptLabel="Sair"
        rejectLabel="Cancelar"
        onAccept={Logout}
        onReject={() => setConfirmLogoutOpen(false)}
        onClose={() => setConfirmLogoutOpen(false)}
      />
    </>
  );
};
