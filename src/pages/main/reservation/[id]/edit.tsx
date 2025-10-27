import Button from "@/components/Button";
import Input from "@/components/Input";
import AddEquipmentsModal from "@/components/modals/reservation/AddEquipments";
// import Select from "@/components/Select";
import { CONFIG } from "@/config";
import { IDetail, IReservation } from "@/types/reservation";
import axios from "axios";
import { parse } from "cookie";
import { ArrowLeftIcon, PlusSquareIcon, Trash2Icon } from "lucide-react";
import moment from "moment";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

// ✅ Types
interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  serial_number?: string;
  full_path_image: string;
}

interface Props {
  categories: Category[];
  brands: Brand[];
  bulkItems: Item[];
  singleItems: Item[];
  users: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  detail: IReservation;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req, params } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;

  if (!token) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  try {
    const { page = "1", limit = "10", search = "" } = query;

    const [
      categories,
      brands,
      bulkItems,
      singleItems,
      users,
      customers,
      detail,
    ] = await Promise.all([
      axios.get(`${CONFIG.API_URL}/v1/master/categories`, {
        headers: { Authorization: token },
      }),
      axios.get(`${CONFIG.API_URL}/v1/master/brands`, {
        headers: { Authorization: token },
      }),
      axios.get(
        `${CONFIG.API_URL}/v1/bulk-items?page=${page}&limit=${limit}${
          search ? `&search=${search}` : ""
        }`,
        {
          headers: { Authorization: token },
        }
      ),
      axios.get(
        `${CONFIG.API_URL}/v1/single-items?page=${page}&limit=${limit}${
          search ? `&search=${search}` : ""
        }`,
        {
          headers: { Authorization: token },
        }
      ),
      axios.get(`${CONFIG.API_URL}/accounts/v1/users/all?page=1&limit=100`, {
        headers: {
          Authorization: `${token}`,
        },
      }),
      axios.get(`${CONFIG.API_URL}/v1/customers?page=1&limit=100`, {
        headers: {
          Authorization: `${token}`,
        },
      }),
      axios.get(`${CONFIG.API_URL}/v1/reservation/${params?.id}`, {
        headers: {
          Authorization: `${token}`,
        },
      }),
    ]);

    return {
      props: {
        categories: categories.data?.data || [],
        brands: brands.data?.data || [],
        bulkItems: bulkItems.data?.data || [],
        singleItems: singleItems.data?.data || [],
        users: users.data?.data || [],
        customers: customers.data?.data || [],
        detail: detail.data?.data || {},
      },
    };
  } catch (error: any) {
    if (error?.response?.status === 401) {
      return { redirect: { destination: "/", permanent: false } };
    }
    return {
      props: { categories: [], brands: [], bulkItems: [], singleItems: [] },
    };
  }
};

