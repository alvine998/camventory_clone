import Button from "@/components/Button";
import DateRangePicker from "@/components/DateRangePicker";
import Modal, { useModal } from "@/components/Modal";
import { CalendarDays } from "lucide-react";
import moment from "moment";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { CONFIG } from "@/config";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import DataTable from "react-data-table-component";
import { useRouter } from "next/router";
import { downloadReport } from "@/utils/exportToExcel";

const parseDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) {
    console.warn("Invalid date string, using current date instead");
    return new Date();
  }
  return date;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req, params } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;
  const { id } = params as { id: string };

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
      startDate = "",
      endDate = "",
    } = query;

    const startDateStr =
      (startDate as string) || moment().format("DD/MM/YYYY");
    const endDateStr =
      (endDate as string) || moment().add(30, "days").format("DD/MM/YYYY");

    const startTimestamp = moment(startDateStr, "DD/MM/YYYY").unix();
    const endTimestamp = moment(endDateStr, "DD/MM/YYYY").unix();

    const paramsApi: any = {
      page,
      limit,
      startDate: startTimestamp,
      endDate: endTimestamp,
    };

    const response = await axios.get(
      `${CONFIG.API_URL}/v1/report/customer/${id}`,
      {
        params: paramsApi,
        headers: {
          Authorization: `${token}`,
        },
      }
    );

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
        reportData: response.data?.data || null,
        dateRange: { start: startDateStr, end: endDateStr },
        customerId: id,
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
        reportData: null,
        dateRange: {
          start: moment().format("DD/MM/YYYY"),
          end: moment().add(30, "days").format("DD/MM/YYYY"),
        },
        customerId: id,
      },
    };
  }
};

interface Props {
  reportData: any;
  dateRange: { start: string; end: string };
  customerId: string;
  token: string;
}

export default function SalesCustomerDetailPage({
  reportData,
  dateRange,
  customerId,
  token,
}: Props) {
  const router = useRouter();
  const { query } = router;

  const [date, setDate] = useState({
    start: dateRange?.start || moment().format("DD/MM/YYYY"),
    end: dateRange?.end || moment().add(30, "days").format("DD/MM/YYYY"),
  });
  const [modal, setModal] = useState<useModal>();
  const [isMounted, setIsMounted] = useState(false);

  const currentPage = Number(query.page) || 1;
  const rowsPerPage = Number(query.limit) || 10;

  // This ensures the component is mounted before rendering the table
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Pagination handlers
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

  const columns: any[] = [
    {
      name: "Status",
      selector: (row: any) => row.status || "-",
      sortable: true,
    },
    {
      name: "Booking ID",
      selector: (row: any) => row.book_id || "-",
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row: any) =>
        row.created_at
          ? moment(row.created_at).format("DD/MM/YYYY HH:mm")
          : "-",
      sortable: true,
    },
    {
      name: "Total Price",
      selector: (row: any) => row.total_price ?? 0,
      sortable: true,
    },
    {
      name: "Customer Name",
      selector: (row: any) => row.customer_name || "-",
      sortable: true,
    },
    {
      name: "User Name",
      selector: (row: any) => row.user_name || "-",
      sortable: true,
    },
  ];

  const customerName =
    reportData?.data_list && reportData.data_list.length > 0
      ? reportData.data_list[0].user_name
      : customerId;

  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">
        Sales Customer Detail - {customerName}
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
        </div>
        <div>
          <Button
            type="button"
            onClick={() => {
              const startTimestamp = moment(date.start, "DD/MM/YYYY").unix();
              const endTimestamp = moment(date.end, "DD/MM/YYYY").unix();

              downloadReport(
                `customer-detail/${customerId}`,
                {
                  startDate: startTimestamp,
                  endDate: endTimestamp,
                },
                token,
                `Sales_Customer_Detail_${customerId}_Report_${moment(date.start, "DD/MM/YYYY").format("YYYYMMDD")}_${moment(date.end, "DD/MM/YYYY").format("YYYYMMDD")}`
              );
            }}
            title="Export Excel"
            variant="submit"
            className="flex items-center gap-2"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {isMounted && (
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={reportData?.data_list || []}
            pagination
            highlightOnHover
            paginationDefaultPage={currentPage}
            paginationPerPage={rowsPerPage}
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
            onSave={(dateRange) => {
              try {
                const startStr = dateRange.start;
                const endStr = dateRange.end;

                setDate({
                  start: startStr,
                  end: endStr,
                });

                setModal({ open: false, key: "", data: {} });

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
              }
            }}
            onCancel={() => setModal({ open: false, key: "", data: {} })}
          />
        </Modal>
      )}
    </div>
  );
}
