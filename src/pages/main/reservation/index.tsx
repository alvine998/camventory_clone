import Button from "@/components/Button";
import { useModal } from "@/components/Modal";
import CustomerDeleteModal from "@/components/modals/customer/delete";
import FilterModal from "@/components/modals/reservation/FilterModal";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { EyeIcon, Filter } from "lucide-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { ColumnReservation } from "@/constants/column_reservation";
import moment from "moment";

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
      search = "",
      customer = "",
      customer_id = "",
      status = "",
      location = "",
      startDate = "",
      endDate = "",
      order_by = "",
    } = query;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (typeof search === "string" && search.trim() !== "") {
      params.set("search", search);
    }

    if (typeof customer_id === "string" && customer_id.trim() !== "") {
      params.set("customer_id", customer_id);
    }

    if (typeof status === "string" && status.trim() !== "") {
      params.set("status", status?.toUpperCase());
    }

    if (typeof location === "string" && location.trim() !== "") {
      params.set("location", location);
    }

    if (typeof startDate === "string" && startDate.trim() !== "") {
      const startTimestamp = Number(startDate);
      // Only set if it's a valid number and positive epoch timestamp
      if (!isNaN(startTimestamp) && startTimestamp > 0) {
        params.set("start_date", String(startTimestamp));
      }
    }

    if (typeof endDate === "string" && endDate.trim() !== "") {
      const endTimestamp = Number(endDate);
      // Only set if it's a valid number and positive epoch timestamp
      if (!isNaN(endTimestamp) && endTimestamp > 0) {
        params.set("end_date", String(endTimestamp));
      }
    }

    // Parse and validate order_by parameter
    let orderByParam: string | null = null;

    // Valid columns and directions
    const validColumns = ["start_date", "end_date", "created_at", "id"];
    const validDirections = ["asc", "desc"];

    // Handle order_by="" or order_by= (empty string means default)
    if (typeof order_by === "string") {
      if (order_by.trim() === "") {
        // Empty string means default (created_at DESC), but we still send it to API
        orderByParam = "";
      } else {
        // Parse format: column:direction
        const parts = order_by.split(":");
        if (parts.length === 2) {
          const column = parts[0].trim();
          const direction = parts[1].trim().toLowerCase();

          // Validate column and direction
          if (
            validColumns.includes(column) &&
            validDirections.includes(direction)
          ) {
            orderByParam = order_by;
          } else {
            // Invalid format, use default (null means don't send parameter)
            orderByParam = null;
          }
        } else {
          // Invalid format, use default (null means don't send parameter)
          orderByParam = null;
        }
      }
    }
    // If orderByParam is null, don't send order_by parameter (API defaults to created_at DESC)

    if (orderByParam !== null) {
      params.set("order_by", orderByParam);
    }

    const table = await axios.get(
      `${CONFIG.API_URL}/v1/reservation?${params.toString()}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    const customers = await axios.get(
      `${CONFIG.API_URL}/v1/customers?page=1&limit=10${customer ? `&search=${customer}` : ""
      }`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    if (table?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // Optionally validate token...
    return {
      props: { table: table?.data, customers: customers?.data?.data || [] },
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
      props: { table: [] },
    };
  }
};

export default function ReservationPage({ table, customers }: any) {
  const [show, setShow] = useState<boolean>(false);
  const [modal, setModal] = useState<useModal>();
  const router = useRouter();
  const [filter, setFilter] = useState<any>(router.query);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);

  const data = [...table?.data].map((item, index) => ({
    ...item,
    customer_name_comp: (
      <div className="flex flex-col gap-1 py-4">
        <span className="font-bold text-gray-800">
          {item.ref_customer?.name || "-"}
        </span>
        <div
          className={`text-[10px] px-2 py-0.5 rounded-full border w-fit font-medium ${item.ref_customer?.status?.toLowerCase() === "member"
            ? "bg-yellow-50 text-yellow-600 border-yellow-200"
            : item.ref_customer?.status?.toLowerCase() === "blacklist"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-blue-50 text-blue-600 border-blue-200"
            }`}
        >
          {item.ref_customer?.status?.toLowerCase() === "member"
            ? "Loyal Member"
            : item.ref_customer?.status?.toLowerCase() === "blacklist"
              ? "Blacklist Member"
              : "Reguler Member"}
        </div>
      </div>
    ),
    rental_duration: `${(item.end_date - item.start_date) / 86400} Hari`,
    transaction_date_comp: (
      <div className="text-gray-600">
        {moment(item.created_at * 1000).format("DD/MM/YYYY")}
      </div>
    ),
    start_date_comp: (
      <div className="py-2">
        <h5 className="font-bold text-gray-800">
          {moment(item.start_date * 1000).format("DD MMM")}
        </h5>
        <p className="text-gray-400 text-xs">
          {moment(item.start_date * 1000).format("ddd hh:mm A")}
        </p>
      </div>
    ),
    end_date_comp: (
      <div className="py-2">
        <h5 className="font-bold text-gray-800">
          {moment(item.end_date * 1000).format("DD MMM")}
        </h5>
        <p className="text-gray-400 text-xs">
          {moment(item.end_date * 1000).format("ddd hh:mm A")}
        </p>
      </div>
    ),
    taking_goods_comp: (
      <div className="py-2">
        <h5 className="font-bold text-gray-800">
          {moment(item.start_date * 1000).format("DD MMM")}
        </h5>
        <p className="text-gray-400 text-xs">
          {moment(item.start_date * 1000).format("ddd hh:mm A")}
        </p>
      </div>
    ),
    returned_items_comp: (
      <div className="py-2">
        <h5 className="font-bold text-gray-800">
          {moment(item.end_date * 1000).format("DD MMM")}
        </h5>
        <p className="text-gray-400 text-xs">
          {moment(item.end_date * 1000).format("ddd hh:mm A")}
        </p>
      </div>
    ),
    status_comp: (
      <div
        className={`px-3 py-1 rounded-full border text-[11px] font-bold w-fit uppercase ${item.status?.toLowerCase() === "booked"
          ? "bg-yellow-50 text-yellow-500 border-yellow-500"
          : item.status?.toLowerCase() === "cancel" ||
            item.status?.toLowerCase() === "cancelled"
            ? "bg-red-50 text-red-500 border-red-500"
            : item.status?.toLowerCase() === "checkout" ||
              item.status?.toLowerCase() === "completed"
              ? "bg-blue-50 text-blue-500 border-blue-500"
              : "bg-purple-50 text-purple-500 border-purple-500" // Check In or others
          }`}
      >
        {item.status}
      </div>
    ),
    employee_name: (
      <span className="text-gray-700">{item.ref_user?.name || "-"}</span>
    ),
    action: (
      <div key={index} className="flex gap-2">
        <button
          className="p-2 bg-white border border-orange-200 rounded-full text-orange-500 hover:bg-orange-50 transition-colors shadow-sm"
          type="button"
          onClick={() => {
            router.push(`/main/reservation/${item.id}/detail`);
          }}
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      </div>
    ),
  }));

  useEffect(() => {
    // Clean filter object to remove invalid values
    const cleanFilter: any = {};
    Object.entries(filter).forEach(([key, value]) => {
      // Skip invalid date values (NaN or empty)
      if (key === "startDate" || key === "endDate") {
        const timestamp = Number(value);
        if (!isNaN(timestamp) && timestamp > 0) {
          cleanFilter[key] = value;
        }
      } else if (value !== undefined && value !== null && value !== "") {
        cleanFilter[key] = value;
      }
    });

    const queryFilter = new URLSearchParams(cleanFilter).toString();
    const currentQuery = new URLSearchParams(window.location.search).toString();

    // Only push if the filter has actually changed
    if (queryFilter !== currentQuery) {
      router.push(`?${queryFilter}`).catch(() => {
        // Ignore navigation cancellation errors
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Handle filter modal apply
  const handleFilterApply = (appliedFilters: any) => {
    const newFilters: any = {
      page: 1,
      limit: router.query.limit || 10,
    };

    // Preserve order_by if it exists
    if (filter.order_by !== undefined) {
      newFilters.order_by = filter.order_by;
    }

    if (appliedFilters.customer?.value) {
      newFilters.customer_id = appliedFilters.customer.value;
    }
    if (appliedFilters.status?.value && appliedFilters.status.value !== "all") {
      newFilters.status = appliedFilters.status.value;
    }
    if (
      appliedFilters.location?.value &&
      appliedFilters.location.value !== "all"
    ) {
      newFilters.location = appliedFilters.location.value;
    }
    if (appliedFilters.startDate) {
      // Date input returns YYYY-MM-DD format, set to 00:00:00 and convert to Unix epoch (seconds)
      const startMoment = moment(
        appliedFilters.startDate,
        "YYYY-MM-DD",
        true
      ).startOf("day"); // Sets to 00:00:00
      if (startMoment.isValid()) {
        const startTimestamp = startMoment.unix();
        if (!isNaN(startTimestamp) && startTimestamp > 0) {
          newFilters.startDate = String(startTimestamp);
        }
      }
    }
    if (appliedFilters.endDate) {
      // Date input returns YYYY-MM-DD format, set to 23:59:59 and convert to Unix epoch (seconds)
      const endMoment = moment(
        appliedFilters.endDate,
        "YYYY-MM-DD",
        true
      ).endOf("day"); // Sets to 23:59:59
      if (endMoment.isValid()) {
        const endTimestamp = endMoment.unix();
        if (!isNaN(endTimestamp) && endTimestamp > 0) {
          newFilters.endDate = String(endTimestamp);
        }
      }
    }

    setFilter(newFilters);
  };

  return (
    <div className="px-2">
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">List Reservations</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2 flex-wrap">
          <Button
            variant="white"
            type="button"
            className="flex items-center gap-2"
            onClick={() => setModal({ open: true, key: "filter" })}
          >
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          {/* <div className="w-48">
            <Select
              options={[
                { value: "", label: "Default (Created At DESC)" },
                { value: "created_at:asc", label: "Created At (ASC)" },
                { value: "created_at:desc", label: "Created At (DESC)" },
                { value: "start_date:asc", label: "Start Date (ASC)" },
                { value: "start_date:desc", label: "Start Date (DESC)" },
                { value: "end_date:asc", label: "End Date (ASC)" },
                { value: "end_date:desc", label: "End Date (DESC)" },
                { value: "id:asc", label: "ID (ASC)" },
                { value: "id:desc", label: "ID (DESC)" },
              ]}
              value={
                typeof filter.order_by === "string"
                  ? {
                    value: filter.order_by,
                    label:
                      filter.order_by === ""
                        ? "Default (Latest Created)"
                        : filter.order_by === "created_at:asc"
                          ? "Created At (Oldest Created)"
                          : filter.order_by === "created_at:desc"
                            ? "Created At (Latest Created)"
                            : filter.order_by === "start_date:asc"
                              ? "Start Date (Oldest Start Date)"
                              : filter.order_by === "start_date:desc"
                                ? "Start Date (Latest Start Date)"
                                : filter.order_by === "end_date:asc"
                                  ? "End Date (Oldest End Date)"
                                  : filter.order_by === "end_date:desc"
                                    ? "End Date (Latest End Date)"
                                    : "Default (Latest Created)",
                  }
                  : { value: "", label: "Default (Created At DESC)" }
              }
              onChange={(selectedOption: any) => {
                const newOrderBy = selectedOption?.value || "";
                setFilter((prev: any) => {
                  const newFilter = { ...prev, page: 1 }; // Reset to page 1 when sorting changes
                  if (newOrderBy) {
                    newFilter.order_by = newOrderBy;
                  } else {
                    delete newFilter.order_by;
                  }
                  return newFilter;
                });
              }}
              placeholder="Sort by..."
              isClearable={false}
            />
          </div> */}
        </div>
        <div className="md:w-auto w-full">
          <Button
            variant="custom-color"
            className="bg-orange-500 text-white w-full md:w-auto"
            type="button"
            onClick={() => router.push("/main/reservation/create")}
          >
            + Add Reservation
          </Button>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        {show && (
          <div className="mt-4">
            <DataTable
              columns={ColumnReservation}
              data={data}
              pagination
              paginationServer
              paginationTotalRows={table?.meta?.total_data || 0}
              paginationRowsPerPageOptions={[10, 20, 50, 100]}
              highlightOnHover
              responsive
              onChangePage={(page) =>
                setFilter((prev: any) => ({ ...prev, page }))
              }
              onChangeRowsPerPage={(limit, page) => {
                const newFilter: any = { limit, page };
                // Preserve order_by if it exists
                if (filter.order_by !== undefined) {
                  newFilter.order_by = filter.order_by;
                }
                setFilter(newFilter);
              }}
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
      </div>
      {modal?.key == "delete" && (
        <CustomerDeleteModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
      {modal?.key == "filter" && (
        <FilterModal
          open={modal?.open}
          setOpen={setModal}
          onApply={handleFilterApply}
          customers={customers}
          initialFilters={{
            customer:
              typeof filter.customer_id === "string" && filter.customer_id
                ? {
                  value: filter.customer_id,
                  label:
                    customers.find((c: any) => c.id === filter.customer_id)
                      ?.name || filter.customer_id,
                }
                : null,
            status:
              typeof filter.status === "string" && filter.status !== "all"
                ? { value: filter.status, label: filter.status }
                : null,
            location:
              typeof filter.location === "string" && filter.location !== "all"
                ? { value: filter.location, label: filter.location }
                : null,
            startDate:
              typeof filter.startDate === "string" && filter.startDate
                ? (() => {
                  const timestamp = Number(filter.startDate);
                  if (
                    !isNaN(timestamp) &&
                    timestamp > 0 &&
                    moment.unix(timestamp).isValid()
                  ) {
                    // Date input expects YYYY-MM-DD format
                    return moment.unix(timestamp).format("YYYY-MM-DD");
                  }
                  return "";
                })()
                : "",
            endDate:
              typeof filter.endDate === "string" && filter.endDate
                ? (() => {
                  const timestamp = Number(filter.endDate);
                  if (
                    !isNaN(timestamp) &&
                    timestamp > 0 &&
                    moment.unix(timestamp).isValid()
                  ) {
                    // Date input expects YYYY-MM-DD format
                    return moment.unix(timestamp).format("YYYY-MM-DD");
                  }
                  return "";
                })()
                : "",
          }}
        />
      )}
    </div>
  );
}
