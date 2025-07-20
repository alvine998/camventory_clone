import Button from "@/components/Button";
import ButtonChoose from "@/components/ButtonChoose";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { XIcon } from "lucide-react";
import { GetServerSideProps } from "next";
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

export default function AdministratorPage({ brands, categories }: Props) {
  const [type, setType] = useState<string>("individual");
  const router = useRouter();
  const [filter, setFilter] = useState<any>(router.query);
  const [images, setImages] = useState<any>([]);
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [value, setValue] = useState("");

  // Format number with thousand separator
  const formatNumber = (input: string) => {
    const numeric = input.replace(/\D/g, ""); // Remove non-digit characters
    if (!numeric) return "";
    return parseInt(numeric, 10).toLocaleString("id-ID"); // "1234567" => "1,234,567"
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatNumber(raw);
    setValue(formatted);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arrImage: any[] = [];

    // const formData = new FormData();
    Array.from(files).forEach((file) => {
      setImage(files[0]?.name);
      const previewImage = URL.createObjectURL(file);
      arrImage.push(previewImage);
      // formData.append("files", file); // Note: same field name "files"
    });

    // const res = await fetch("/api/upload", {
    //   method: "POST",
    //   body: formData,
    // });

    // const data = await res.json();
    setImages(arrImage);
  };

  useEffect(() => {
    const queryFilter = new URLSearchParams(filter).toString();
    router.push(`?${queryFilter}`);
  }, [filter]);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));
    try {
      const payload = {
        ...formData,
        image_path: "items/" + image,
        rate_day: Number(value?.replaceAll(".", "")),
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
      if (type === "bulk") {
        await axios.post("/api/items/bulk", payload);
      } else {
        await axios.post("/api/items/single", payload);
      }
      Swal.fire({
        icon: "success",
        title: "User Created Successfully",
        showConfirmButton: false,
        timer: 1500,
      });
      setLoading(false);
      router.push(`/main/items${type === "bulk" ? "/bulk" : ""}`);
    } catch (error: any) {
      console.log(error);
      setLoading(false);
    }
  };
  return (
    <div>
      <div className="">
        <h1 className="text-2xl font-bold text-orange-500">Add Items</h1>
        <div>
          <h5 className="text-orange-500">
            How would you like this item added?
          </h5>
          <div className="mt-6">
            <ButtonChoose
              options={[
                {
                  label: "As individual item",
                  value: "individual",
                  description:
                    "Recommended for unique, high-cost items (cameras, tripod, lensa, etc)",
                  checked: type === "individual",
                  onClick: () => setType("individual"),
                },
                {
                  label: "As a bulk item",
                  value: "bulk",
                  description:
                    "Recommended for expendable, low-cost items (AAA batteries, cables, etc)",
                  checked: type === "bulk",
                  onClick: () => setType("bulk"),
                },
              ]}
            />
          </div>
          <div className="mt-6 mb-20">
            <h5 className="text-orange-500 font-bold">Item Details</h5>
            <form onSubmit={onSubmit}>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Select
                  options={brands?.map((item: any) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  placeholder="Brand"
                  label="Brand"
                  fullWidth
                  required
                  name="brandID"
                  onChange={(e) => setFilter({ ...filter, brand: e })}
                />
                <Input
                  placeholder="Model"
                  label="Model"
                  name="model"
                  fullWidth
                  required
                  onChange={(e) =>
                    setFilter({ ...filter, model: e.target.value })
                  }
                />
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Item Name"
                  label="Item Name"
                  name="name"
                  fullWidth
                  readOnly
                  required
                  value={`${filter?.brand?.label || "Item Name"} ${
                    filter?.model || ""
                  }`}
                />
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
                  placeholder="Location"
                  label="Location"
                  fullWidth
                  required
                  name="location"
                  // onChange={(e) => setFilter({ brand: e })}
                />
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Completeness"
                  label="Completeness"
                  name="completeness"
                  fullWidth
                  required
                />
                <Input
                  placeholder="Rate/Day"
                  label="Rate/Day"
                  name="rate_day"
                  fullWidth
                  type="text"
                  onChange={handleChange}
                  required
                  value={value}
                />
              </div>
              {type !== "" && (
                <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                  <Input
                    placeholder="Purchase Date"
                    label="Purchase Date"
                    name="purchase_date"
                    fullWidth
                    type="date"
                  />
                  <Input
                    placeholder="Warranty Date"
                    label="Warranty Date"
                    name="warranty_date"
                    fullWidth
                    type="date"
                  />
                </div>
              )}
              {type !== "bulk" && (
                <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                  <Input
                    placeholder="Serial Number"
                    label="Serial Number"
                    name="serial_number"
                    fullWidth
                  />
                  <Input
                    placeholder="Barcode"
                    label="Barcode"
                    name="barcode"
                    fullWidth
                  />
                </div>
              )}
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                {type === "bulk" ? (
                  <Input
                    placeholder="0"
                    label="QTY"
                    name="qty"
                    fullWidth
                    required
                    type="number"
                  />
                ) : (
                  <Select
                    options={categories?.map((item: any) => ({
                      label: item.name,
                      value: item.id,
                    }))}
                    placeholder="Category"
                    label="Category Items"
                    fullWidth
                    required
                    name="categoryID"
                    // onChange={(e) => setFilter({ brand: e })}
                  />
                )}
                <Input
                  placeholder="Image"
                  label="Image"
                  name="image"
                  accept="image/*"
                  fullWidth
                  type="file"
                  onChange={handleImage}
                  multiple
                  required
                />
              </div>
              <div className="flex sm:flex-row flex-col gap-4 mt-4">
                {images.map((url: any, i: number) => (
                  <div className="relative" key={i}>
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                      onClick={() =>
                        setImages(
                          images.filter((_: any, index: number) => index !== i)
                        )
                      }
                    >
                      <XIcon className="w-4 h-4" color="white" />
                    </button>
                    <img
                      src={url}
                      alt={`Uploaded ${i}`}
                      width={150}
                      className="rounded"
                    />
                  </div>
                ))}
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
                <Button disabled={loading} variant="primary" type="submit">
                  {loading ? "Loading..." : "Add Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
