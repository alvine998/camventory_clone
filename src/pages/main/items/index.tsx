import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import CustomerDeleteModal from "@/components/modals/customer/delete";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import { ColumnCustomer } from "@/constants/column_customer";
import axios from "axios";
import { parse } from "cookie";
import { EyeIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";

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
      `${CONFIG.API_URL}/v1/items?${params.toString()}`,
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
    return { props: { table: table?.data?.data } };
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

export default function AdministratorPage({ table }: any) {
  const [show, setShow] = useState<boolean>(false);
  const [modal, setModal] = useState<useModal>();
  const router = useRouter();
  const [filter, setFilter] = useState<any>(router.query);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);
  const data = [...table].map((item, index) => ({
    ...item,
    item_name: (
      <div className="flex gap-2 items-center">
        <Image src={item.full_path_ktp} alt="ktp" width={50} height={50} />
        <div>
          <h5 className="text-black">{item.name}</h5>
          <div>
            <p>Available</p>
            <p>QRCode</p>
            <p>{item.code}</p>
          </div>
        </div>
      </div>
    ),
    action: (
      <div key={index} className="flex gap-2">
        <Button
          className="bg-orange-200 text-orange-500"
          variant="custom-color"
          type="button"
          onClick={() => {}}
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
        <h1 className="text-2xl font-bold">List Items</h1>
      </div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between mt-4">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search Items"
            type="search"
            onChange={(e) => setFilter({ search: e.target.value })}
          />
          <Select
            options={[]}
            placeholder="Bulk Items"
            onChange={(e) => setFilter({ bulk: e })}
          />
          <Select
            options={[
              { value: "all", label: "All" },
              { value: "cipadung", label: "Cipadung" },
              { value: "dipatiukur", label: "Dipatiukur" },
            ]}
            placeholder="Location"
            onChange={(e) => setFilter({ location: e })}
          />
          <button className="text-red-500 hover:text-red-600 text-lg">
            Reset Filter
          </button>
        </div>
        <Button
          variant="custom-color"
          className="bg-orange-500 text-white"
          type="button"
          onClick={() => router.push("/main/items/create")}
        >
          + Add Items
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        {show && (
          <div className="mt-4">
            <DataTable
              columns={ColumnCustomer}
              data={data}
              pagination
              highlightOnHover
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
