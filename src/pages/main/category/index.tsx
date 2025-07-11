import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import CategoryCreateModal from "@/components/modals/category/create";
import CategoryDeleteModal from "@/components/modals/category/delete";
import CategoryUpdateModal from "@/components/modals/category/update";
import { CONFIG } from "@/config";
import { ColumnCategory } from "@/constants/column_category";
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
      `${CONFIG.API_URL}/v1/master/categories?${params.toString()}`,
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
        <h1 className="text-2xl font-bold">List Category Items</h1>
      </div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between mt-4">
        <Input
          placeholder="Search Category Items"
          type="search"
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <Button
          variant="custom-color"
          className="bg-orange-500 text-white"
          type="button"
          onClick={() => setModal({ open: true, key: "create" })}
        >
          + Add Category
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        {show && (
          <div className="mt-4">
            <DataTable
              columns={ColumnCategory}
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
        <CategoryCreateModal open={modal?.open} setOpen={setModal} />
      )}
      {modal?.key == "update" && (
        <CategoryUpdateModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
      {modal?.key == "delete" && (
        <CategoryDeleteModal
          open={modal?.open}
          setOpen={setModal}
          data={modal?.data}
        />
      )}
    </div>
  );
}
