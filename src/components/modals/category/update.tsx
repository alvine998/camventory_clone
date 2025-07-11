import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import { ICustomer } from "@/types/customer";
import { queryToUrlSearchParams } from "@/utils";
import axios from "axios";
import { XIcon } from "lucide-react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Swal from "sweetalert2";

interface Props {
  open: boolean;
  setOpen: any;
  data: ICustomer;
}

export default function CategoryUpdateModal({ open, setOpen, data }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const params = queryToUrlSearchParams(router?.query)?.toString();

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));
    try {
      const payload = {
        ...formData,
        id: data.id,
      };
      await axios.patch("/api/category", payload);
      Swal.fire({
        icon: "success",
        title: "Category Items Updated Successfully",
        showConfirmButton: false,
        timer: 1500,
      });
      setLoading(false);
      setOpen();
      router.push(`?${params}`);
    } catch (error: any) {
      console.log(error);
      Swal.fire({
        icon: "error",
        title:
          error?.response?.data?.message?.message ||
          "Error updating category items",
      });
      if (error?.response?.data?.message?.code === 401) {
        router.push("/");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
  };
  return (
    <div>
      <Modal open={open} setOpen={setOpen}>
        <div className="border-b-2 border-gray-200 pb-4 flex justify-between gap-2">
          <h1 className="text-center font-bold text-xl text-orange-500">
            Update Category Items
          </h1>
          <button type="button" onClick={setOpen}>
            <XIcon className="w-6 h-6 text-orange-500" />
          </button>
        </div>
        <form className="mt-4 flex flex-col gap-2" onSubmit={onSubmit}>
          <Input
            label="Category Name"
            required={true}
            placeholder="Enter Category Name"
            name="name"
            defaultValue={data.name}
          />

          <div className="w-full flex justify-end gap-2 border-t-2 border-t-gray-200 pt-4 mt-2">
            <Button
              variant="custom-color"
              className="border border-orange-500 text-orange-500"
              type="button"
              onClick={setOpen}
            >
              Close
            </Button>
            <Button variant="submit" disabled={loading} type="submit">
              {loading ? "Loading..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
