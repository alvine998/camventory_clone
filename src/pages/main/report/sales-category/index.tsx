import Button from "@/components/Button";
import DateRangePicker from "@/components/DateRangePicker";
import Modal, { useModal } from "@/components/Modal";
import { CalendarDays, Upload } from "lucide-react";
import { format } from "date-fns";
import moment from "moment";
import React, { useEffect, useState } from "react";
import Select from "@/components/Select";
import axios from "axios";
import { CONFIG } from "@/config";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import Image from "next/image";
import { toMoney } from "@/utils";
import DataTable from "react-data-table-component";
import { ColumnSalesCategory } from "@/constants/column_sales_category";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx;
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
    const { 
      page = 1, 
      limit = 10, 
      categoryID = "",
      startDate = "",
      endDate = "",
    } = query;

    // Get date range from query or use defaults
    const startDateStr = (startDate as string) || moment().format("DD/MM/YYYY");
    const endDateStr = (endDate as string) || moment().add(30, "days").format("DD/MM/YYYY");

    // Convert dates to Unix timestamps
    const startTimestamp = moment(startDateStr, "DD/MM/YYYY").unix();
    const endTimestamp = moment(endDateStr, "DD/MM/YYYY").unix();

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      startDate: String(startTimestamp),
      endDate: String(endTimestamp),
    });

    if (typeof categoryID === "string" && categoryID.trim() !== "") {
      params.set("categoryID", categoryID);
    }

    // Fetch report data
    const reportResponse = await axios.get(
      `${CONFIG.API_URL}/v1/report/category?${params.toString()}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    // Fetch categories list
    const categories = await axios.get(
      `${CONFIG.API_URL}/v1/master/categories?page=1&limit=100`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    if (reportResponse?.status === 401 || categories?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return {
      props: { 
        reportData: reportResponse.data?.data || null,
        categories: categories?.data?.data || [],
        dateRange: { start: startDateStr, end: endDateStr },
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
        reportData: null,
        categories: [],
        dateRange: {
          start: moment().format("DD/MM/YYYY"),
          end: moment().add(30, "days").format("DD/MM/YYYY"),
        },
      },
    };
  }
};

const parseDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split("/").map(Number);
  // Create date in local timezone
  const date = new Date(year, month - 1, day);
  // Validate the date
  if (isNaN(date.getTime())) {
    console.warn("Invalid date string, using current date instead");
    return new Date();
  }
  return date;
};

interface Props {
  reportData: any;
  categories: any[];
  dateRange: { start: string; end: string };
}

export default function SalesCategoryPage({ reportData, categories, dateRange }: Props) {
  const router = useRouter();
  const { query } = router;

  const [date, setDate] = useState({
    start: dateRange?.start || moment().format("DD/MM/YYYY"),
    end: dateRange?.end || moment().add(30, "days").format("DD/MM/YYYY"),
  });
  const [modal, setModal] = useState<useModal>();
  const [isMounted, setIsMounted] = useState(false);

  // This ensures the component is mounted before rendering the chart
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const currentPage = Number(query.page) || 1;
  const rowsPerPage = Number(query.limit) || 10;
  const currentCategoryId =
    (query.categoryID as string) ||
    (categories && categories.length > 0 ? String(categories[0].id) : "");

  // Function to handle pagination
  const handlePageChange = (page: number) => {
    router.push({
      pathname: router.pathname,
      query: {
        ...query,
        page,
        limit: rowsPerPage,
      },
    });
  };

  // Function to handle rows per page change
  const handleRowsPerPageChange = (newPerPage: number, page: number) => {
    router.push({
      pathname: router.pathname,
      query: {
        ...query,
        page,
        limit: newPerPage,
      },
    });
  };

  const salesData = [
    {
      label: "Product Sold",
      value: reportData?.summary_data?.total || 0,
      icon: "/icons/camera.svg",
    },
    {
      label: "Total Gross Sales",
      value: reportData?.summary_data?.gross_sales || 0,
      icon: "/icons/growth-chart.svg",
    },
    {
      label: "Total Tax",
      value: reportData?.summary_data?.taxes || 0,
      icon: "/icons/receipt.svg",
    },
    {
      label: "Total Sales",
      value: reportData?.summary_data?.sales || 0,
      icon: "/icons/bill.svg",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">
        Sales Report per Category
      </h1>
      <div className="flex justify-between items-center gap-2 mt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setModal({ open: true, key: "date", data: date });
            }}
            className="border border-gray-300 rounded px-2 pr-16 py-2 flex items-center justify-start gap-2"
          >
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-500">
              {date.start} - {date.end}
            </p>
          </button>
          <Select
            defaultValue={currentCategoryId}
            options={categories?.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            onChange={(value) => {
              const selected = value as { value?: string | number } | null;
              const categoryID = selected?.value ?? "";

              router.push({
                pathname: router.pathname,
                query: {
                  ...query,
                  categoryID,
                  page: 1,
                },
              });
            }}
          />
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

      <div className="mt-4 grid sm:grid-cols-4 grid-cols-1 gap-4">
        {salesData.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6 border border-gray-400 flex justify-between items-center"
          >
            <div>
              <h5 className="text-sm">{item?.label}</h5>
              <h1 className="text-2xl font-bold text-black">
                {index !== 0 ? "Rp " : ""}
                {toMoney(item?.value)}
              </h1>
            </div>
            <div>
              <Image src={item?.icon} alt={item?.icon} width={50} height={50} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      {isMounted && (
        <div className="mt-4">
          <DataTable
            columns={ColumnSalesCategory}
            data={reportData?.data_list?.map((item: any) => ({
              category: item.name,
              total_rentals: item.total,
              gross_sales: item.gross_sales,
              taxes: item.taxes,
              sales: item.sales,
            })) || []}
            pagination
            paginationDefaultPage={currentPage}
            paginationPerPage={rowsPerPage}
            highlightOnHover
            paginationTotalRows={reportData?.count || 0}
            paginationRowsPerPageOptions={[10, 20, 50, 100]}
            paginationServer
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsPerPageChange}
            responsive
            customStyles={{
              headCells: {
                style: {
                  backgroundColor: "#f3f4f6",
                  fontWeight: "bold",
                },
              },
              rows: {
                style: {
                  "&:hover": {
                    backgroundColor: "#e5e7eb",
                  },
                },
              },
            }}
          />
        </div>
      )}

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
              end: parseDateString(date.end),
            }}
            setDate={(dateRange) => {
              try {
                // Convert the received date range to the expected format
                const startDate = dateRange.start
                  ? new Date(dateRange.start)
                  : new Date();
                const endDate = dateRange.end
                  ? new Date(dateRange.end)
                  : new Date();

                // Ensure dates are valid
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                  throw new Error("Invalid date");
                }

                const startStr = format(startDate, "dd/MM/yyyy");
                const endStr = format(endDate, "dd/MM/yyyy");

                setDate({
                  start: startStr,
                  end: endStr,
                });

                router.push({
                  pathname: router.pathname,
                  query: {
                    ...query,
                    startDate: startStr,
                    endDate: endStr,
                    page: 1,
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
                    ...query,
                    startDate: nowStr,
                    endDate: nowStr,
                    page: 1,
                  },
                });
              }
            }}
          />
        </Modal>
      )}
    </div>
  );
}
