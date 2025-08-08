import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { ArrowLeftIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React, { useState } from "react";
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

    // Optionally validate token...
    return {
      props: {
        categories: categories?.data?.data || [],
        brands: brands?.data?.data || [],
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
}

export default function CreateReservationPage({ brands }: Props) {
  //   const [type, setType] = useState<string>("individual");
  const router = useRouter();
  //   const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  //   const [value, setValue] = useState("");

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
        title: "User Created Successfully",
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
              </div>

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
