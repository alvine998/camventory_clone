import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { queryToUrlSearchParams } from "@/utils";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useState } from "react";
interface Props {
  open: boolean;
  setOpen: any;
  data: any;
}
export default function AdminDeleteModal({ open, setOpen, data }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const params = queryToUrlSearchParams(router?.query)?.toString();

  const onSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));
    try {
      const payload = {
        ...formData,
      };
      console.log(payload);
      setLoading(false);
      setOpen();
      router.push(`?${params}`);
    } catch (error: any) {
      console.log(error);
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
