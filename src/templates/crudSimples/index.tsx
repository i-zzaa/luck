
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useToast } from "../../contexts/toast";
import { useForm } from "react-hook-form";
import { Card, Modal, SearchAdd, List, Confirm, ButtonHeron, Input } from "../../components/index";
import { create, getList, search, update } from "../../server";

import { Fields } from "../../constants/formFields";
import { useDropdown } from "../../contexts/dropDown";

interface Props {
  namelist: string;
  onClick: (e:any) => void;
  iconButtonFooter?: string;
  textButtonFooter?: string;
}

export default function CrudSimples({
  namelist,
  onClick,
  iconButtonFooter,
  textButtonFooter,
}:Props) {
  const [list, setList] = useState<any>([]);
  const [item, setItem] = useState<any>({});
  const [open, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

  const [fields, setFields] = useState([])
  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownCrud, renderEspecialidadeFuncao } = useDropdown()

  const { renderToast } = useToast();

  const {  
    handleSubmit,  
    control,  
    formState: { errors }, 
    setValue,
    unregister,
    reset,
  } = useForm<any>();

  const renderList = useCallback(async () => {
    const response = await getList(namelist);
    setList(response);
    if (open) {
      setOpen(false)
    }
  }, []);

  const handleClick = async (word: any) => {
    try {
      if (word.search === undefined) return;
      setLoading(true)
      const response = await search(namelist, word.search);
      const lista = response.status === 200 ? response.data : [];
      setList(lista);
      setLoading(false)
    } catch (error) {
      setLoading(false)
      msgError(error)
    }
  };

  const onSubmit = async (userState: any) => {
    try {
      setLoading(true)

      let data;
      const formatValues = {
        ...userState,
      };

      Object.keys(userState).forEach((index) => {
        if (index.indexOf('Id') !== -1) {
          if(!userState[index]) {
            delete formatValues[index];
          } else {
            formatValues[index] = userState[index].id
          }
        }
      })

      delete formatValues.search

      if (isEdit) {
        formatValues.id = item.id;
        data = await update(namelist, formatValues);
      } else {
        data = await create(namelist, formatValues);
      }

      reset()
      renderList()
      setIsEdit(false)
      setOpen(false)
      renderToast({
        type: "success",
        title: "",
        message: data.data.message,
        open: true,
      });
      setLoading(false)
    } catch ({ message }: any) {
      renderToast({
        type: "failure",
        title: "401",
        message: `${message}`,
        open: true,
      });
      setLoading(false)
      return;
    }
  };

  const handleTrashItem = async () => {
    try {
      await update(namelist, item);

      renderList();
      setOpenConfirm(false);
      renderToast({
        type: "success",
        title: " Sucesso!! ",
        message: "Atualizado com sucesso!",
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
      message: data?.message || "Não foi possível realizar!",
      open: true,
    });
  };

  const actionFieldId = async(value: any, fieldId: string) => {
    switch (fieldId) {
      case 'perfilId':
        setHidden(value.nome !== 'Terapeuta')
        if (value.nome !== 'Terapeuta') {
          unregister(['especialidadeId', 'funcaoId'], {keepDirtyValues: true})
        }
       
        break;
      case 'especialidadeId':
        const especialidadeFuncao = await renderEspecialidadeFuncao(value.nome)
        setDropDownList({ ...dropDownList, funcoes: especialidadeFuncao })
        break;
    
      default:
        break;
    }
  }

  const handleChange=(value: any, fieldId: string) => {
    switch (namelist) {
      case 'usuarios':
        actionFieldId(value, fieldId)
        break;
    
      default:
        break;
    }
  }

  const renderAgendar =useCallback(async()=> {
    const list = await renderDropdownCrud()
    setDropDownList(list)
  },[])


  useLayoutEffect(() => {
    renderAgendar()
  }, [renderAgendar]);


  useEffect(() => {
    const index: string = `${namelist}Fields`
    const _fields = Fields[index]
    const fieldsState: any = {};
    _fields.forEach((field: any) => (fieldsState[field.id] = ""));
    setFields(_fields)
  }, []);

  useEffect(() => {
    renderList()
  }, [renderList]);

  useEffect(() => {
     unregister(['especialidadeId', 'funcaoId'], {keepDirtyValues: true})
  }, [fields]);

  return (
    <>
      <SearchAdd 
        onClick={() => {
          reset()
          setIsEdit(false)
          setOpen(true)
        }}
        onSubmit={handleSubmit(handleClick)}
        textButton="Cadastrar usuário"
        iconButton="pi pi-plus"
        control={control}
        loading={loading}
      />

      <Card>
        <List  
          type="simples"
          onClickTrash={(item_: any) => {
            item_.ativo = true
            setItem(item_);
            setOpenConfirm(true);
          }}
          onClickEdit={(item_: any) => {
            Object.keys(item_).forEach((index: any) => {
              if (typeof item_[index] === 'object') {
                item_[`${index}Id`] = item_[index]
                index = `${index}Id`
              }
              setValue(index, item_[index])
            })
          
            setIsEdit(true)
            setItem(item_);
            setOpen(true);
          }}
          onClick={(item_: any) => onClick(item_.id)}
          items={list}
          iconButtonFooter={iconButtonFooter}
          textButtonFooter={textButtonFooter}
          onClickLink={()=>{}} 
          onClickReturn={(item_: any)=>{
            item_.ativo = true
            setIsEdit(true)
            onSubmit(item_)
          }} 
        />
      </Card>

      <Modal
        title="Cadastro"
        open={open}
        onClose={() => {
          setOpen(false)
          reset()
        }}
      >
      <form onSubmit={handleSubmit(onSubmit)} action="#">
          <div>
            {fields.map((field: any) => (
              <Input
                key={field.id}
                labelText={field.labelText}
                id={field.id}
                type={field.type}
                options={field.type === "select" && dropDownList[field.labelFor]}
                validate={!!field.validate ? field.validate : !hidden && {required: "Campo obrigatório!"} }
                errors={errors}
                control={control}
                onChange={(values: any)=> handleChange(values, field.id)}
                hidden={namelist === 'usuarios' && field.hidden && hidden }
              />
            ))}
          </div>

          <ButtonHeron
            text={isEdit ? "Atualizar" : "Cadastrar"}
            type={isEdit ? "second" : "primary"}
            size="full"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
          /> 
        </form>
      </Modal>

      <Confirm
        onAccept={handleTrashItem}
        onReject={() => setOpenConfirm(false)}
        onClose={() => setOpenConfirm(false)}
        title="Desativar"
        message="Deseja realmente desativar?"
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
      />	
    </>
  );
}
