import Button from "@/components/Button";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import DateRangePicker from "@/components/DateRangePicker";
import Modal, { useModal } from "@/components/Modal";
import { CalendarDays, Upload } from "lucide-react";
import moment from "moment";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { CONFIG } from "@/config";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import DataTable from "react-data-table-component";
import { useRouter } from "next/router";
import { downloadReport } from "@/utils/exportToExcel";
import Select from "@/components/Select";
import { ColumnSalesBrand } from "@/constants/column_sales_brand";

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
      limit = 999,
      brandID = "",
      startDate = "",
      endDate = "",
    } = query;

    const startDateStr = (startDate as string) || moment().subtract(30, "days").format("DD/MM/YYYY");
    const endDateStr = (endDate as string) || moment().format("DD/MM/YYYY");

    const startTimestamp = moment(startDateStr, "DD/MM/YYYY").unix();
    const endTimestamp = moment(endDateStr, "DD/MM/YYYY").unix();
    console.log(startTimestamp, endTimestamp, "timestamp")

    const params: any = {
      page,
      limit,
      startDate: startTimestamp,
      endDate: endTimestamp,
      brandID: brandID
    };

    if (query.brandID) {
      params.brandID = query.brandID;
    }

    const [reportResponse, brandsResponse, notificationsData, unreadNotificationsData] = await Promise.allSettled([
      axios.get(
        `${CONFIG.API_URL}/v1/report/brand`,
        {
          params,
          headers: {
            Authorization: `${token}`,
          },
        }
      ),
      axios.get(
        `${CONFIG.API_URL}/v1/master/brands?page=1&limit=999`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      ),
      fetchNotificationsServer(token),
      fetchUnreadNotificationsServer(token),
    ]);

    const reportResult = reportResponse.status === "fulfilled" ? (reportResponse.value as any)?.data?.data : null;
    const brandsResult = brandsResponse.status === "fulfilled" ? (brandsResponse.value as any)?.data?.data : [];
    const notifications = notificationsData.status === "fulfilled" ? (notificationsData.value as any)?.data : [];
    const unreadNotifications = unreadNotificationsData.status === "fulfilled" ? (unreadNotificationsData.value as any)?.data : [];

    return {
      props: {
        reportData: reportResult || null,
        brands: brandsResult || [],
        dateRange: { start: startDateStr, end: endDateStr },
        token: token,
        notifications: notifications || [],
        unreadNotifications: unreadNotifications || [],
      },
    };
  } catch (error: any) {
    console.error("SSR Brand Report Error:", error);
    // Even in total failure, try to preserve the date range from query if possible
    const { startDate, endDate } = (ctx.query || {}) as any;
    return {
      props: {
        reportData: null,
        brands: [],
        dateRange: {
          start: startDate || moment().subtract(30, "days").format("DD/MM/YYYY"),
          end: endDate || moment().format("DD/MM/YYYY"),
        },
        token: "",
        notifications: [],
        unreadNotifications: [],
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

export default function SalesBrandPage({
  reportData,
  brands,
  dateRange,
  token,
}: any) {
  const router = useRouter();
  const { query } = router;

  const [date, setDate] = useState({
    start: dateRange?.start || moment().subtract(30, "days").format("DD/MM/YYYY"),
    end: dateRange?.end || moment().format("DD/MM/YYYY"),
  });
  const [tempDate, setTempDate] = useState({
    start: dateRange?.start || moment().subtract(30, "days").format("DD/MM/YYYY"),
    end: dateRange?.end || moment().format("DD/MM/YYYY"),
  });
  const [modal, setModal] = useState<useModal>();
  const [isMounted, setIsMounted] = useState(false);

  // Update date and tempDate when dateRange changes (from SSR)
  useEffect(() => {
    if (dateRange) {
      const newDate = {
        start: dateRange.start,
        end: dateRange.end,
      };
      setDate(newDate);
      setTempDate(newDate);
    }
  }, [dateRange]);

  const currentPage = Number(query.page) || 1;
  const rowsPerPage = Number(query.limit) || 10;
  /* const currentCategoryId =
    (query.categoryID as string) ||
    (categories && categories.length > 0 ? String(categories[0].id) : ""); */

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

  // This ensures the component is mounted before rendering the chart
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">
        Sales Report per Brand
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
          <div className="w-64">
            <Select
              placeholder="All Brands"
              isClearable
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              value={(() => {
                const currentBrandId = query.brandID;
                if (!currentBrandId || !brands) return null;
                const options = brands.map((b: any) => ({ value: String(b.id), label: b.name }));
                return options.find((opt: any) => opt.value === String(currentBrandId)) || null;
              })()}
              options={brands?.map((brand: any) => ({
                value: String(brand.id),
                label: brand.name,
              }))}
              onChange={(value) => {
                const selected = value as { value?: string | number } | null;
                const brandID = selected?.value ?? "";

                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query, // Prefer the current full query from router instance
                    brandID,
                    page: 1,
                  },
                });
              }}
            />
          </div>
        </div>
        <div>
          <Button
            type="button"
            onClick={() => {
              const startTimestamp = moment(tempDate.start, "DD/MM/YYYY").unix();
              const endTimestamp = moment(tempDate.end, "DD/MM/YYYY").unix();
              const brandID = router.query.brandID || "";

              downloadReport(
                "brand",
                {
                  startDate: startTimestamp,
                  endDate: endTimestamp,
                  brandID,
                },
                token,
                `Sales_Brand_Report_${moment(tempDate.start, "DD/MM/YYYY").format("YYYYMMDD")}_${moment(tempDate.end, "DD/MM/YYYY").format("YYYYMMDD")}`,
                [
                  { header: "Brand Name", key: "name" },
                  { header: "Total Rentals", key: "total" },
                  { header: "Gross Sales", key: "gross_sales" },
                  { header: "Taxes", key: "taxes" },
                  { header: "Sales", key: "sales" },
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

      {/* Chart Section */}
      {isMounted && (
        <div className="mt-4">
          <DataTable
            columns={ColumnSalesBrand}
            data={
              reportData?.data_list?.map((item: any) => ({
                brand_name: item.name,
                total_rentals: item.total,
                net_sales: item.gross_sales,
                taxes: item.taxes,
                sales: item.sales,
              })) || []
            }
            pagination
            highlightOnHover
            paginationDefaultPage={currentPage}
            paginationPerPage={rowsPerPage}
            paginationTotalRows={reportData?.count || 0}
            paginationRowsPerPageOptions={[10, 20, 50, 100, 999]}
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
              setDate={setTempDate}
              onSave={(dateRange) => {
                setModal({ open: false, key: "", data: {} });
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...query,
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                    page: 1,
                  },
                });
              }}
              onCancel={() => {
                setModal({ open: false, key: "", data: {} });
                setTempDate({
                  start: date.start,
                  end: date.end,
                });
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