export default function EditReservationPage({
  bulkItems,
  singleItems,
  users,
  customers,
  detail,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>(detail?.details || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    customer_id: detail?.ref_customer?.id || "",
    user_id: detail?.ref_user?.id || "",
    pickup_location: detail?.pickup_location || "dipatiukur",
    from: moment(detail?.start_date * 1000).format("YYYY-MM-DD") || "",
    to: moment(detail?.end_date * 1000).format("YYYY-MM-DD") || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...detail,
      ...formData,
      start_date: formData.from
        ? Math.floor(new Date(formData.from).getTime() / 1000)
        : null,
      end_date: formData.to
        ? Math.floor(new Date(formData.to).getTime() / 1000)
        : null,
      items: JSON.stringify(
        items?.map((item: any) => ({
          uuid: item.id,
          qty: item?.qty || item?.added || 1,
          type: item?.item_type || (item?.category ? "single" : "bulk"),
        })) || []
      ),
      customer_uuid: formData.customer_id || detail?.ref_customer?.id || "",
      location:
        formData.pickup_location || detail?.pickup_location || "dipatiukur",
      user_uuid: formData.user_id || detail?.ref_user?.id || "",
      id: detail?.id,
    };

    console.log("Payload being sent:", payload);

    // Ensure required fields are present
    if (!payload.customer_id || !payload.user_id || !payload.pickup_location) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill all required fields",
      });
      setLoading(false);
      return;
    }

    try {
      await axios.patch("/api/reservation", payload);
      Swal.fire({
        icon: "success",
        title: "Reservation Edited Successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      router.push(`/main/reservation`);
    } catch (error: any) {
      console.error("Update error:", error);
      const errorMessage =
        error.response?.data?.message &&
        typeof error.response?.data?.message === "string"
          ? error.response?.data?.message
          : error.response?.data?.message?.message || "An error occurred while updating the reservation";

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: errorMessage,
        html: errorMessage?.includes("Date conflict detected")
          ? `<div style="text-align: left; white-space: pre-line;">${errorMessage}</div>`
          : errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(filter).length > 0) {
      const queryFilter = new URLSearchParams(filter).toString();
      router.push(`?${queryFilter}`);
    }
  }, [filter, router]);

  const CUSTOMERS = customers.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const USERS = users.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  return (
    <div>
      <div className="flex flex-row gap-2 items-center">
        <button
          onClick={() => router.push(`/main/reservation/${detail?.id}/detail`)}
          type="button"
        >
          <ArrowLeftIcon className="w-6 h-6 text-orange-500" />
        </button>
        <h1 className="text-2xl font-bold text-orange-500">
          Edit Reservation Data
        </h1>
      </div>

      <form onSubmit={onSubmit} className="mt-6 mb-20">
        {/* Customer & User */}
        <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Customer</option>
              {CUSTOMERS.map((customer) => (
                <option key={customer.value} value={customer.value}>
                  {customer.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User/Employee <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              name="user_id"
              value={formData.user_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select User/Employee</option>
              {USERS.map((user) => (
                <option key={user.value} value={user.value}>
                  {user.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates & Location */}
        <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
          <div className="grid grid-cols-2 gap-4 w-full">
            <Input
              placeholder="From"
              label="From"
              name="from"
              fullWidth
              required
              type="date"
              value={formData.from}
              onChange={handleInputChange}
            />
            <Input
              placeholder="To"
              label="To"
              name="to"
              fullWidth
              required
              type="date"
              value={formData.to}
              onChange={handleInputChange}
              min={formData.from}
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleInputChange}
              required
            >
              <option value="dipatiukur">Dipatiukur</option>
              <option value="cipadung">Cipadung</option>
            </select>
          </div>
        </div>

        {/* Equipment Section */}
        <div className="mt-4">
          <h1 className="text-xl font-bold text-orange-500">Equipments</h1>
          <div className="border rounded p-4 mt-2">
            <div className="flex justify-center items-center">
              <button
                className="border border-orange-500 p-2 rounded flex items-center gap-2"
                type="button"
                onClick={() => setModalOpen(true)}
              >
                <PlusSquareIcon className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-orange-500">Add product or Item</p>
              </button>
            </div>

            {items.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {items.map((item: IDetail) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b py-2"
                  >
                    <div className="flex gap-2 items-center">
                      <Image
                        src={CONFIG.IMAGE_URL + item.item_image_path}
                        alt={item.item_id}
                        width={50}
                        height={50}
                        className="w-24 h-20 object-cover rounded"
                      />
                      <div>
                        <p className="text-sm font-bold">{item.item_name}</p>
                        <p className="text-xs text-gray-500">
                          {item?.item_type === "bulk" ? "Item" : "Product"}
                        </p>
                        <p className="text-xs text-gray-500 font-bold">
                          {item?.qty || "1"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setItems(items.filter((i) => i.id !== item.id));
                        Swal.fire({
                          icon: "success",
                          title: "Item removed successfully",
                          timer: 1500,
                          showConfirmButton: false,
                        });
                      }}
                    >
                      <Trash2Icon className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <AddEquipmentsModal
            open={modalOpen}
            setOpen={() => setModalOpen(false)}
            items={items}
            setItems={setItems}
            singleItems={singleItems}
            bulkItems={bulkItems}
            setFilter={setFilter}
            filter={filter}
          />
        )}

        {/* Buttons */}
        <div className="flex gap-4 justify-end mt-4">
          <Button
            variant="white"
            type="button"
            onClick={() => router.push("/main/items")}
          >
            Cancel
          </Button>
          <Button disabled={loading} variant="submit" type="submit">
            {loading ? "Loading..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
