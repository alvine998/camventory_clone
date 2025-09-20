import Button from "@/components/Button";
import DateRangePicker from "@/components/DateRangePicker";
import Modal, { useModal } from "@/components/Modal";
import { CalendarDays, Upload } from "lucide-react";
import { format } from "date-fns";
import moment from "moment";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

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
  },
  tooltip: {
    enabled: true,
    x: {
      format: 'dd MMM yyyy',
      formatter: undefined, // Use default formatter
    },
  },
  colors: ["#f97316"], // Orange color to match your theme
};

// Sample data for the chart
const chartSeries = [
  {
    name: "Sales",
    data: Array.from(
      { length: 30 },
      () => Math.floor(Math.random() * 1000) + 500
    ),
  },
];

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

export default function SalesSummaryPage() {
  const [date, setDate] = useState({
    start: moment().format("DD/MM/YYYY"),
    end: moment().add(30, "days").format("DD/MM/YYYY"),
  });
  const [modal, setModal] = useState<useModal>();
  const [isMounted, setIsMounted] = useState(false);

  // This ensures the component is mounted before rendering the chart
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
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
              {date.start} - {date.end}
            </p>
          </button>
        </div>
        <div>
          <Button
            type="button"
            onClick={() => {}}
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
              options={chartOptions}
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
          <div className="mt-2">
            <h5 className="text-gray-500">
              Gross Sales - (Discount + Redeem Point) + Tax
            </h5>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p>Gross Sales</p>
              <p>Rp21.353.000</p>
            </div>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p>Discount</p>
              <p>-Rp694.500</p>
            </div>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p>Redeem Point</p>
              <p>-</p>
            </div>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p className="font-bold">Total Net Sales</p>
              <p className="font-bold">Rp20.658.500</p>
            </div>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p>Tax</p>
              <p>Rp0</p>
            </div>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p className="font-bold">Total Sales</p>
              <p className="font-bold">Rp20.658.500</p>
            </div>
          </div>
        </div>

        {/* Border Profit */}
        <div className="border border-gray-300 rounded-lg p-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Profit</h2>
          <div className="mt-2">
            <h5 className="text-gray-500">Total Net Sales - Base Price</h5>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p>Total Net Sales</p>
              <p>Rp20.658.500</p>
            </div>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p>Base price</p>
              <p>-Rp0</p>
            </div>
            <div className="flex items-center gap-2 justify-between mt-2 pb-2 border-b border-b-gray-300">
              <p>Total Profit</p>
              <p>Rp20.658.500</p>
            </div>
          </div>
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
          setOpen={() => setModal({ open: false, key: "", data: {} })}
          size="xl"
        >
          <DateRangePicker 
            date={{
              start: parseDateString(date.start),
              end: parseDateString(date.end)
            }} 
            setDate={(dateRange) => {
              try {
                // Convert the received date range to the expected format
                const startDate = dateRange.start ? new Date(dateRange.start) : new Date();
                const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
                
                // Ensure dates are valid
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                  throw new Error('Invalid date');
                }
                
                setDate({
                  start: format(startDate, 'dd/MM/yyyy'),
                  end: format(endDate, 'dd/MM/yyyy')
                });
              } catch (error) {
                console.error('Error setting date range:', error);
                const now = new Date();
                const nowStr = format(now, 'dd/MM/yyyy');
                setDate({
                  start: nowStr,
                  end: nowStr
                });
              }
            }}
          />
        </Modal>
      )}
    </div>
  );
}
