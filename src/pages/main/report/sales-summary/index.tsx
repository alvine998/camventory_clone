import Button from "@/components/Button";
import DateRangePicker from "@/components/DateRangePicker";
import Modal, { useModal } from "@/components/Modal";
import { CalendarDays, Upload } from "lucide-react";
import { format } from "date-fns";
import moment from "moment";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CONFIG } from "@/config";
import { parse } from "cookie";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { exportToExcel, formatCurrency } from "@/utils/exportToExcel";

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
      const date = moment().subtract(29, 'days').add(i, 'days');
      return date.format('DD MMM');
    }),
    title: {
      text: "Date",
    },
    type: 'category',
  },
  yaxis: {
    title: {
      text: "Sales Amount",
    },
    labels: {
      formatter: (value) => formatCurrency(value),
    },
  },
  tooltip: {
    enabled: true,
    x: {
      format: 'dd MMM yyyy',
      formatter: undefined, // Use default formatter
    },
    y: {
      formatter: (value) => formatCurrency(value),
    },
  },
  colors: ["#f97316"], // Orange color to match your theme
};

const parseDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split('/').map(Number);
  // Create date in local timezone
  const date = new Date(year, month - 1, day);
  // Validate the date
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string, using current date instead');
    return new Date();
  }
  return date;
};

interface ReportData {
  date: number[] | null;
  sum_by_date: number[] | null;
  total_sum_by_date: number;
  tax: number;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, query } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;

  try {
    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // Get date range from query or use defaults
    const startDate = (query.startDate as string) || moment().format("DD/MM/YYYY");
    const endDate = (query.endDate as string) || moment().add(30, "days").format("DD/MM/YYYY");

    // Convert dates to Unix timestamps
    const startTimestamp = moment(startDate, "DD/MM/YYYY").unix();
    const endTimestamp = moment(endDate, "DD/MM/YYYY").unix();

    const response = await axios.get(`${CONFIG.API_URL}/v1/report/summary`, {
      params: {
        startDate: startTimestamp,
        endDate: endTimestamp,
      },
      headers: {
        Authorization: `${token}`,
      },
    });
    console.log(response.data);
    console.log(startTimestamp, endTimestamp, 'startTimestamp, endTimestamp');
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
        initialReportData: response.data?.data || null,
        dateRange: { start: startDate, end: endDate },
        token: token,
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
        initialReportData: null,
        dateRange: {
          start: moment().format("DD/MM/YYYY"),
          end: moment().add(30, "days").format("DD/MM/YYYY"),
        },
        token: null,
        errorMessage: error?.response?.data?.error?.message || "Failed to fetch report data",
      },
    };
  }
};

