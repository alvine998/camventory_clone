import Button from "@/components/Button";
import DateRangePicker from "@/components/DateRangePicker";
import Modal, { useModal } from "@/components/Modal";
import { CalendarDays, Eye, Upload } from "lucide-react";
import moment from "moment";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { CONFIG } from "@/config";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import DataTable from "react-data-table-component";
import { ColumnSalesCustomer } from "@/constants/column_sales-customer";
import { useRouter } from "next/router";
import Select from "@/components/Select";
import { exportToExcel } from "@/utils/exportToExcel";

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
      sortBy = "",
      startDate = "",
      endDate = "",
    } = query;

    const startDateStr = (startDate as string) || moment().format("DD/MM/YYYY");
    const endDateStr =
      (endDate as string) || moment().add(30, "days").format("DD/MM/YYYY");

    const startTimestamp = moment(startDateStr, "DD/MM/YYYY").unix();
    const endTimestamp = moment(endDateStr, "DD/MM/YYYY").unix();

    const params: any = {
      page,
      limit,
      startDate: startTimestamp,
      endDate: endTimestamp,
    };

    if (typeof sortBy === "string" && sortBy.trim() !== "") {
      params.sortBy = sortBy;
    }

    const reportResponse = await axios.get(
      `${CONFIG.API_URL}/v1/report/customer`,
      {
        params,
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    if (reportResponse?.status === 401) {
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
        meta: reportResponse.data?.meta || null,
        dateRange: { start: startDateStr, end: endDateStr },
        initialSortBy: sortBy || "",
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
        meta: null,
        dateRange: {
          start: moment().format("DD/MM/YYYY"),
          end: moment().add(30, "days").format("DD/MM/YYYY"),
        },
        initialSortBy: "",
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
  meta: any;
  dateRange: { start: string; end: string };
  initialSortBy: string;
}

export default function SalesCustomerPage({
  reportData,
  meta,
  dateRange,
  initialSortBy,
}: Props) {
  const router = useRouter();
  const { query } = router;

  const [date] = useState({
    start: dateRange?.start || moment().format("DD/MM/YYYY"),
    end: dateRange?.end || moment().add(30, "days").format("DD/MM/YYYY"),
  });
  const [tempDate, setTempDate] = useState({
    start: dateRange?.start || moment().format("DD/MM/YYYY"),
    end: dateRange?.end || moment().add(30, "days").format("DD/MM/YYYY"),
  });
  const [sortBy, setSortBy] = useState<string>(initialSortBy || "");

  // Update tempDate when date changes (from SSR)
  useEffect(() => {
    setTempDate({
      start: date.start,
      end: date.end,
    });
  }, [date.start, date.end]);

  const currentPage = Number(query.page) || 1;
  const rowsPerPage = Number(query.limit) || 10;

  // Function to handle pagination
  const handlePageChange = (page: number) => {
    router.push({
      pathname: router.pathname,
      query: {
        ...(typeof query === "object" && query !== null ? query : {}),
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
        ...(typeof query === "object" && query !== null ? query : {}),
        page,
        limit: newPerPage,
      },
    });
  };
  const [modal, setModal] = useState<useModal>();
  const [isMounted, setIsMounted] = useState(false);

  // This ensures the component is mounted before rendering the chart
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">
        Sales Report per Customer
      </h1>

      <div className="flex justify-between items-center gap-2 mt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              // Initialize tempDate with current date when opening modal
              setTempDate({
                start: date.start,
                end: date.end,
              });
              setModal({ open: true, key: "date", data: date });
            }}
            className="border border-gray-300 rounded px-2 pr-16 py-2 flex items-center justify-start gap-2"
          >
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-500">
              {moment(tempDate.start, "DD/MM/YYYY").format("DD MMM YYYY")} -{" "}
              {moment(tempDate.end, "DD/MM/YYYY").format("DD MMM YYYY")}
            </p>
          </button>
          {/* <Input type="search" placeholder="Search Customer" /> */}
          <Select
            defaultValue={sortBy}
            options={[
              { label: "Total Transaction (High - Low)", value: "total_desc" },
              { label: "Total Transaction (Low - High)", value: "total_asc" },
              { label: "Total Visit (High - Low)", value: "visit_desc" },
              { label: "Total Visit (Low - High)", value: "visit_asc" },
            ]}
            onChange={(value) => {
              const selected = value as { value?: string } | null;
              const sort = selected?.value || "";
              setSortBy(sort);
              router.push({
                pathname: router.pathname,
                query: {
                  ...(typeof query === "object" && query !== null ? query : {}),
                  sortBy: sort,
                  page: 1,
                },
              });
            }}
            placeholder="Urutkan Berdasarkan"
          />
        </div>
        <div>
          <Button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: `Sales_Customer_Report_${moment(tempDate.start, "DD/MM/YYYY").format("YYYYMMDD")}_${moment(tempDate.end, "DD/MM/YYYY").format("YYYYMMDD")}`,
                sheetName: 'Sales Customer',
                columns: [
                  { header: 'Customer Name', key: 'customer_name', width: 30 },
                  { header: 'Phone Number', key: 'phone_number', width: 20 },
                  { header: 'Total Visit', key: 'total_visit', width: 15 },
                  { header: 'Total Transaction', key: 'total_transaction', width: 20 },
                ],
                data: Array.isArray(reportData?.data_list)
                  ? reportData.data_list.map((item: any) => ({
                    customer_name: item.name,
                    phone_number: item.phone_number,
                    total_visit: item.total_visit,
                    total_transaction: item.total,
                  }))
                  : [],
                summaryData: [
                  { label: 'Report Period', value: `${moment(tempDate.start, "DD/MM/YYYY").format("DD MMM YYYY")} - ${moment(tempDate.end, "DD/MM/YYYY").format("DD MMM YYYY")}` },
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
      {isMounted && (
        <div className="mt-4">
          <DataTable
            columns={ColumnSalesCustomer}
            data={
              Array.isArray(reportData?.data_list)
                ? reportData.data_list.map((item: any) => ({
                  customer_id: item.customer_id,
                  customer_name: item.name,
                  phone_number: item.phone_number,
                  total_visit: item.total_visit,
                  total_transaction: item.total,
                  action: (
                    <Button
                      type="button"
                      title="View"
                      variant="submit"
                      className="flex items-center gap-2"
                      onClick={() =>
                        router.push(
                          `/main/report/sales-customer/${item.customer_id}`
                        )
                      }
                    >
                      <Eye className="w-4 h-4 text-white" />
                    </Button>
                  ),
                }))
                : []
            }
            pagination
            highlightOnHover
            paginationDefaultPage={currentPage}
            paginationPerPage={rowsPerPage}
            paginationTotalRows={
              Number(meta?.total_data) || Number(reportData?.count) || 0
            }
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
                end: parseDateString(tempDate.end),
              }}
              setDate={(dateRange) => {
                try {
                  // DateRangePicker sends dates in 'dd/MM/yyyy' format as strings
                  if (!dateRange.start || !dateRange.end) {
                    return; // Don't update if dates are not complete
                  }

                  // Validate using moment to ensure dates are valid
                  const startMoment = moment(dateRange.start, "DD/MM/YYYY");
                  const endMoment = moment(dateRange.end, "DD/MM/YYYY");

                  // Ensure dates are valid
                  if (!startMoment.isValid() || !endMoment.isValid()) {
                    throw new Error("Invalid date");
                  }

                  // Update temporary date (not the actual date yet)
                  // DateRangePicker already sends in 'dd/MM/yyyy' format, so use directly
                  setTempDate({
                    start: dateRange.start,
                    end: dateRange.end,
                  });
                } catch (error) {
                  console.error("Error setting date range:", error);
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="white"
                onClick={() => {
                  setModal({ open: false, key: "", data: {} });
                  setTempDate({
                    start: date.start,
                    end: date.end,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="submit"
                onClick={() => {
                  setModal({ open: false, key: "", data: {} });
                  router.push({
                    pathname: router.pathname,
                    query: {
                      ...(typeof query === "object" && query !== null
                        ? query
                        : {}),
                      startDate: tempDate.start,
                      endDate: tempDate.end,
                      page: 1,
                    },
                  });
                }}
              >
                Simpan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
