import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../contexts/toast';
import { useForm } from 'react-hook-form';
import {
  Card,
  Modal,
  SearchAdd,
  List,
  Confirm,
  ButtonHeron,
  Input,
} from '../../components/index';
import { create, deleteItem, getList, search, update } from '../../server';
import { v4 as uuidv4 } from 'uuid';

import { Fields, atividadesFields } from '../../constants/formFields';
import Pagination from '../../components/Pagination';

interface Props {
  namelist: string;
  onClick: (e: any) => void;
  iconButtonFooter?: string;
  textButtonFooter?: string;
  screen: string;
}

export default function CrudSimples({
  namelist,
  onClick,
  iconButtonFooter,
  textButtonFooter,
  screen,
}: Props) {
  const [list, setList] = useState<any>([]);
  const [pagination, setPagination] = useState<any>({
    pageSize: 0,
    totalPage: 0,
  });
  const [item, setItem] = useState<any>({});
  const [open, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

  const [fields, setFields] =useState<any>([]);
  const { renderToast } = useToast();


  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    unregister,
    reset,
  } = useForm({
  });

  const renderList = useMemo(async (page: number = 1, pageSize: number= 10) => {
    setLoading(true);

    try {
      const response = await getList(`${namelist}?page=${page}&pageSize=${pageSize}`);
      setList(response.data);
      setPagination(response.pagination)
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
    if (open) {
      setOpen(false);
    }
  }, []);

  const handleClick = async (word: any) => {
    try {
      if (word.search === undefined || word.search === ""){
        renderList;  
        return;
      }
      setLoading(true);
      const response = await search(namelist, word.search);
      setValue('search', '')
      const lista = response.status === 200 ? response.data : [];
      setList(lista);
      setPagination({
        pageSize: 0,
        totalPage: 0,
      })

      setLoading(false);
    } catch (error) {
      setLoading(false);
      msgError(error);
    }
  };

  const onSubmit = async (userState: any) => {
    try {
      setLoading(true);

      let data;
      const formatValues = {
        ...userState,
      };

      Object.keys(userState).forEach((index) => {
        if (index.indexOf('Id') !== -1) {
          if (!userState[index] || typeof userState[index][0] === 'number') {
            delete formatValues[index];
            return;
          }

          if (Array.isArray(userState[index]) && userState[index].length) {
            formatValues[index] = formatValues[index].map(
              (item_: any) => item_.id
            );
          } else {
            formatValues[index] = userState[index].id;
          }
        }
      });

      delete formatValues.search;

      if (isEdit) {
        item.nome = formatValues.nome
        formatValues.id = item.id;
        data = await update(namelist, formatValues);
      } else {
        data = await create(namelist, formatValues);
      }

      reset();
      renderList;
      setIsEdit(false);
      setOpen(false);
      renderToast({
        type: 'success',
        title: '',
        message: 'Sucesso!',
        open: true,
      });
    } catch ({ message }: any) {
      renderToast({
        type: 'failure',
        title: '401',
        message: `${message}`,
        open: true,
      });
      setLoading(false);
      return;
    }
  };

  const onChangePage = () => renderList;

  const handleTrashItem = async () => {
    try {
      await deleteItem(`${namelist}/${item.id}`);

      renderList;
      setOpenConfirm(false);
      renderToast({
        type: 'success',
        title: ' Sucesso!! ',
        message: 'Atualizado com sucesso!',
        open: true,
      });
    } catch (message) {
      msgError(message);
    }
  };

  const msgError = ({ data }: any) => {
    renderToast({
      type: 'failure',
      title: '401',
      message: data?.message || 'Não foi possível realizar!',
      open: true,
    });
  };

  const handleAddClick =  (type: 'remove' | 'add', id :  string | undefined ) => {
    if (type === 'remove' && id) {
      const _fields: any = fields.filter((f: any) => f.id !== id);
      const elemento = {...item}
      delete elemento[id]
      delete elemento.atividades

      setItem(elemento);
      setFields(_fields);
      unregister(id, { keepDirtyValues: true });
    }else  {
      const _fields: any = [...fields];
      const new_atividadesFields = {...atividadesFields}
      const uuid = uuidv4();

      new_atividadesFields.id = `atividade${uuid}`

      _fields.map((f: any) => {
        f.buttonAdd = false
      })
      
      new_atividadesFields.buttonAdd = true
      _fields.push(new_atividadesFields)
      setFields(_fields);
    }
  }

  useEffect(() => {
    let namelistField = `${namelist}Fields`

    const _fields = [...Fields[namelistField]];

    const fieldsState: any = {};
    _fields.forEach((field: any) => (fieldsState[field.id] = ''));

    setFields(_fields);
  }, [Fields]);

  useEffect(() => {
    renderList
  }, [renderList]);

  return (
    <>
      <SearchAdd
        onClick={() => {
          // reset();

          if (namelist === 'programa') {
            const _fields = [...fields]
            const uuid = uuidv4();
            atividadesFields.id = `atividade${uuid}`
            _fields[1] = atividadesFields

            setFields(_fields);
          }

          setIsEdit(false);
          setOpen(true);
        }}
        onSubmit={handleSubmit(handleClick)}
        textButton="Cadastrar"
        iconButton="pi pi-plus"
        control={control}
        loading={loading}
        screen={screen}
      />

      <Card>
        <List
          loading={loading}
          screen={screen}
          type="simples"
          onClickTrash={(item_: any) => {
            item_.ativo = false;
            setItem(item_);
            setOpenConfirm(true);
          }}
          onClickEdit={(item_: any) => {
            const elemento = { ...item_ };
            let namelistField = `${namelist}Fields`
            const _fields = [...Fields[namelistField]];

            setValue('nome', item_.nome)

            elemento.atividades.map((atividade: any, index: number)=> {
              _fields.push({
                ...atividadesFields,
                id: `atividade${atividade.id}`,
                name: `atividade${atividade.id}`,
                buttonAdd: index === ( elemento.atividades.length - 1)
              })

              elemento[`atividade${atividade.id}`] =  atividade.nome
              setValue(`atividade${atividade.id}`, atividade.nome)
            })

            // _fields.push({
            //   ...atividadesFields,
            //   id: null,
            //   name: `atividade${atividade.id}`,
            //   buttonAdd: index === ( elemento.atividades.length - 1)
            // })

        
            setFields(_fields);
            setIsEdit(true);
            setItem(elemento);
            setOpen(true);
          }}
          onClick={(item_: any) => onClick(item_.id)}
          items={list}
          iconButtonFooter={iconButtonFooter}
          textButtonFooter={textButtonFooter}
          onClickLink={() => {}}
          onClickReturn={(item_: any) => {
            item_.ativo = true;
            setItem(item_);
            setIsEdit(true);
          }}
        />

       {pagination.totalPages > 1 && <Pagination totalPages={pagination.totalPages}  currentPage={pagination.currentPage} onChange={onChangePage}/>}

      </Card>

      <Modal
        title="Cadastro"
        open={open}
        width={'95vw'}
        onClose={() => {
          setOpen(false);
          reset();
        }}
      >
        {
          <div className="grid gap-6">
            <div className="grid sm:grid-cols-6 items-center sm:gap-2">
              {fields.map((field: any) => (
                <Input
                  key={field.id}
                  labelText={field.labelText}
                  id={field.id}
                  type={field.type}
                  validate={
                    !!field.validate
                      ? field.validate
                      : { required: 'Campo obrigatório!' }
                  }
                  errors={errors}
                  control={control}
                  hidden={field.hidden}
                  customCol={field.customCol}
                  onClick={(e: 'remove' | 'add') =>  namelist === 'programa' ? handleAddClick(e, field.id) : null}
                  buttonAdd={field?.buttonAdd}
                />
              ))}
            </div>

            <ButtonHeron
              text={isEdit ? 'Atualizar' : 'Cadastrar'}
              type={isEdit ? 'second' : 'primary'}
              size="full"
              onClick={handleSubmit(onSubmit)}
              loading={loading}
            />
          </div>
        }
      </Modal>

      <Confirm
        onAccept={handleTrashItem}
        onReject={() => setOpenConfirm(false)}
        onClose={() => setOpenConfirm(false)}
        title="Desativar"
        message="Deseja realmente excluir?"
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
      />
    </>
  );
}
