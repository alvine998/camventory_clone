import { Circle, TrendingDown, Upload } from "lucide-react";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import moment from "moment";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import Select from "@/components/Select";
import axios from "axios";
import { CONFIG } from "@/config";
import { parse } from "cookie";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { downloadReport } from "@/utils/exportToExcel";
import Button from "@/components/Button";

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
  prior_date?: number[];
  sum_by_date: number[];
  sum_by_date_prior?: number[];
  diff?: number[];
  ratio?: number[];
  total_sum_by_date?: number;
  total_sum_by_date_prior?: number;
  ratio_result?: number;
  net_sales: number;
  profit: number;
  gross_sales: number;
  tax: number;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, query } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;
  const filterBy = (query.filterBy as string) || "month";
  const trendBy = (query.trendBy as string) || "sales";

  try {
    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    const [response, notificationsData, unreadNotificationsData] = await Promise.all([
      axios.get(`${CONFIG.API_URL}/v1/report/trend`, {
        params: {
          filterBy,
          trendBy,
        },
        headers: {
          Authorization: `${token}`,
        },
      }),
      fetchNotificationsServer(token),
      fetchUnreadNotificationsServer(token),
    ]);

    console.log(response.data, "response");

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
        initialTrendBy: trendBy,
        token: token,
        notifications: notificationsData?.data || [],
        unreadNotifications: unreadNotificationsData?.data || [],
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
        initialTrendBy: trendBy,
        notifications: [],
        unreadNotifications: [],
      },
    };
  }
};

export default function SalesSummaryPage({
  initialTrendData,
  initialFilterBy = "month",
  initialTrendBy = "sales",
  token,
}: {
  initialTrendData: TrendData | null;
  initialFilterBy?: string;
  initialTrendBy?: string;
  token: string;
}) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [trendData, setTrendData] = useState<TrendData | null>(initialTrendData);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState<string>(initialFilterBy);
  const [trendBy, setTrendBy] = useState<string>(initialTrendBy);

  // Sync state with props when SSR data changes
  useEffect(() => {
    setLoading(false);
    setTrendData(initialTrendData);
    setFilterBy(initialFilterBy);
    setTrendBy(initialTrendBy);
  }, [initialTrendData, initialFilterBy, initialTrendBy]);

  // This ensures the component is mounted before rendering the chart
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const periods = useMemo(() => [
    {
      value: "day",
      label: "Today",
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
  ], []);

  const selectType = useMemo(() => {
    return trendBy === "profit" ? "Profit" : "Sales";
  }, [trendBy])

  const handleFilterChange = (period: string) => {
    setLoading(true);
    router.push({
      query: { ...router.query, filterBy: period, trendBy }
    });
  };

  const handleTypeChange = (type: string) => {
    if (trendBy === type) return;
    setLoading(true);
    router.push({
      query: { ...router.query, filterBy, trendBy: type }
    });
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

    const chartCategories = trendData.date.map((ts) => {
      if (!moment.unix(ts).isValid()) return "";
      // If filtering by year, show Month Year (e.g. "Jan 2024")
      if (filterBy === "year") return moment.unix(ts).format("MMM YYYY");
      // Otherwise show Day Month (e.g. "01 Mar")
      return moment.unix(ts).format("DD MMM");
    });

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
  }, [trendData, filterBy]);

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

  // const currentTotal = trendData?.total_sum_by_date ?? 0;
  // const priorTotal = trendData?.total_sum_by_date_prior ?? 0;
  const ratioResult = trendData?.ratio_result ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">Sales Trend</h1>
      {/* Header 1 */}
      <div className="flex items-center gap-2 mt-2">
        <Select
          value={periods.find(p => p.value === filterBy)}
          options={periods}
          isClearable={false}
          onChange={(selected) => {
            const val = (selected as { value: string })?.value;
            if (val && val !== filterBy) {
              handleFilterChange(val);
            }
          }}
        />
        <h5>VS</h5>
        <div className="px-4 py-2 bg-gray-100 rounded-md text-gray-600 font-medium min-w-[140px] text-center">
          {filterBy === "day" ? "Yesterday" :
            filterBy === "week" ? "1 Week Prior" :
              filterBy === "month" ? "Previous Month" :
                filterBy === "year" ? "Previous Year" : "-"}
        </div>
        <div className="ml-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleTypeChange("sales")}
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
            onClick={() => handleTypeChange("profit")}
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
        <div className="ml-auto">
          <Button
            type="button"
            onClick={() => {
              downloadReport(
                "trend",
                {
                  filterBy,
                  trendBy,
                },
                token,
                `${selectType}_Trend_Report_${moment().format("YYYYMMDD")}`,
                [
                  {
                    header: "Date",
                    key: "date",
                    formatter: (value) => {
                      if (!value) return "-";
                      const m = moment(value);
                      return filterBy === "year" ? m.format("MMM YYYY") : m.format("DD MMM YYYY");
                    }
                  },
                  {
                    header: "Prior Date",
                    key: "prior_date",
                    formatter: (value) => {
                      if (!value) return "-";
                      const m = moment(value);
                      return filterBy === "year" ? m.format("MMM YYYY") : m.format("DD MMM YYYY");
                    }
                  },
                  { header: `Current ${selectType}`, key: "sum" },
                  { header: `Prior ${selectType}`, key: "prior_sum" },
                  { header: "Difference", key: "diff" },
                  { header: "Ratio (%)", key: "ratio" },
                ]
              );
            }}
            title="Export Excel"
            variant="submit"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-white" />
            Export Excel
          </Button>
        </div>
      </div>

      <h2 className="font-bold text-xl mt-4">Financial Summary</h2>
      {/* Header 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Gross Sales</p>
          <p className="text-xl font-bold text-gray-800">
            Rp{trendData?.gross_sales?.toLocaleString("id-ID") || 0}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Tax</p>
          <p className="text-xl font-bold text-red-500">
            Rp{trendData?.tax?.toLocaleString("id-ID") || 0}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Net Sales</p>
          <p className="text-xl font-bold text-orange-600">
            Rp{trendData?.net_sales?.toLocaleString("id-ID") || 0}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Profit</p>
              <p className="text-xl font-bold text-green-600">
                Rp{trendData?.profit?.toLocaleString("id-ID") || 0}
              </p>
            </div>
            {ratioResult !== 0 && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${ratioResult > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                <TrendingDown className={`w-3 h-3 ${ratioResult > 0 ? "rotate-180" : ""}`} />
                <span>{Math.abs(ratioResult).toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        {loading && (
          <p className="text-center text-gray-500 text-sm mb-2">Memuat data...</p>
        )}
        {/* {error && !loading && (
          <p className="text-center text-red-500 text-sm mb-2">{error}</p>
        )} */}
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
