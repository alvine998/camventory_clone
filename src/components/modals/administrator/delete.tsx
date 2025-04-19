import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { queryToUrlSearchParams } from "@/utils";
import axios from "axios";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Swal from "sweetalert2";
interface Props {
  open: boolean;
  setOpen: any;
  data: any;
}
export default function AdminDeleteModal({ open, setOpen, data }: Props) {
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
      };
      await axios.delete("/api/office/administrator", { data: payload });
      Swal.fire({
        icon: "success",
        title: "User Deleted Successfully",
        showConfirmButton: false,
        timer: 1500,
      });
      setLoading(false);
      setOpen();
      router.push(`?${params}`);
    } catch (error: any) {
      console.log(error, "error");
      Swal.fire({
        icon: "error",
        title: error?.response?.data?.message?.message || "Error deleting user",
      });
      if (error?.response?.data?.message?.code === 401) {
        router.push("/office/login");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
  };
  return (
    <div>
      <Modal open={open} setOpen={setOpen}>
        <div className=" flex justify-between gap-2">
          <div className="w-full"></div>
          <button type="button" onClick={setOpen}>
            <XIcon className="w-6 h-6 text-red-500" />
          </button>
        </div>
        <Image
          alt="logo"
          src={"/icons/delete_trash.svg"}
          layout="relative"
          className="w-16 h-16 mx-auto"
          width={50}
          height={50}
        />
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2">
          <input type="hidden" name="id" value={data.id} />
          <input type="hidden" name="data" value={JSON.stringify(data)} />
          <p className="text-center text-gray-600">
            Are you sure you want to delete {data.name} ?
          </p>
          <div className="w-full flex justify-center gap-2 mt-2">
            <Button
              variant="custom-color"
              className="border border-red-500 text-red-500"
              type="button"
              onClick={setOpen}
            >
              Cancel
            </Button>
            <Button variant="danger" disabled={loading} type="submit">
              {loading ? "Loading..." : "Delete"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
