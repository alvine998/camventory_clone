import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import CustomerDeleteModal from "@/components/modals/customer/delete";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { EyeIcon, Filter, X } from "lucide-react";
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
    const { page = 1, limit = 10, search = "" } = query;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (typeof search === "string" && search.trim() !== "") {
      params.set("search", search);
    }

    const table = await axios.get(
      `${CONFIG.API_URL}/v1/reservation?${params.toString()}`,
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
    console.log(table?.data?.data)

    // Optionally validate token...
    return { props: { table: table?.data } };
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

export default function ReservationPage({ table }: any) {
  const [show, setShow] = useState<boolean>(false);
  const [modal, setModal] = useState<useModal>();
  const router = useRouter();
  const [filter, setFilter] = useState(() => ({
    search: typeof router.query.search === "string" ? router.query.search : "",
    status:
      typeof router.query.status === "string" ? router.query.status : "all",
    location:
      typeof router.query.location === "string" ? router.query.location : "all",
    customer:
      typeof router.query.customer === "string" ? router.query.customer : "",
    page: router.query.page ? Number(router.query.page) : 1,
    limit: router.query.limit ? Number(router.query.limit) : 10,
  }));
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);
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
    action: (
      <div key={index} className="flex gap-2">
        <Button
          className="bg-orange-200 text-orange-500"
          variant="custom-color"
          type="button"
          onClick={() => {
            router.push(`/main/reservation/${item.id}/detail`);
          }}
        >
          <EyeIcon className="w-4 h-4" />
        </Button>
      </div>
    ),
  }));
  // Update URL when filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const queryParams = new URLSearchParams();

      // Always include pagination
      queryParams.set("page", String(filter.page));
      queryParams.set("limit", String(filter.limit));

      // Only include search if it has a value
      if (filter.search) {
        queryParams.set("search", filter.search);
      }

      // Only include status if it's not 'all'
      if (filter.status && filter.status !== "all") {
        queryParams.set("status", filter.status);
      }

      // Only include location if it's not 'all'
      if (filter.location && filter.location !== "all") {
        queryParams.set("location", filter.location);
      }

      // Only include customer if it has a value
      if (filter.customer) {
        queryParams.set("customer", filter.customer);
      }

      // Only update URL if there are actual changes
      const currentQuery = new URLSearchParams(window.location.search);
      if (queryParams.toString() !== currentQuery.toString()) {
        router.push(`?${queryParams.toString()}`, undefined, { shallow: true });
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [filter, router]);

  // Reset all filters
  const handleResetFilters = () => {
    setFilter({
      search: "",
      status: "all",
      location: "all",
      customer: "",
      page: 1,
      limit: filter.limit,
    });
  };

  // Check if any filter is active
  const isFilterActive =
    filter.search ||
    filter.status !== "all" ||
    filter.location !== "all" ||
    filter.customer;
  return (
    <div>
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
              highlightOnHover
              responsive
              onChangeRowsPerPage={(limit) =>
                setFilter((prev) => ({ ...prev, limit, page: 1 }))
              }
              onChangePage={(page) => setFilter((prev) => ({ ...prev, page }))}
              paginationPerPage={filter.limit}
              paginationDefaultPage={filter.page}
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
    </div>
  );
}
