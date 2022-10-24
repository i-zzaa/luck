// import Modal from "../components/Modal";


import { getList, search, update } from "../server";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "../contexts/toast";
import { useForm } from "react-hook-form";
import { Card, Modal, SearchAdd, List, Confirm } from "../components/index";
import UsuarioForm from "../foms/UsuarioForm";

interface UserProps {
  id: string;
  nome: string;
  login: string;
  ativo: boolean;
  perfil: {
    id: string;
    nome: string;
  };
}

export default function User() {
  const [users, setUsers] = useState<UserProps[] | null>([]);
  const [user, setUser] = useState<UserProps>();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

  const { renderToast } = useToast();
  const {  handleSubmit,  control  } = useForm<any>();

  const renderUser = useCallback(async () => {
    const response: UserProps[] = await getList("usuarios");
    setUsers(response);
    if (open) {
      setOpen(false)
    }
  }, []);

  const handleClick = async (word: any) => {
    if (word === undefined) return;
    setLoading(true)
    const response = await search("usuarios", word.search);
    const lista: UserProps[] = response.status === 200 ? response.data : [];
    setUsers(lista);
    setLoading(false)
  };

  const handleResetSenha = async (userId: number) => {
    try {
      const { message }: any = await getList(`/usuarios/reset-senha/${userId}`);
      renderToast({
        type: "success",
        title: "",
        message,
        open: true,
      });
    } catch ({ message }: any) {
      renderToast({
        type: "failure",
        title: "401",
        message: `${message}`,
        open: true,
      });
      return;
    }
  };

  const handleDisabledUser = async () => {
    try {
      await update("usuarios", {
        ativo: user?.ativo,
        id: user?.id,
        login: user?.login,
        nome: user?.nome,
        perfilId: user?.perfil.id,
      });

      renderUser();
      setOpenConfirm(false);
      renderToast({
        type: "success",
        title: " Sucesso!! ",
        message: "Usuário desativado!",
        open: true,
      });
    } catch ({ response }) {
      msgError(response);
    }
  };

  const msgError = ({ data }: any) => {
    renderToast({
      type: "failure",
      title: "401",
      message: data?.message || "Usuário não encontrado!",
      open: true,
    });
  };

  useEffect(() => {
    renderUser();
  }, [renderUser]);

  return (
    <>
      <SearchAdd 
        onClick={() => {
          setUser(undefined)
          setOpen(true)
        }}
        onSubmit={handleSubmit(handleClick)}
        textButton="Cadastrar usuário"
        iconButton="pi pi-user-plus"
        control={control}
        loading={loading}
      />

      <Card>
        <List  
          type="simples"
          onClickTrash={(user_: any) => {
            setUser(user_);
            setOpenConfirm(true);
          }}
          onClickEdit={(user_: any) => {
            const user__ = {...user_}
            user__.perfilId = user_.perfil
            delete user__.perfil

            setUser(user__);
            setOpen(true);
          }}
          onClick={(user_: any) => handleResetSenha(user_.id)}
          items={users}
          iconButton="pi pi-sync"
          textButton="Reset de senha"
          onClickLink={()=>{}} 
          onClickReturn={()=>{}} 
        />
      </Card>

      <Modal
        title="Cadastro de Usuário"
        open={open}
        onClose={() => setOpen(false)}
      >
        <UsuarioForm onClose={() => {
          renderUser()
          setOpen(false)
        }} value={user}/>
      </Modal>

      <Confirm
        onAccept={handleDisabledUser}
        onReject={() => setOpenConfirm(false)}
        onClose={() => setOpenConfirm(false)}
        title="Desativar"
        message="Deseja realmente desativar o usuário?"
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
      />	
    </>
  );
}
