import Button from "@/components/Button";
import { useModal } from "@/components/Modal";
import CustomerDeleteModal from "@/components/modals/customer/delete";
import FilterModal from "@/components/modals/reservation/FilterModal";
import Badge from "@/components/Badge";
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
import TooltipComponent from "@/components/TooltipComponent";

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
      params.set("start_date", String(startDate));
    }

    if (typeof endDate === "string" && endDate.trim() !== "") {
      params.set("end_date", String(endDate));
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
      `${CONFIG.API_URL}/v1/customers?page=1&limit=10${
        customer ? `&search=${customer}` : ""
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
  // Helper function to get badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "available";
      case "pending":
        return "warning";
      case "cancelled":
        return "empty";
      case "completed":
        return "available";
      case "overdue":
        return "empty";
      case "booked":
        return "warning";
      default:
        return "custom";
    }
  };

  const data = [...table?.data].map((item, index) => ({
    ...item,
    rental_duration: `${(item.end_date - item.start_date) / 86400} ${
      (item.end_date - item.start_date) / 86400 == 1 ? "Day" : "Days"
    }`,
    start_date: (
      <div>
        <h5 className="font-bold">
          {moment(item.start_date * 1000).format("DD MMM")}
        </h5>
        <p className="text-gray-500">
          {moment(item.start_date * 1000).format("ddd HH:mm")}
        </p>
      </div>
    ),
    end_date: (
      <div>
        <h5 className="font-bold">
          {moment(item.end_date * 1000).format("DD MMM")}
        </h5>
        <p className="text-gray-500">
          {moment(item.end_date * 1000).format("ddd HH:mm")}
        </p>
      </div>
    ),
    status: (
      <Badge color={getStatusBadgeColor(item.status)} text={item.status}>
        {item.status}
      </Badge>
    ),
    action: (
      <div key={index} className="flex gap-2">
        <TooltipComponent content="View details">
          <Button
            className="bg-orange-50 text-orange-500"
            variant="custom-color"
            type="button"
            onClick={() => {
              router.push(`/main/reservation/${item.id}/detail`);
            }}
          >
            <EyeIcon className="w-4 h-4" />
          </Button>
        </TooltipComponent>
      </div>
    ),
  }));

  useEffect(() => {
    const queryFilter = new URLSearchParams(filter).toString();
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
      // Convert DD/MM/YYYY to Unix epoch (seconds)
      const startTimestamp = moment(appliedFilters.startDate, "DD/MM/YYYY").unix();
      newFilters.startDate = String(startTimestamp);
    }
    if (appliedFilters.endDate) {
      // Convert DD/MM/YYYY to Unix epoch (seconds)
      const endTimestamp = moment(appliedFilters.endDate, "DD/MM/YYYY").unix();
      newFilters.endDate = String(endTimestamp);
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
              onChangeRowsPerPage={(limit, page) => setFilter({ limit, page })}
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
                ? moment.unix(Number(filter.startDate)).format("DD/MM/YYYY")
                : "",
            endDate:
              typeof filter.endDate === "string" && filter.endDate
                ? moment.unix(Number(filter.endDate)).format("DD/MM/YYYY")
                : "",
          }}
        />
      )}
    </div>
  );
}
