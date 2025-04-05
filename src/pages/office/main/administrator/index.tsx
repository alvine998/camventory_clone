import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import AdminCreateModal from "@/components/modals/administrator/create";
import AdminDeleteModal from "@/components/modals/administrator/delete";
import AdminUpdateModal from "@/components/modals/administrator/update";
import { CONFIG } from "@/config";
import { ColumnAdministrator } from "@/constants/column_administrator";
import axios from "axios";
import { parse } from "cookie";
import { PencilLineIcon, TrashIcon } from "lucide-react";
import { GetServerSideProps } from "next";
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
          destination: "/office/login",
          permanent: false,
        },
      };
    }
    const filters = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const table = await axios.get(
      `${CONFIG.API_URL}/accounts/v1/users/all?page=${filters.page}&limit=${filters.limit}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    if (table?.status === 401) {
      return {
        redirect: {
          destination: "/office/login",
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
          destination: "/office/login",
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
    router.push(`?${queryFilter}`);
  }, [filter]);
  return (
    <div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">List Admin Camventory</h1>
      </div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between mt-4">
        <Input
          placeholder="Search Administrator"
          type="search"
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <Button
          variant="custom-color"
          className="bg-orange-500 text-white"
          type="button"
          onClick={() => setModal({ open: true, key: "create" })}
        >
          + Add User
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        {show && (
          <div className="mt-4">
            <DataTable
              columns={ColumnAdministrator}
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
      {modal?.key == "create" && (
        <AdminCreateModal open={modal?.open} setOpen={setModal} />
      )}
      {modal?.key == "update" && (
        <AdminUpdateModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
      {modal?.key == "delete" && (
        <AdminDeleteModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
    </div>
  );
}
