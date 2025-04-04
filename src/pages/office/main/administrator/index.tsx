import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import AdminCreateModal from "@/components/modals/administrator/create";
import AdminDeleteModal from "@/components/modals/administrator/delete";
import AdminUpdateModal from "@/components/modals/administrator/update";
import { ColumnAdministrator } from "@/constants/column_administrator";
import { PencilLineIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";

export default function AdministratorPage() {
  const [show, setShow] = useState<boolean>(false);
  const [modal, setModal] = useState<useModal>();
  const router = useRouter();
  const [filter, setFilter] = useState<any>(router.query);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);
  const dummyData = [
    {
      id: 1,
      name: "Alvine",
      email: "alvine@gmail.com",
      phone: "08998888888",
      placement: "Cipadung",
      address: "Cipadung",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      name: "Fadhil",
      email: "fadhil@gmail.com",
      phone: "08998888888",
      placement: "All",
      address: "All",
      role: "Admin",
      status: "Active",
    },
    {
      id: 3,
      name: "Raka",
      email: "raka@gmail.com",
      phone: "08998888888",
      address: "Dipatiukur",
      placement: "Dipatiukur",
      role: "Admin",
      status: "Suspend",
    },
  ].map((item, index) => ({
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
  }, [filter, router]);
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
              data={dummyData}
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
