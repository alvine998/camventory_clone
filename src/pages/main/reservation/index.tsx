import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import CustomerDeleteModal from "@/components/modals/customer/delete";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { EyeIcon } from "lucide-react";
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
  const [filter, setFilter] = useState<any>(router.query);
  console.log(table,'lslsl')
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
  useEffect(() => {
    const queryFilter = new URLSearchParams(filter).toString();
    router.push(`?${queryFilter}`);
  }, [filter]);
  return (
    <div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">List Reservations</h1>
      </div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between mt-4">
        <div className="flex gap-2 items-center w-full">
          <Input
            placeholder="Search Reservation"
            type="search"
            onChange={(e) => setFilter({ search: e.target.value })}
            fullWidth
          />
          <Select
            options={[]}
            placeholder="Status"
            onChange={(e) => setFilter({ status: e })}
            fullWidth
          />
          <Select
            options={[
              { value: "all", label: "All" },
              { value: "cipadung", label: "Cipadung" },
              { value: "dipatiukur", label: "Dipatiukur" },
            ]}
            placeholder="Location"
            onChange={(e) => setFilter({ location: e })}
            fullWidth
          />
          <Select
            options={[]}
            placeholder="Customer"
            onChange={(e) => setFilter({ customer: e })}
            fullWidth
          />
          <button className="text-red-500 hover:text-red-600 text-lg w-1/2">
            Reset Filter
          </button>
        </div>
        <div className="md:w-1/5 w-full flex items-end justify-end">
          <Button
            variant="custom-color"
            className="bg-orange-500 text-white w-auto"
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
              paginationTotalRows={table?.meta?.total_data}
              highlightOnHover
              responsive
              onChangeRowsPerPage={(e) => setFilter({ limit: e })}
              onChangePage={(e) => setFilter({ page: e })}
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
