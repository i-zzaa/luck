import { useCallback, useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getList } from '../server';
import { ButtonHeron, Card, TextSubtext, Title } from '../components/index';
import { NotFound } from '../components/notFound';
import { permissionAuth } from '../contexts/permission';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import * as XLSX from 'xlsx';
import moment from 'moment';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  // Title,
  Tooltip,
  Legend,
  ArcElement
);

export const options = {
  responsive: true,
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
      display: false,
    },
    title: {
      display: false,
      text: 'Prioridades',
    },
  },
};

export const optionsDounuts = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      display: true,
      align: 'start',
    },
    title: {
      display: false,
      text: 'Prioridades',
    },
  },
};

export const modelChart = {
  labels: [],
  datasets: [
    {
      label: '',
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
    },
  ],
};

export default function Dashboard() {
  const [chatTipoSessao, setChatTipoSessao] = useState<any>(modelChart);
  const [chatEspecialidades, setChatEspecialidades] = useState<any>(modelChart);
  const [chatStatus, setChatStatus] = useState<any>(modelChart);
  const [wait, setChatWait] = useState<string>('');
  const [returnTrend, setReturnTrend] = useState<string>('');
  const [pacientes, setPacientes] = useState([]);

  const { hasPermition } = permissionAuth();

  const getPatientsActived = useCallback(async () => {
    const data = await getList('/pacientes/dashboard');
    setPacientes(data);
  }, []);

  const setTipoSessao = useCallback(async () => {
    const data = await getList('/vagas/dashboard/tipoSessoes');
    setChatTipoSessao(data);
  }, []);

  const setsEspecialidades = useCallback(async () => {
    const data = await getList('/vagas/dashboard/especialidades');
    setChatEspecialidades(data);
  }, []);

  const setStatus = useCallback(async () => {
    const data = await getList('/vagas/dashboard/status');
    setChatStatus(data);
  }, []);

  const setWait = useCallback(async () => {
    const data = await getList('/vagas/wait');
    setChatWait(data);
  }, []);

  const setInfoReturns = useCallback(async () => {
    const { data } = await getList('/vagas/return');
    setReturnTrend(data);
  }, []);

  const renderInfo = () => {
    return (
      <div className="grid sm:gap-2 md:flex md:h-48 sm:grid-cols-3 overflow-hidden">
        {hasPermition('DASHBOARD_TEMPO_FILA') ? (
          <div className="w-full">
            <Card>
              <TextSubtext
                text="Tempo de espera: "
                subtext={wait}
                color="gray-dark"
                size="md"
                icon="pi pi-hourglass"
                display="grid"
              />
            </Card>
          </div>
        ) : null}
        {hasPermition('DASHBOARD_RETORNO_FILA') ? (
          <div className="w-full">
            <Card>
              <TextSubtext
                text="Retornos para fila:  "
                subtext={returnTrend}
                color="gray-dark"
                size="md"
                icon="pi pi-sync"
                display="grid"
              />
            </Card>
          </div>
        ) : null}
        {chatStatus.length && hasPermition('DASHBOARD_GRAFICO_FILA') ? (
          <div className="">
            <Card>
              <div className="md:h-12">
                <Bar
                  options={options}
                  data={chatStatus}
                  height={98}
                  style={{ marginTop: '-1rem' }}
                />
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    );
  };

  const renderChart = (type: string, data: any) => {
    return (
      <Card>
        <div className="md:grid gap-4 items-center mx-auto">
          <Title size="md">{type}</Title>

          {data && data.datasets[0].data.length ? (
            <div className="grid justify-center">
              <Doughnut data={data} />
            </div>
          ) : (
            <NotFound />
          )}
        </div>
      </Card>
    );
  };

  const gerarExcel = () => {
    // Cria um novo objeto Workbook
    const workbook = XLSX.utils.book_new();

    // Cria uma nova planilha
    const planilha = XLSX.utils.json_to_sheet(pacientes);

    // Adiciona a planilha ao Workbook
    XLSX.utils.book_append_sheet(workbook, planilha, 'Pacientes');

    const page = `Pacientes_${moment().format('DD/MM')}.xlsx`;

    // Salva o arquivo
    XLSX.writeFile(workbook, page);
  };

  useEffect(() => {
    setStatus();
    setWait();
    setTipoSessao();
    setInfoReturns();
    setsEspecialidades();
    getPatientsActived();
  }, []);

  return (
    <div className="grid grid-cols-2">
      <div>
        <div className="flex gap-4 m-4 items-center">
          <div className="sm:text-end">
            <ButtonHeron
              text="Download"
              icon="pi pi-download"
              type="primary"
              size="sm"
              onClick={gerarExcel}
            />
          </div>
          <span> Pacientes ativos</span>
        </div>

        <DataTable
          value={pacientes}
          showGridlines
          tableStyle={{ minWidth: '20rem' }}
          stripedRows
          scrollHeight="400px"
          virtualScrollerOptions={{ itemSize: 46 }}
        >
          <Column field="nome" header="Paciente"></Column>
          <Column field="telefone" header="Telefone"></Column>
          <Column field="statusPaciente.nome" header="Status"></Column>
        </DataTable>
      </div>

      <div className="">
        {renderInfo()}
        {hasPermition('DASHBOARD_GRAFICO_FILA') ? (
          <div className="grid md:grid-cols-2 gap-4 justify-center sm:justify-beteween w-full">
            {renderChart('Especialidades por Demanda', chatEspecialidades)}
            {renderChart('Tipo de sessão por Demanda', chatTipoSessao)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
