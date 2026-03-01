import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import { queryToUrlSearchParams } from "@/utils";
import axios from "axios";
import { UploadIcon, XIcon } from "lucide-react";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import Swal from "sweetalert2";

interface Props {
  open: boolean;
  setOpen: any;
}

export default function CustomerCreateModal({ open, setOpen }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [metaFile, setMetaFile] = useState<any>({
    file: null,
    path: null,
    preview: null,
    name: "",
  });
  const [nik, setNik] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = queryToUrlSearchParams(router?.query)?.toString();

  const onUpload = async (file: any) => {
    setLoading(true);
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
      setMetaFile((prev: any) => ({
        ...prev,
        path: message,
      }));
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));
    try {
      // If there's a new file but no path yet, wait for upload to complete
      if (metaFile?.file && !metaFile?.path) {
        await onUpload(metaFile.file);
      }
      const payload = {
        ...formData,
        path_ktp: metaFile?.path || null,
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
        title:
          error?.response?.data?.message?.message || "Error creating customer",
      });
      if (error?.response?.data?.message?.code === 401) {
        router.push("/");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMetaFile({
        file: file,
        path: null,
        preview: URL.createObjectURL(file),
        name: file.name,
      });
      onUpload(file);
    }
  };

  return (
    <div>
      <Modal open={open} setOpen={setOpen}>
        <div className="border-b-2 border-gray-200 pb-4 flex justify-between gap-2">
          <h1 className="font-bold text-xl text-orange-500">
            Add Customer
          </h1>
          <button type="button" onClick={setOpen}>
            <XIcon className="w-6 h-6 text-orange-500" />
          </button>
        </div>
        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-x-6 gap-y-4">
            {/* Row 1: KTP Photo & Name */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium">
                Customer ID Card Photo
              </label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 bg-white h-[46px]">
                <span className="text-xs text-blue-500 truncate flex-1">
                  {metaFile.name || "No file chosen"}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-500 text-white px-3 py-1 rounded flex items-center gap-1 text-xs hover:bg-orange-600 transition-colors"
                >
                  <UploadIcon className="w-3.5 h-3.5" />
                  Upload
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
            </div>

            <Input
              label="Customer Name"
              required={true}
              placeholder="Enter Customer Name"
              name="name"
              fullWidth
            />

            {/* Row 2: NIK & Email */}
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
              fullWidth
            />
            <Input
              label="Email"
              required={true}
              placeholder="Enter Email"
              name="email"
              type="email"
              fullWidth
            />

            {/* Row 3: Phone Number & Status Customer */}
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
              fullWidth
            />
            <Select
              label="Status Customer"
              required={true}
              name="status"
              options={[
                { value: "REGULAR_MEMBER", label: "Regular Member" },
                { value: "LOYAL_MEMBER", label: "Loyal Member" },
                { value: "BLACKLIST_MEMBER", label: "Blacklist Member" },
              ]}
              fullWidth
            />

            {/* Row 4: Instagram Account & Address */}
            <Input
              label="Instagram Account"
              required={true}
              placeholder="Enter Instagram Account"
              name="instagram_acc"
              fullWidth
            />
            <Input
              type="textarea"
              label="Address"
              required={true}
              placeholder="Enter Address"
              name="address"
              fullWidth
            />
          </div>

          <div className="w-full flex justify-end gap-3 border-t-2 border-t-gray-200 pt-6 mt-4">
            <Button
              variant="custom-color"
              className="border border-orange-500 text-orange-500 hover:bg-orange-50 rounded-[8px] px-8"
              type="button"
              onClick={setOpen}
            >
              Cancel
            </Button>
            <Button
              variant="submit"
              disabled={loading}
              type="submit"
              className="rounded-[8px] px-8"
            >
              {loading ? "Loading..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
