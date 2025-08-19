import Button from "@/components/Button";
import Input from "@/components/Input";
import { useModal } from "@/components/Modal";
import AddEquipmentsModal from "@/components/modals/reservation/AddEquipments";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { ArrowLeftIcon, PlusSquareIcon, Trash2Icon } from "lucide-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

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
      ...(search && { search: String(search) || "" }),
      location: String(query.location || ""),
      category: String(query.category || ""),
      brand: String(query.brand || ""),
      type: String(query.type || ""),
      status: String(query.status || ""),
    });

    if (typeof search === "string" && search.trim() !== "") {
      params.set("search", search);
    }
    const categories = await axios.get(
      `${CONFIG.API_URL}/v1/master/categories`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    const brands = await axios.get(`${CONFIG.API_URL}/v1/master/brands`, {
      headers: {
        Authorization: `${token}`,
      },
    });

    const bulkItems = await axios.get(
      `${CONFIG.API_URL}/v1/bulk-items?${params.toString()}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    const singleItems = await axios.get(
      `${CONFIG.API_URL}/v1/single-items?${params.toString()}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
console.log(singleItems?.data?.data);
    // Optionally validate token...
    return {
      props: {
        categories: categories?.data?.data || [],
        brands: brands?.data?.data || [],
        bulkItems: bulkItems?.data?.data || [],
        singleItems: singleItems?.data?.data || [],
      },
    };
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

interface Props {
  categories: any;
  brands: any;
  bulkItems: any;
  singleItems: any;
}

export default function CreateReservationPage({
  brands,
  bulkItems,
  singleItems,
}: Props) {
  //   const [type, setType] = useState<string>("individual");
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<any>([]);
  const [modal, setModal] = useState<useModal>();

  //   // Format number with thousand separator
  //   const formatNumber = (input: string) => {
  //     const numeric = input.replace(/\D/g, ""); // Remove non-digit characters
  //     if (!numeric) return "";
  //     return parseInt(numeric, 10).toLocaleString("id-ID"); // "1234567" => "1,234,567"
  //   };

  //   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const raw = e.target.value;
  //     const formatted = formatNumber(raw);
  //     setValue(formatted);
  //   };

  const [filter, setFilter] = useState<any>({});

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));
    try {
      const payload = {
        ...formData,
        qty: Number(formData?.qty) || null,
        purchase_date: formData?.purchase_date
          ? Math.floor(
              new Date(formData?.purchase_date.toString()).getTime() / 1000
            )
          : null,
        warranty_date: formData?.warranty_date
          ? Math.floor(
              new Date(formData?.warranty_date.toString()).getTime() / 1000
            )
          : null,
      };
      await axios.post("/api/reservation", payload);
      Swal.fire({
        icon: "success",
        title: "Reservation Created Successfully",
        showConfirmButton: false,
        timer: 1500,
      });
      setLoading(false);
      router.push(`/main/reservation`);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };
  useEffect(() => {
    const queryFilter = new URLSearchParams(filter).toString();
    router.push(`?${queryFilter}`);
  }, [filter]);
  return (
    <div>
      <div className="">
        <div className="flex flex-row gap-2 items-center">
          <button
            type="button"
            onClick={() => {
              router.push(`/main/reservation`);
            }}
          >
            <ArrowLeftIcon className="w-6 h-6 text-orange-500" />
          </button>
          <h1 className="text-2xl font-bold text-orange-500">
            Add Reservation Data
          </h1>
        </div>
        <div>
          <div className="mt-6 mb-20">
            <form onSubmit={onSubmit}>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Select
                  options={brands?.map((item: any) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  placeholder="Customer"
                  label="Customer"
                  fullWidth
                  required
                  name="customerID"
                />
                <Select
                  options={brands?.map((item: any) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  placeholder="User/Employee"
                  label="User/Employee"
                  fullWidth
                  required
                  name="userID"
                />
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Input
                    placeholder="From"
                    label="From"
                    name="from"
                    fullWidth
                    readOnly
                    required
                    type="date"
                  />
                  <Input
                    placeholder="To"
                    label="To"
                    name="to"
                    fullWidth
                    readOnly
                    required
                    type="date"
                  />
                </div>
                <Select
                  options={[
                    {
                      label: "Dipatiukur",
                      value: "dipatiukur",
                    },
                    {
                      label: "Cipadung",
                      value: "cipadung",
                    },
                  ]}
                  placeholder="Pickup Location"
                  label="Pickup Location"
                  fullWidth
                  required
                  name="pickup_location"
                  // onChange={(e) => setFilter({ brand: e })}
                />
              </div>

              <div className="mt-4">
                <h1 className="text-xl font-bold text-orange-500">
                  Equipments
                </h1>
                <div className={`border rounded p-4 mt-2`}>
                  <div className="flex justify-center items-center">
                    <button
                      className="border border-orange-500 p-2 justify-center rounded flex items-center gap-2"
                      type="button"
                      onClick={() => setModal({ open: true })}
                    >
                      <PlusSquareIcon className="w-4 h-4 text-orange-500" />
                      <p className="text-xs text-orange-500">
                        Add product or Item
                      </p>
                    </button>
                  </div>
                  {items?.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center border-b py-2"
                        >
                          <div className="flex flex-row gap-1">
                            <Image
                              src={item.full_path_image}
                              alt={item.name}
                              width={50}
                              height={50}
                              className="w-24 h-20 object-cover rounded"
                            />
                            <div className="flex flex-col">
                              <p className="text-sm font-bold">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.serial_number || "-"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setItems(
                                items.filter((i: any) => i.id !== item.id)
                              );
                              Swal.fire({
                                icon: "success",
                                title: "Item removed successfully",
                                showConfirmButton: false,
                                timer: 1500,
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

              {modal?.open && (
                <AddEquipmentsModal
                  open={modal?.open}
                  setOpen={setModal}
                  items={items}
                  setItems={setItems}
                  singleItems={singleItems}
                  bulkItems={bulkItems}
                  setFilter={setFilter}
                  filter={filter}
                />
              )}

              <div className="flex flex-row gap-4 justify-end items-center mt-4">
                <Button
                  variant="white"
                  type="button"
                  onClick={() => {
                    router.push("/main/items");
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={loading} variant="submit" type="submit">
                  {loading ? "Loading..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
