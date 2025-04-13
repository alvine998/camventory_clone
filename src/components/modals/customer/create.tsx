import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import { queryToUrlSearchParams } from "@/utils";
import axios from "axios";
import { XIcon } from "lucide-react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Swal from "sweetalert2";

interface Props {
  open: boolean;
  setOpen: any;
}

export default function CustomerCreateModal({ open, setOpen }: Props) {
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
      await axios.post("/api/customer", payload);
      Swal.fire({
        icon: "success",
        title: "Customer Created Successfully",
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
        title: error?.response?.data?.message?.message || "Error creating user",
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
            Add Customer
          </h1>
          <button type="button" onClick={setOpen}>
            <XIcon className="w-6 h-6 text-orange-500" />
          </button>
        </div>
        <form className="mt-4 flex flex-col gap-2" onSubmit={onSubmit}>
          <Input
            label="Customer Name"
            required={true}
            placeholder="Enter Customer Name"
            name="name"
          />
          <Input
            label="NIK"
            required={true}
            placeholder="Enter NIK"
            name="nik"
            type="number"
          />
          <Input
            label="Phone Number"
            required={true}
            placeholder="Enter Phone Number"
            name="phone_number"
          />
          <Input
            label="Member No"
            required={true}
            placeholder="Enter Member No"
            name="member_no"
          />
          <Input
            label="Join Date"
            required={true}
            placeholder="Enter Join Date"
            name="join_date"
            type="date"
          />
          <Input
            label="Instagram Account"
            required={true}
            placeholder="Enter Instagram Account"
            name="instagram_acc"
          />
          <Input
            label="Customer ID Card Photo"
            placeholder="Enter Customer ID Card Photo"
            name="path_ktp"
            type="file"
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
