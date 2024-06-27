import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter } from "../templates/filter";
import { useDropdown } from "../contexts/dropDown";
import { PEIFields } from "../constants/formFields";
import { dropDown, filter } from "../server";
import { useToast } from "../contexts/toast";
import { Card } from "../components/card";
import { NotFound } from "../components/notFound";
import { LoadingHeron } from "../components/loading";
import { useNavigate } from "react-router-dom";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { Accordion, AccordionTab } from "primereact/accordion";

const fieldsConst = PEIFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

const PEI = () => {
  const { renderToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);
  const [list, setList] = useState({}) as any;

  const renderContent = () => {
    if (!loading) {
      return list.length ? (
        <Accordion>
          {
            list.map((item: any, key: string) => {
              return (
                <div key={key}>
                  <div className="font-inter m-2 text-gray-400">
                  </div>
                  {
                    <AccordionTab header={item} tabIndex={0}>
      
                    </AccordionTab>
                  }
                </div>
              )
            }) 
          }
        </Accordion>
      ) : (
       <Card> <NotFound /> </Card>
      );
    } else {
      return <LoadingHeron />;
    }
  }

  const onSubmitFilter = async (formvalue: any) => {
    setLoading(true)
    try {
      const response: any = await filter('pei', formvalue);

      setList(response);
    } catch (error) {
      setList([]);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Período não encontrado!',
        open: true,
      });
    }
    setLoading(false)
  }

  const renderFilter = () => {
    return (
      <Filter
        id="form-filter-pei"
        legend="Filtro"
        nameButton="Cadastrar"
        fields={fieldsConst}
        dropdown={dropDownList}
        onSubmit={(value)=>  onSubmitFilter(value)}
        onReset={()=> setList([])}
        screen="PEI"
        loading={loading}
        onInclude={() => navigate(`/${CONSTANTES_ROUTERS.PEICADASTRO}`)}
      />
    )
  }
  
  const renderPrograma = useCallback(async () => {
    const [paciente, programa]: any = await Promise.all([
      dropDown('paciente'),
      dropDown('programa'),
    ])

    setDropDownList({
      paciente,
      programa,
    })
  }, []);

  useEffect(() => {
    renderPrograma();
  }, []);
  
  return (
    <div>
      { renderFilter() }
      { renderContent() }
    </div>
  );
};

export default PEI;
