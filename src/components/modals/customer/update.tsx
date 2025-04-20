import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import { ICustomer } from "@/types/customer";
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
  data: ICustomer;
}

export default function CustomerUpdateModal({ open, setOpen, data }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [metaFile, setMetaFile] = useState<any>({
    file: data.path_ktp,
    path: data.full_path_ktp,
  });
  const [nik, setNik] = useState<string>(data.nik);
  const [phone, setPhone] = useState<string>(data.phone_number);
  const params = queryToUrlSearchParams(router?.query)?.toString();

  const onUpload = async (file: any) => {
    setLoading(true)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "customer_ktp");
    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const { message } = response.data.payload;
      setMetaFile({
        file: file,
        path: message,
        preview: URL.createObjectURL(file),
      });
      setLoading(false)
    } catch (error) {
      console.log(error);
      setLoading(false)
    }
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));
    try {
      const payload = {
        ...formData,
        path_ktp: metaFile?.preview ? metaFile?.path : data.path_ktp,
        id: data.id
      };
      await axios.patch("/api/customer", payload);
      Swal.fire({
        icon: "success",
        title: "Customer Updated Successfully",
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
        title: error?.response?.data?.message?.message || "Error updating customer",
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
            Update Customer
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
            defaultValue={data.name}
          />
          <Input
            label="NIK"
            required={true}
            placeholder="Enter NIK"
            name="nik"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={nik}
            minLength={16}
            maxLength={16}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/[^0-9]/g, "");
              setNik(onlyNums);
            }}
          />
          <Input
            label="Phone Number"
            required={true}
            placeholder="Enter Phone Number"
            name="phone_number"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={phone}
            maxLength={13}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/[^0-9]/g, "");
              setPhone(onlyNums);
            }}
          />
          <Input
            label="Instagram Account"
            required={true}
            placeholder="Enter Instagram Account"
            name="instagram_acc"
            defaultValue={data.instagram_acc}
          />
          <Input
            label="Customer ID Card Photo"
            placeholder="Enter Customer ID Card Photo"
            name="path_ktp"
            type="file"
            onChange={(e: any) => {
              onUpload(e.target.files[0]);
            }}
          />
          {metaFile.path && (
            <Image
              src={metaFile.preview || metaFile.path}
              alt="image"
              width={200}
              height={150}
              className="w-auto h-auto"
              layout="responsive"
            />
          )}

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
