import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import { queryToUrlSearchParams } from "@/utils";
import { XIcon } from "lucide-react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Swal from "sweetalert2";

interface Props {
  open: boolean;
  setOpen: any;
}

export default function AdminCreateModal({ open, setOpen }: Props) {
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
      Swal.fire({
        icon: "success",
        title: "User Created Successfully",
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
        title: error?.response?.data?.error_message || "Error creating user",
      });
      setLoading(false);
    }
  };
  return (
    <div>
      <Modal open={open} setOpen={setOpen}>
        <div className="border-b-2 border-gray-200 pb-4 flex justify-between gap-2">
          <h1 className="text-center font-bold text-xl text-orange-500">
            Add User
          </h1>
          <button type="button" onClick={setOpen}>
            <XIcon className="w-6 h-6 text-orange-500" />
          </button>
        </div>
        <form className="mt-4 flex flex-col gap-2" onSubmit={onSubmit}>
          <Input
            label="Name"
            required={true}
            placeholder="Enter Name"
            name="name"
          />
          <Input
            label="Email"
            required={true}
            placeholder="Enter Email"
            name="email"
            type="email"
          />
          <Input
            label="Password"
            required={true}
            placeholder="Enter Password"
            name="password"
            type="password"
          />
          <Input
            label="Phone Number"
            required={true}
            placeholder="Enter Phone Number"
            name="phone"
            type="number"
          />
          <Select
            options={[
              { value: "All", label: "All" },
              { value: "Cipadung", label: "Cipadung" },
              { value: "Dipatiukur", label: "Dipatiukur" },
            ]}
            label="Placement"
            required={true}
            placeholder="Choose Placement"
            name="placement"
          />
          <Select
            options={[
              { value: "Admin", label: "Admin" },
              { value: "Staff", label: "Staff" },
              { value: "Head Staff", label: "Head Staff" },
            ]}
            label="Role"
            required={true}
            placeholder="Choose Role"
            name="role"
          />
          <Select
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
              { value: "Suspend", label: "Suspend" },
            ]}
            label="Status"
            required={true}
            placeholder="Choose Status"
            name="status"
          />
          <Input
            label="Address"
            required={true}
            placeholder="Enter Address"
            name="address"
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
