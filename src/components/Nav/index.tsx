import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth';
import { ButtonHeron } from '../button';
import { Confirm } from '../confirm';
import { usePageTitle } from './usePageTitle';
import { useIsTabRoute } from './useIsTabRoute';
import { BottomTabBar } from './BottomTabBar';

export const Nav = () => {
  const navigate = useNavigate();
  const { Logout } = useContext(AuthContext);
  const pageTitle = usePageTitle();
  const isTabRoute = useIsTabRoute();
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
              {pageTitle}
            </span>
            {/* Avatar = acesso ao logout (a sidebar antiga não existe
                mais, era a única outra coisa que ela oferecia) — mas
                deslogar direto no clique era perigoso demais pra um
                toque sem querer, então pede confirmação antes. */}
            <div
              className="w-12 h-12 mt-[1vh] rounded-3xl bg-primary cursor-pointer"
              onClick={() => setConfirmLogoutOpen(true)}
              title="Sair"
            >
              <div className="bg-logo-mini bg-no-repeat bg-cover rounded-full h-12 w-12 duration-700" />
            </div>
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
