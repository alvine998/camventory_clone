import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import CustomerCreateModal from "@/components/modals/customer/create";
import CustomerDeleteModal from "@/components/modals/customer/delete";
import CustomerUpdateModal from "@/components/modals/customer/update";
import { CONFIG } from "@/config";
import { ColumnCustomer } from "@/constants/column_customer";
import axios from "axios";
import { parse } from "cookie";
import { PencilLineIcon, TrashIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
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
      `${CONFIG.API_URL}/v1/customers?${params.toString()}`,
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
      props: { table: { data: table?.data?.data, ...table?.data?.meta } },
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
  const data = [...table?.data].map((item, index) => ({
    ...item,
    ktp: (
      <div className="flex gap-2 items-center">
        <Image src={item.full_path_ktp} alt="ktp" width={50} height={50} />
        <Link
          className="text-blue-500"
          href={item.full_path_ktp}
          target="_blank"
        >
          View
        </Link>
      </div>
    ),
    action: (
      <div key={index} className="flex gap-2">
        <Button
          className="bg-orange-200 text-orange-500"
          variant="custom-color"
          type="button"
          onClick={() => {
            setModal({
              open: true,
              data: item,
              key: "update",
            });
          }}
        >
          <PencilLineIcon className="w-4 h-4" />
        </Button>
        <Button
          className="bg-red-200 text-red-500"
          variant="custom-color"
          type="button"
          onClick={() => {
            setModal({
              open: true,
              data: item,
              key: "delete",
            });
          }}
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    ),
  }));

  useEffect(() => {
    const queryFilter = new URLSearchParams(filter).toString();
    const currentQuery = new URLSearchParams(window.location.search).toString();
    
    // Only push if the filter has actually changed
    if (queryFilter !== currentQuery) {
      router.push(`?${queryFilter}`, undefined, { shallow: true }).catch(() => {
        // Ignore navigation cancellation errors
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  return (
    <div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">List Customer</h1>
      </div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between mt-4">
        <Input
          placeholder="Search Customer"
          type="search"
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <Button
          variant="custom-color"
          className="bg-orange-500 text-white"
          type="button"
          onClick={() => setModal({ open: true, key: "create" })}
        >
          + Add Customer
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
              paginationTotalRows={table?.total_data || 0}
              paginationRowsPerPageOptions={[10, 20, 50, 100]}
              paginationServer
              onChangePage={(page) =>
                setFilter((prev: any) => ({ ...prev, page }))
              }
              onChangeRowsPerPage={(limit, page) => setFilter({ limit, page })}
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
      {modal?.key == "create" && (
        <CustomerCreateModal open={modal?.open} setOpen={setModal} />
      )}
      {modal?.key == "update" && (
        <CustomerUpdateModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
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
