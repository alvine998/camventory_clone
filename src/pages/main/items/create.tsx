import Button from "@/components/Button";
import ButtonChoose from "@/components/ButtonChoose";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { XCircleIcon, XIcon } from "lucide-react";
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
  const [loading, setLoading] = useState<boolean>(false);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    let arrImage: any[] = [];

    // const formData = new FormData();
    Array.from(files).forEach((file) => {
      const previewImage = URL.createObjectURL(file);
      arrImage.push(previewImage);
      // formData.append("files", file); // Note: same field name "files"
    });

    // const res = await fetch("/api/upload", {
    //   method: "POST",
    //   body: formData,
    // });

    // const data = await res.json();
    console.log(arrImage, "slssl");
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
      };
      await axios.post("/api/item", payload);
      Swal.fire({
        icon: "success",
        title: "User Created Successfully",
        showConfirmButton: false,
        timer: 1500,
      });
      setLoading(false);
      router.push(`/main/items`);
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
                  disabled
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
                  name="rate"
                  fullWidth
                  type="number"
                  required
                />
                {/* <Input
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
                /> */}
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                {type === "individual" ? (
                  <Select
                    options={categories?.map((item: any) => ({
                      label: item.name,
                      value: item.id,
                    }))}
                    placeholder="Category"
                    label="Category Items"
                    fullWidth
                    required
                    // onChange={(e) => setFilter({ brand: e })}
                  />
                ) : (
                  <Input
                    placeholder="0"
                    label="QTY"
                    name="qty"
                    fullWidth
                    required
                    type="number"
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

              {/* <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
               
                <Input
                  placeholder="Serial Number"
                  label="Serial Number"
                  name="serial_number"
                  fullWidth
                />
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                
                <Input
                  placeholder="Barcode"
                  label="Barcode"
                  name="barcode"
                  fullWidth
                />
              </div> */}
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
                <Button variant="primary" type="submit">
                  Add Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