export default function SalesSummaryPage({ initialReportData, dateRange, errorMessage }: any) {
  const router = useRouter();
  const { query } = router;
  const [date, setDate] = useState({
    start: dateRange?.start || moment().format("DD/MM/YYYY"),
    end: dateRange?.end || moment().add(30, "days").format("DD/MM/YYYY"),
  });
  const [tempDate, setTempDate] = useState({
    start: dateRange?.start || moment().format("DD/MM/YYYY"),
    end: dateRange?.end || moment().add(30, "days").format("DD/MM/YYYY"),
  });
  const [modal, setModal] = useState<useModal>();
  const [isMounted, setIsMounted] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(initialReportData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage || null);

  // Update reportData when initialReportData changes (from SSR)
  useEffect(() => {
    if (initialReportData) {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
      setReportData(initialReportData);
      setLoading(true);
    }
  }, [initialReportData]);

  useEffect(() => {
    if (errorMessage) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: errorMessage,
      });
      setError(errorMessage);
    }
  }, [errorMessage]);

  // This ensures the component is mounted before rendering the chart
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // No need for client-side fetch since SSR will handle it via router.push

  // Build chart data from API response
  const { chartCategories, chartSeries } = useMemo(() => {
    const emptyResult = {
      chartCategories: [] as string[],
      chartSeries: [
        {
          name: "Sales",
          data: [] as number[],
        },
      ],
    };

    if (!reportData || !reportData.date || !reportData.sum_by_date) {
      return emptyResult;
    }

    // date and sum_by_date are arrays with corresponding indices
    // date contains Unix timestamps, sum_by_date contains sales values
    const dateArray = reportData.date || [];
    const sumArray = reportData.sum_by_date || [];

    // Zip the arrays together and sort by date
    const entries = dateArray
      .map((timestamp, index) => ({
        date: timestamp,
        value: sumArray[index] ?? 0,
      }))
      .sort((a, b) => a.date - b.date); // Sort by timestamp

    // Format dates for chart categories
    const chartCategories = entries.map(({ date }) =>
      moment.unix(date).format("DD MMM")
    );

    // Extract sales values
    const chartSeries = [
      {
        name: "Sales",
        data: entries.map(({ value }) => value ?? 0),
      },
    ];

    return { chartCategories, chartSeries };
  }, [reportData]);

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">Sales Summary</h1>
      <div className="flex justify-between items-center gap-2">
        <div>
          <button
            type="button"
            onClick={() => {
              setModal({ open: true, key: "date", data: date });
            }}
            className="border border-gray-300 rounded px-2 pr-16 py-2 mt-4 flex items-center justify-start gap-2"
          >
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-500">
              {moment(date.start, "DD/MM/YYYY").format("DD MMM YYYY")} - {moment(date.end, "DD/MM/YYYY").format("DD MMM YYYY")}
            </p>
          </button>
        </div>
        <div>
          <Button
            type="button"
            onClick={() => {
              if (!reportData || !reportData.date || !reportData.sum_by_date) {
                alert('No data available to export');
                return;
              }

              const dateArray = reportData.date || [];
              const sumArray = reportData.sum_by_date || [];
              const entries = dateArray.map((timestamp: number, index: number) => ({
                date: moment.unix(timestamp).format("DD MMM YYYY"),
                sales: sumArray[index] ?? 0,
              }));

              exportToExcel({
                filename: `Sales_Summary_Report_${moment(date.start, "DD/MM/YYYY").format("YYYYMMDD")}_${moment(date.end, "DD/MM/YYYY").format("YYYYMMDD")}`,
                sheetName: 'Sales Summary',
                columns: [
                  { header: 'Date', key: 'date', width: 20 },
                  { header: 'Sales', key: 'sales_formatted', width: 20 },
                ],
                data: entries.map(entry => ({
                  date: entry.date,
                  sales_formatted: formatCurrency(entry.sales),
                })),
                summaryData: [
                  { label: 'Report Period', value: `${moment(date.start, "DD/MM/YYYY").format("DD MMM YYYY")} - ${moment(date.end, "DD/MM/YYYY").format("DD MMM YYYY")}` },
                  { label: 'Total Gross Sales', value: formatCurrency(reportData?.total_sum_by_date || 0) },
                  { label: 'Tax', value: formatCurrency(reportData?.tax || 0) },
                  { label: 'Total Sales', value: formatCurrency((reportData?.total_sum_by_date || 0) + (reportData?.tax || 0)) },
                ],
              });
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

      {/* Chart Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Sales Overview
        </h2>
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

      {/* Stats */}
      <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
        {/* Border Sales */}
        <div className="border border-gray-300 rounded-lg p-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales</h2>
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center py-4">{error}</p>
          ) : (
            <div className="mt-2">
              <h5 className="text-gray-500">
                Gross Sales - (Discount + Redeem Point) + Tax
              </h5>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p>Gross Sales</p>
                <p>{formatCurrency(reportData?.total_sum_by_date || 0)}</p>
              </div>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p>Discount</p>
                <p>Rp 0</p>
              </div>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p>Redeem Point</p>
                <p>-</p>
              </div>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p className="font-bold">Total Net Sales</p>
                <p className="font-bold">{formatCurrency(reportData?.total_sum_by_date || 0)}</p>
              </div>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p>Tax</p>
                <p>{formatCurrency(reportData?.tax || 0)}</p>
              </div>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p className="font-bold">Total Sales</p>
                <p className="font-bold">
                  {formatCurrency((reportData?.total_sum_by_date || 0) + (reportData?.tax || 0))}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Border Profit */}
        <div className="border border-gray-300 rounded-lg p-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Profit</h2>
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center py-4">{error}</p>
          ) : (
            <div className="mt-2">
              <h5 className="text-gray-500">Total Net Sales - Base Price</h5>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p>Total Net Sales</p>
                <p>{formatCurrency(reportData?.total_sum_by_date || 0)}</p>
              </div>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p>Base price</p>
                <p>Rp 0</p>
              </div>
              <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
                <p>Total Profit</p>
                <p>{formatCurrency(reportData?.total_sum_by_date || 0)}</p>
              </div>
            </div>
          )}
          <p className="text-gray-500 mt-2 text-xs">
            *Operating Costs recorded in Cash Out are not included in the Total
            Profit
          </p>
        </div>
      </div>

      {/* Date Modal */}
      {modal?.key === "date" && (
        <Modal
          open={modal?.open}
          setOpen={() => {
            setModal({ open: false, key: "", data: {} });
            // Reset temp date to current date when closing
            setTempDate({
              start: date.start,
              end: date.end,
            });
          }}
          size="xl"
        >
          <div className="p-6">
            <DateRangePicker
              date={{
                start: parseDateString(tempDate.start),
                end: parseDateString(tempDate.end)
              }}
              setDate={(dateRange) => {
                try {
                  // DateRangePicker sends dates in 'dd/MM/yyyy' format as strings
                  // Validate using moment to ensure dates are valid
                  const startMoment = dateRange.start
                    ? moment(dateRange.start, "DD/MM/YYYY")
                    : moment();
                  const endMoment = dateRange.end
                    ? moment(dateRange.end, "DD/MM/YYYY")
                    : moment();

                  // Ensure dates are valid
                  if (!startMoment.isValid() || !endMoment.isValid()) {
                    throw new Error('Invalid date');
                  }

                  // Update temporary date (not the actual date yet)
                  // DateRangePicker already sends in 'dd/MM/yyyy' format, so use directly
                  setTempDate({
                    start: dateRange.start || startMoment.format('DD/MM/YYYY'),
                    end: dateRange.end || endMoment.format('DD/MM/YYYY')
                  });
                } catch (error) {
                  console.error('Error setting date range:', error);
                  // Fallback to current date if parsing fails
                  const now = moment();
                  setTempDate({
                    start: now.format('DD/MM/YYYY'),
                    end: now.format('DD/MM/YYYY')
                  });
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setModal({ open: false, key: "", data: {} });
                  // Reset temp date to current date when canceling
                  setTempDate({
                    start: date.start,
                    end: date.end,
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    // Convert the date range to the expected format
                    const startDate = tempDate.start
                      ? new Date(moment(tempDate.start, "DD/MM/YYYY").format("YYYY-MM-DD"))
                      : new Date();
                    const endDate = tempDate.end
                      ? new Date(moment(tempDate.end, "DD/MM/YYYY").format("YYYY-MM-DD"))
                      : new Date();

                    // Ensure dates are valid
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                      throw new Error("Invalid date");
                    }

                    const startStr = tempDate.start;
                    const endStr = tempDate.end;

                    // Update local state
                    setDate({
                      start: startStr,
                      end: endStr,
                    });

                    // Close modal
                    setModal({ open: false, key: "", data: {} });

                    // Update URL query parameters to trigger SSR
                    router.push({
                      pathname: router.pathname,
                      query: {
                        ...(typeof query === "object" && query ? query : {}),
                        startDate: startStr,
                        endDate: endStr,
                      },
                    });
                  } catch (error) {
                    console.error("Error setting date range:", error);
                    const now = new Date();
                    const nowStr = format(now, "dd/MM/yyyy");
                    setDate({
                      start: nowStr,
                      end: nowStr,
                    });
                    router.push({
                      pathname: router.pathname,
                      query: {
                        ...(typeof query === "object" && query ? query : {}),
                        startDate: nowStr,
                        endDate: nowStr,
                      },
                    });
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
