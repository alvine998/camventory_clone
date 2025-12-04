import { Circle, TrendingDown } from "lucide-react";
import moment from "moment";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import Select from "@/components/Select";
import axios from "axios";
import { CONFIG } from "@/config";
import { parse } from "cookie";
import { GetServerSideProps } from "next";

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

interface TrendData {
  date: number[];
  prior_date: number[];
  sum_by_date: number[];
  sum_by_date_prior: number[];
  diff: number[];
  ratio: number[];
  total_sum_by_date: number;
  total_sum_by_date_prior: number;
  ratio_result: number;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, query } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;
  const filterBy = (query.filterBy as string) || "week";

  try {
    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    const response = await axios.get(`${CONFIG.API_URL}/v1/report/trend`, {
      params: {
        filterBy,
      },
      headers: {
        Authorization: `${token}`,
      },
    });

    if (response?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return {
      props: {
        initialTrendData: response.data?.data || null,
        initialFilterBy: filterBy,
      },
    };
  } catch (error: any) {
    console.log(error);
    if (error?.response?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return {
      props: {
        initialTrendData: null,
        initialFilterBy: filterBy,
      },
    };
  }
};

export default function SalesSummaryPage({
  initialTrendData,
  initialFilterBy = "week",
}: {
  initialTrendData: TrendData | null;
  initialFilterBy?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [trendData, setTrendData] = useState<TrendData | null>(initialTrendData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<string>(initialFilterBy);

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

  const fetchTrendData = async (period: string) => {
    try {
      setLoading(true);
      setError(null);
      setFilterBy(period);

      const cookies = parse(document.cookie || "");
      const token = cookies.token;

      if (!token) {
        setError("Token tidak ditemukan");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${CONFIG.API_URL}/v1/report/trend`, {
        params: {
          filterBy: period,
        },
        headers: {
          Authorization: `${token}`,
        },
      });

      if (response.data.status === 1) {
        setTrendData(response.data.data);
      } else {
        setError(response.data.error?.message || "Gagal mengambil data trend");
      }
    } catch (err: any) {
      console.error("Error fetching trend data:", err);
      setError(err.response?.data?.error?.message || "Gagal mengambil data trend");
    } finally {
      setLoading(false);
    }
  };

  // Bangun data chart dari response API
  const { chartCategories, chartSeries } = useMemo(() => {
    const baseCategories =
      (chartOptions.xaxis?.categories as string[]) ||
      Array.from({ length: 30 }, (_, i) => {
        const date = moment().subtract(29, "days").add(i, "days");
        return date.format("DD MMM");
      });

    if (!trendData || !trendData.date || !trendData.sum_by_date) {
      return {
        chartCategories: baseCategories,
        chartSeries: [
          {
            name: "Current Period",
            type: "line",
            data: baseCategories.map(() => 0),
          },
          {
            name: "Prior Period",
            type: "line",
            data: baseCategories.map(() => 0),
          },
        ],
      };
    }

    const chartCategories = trendData.date.map((ts) =>
      moment(ts).isValid() ? moment(ts).format("DD MMM") : ""
    );

    const chartSeries = [
      {
        name: "Current Period",
        type: "line",
        data: trendData.sum_by_date ?? [],
      },
      {
        name: "Prior Period",
        type: "line",
        data: trendData.sum_by_date_prior ?? [],
      },
    ];

    return { chartCategories, chartSeries };
  }, [trendData]);

  const mergedChartOptions: ApexCharts.ApexOptions = useMemo(
    () => ({
      ...chartOptions,
      xaxis: {
        ...(chartOptions.xaxis || {}),
        categories: chartCategories,
      },
    }),
    [chartCategories]
  );

  const currentTotal = trendData?.total_sum_by_date ?? 0;
  const priorTotal = trendData?.total_sum_by_date_prior ?? 0;
  const ratioResult = trendData?.ratio_result ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">Sales Trend</h1>
      {/* Header 1 */}
      <div className="flex items-center gap-2 mt-2">
        <Select
          defaultValue={filterBy}
          options={periods}
          onChange={(value) => {
            const selected = value as { value?: string } | null;
            if (selected?.value) {
              fetchTrendData(selected.value);
            }
          }}
        />
        <h5>VS</h5>
        <Select
          defaultValue={"week"}
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
            <p className="text-sm text-gray-600">Current Period</p>
            <p className="font-semibold">
              Rp{currentTotal.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="rounded bg-orange-600 w-5 h-5"></div>
          <div>
            <p className="text-sm text-gray-600">Prior Period</p>
            <p className="font-semibold">
              Rp{priorTotal.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="rounded border-orange-600 border p-1">
            <TrendingDown className="w-3 h-3 text-orange-600" />
          </div>
          <p className="text-sm text-orange-600">
            {ratioResult.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        {loading && (
          <p className="text-center text-gray-500 text-sm mb-2">Memuat data...</p>
        )}
        {error && !loading && (
          <p className="text-center text-red-500 text-sm mb-2">{error}</p>
        )}
        {isMounted && (
          <div className="w-full">
            <Chart
              options={mergedChartOptions}
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
