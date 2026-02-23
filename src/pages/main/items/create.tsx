import Button from "@/components/Button";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import ButtonChoose from "@/components/ButtonChoose";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { XIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
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
    const [categories, brands, notificationsData, unreadNotificationsData] = await Promise.all([
      axios.get(
        `${CONFIG.API_URL}/v1/master/categories`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      ),
      axios.get(`${CONFIG.API_URL}/v1/master/brands`, {
        headers: {
          Authorization: `${token}`,
        },
      }),
      fetchNotificationsServer(token),
      fetchUnreadNotificationsServer(token),
    ]);

    // Optionally validate token...
    return {
      props: {
        categories: categories?.data?.data || [],
        brands: brands?.data?.data || [],
        notifications: notificationsData?.data || [],
        unreadNotifications: unreadNotificationsData?.data || [],
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
      props: {
        table: [],
        notifications: [],
        unreadNotifications: [],
      },
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
  const [price, setPrice] = useState("");

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

  const handlePrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatNumber(raw);
    setPrice(formatted);
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
      setImage(files[0]);
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
  }, [filter, router]);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));

    // Validate image
    if (!image && !images.length) {
      Swal.fire({
        icon: "error",
        title: "Image Required",
        text: "Please upload at least one image for the item.",
      });
      setLoading(false);
      return;
    }

    // Validate rate day
    if (!value || Number(value.replaceAll(".", "")) <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Rate",
        text: "Please enter a valid rate per day greater than 0.",
      });
      setLoading(false);
      return;
    }

    // Validate quantity for bulk items
    if (type === "bulk" && (!formData?.qty || Number(formData.qty) <= 0)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Quantity",
        text: "Please enter a valid quantity greater than 0 for bulk items.",
      });
      setLoading(false);
      return;
    }

    const formDataImage = new FormData();
    formDataImage.append("file", image);
    formDataImage.append("category", "items");

    const urlImage = await axios.post("/api/upload", formDataImage, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (!urlImage) {
      Swal.fire({
        icon: "error",
        title: "Image Required",
        text: "Please upload at least one image for the item.",
      });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        image_path: urlImage?.data?.payload?.message || null,
        rate_day: Number(value?.replaceAll(".", "")),
        purchase_price: Number(price?.replaceAll(".", "")),
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
        title: "Item Created Successfully",
        text: `The ${type === "bulk" ? "bulk" : "single"
          } item has been created successfully.`,
        showConfirmButton: false,
        timer: 1500,
      });
      setLoading(false);
      router.push(`/main/items${type === "bulk" ? "/bulk" : ""}`);
    } catch (error: any) {
      console.error("Item creation error:", error);

      // Extract error message from different possible response structures
      let errorMessage = "An error occurred while creating the item";
      let errorTitle = "Item Creation Failed";

      if (error.response) {
        // API error response
        const responseData = error.response.data;

        // Check for message in different possible locations
        if (responseData?.message) {
          errorMessage =
            typeof responseData.message === "string"
              ? responseData.message
              : responseData.message?.message || errorMessage;
        } else if (responseData?.error?.message) {
          errorMessage = responseData.error.message;
        } else if (responseData?.error) {
          errorMessage =
            typeof responseData.error === "string"
              ? responseData.error
              : errorMessage;
        } else if (typeof responseData === "string") {
          errorMessage = responseData;
        }

        // Handle specific error status codes
        if (error.response.status === 400) {
          errorTitle = "Invalid Request";
        } else if (error.response.status === 401) {
          errorTitle = "Authentication Failed";
          errorMessage = "Your session has expired. Please log in again.";
        } else if (error.response.status === 403) {
          errorTitle = "Permission Denied";
          errorMessage = "You don't have permission to create items.";
        } else if (error.response.status === 409) {
          errorTitle = "Conflict Detected";
          errorMessage =
            errorMessage ||
            "An item with this name or identifier already exists.";
        } else if (error.response.status === 422) {
          errorTitle = "Validation Error";
        } else if (error.response.status >= 500) {
          errorTitle = "Server Error";
          errorMessage =
            "The server encountered an error. Please try again later.";
        }
      } else if (error.request) {
        // Request was made but no response received
        errorTitle = "Network Error";
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else {
        // Error in request setup
        errorMessage = error.message || errorMessage;
      }

      // Format error message for display
      const isMultiLine =
        errorMessage.includes("\n") || errorMessage.length > 100;

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: !isMultiLine ? errorMessage : undefined,
        html: isMultiLine
          ? `<div style="text-align: left; white-space: pre-line; font-size: 14px;">${errorMessage}</div>`
          : undefined,
        confirmButtonText: "OK",
        confirmButtonColor: "#f97316",
      });

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
                  value={`${filter?.brand?.label || "Item Name"} ${filter?.model || ""
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
                    placeholder="Purchase Price"
                    label="Purchase Price"
                    name="rate_day"
                    fullWidth
                    type="text"
                    onChange={handlePrice}
                    required
                    value={price}
                  />
                  <Input
                    placeholder="Purchase Date"
                    label="Purchase Date"
                    name="purchase_date"
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
                    placeholder="Warranty Date"
                    label="Warranty Date"
                    name="warranty_date"
                    fullWidth
                    type="date"
                  />
                </div>
              )}
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Barcode"
                  label="Barcode"
                  name="barcode"
                  fullWidth
                />
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
              </div>
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
                    <Image
                      src={url}
                      alt={`Uploaded ${i}`}
                      width={150}
                      height={150}
                      className="rounded object-cover"
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
