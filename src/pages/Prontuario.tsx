import { Chart } from "primereact/chart";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Timeline } from 'primereact/timeline';
// import { Card } from 'primereact/card';

import { useState, useEffect } from "react";
import { Card } from "../components";
import { Tag } from "../components/tag";
import { clsx } from 'clsx';


export const Prontuario = () => {
  const [chartData, setChartData] = useState({});
  const [chartDataDoughnut, setChartDataDoughnut] = useState({});

  const [chartOptionsDoughnut, setChartOptionsDoughnut] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  const [products, setProducts] = useState([]) as any;

  const [paciente, setPaciente] = useState({
    especialidades: [
      {nome: 'fono', terapeuta: 'Julia'},
      {nome: 'psico', terapeuta: 'Talita'},
    ]
  });

  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const data = {
        labels: ['A', 'B', 'C'],
        datasets: [
            {
                data: [300, 50, 100],
                backgroundColor: [
                    documentStyle.getPropertyValue('--blue-500'), 
                    documentStyle.getPropertyValue('--yellow-500'), 
                    documentStyle.getPropertyValue('--green-500')
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--blue-400'), 
                    documentStyle.getPropertyValue('--yellow-400'), 
                    documentStyle.getPropertyValue('--green-400')
                ]
            }
        ]
    };
    const options = {
        cutout: '60%'
    };

    setChartDataDoughnut(data);
    setChartOptionsDoughnut(options);
}, []);

  useEffect(() => {
    setProducts([
      {code: 'f230fh0g3', name: 'Bamboo Watch', category: 'Accessories', quantity: 3 },
      {code: 'f230fh0g3', name: 'Bamboo Watch', category: 'Accessories', quantity: 3 },
      {code: 'f230fh0g3', name: 'Bamboo Watch', category: 'Accessories', quantity: 3 },
      {code: 'f230fh0g3', name: 'Bamboo Watch', category: 'Accessories', quantity: 3 },
    ])
  }, []);

  useEffect(() => {
      const data = {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
              {
                  label: 'Sales',
                  data: [540, 325, 702, 620],
                  backgroundColor: [
                      'rgba(255, 159, 64, 0.2)',
                      'rgba(75, 192, 192, 0.2)',
                      'rgba(54, 162, 235, 0.2)',
                      'rgba(153, 102, 255, 0.2)'
                    ],
                    borderColor: [
                      'rgb(255, 159, 64)',
                      'rgb(75, 192, 192)',
                      'rgb(54, 162, 235)',
                      'rgb(153, 102, 255)'
                    ],
                    borderWidth: 1
              }
          ]
      };
      const options = {
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      };

      setChartData(data);
      setChartOptions(options);
  }, []);


  const customizedContent = (item: any) => {
    return (
      <div className="w-full md:w-[24rem]">
      <Card>
        <div className="grid gap-2">
          <div className="flex justify-end">
            <Tag type={item.nome} disabled={false}></Tag>
          </div>

          <div>
            Especialidade: { item.nome} 
            Terapeuta: { item.terapeuta} 
          </div>

          {/* <Chart type="bar" data={chartData} options={chartOptions} /> */}
       


          <Chart type="doughnut" data={chartDataDoughnut} options={chartOptionsDoughnut} className="w-full md:w-30rem" />

        </div>
      </Card>
      </div>

    );
  };

  const customizedMarker = (item: any) => {
    return (
      <span className={clsx("flex w-8 h-8 items-center justify-center text-white rounded-full	 z-1 shadow-1", {
        'bg-to': item.nome.toUpperCase() === 'TO',
        'bg-fono': item.nome.toUpperCase() === 'FONO',
        'bg-psico': item.nome.toUpperCase() === 'PSICO',
        'bg-black': item.nome.toUpperCase() === 'PSICOPEDAG',
      })}>
          <i className='pi pi-tag'></i>
      </span>
    );
};


  return (
    <div className="p-4">
    <div className="font-inter font-medium text-primary-text-hover text-lg">João Paulo</div>
    <div className="font-inter font-medium text-gray-400 text-lg">Idade: 8 anos</div>

    <Timeline value={paciente.especialidades} align="left" className="mt-8 sm:hidden flex" marker={customizedMarker} content={customizedContent} />
    <Timeline value={paciente.especialidades} layout="horizontal"  className="hidden sm:flex" marker={customizedMarker} content={customizedContent} />


    {/* <Card>
      <Chart type="bar" data={chartData} options={chartOptions} />
    </Card> */}

    <Card>
      <DataTable value={products} showGridlines stripedRows>
          <Column field="code" header="Code"></Column>
          <Column field="name" header="Name"></Column>
          <Column field="category" header="Category"></Column>
          <Column field="quantity" header="Quantity"></Column>
      </DataTable>
    </Card>

    </div>
  )
}