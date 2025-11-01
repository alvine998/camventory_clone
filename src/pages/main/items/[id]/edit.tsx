import Button from "@/components/Button";
import ButtonChoose from "@/components/ButtonChoose";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import moment from "moment";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req, params } = ctx;
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

    // Fetch categories and brands
    const [categories, brands, itemResult] = await Promise.all([
      axios.get(`${CONFIG.API_URL}/v1/master/categories`, {
        headers: { Authorization: `${token}` },
      }),
      axios.get(`${CONFIG.API_URL}/v1/master/brands`, {
        headers: { Authorization: `${token}` },
      }),
      query.type === "bulk" && params?.id
        ? axios.get(`${CONFIG.API_URL}/v1/bulk-items/${params.id}`, {
            headers: { Authorization: `${token}` },
          })
        : query.type === "single" && params?.id
        ? axios.get(`${CONFIG.API_URL}/v1/single-items/${params.id}`, {
            headers: { Authorization: `${token}` },
          })
        : Promise.resolve({ data: null }),
    ]);

    return {
      props: {
        categories: categories?.data?.data || [],
        brands: brands?.data?.data || [],
        itemData: itemResult?.data?.data || null,
        itemType: query.type || "single",
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
      props: { categories: [], brands: [], itemData: null, itemType: "single" },
    };
  }
};

interface Props {
  categories: any;
  brands: any;
  itemData: any;
  itemType: string;
}

