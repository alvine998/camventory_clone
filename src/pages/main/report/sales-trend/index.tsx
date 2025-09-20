import { Circle, TrendingDown } from "lucide-react";
import moment from "moment";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Select from "@/components/Select";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Chart data state
const chartOptions: ApexCharts.ApexOptions = {
  chart: {
    height: 350,
    type: "line",
    zoom: {
      enabled: true,
    },
    toolbar: {
      show: true,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: "smooth",
    width: 2,
  },
  xaxis: {
    categories: Array.from({ length: 30 }, (_, i) => {
      const date = moment().subtract(29, "days").add(i, "days");
      return date.format("DD MMM");
    }),
    title: {
      text: "Date",
    },
    type: "category",
  },
  yaxis: [
    {
      title: {
        text: "Sales Amount",
      },
      axisTicks: {
        show: true,
      },
      labels: {
        formatter: (val: number) => `Rp${val.toLocaleString()}`,
      },
    },
    {
      opposite: true,
      title: {
        text: "Quantity",
      },
      min: 0,
      max: 100,
      axisTicks: {
        show: true,
      },
    },
  ],
  tooltip: {
    enabled: true,
    x: {
      format: "dd MMM yyyy",
    },
  },
  colors: ["#f97316", "#10b981"], // Add multiple colors for each series
  legend: {
    position: "top",
  },
};

// Sample data for the chart
const chartSeries = [
  {
    name: "Sales",
    type: "line",
    data: Array.from(
      { length: 30 },
      () => Math.floor(Math.random() * 1000) + 500
    ),
  },
  {
    name: "Quantity",
    type: "line",
    data: Array.from(
      { length: 30 },
      () => Math.floor(Math.random() * 100) + 10
    ),
  },
];

export default function SalesSummaryPage() {
  const [isMounted, setIsMounted] = useState(false);

  // This ensures the component is mounted before rendering the chart
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const periods = [
    {
      value: "today",
      label: "Today",
    },
    {
      value: "yesterday",
      label: "Yesterday",
    },
    {
      value: "week",
      label: "1 Week",
    },
    {
      value: "month",
      label: "1 Month",
    },
    {
      value: "year",
      label: "1 Year",
    },
  ];
  const [selectType, setSelectType] = useState<string>("Sales");
  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">Sales Trend</h1>
      {/* Header 1 */}
      <div className="flex items-center gap-2 mt-2">
        <Select
          defaultValue={{ value: "today", label: "Today" }}
          options={periods}
          onChange={(value) => console.log(value)}
        />
        <h5>VS</h5>
        <Select
          defaultValue={{ value: "today", label: "Today" }}
          options={periods}
          onChange={(value) => console.log(value)}
        />
        <div className="ml-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSelectType("Sales")}
            className="flex items-center gap-2"
          >
            <div className="relative flex items-center justify-center w-5 h-5">
              <Circle className="w-5 h-5 text-orange-600" />
              {selectType === "Sales" && (
                <div className="absolute bg-orange-600 w-3 h-3 rounded-full" />
              )}
            </div>
            Sales
          </button>
          <button
            type="button"
            onClick={() => setSelectType("Profit")}
            className="flex items-center gap-2"
          >
            <div className="relative flex items-center justify-center w-5 h-5">
              <Circle className="w-5 h-5 text-orange-600" />
              {selectType === "Profit" && (
                <div className="absolute bg-orange-600 w-3 h-3 rounded-full" />
              )}
            </div>
            Profit
          </button>
        </div>
      </div>

      <h2 className="font-bold text-xl mt-4">{selectType}</h2>
      {/* Header 2 */}
      <div className="flex items-start gap-10 mt-2">
        <div className="flex gap-2">
          <div className="rounded bg-orange-600 w-5 h-5"></div>
          <div>
            <p className="text-sm text-gray-600">25 Jun 2025 - 02 Jul 2025</p>
            <p className="font-semibold">Rp 15.825.000</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="rounded bg-orange-600 w-5 h-5"></div>
          <div>
            <p className="text-sm text-gray-600">17 Jun 2025 - 24 Jun 2025</p>
            <p className="font-semibold">Rp 22.718.500</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="rounded border-orange-600 border p-1">
            <TrendingDown className="w-3 h-3 text-orange-600" />
          </div>
          <p className="text-sm text-orange-600">30,34%</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Sales Overview
        </h2>
        {isMounted && (
          <div className="w-full">
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="line"
              height={350}
            />
          </div>
        )}
      </div>
    </div>
  );
}
