import Button from "@/components/Button";
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
import Input from "@/components/Input";
import { ColumnSalesBrand } from "@/constants/column_sales_brand";
import Select from "@/components/Select";
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

    const startDateStr = (startDate as string) || moment().format("DD/MM/YYYY");
    const endDateStr =
      (endDate as string) || moment().add(30, "days").format("DD/MM/YYYY");

    const startTimestamp = moment(startDateStr, "DD/MM/YYYY").unix();
    const endTimestamp = moment(endDateStr, "DD/MM/YYYY").unix();

    const brandParams: any = {
      page,
      limit,
      startDate: startTimestamp,
      endDate: endTimestamp,
    };

    if (typeof categoryID === "string" && categoryID.trim() !== "") {
      brandParams.categoryID = categoryID;
    }

    const reportResponse = await axios.get(
      `${CONFIG.API_URL}/v1/report/brand`,
      {
        params: brandParams,
        headers: {
          Authorization: `${token}`,
        },
      }
    );

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

export default function SalesProductPage({
  reportData,
  categories,
  dateRange,
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
  const [modal, setModal] = useState<useModal>();
  const [isMounted, setIsMounted] = useState(false);

  // Update tempDate when date changes (from SSR)
  useEffect(() => {
    setTempDate({
      start: date.start,
      end: date.end,
    });
  }, [date.start, date.end]);

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
          <Input type="search" placeholder="Search Brand" />
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
                      ...query,
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