export default function EditItemPage({
  brands,
  categories,
  itemData,
  itemType,
}: Props) {
  const router = useRouter();
  const { id } = router.query;
  const type = itemType === "bulk" ? "bulk" : "individual";
  const [filter, setFilter] = useState<any>({
    brand: itemData?.brandID
      ? { value: itemData.brandID, label: itemData.brand?.name || "" }
      : null,
    model: itemData?.model || "",
  });
  const [images, setImages] = useState<any>(
    itemData?.full_path_image ? [itemData.full_path_image] : []
  );
  const [image, setImage] = useState<string>(
    itemData?.image_path?.split("/")[1] || ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [value, setValue] = useState(
    itemData?.rate_day ? itemData.rate_day.toLocaleString("id-ID") : ""
  );
  const [price, setPrice] = useState(
    itemData?.purchase_price
      ? itemData.purchase_price.toLocaleString("id-ID")
      : ""
  );

  // Format number with thousand separator
  const formatNumber = (input: string) => {
    const numeric = input.replace(/\D/g, "");
    if (!numeric) return "";
    return parseInt(numeric, 10).toLocaleString("id-ID");
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
    const arrImage: any[] = [...images];

    Array.from(files).forEach((file) => {
      setImage(file.name);
      const previewImage = URL.createObjectURL(file);
      arrImage.push(previewImage);
    });

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

    // Validate rate day
    if (!value || Number(value.replaceAll(".", "").replaceAll(",", "")) <= 0) {
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

    try {
      const payload = {
        ...formData,
        image_path: image ? "items/" + image : itemData?.image_path,
        rate_day: Number(value.replaceAll(".", "").replaceAll(",", "")),
        purchase_price: price
          ? Number(price.replaceAll(".", "").replaceAll(",", ""))
          : null,
        qty: Number(formData?.qty) || null,
        purchase_date: formData?.purchase_date
          ? Math.floor(
              new Date(formData?.purchase_date.toString()).getTime() / 1000
            )
          : itemData?.purchase_date
          ? moment(itemData.purchase_date).unix()
          : null,
        warranty_date: formData?.warranty_date
          ? Math.floor(
              new Date(formData?.warranty_date.toString()).getTime() / 1000
            )
          : itemData?.warranty_date
          ? moment(itemData.warranty_date).unix()
          : null,
      };

      if (type === "bulk") {
        await axios.put(`/api/items/bulk?id=${id}`, payload);
      } else {
        await axios.put(`/api/items/single?id=${id}`, payload);
      }

      Swal.fire({
        icon: "success",
        title: "Item Updated Successfully",
        text: `The ${type === "bulk" ? "bulk" : "single"} item has been updated successfully.`,
        showConfirmButton: false,
        timer: 1500,
      });
      setLoading(false);
      router.push(
        `/main/items/${id}/detail?type=${type === "bulk" ? "bulk" : "single"}`
      );
    } catch (error: any) {
      console.error("Item update error:", error);

      // Extract error message from different possible response structures
      let errorMessage = "An error occurred while updating the item";
      let errorTitle = "Item Update Failed";

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
          errorMessage = "You don't have permission to update items.";
        } else if (error.response.status === 409) {
          errorTitle = "Conflict Detected";
          errorMessage =
            errorMessage ||
            "An item with this name or identifier already exists.";
        } else if (error.response.status === 422) {
          errorTitle = "Validation Error";
        } else if (error.response.status >= 500) {
          errorTitle = "Server Error";
          errorMessage = "The server encountered an error. Please try again later.";
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
      <div className="flex flex-row gap-2 items-center">
        <button
          onClick={() =>
            router.push(
              `/main/items/${id}/detail?type=${type === "bulk" ? "bulk" : "single"}`
            )
          }
          type="button"
        >
          <ArrowLeftIcon className="w-6 h-6 text-orange-500" />
        </button>
        <h1 className="text-2xl font-bold text-orange-500">Edit Item</h1>
      </div>
      <div className="">
        <div>
          <h5 className="text-orange-500 mt-4">
            Item Type (cannot be changed)
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
                  onClick: () => {
                    // Type cannot be changed when editing
                  },
                },
                {
                  label: "As a bulk item",
                  value: "bulk",
                  description:
                    "Recommended for expendable, low-cost items (AAA batteries, cables, etc)",
                  checked: type === "bulk",
                  onClick: () => {
                    // Type cannot be changed when editing
                  },
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
                  value={filter.brand}
                  onChange={(e) => setFilter({ ...filter, brand: e })}
                />
                <Input
                  placeholder="Model"
                  label="Model"
                  name="model"
                  fullWidth
                  required
                  defaultValue={itemData?.model || ""}
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
                  value={`${filter?.brand?.label || itemData?.name || "Item Name"} ${
                    filter?.model || ""
                  }`.trim()}
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
                  value={
                    itemData?.location
                      ? {
                          label:
                            itemData.location.charAt(0).toUpperCase() +
                            itemData.location.slice(1),
                          value: itemData.location,
                        }
                      : null
                  }
                />
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Completeness"
                  label="Completeness"
                  name="completeness"
                  fullWidth
                  required
                  defaultValue={itemData?.completeness || ""}
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
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Purchase Price"
                  label="Purchase Price"
                  name="purchase_price"
                  fullWidth
                  type="text"
                  onChange={handlePrice}
                  value={price}
                />
                <Input
                  placeholder="Purchase Date"
                  label="Purchase Date"
                  name="purchase_date"
                  fullWidth
                  type="date"
                  defaultValue={
                    itemData?.purchase_date
                      ? moment(itemData.purchase_date).format("YYYY-MM-DD")
                      : ""
                  }
                />
              </div>
              {type !== "bulk" && (
                <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                  <Input
                    placeholder="Serial Number"
                    label="Serial Number"
                    name="serial_number"
                    fullWidth
                    defaultValue={itemData?.serial_number || ""}
                  />
                  <Input
                    placeholder="Warranty Date"
                    label="Warranty Date"
                    name="warranty_date"
                    fullWidth
                    type="date"
                    defaultValue={
                      itemData?.warranty_date
                        ? moment(itemData.warranty_date).format("YYYY-MM-DD")
                        : ""
                    }
                  />
                </div>
              )}
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Barcode"
                  label="Barcode"
                  name="barcode"
                  fullWidth
                  defaultValue={itemData?.barcode || ""}
                />
                {type === "bulk" ? (
                  <Input
                    placeholder="0"
                    label="QTY"
                    name="qty"
                    fullWidth
                    required
                    type="number"
                    defaultValue={itemData?.qty || ""}
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
                    value={
                      itemData?.categoryID
                        ? {
                            label: itemData.category?.name || "",
                            value: itemData.categoryID,
                          }
                        : null
                    }
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
                    router.push(
                      `/main/items/${id}/detail?type=${type === "bulk" ? "bulk" : "single"}`
                    );
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={loading} variant="primary" type="submit">
                  {loading ? "Loading..." : "Update Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}