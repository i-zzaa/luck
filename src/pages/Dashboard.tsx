import { useCallback, useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getList } from "../server";
import { Card, TextSubtext, Title } from "../components/index";
import { NotFound } from "../components/notFound";

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
  plugins: {
    legend: {
      position: "top" as const,
      display: false,
    },
    title: {
      display: false,
      text: "Prioridades",
    },
  },
};

export const optionsDounuts = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom" as const,
      display: true,
      align: "start",
    },
    title: {
      display: false,
      text: "Prioridades",
    },
  },
};

export const modelChart = {
  labels: [],
  datasets: [
    {
      label: "",
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
  const [wait, setChatWait] = useState<string>("");
  const [returnTrend, setReturnTrend] = useState<string>("");

  const setTipoSessao = useCallback(async () => {
    const data = await getList("/vagas/dashboard/tipoSessoes");
    setChatTipoSessao(data);
  }, []);

  const setsEspecialidades = useCallback(async () => {
    const data = await getList("/vagas/dashboard/especialidades");
    setChatEspecialidades(data);
  }, []);

  const setStatus = useCallback(async () => {
    const data = await getList("/vagas/dashboard/status");
    setChatStatus(data);
  }, []);

  const setWait = useCallback(async () => {
    const data = await getList("/vagas/wait");
    setChatWait(data);
  }, []);

  const setInfoReturns = useCallback(async () => {
    const { data } = await getList("/vagas/return");
    setReturnTrend(data);
  }, []);

  const renderChart = (type: string, data: any) => {
    return (
      <Card>
        <div className="grid gap-4 items-center mx-auto">
          <Title size="md">{type}</Title>

          {data && data.datasets[0].data.length ? (
            <div className="grid justify-center">
              <Doughnut  data={data} />
            </div>
          ) : (
            <NotFound />
          )}
        </div>
      </Card>
    );
  };

  useEffect(() => {
    setStatus();
    setWait();
    setTipoSessao();
    setInfoReturns();
    setsEspecialidades();
  }, []);

  return (
    <div className=" overflow-y-auto h-screen">
      <div className=" py-6 mt-8 grid  gap-4 justify-center sm:justify-beteween w-full">

          <Card>
            <div className="grid gap-2 sm:flex">
            <TextSubtext
              text="Tempo de espera: "
              subtext={wait}
              color="gray-dark"
              size="md"
              icon="pi pi-hourglass"
              display="grid"
              />

            <TextSubtext
              text="Retornos para fila:  "
              subtext={returnTrend}
              color="gray-dark"
              size="md"
              icon="pi pi-sync"
              display="grid"
              />
            {chatStatus && (
              <div className="text-lg p-2 grid grid-rows gap-4">
                <div className=" grid m-auto text-left">
                  <Bar options={options} data={chatStatus} />
                </div>
              </div>
            )}
            </div>
          </Card>
        <div className="grid md:grid-cols-2 gap-4 justify-center sm:justify-beteween w-full">
          {renderChart("Especialidades por Demanda", chatEspecialidades)}
          {renderChart("Tipo de sessão por Demanda", chatTipoSessao)}
        </div>
      </div>
    </div>
  );
}
