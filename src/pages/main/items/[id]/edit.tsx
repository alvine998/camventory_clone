import Button from "@/components/Button";
import ButtonChoose from "@/components/ButtonChoose";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import { formatEpochDate } from "@/utils";
import axios from "axios";
import { parse } from "cookie";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import moment from "moment";

type OptionType = {
  value: string | number;
  label: string;
};

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
          : Promise.resolve({ data: { data: null } }),
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

  const initialBrand: OptionType | null = itemData?.brandID
    ? {
      value: itemData.brandID,
      label: itemData?.name?.split(" ")[0] || "",
    }
    : null;

  const initialCategory: OptionType | null =
    type === "individual" && itemData?.categoryID
      ? {
        value: itemData.categoryID,
        label: categories?.find((item: any) => item.id === itemData.categoryID)?.name || "",
      }
      : null;

  const initialLocation: OptionType | null = itemData?.location
    ? {
      value: itemData.location,
      label:
        itemData.location.charAt(0).toUpperCase() +
        itemData.location.slice(1),
    }
    : null;

  const [selectedBrand, setSelectedBrand] = useState<OptionType | null>(
    initialBrand
  );
  const [model, setModel] = useState<string>(itemData?.model || "");
  const [selectedCategory, setSelectedCategory] =
    useState<OptionType | null>(initialCategory);
  const [selectedLocation, setSelectedLocation] =
    useState<OptionType | null>(initialLocation);
  const [images, setImages] = useState<string[]>(
    itemData?.full_path_image ? [itemData.full_path_image] : []
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [value, setValue] = useState(
    itemData?.rate_day
      ? Number(itemData.rate_day).toLocaleString("id-ID")
      : ""
  );
  const [price, setPrice] = useState(
    itemData?.purchase_price
      ? Number(itemData.purchase_price).toLocaleString("id-ID")
      : ""
  );
  const [qty, setQty] = useState<string>(
    type === "bulk" && itemData?.qty ? String(itemData.qty) : ""
  );

  useEffect(() => {
    return () => {
      images.forEach((url) => {
        if (typeof url === "string" && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

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
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const previewImages = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setImages((prev) => {
      prev.forEach((url) => {
        if (typeof url === "string" && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });

      const persisted = prev.filter(
        (url) => typeof url === "string" && !url.startsWith("blob:")
      );
      return [...persisted, ...previewImages];
    });

    setImageFile(selectedFiles[0]);
    setImageRemoved(false);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const removedUrl = prev[index];

      if (removedUrl === itemData?.full_path_image) {
        setImageRemoved(true);
      }

      if (removedUrl && removedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(removedUrl);
        setImageFile(null);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));

    if (!selectedBrand?.value) {
      Swal.fire({
        icon: "error",
        title: "Brand Required",
        text: "Please select a brand for the item.",
      });
      setLoading(false);
      return;
    }

    if (type === "individual" && !selectedCategory?.value) {
      Swal.fire({
        icon: "error",
        title: "Category Required",
        text: "Please select a category for the item.",
      });
      setLoading(false);
      return;
    }

    if (!selectedLocation?.value) {
      Swal.fire({
        icon: "error",
        title: "Location Required",
        text: "Please select a location for the item.",
      });
      setLoading(false);
      return;
    }

    if (!value || Number(value.replace(/\D/g, "")) <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Rate",
        text: "Please enter a valid rate per day greater than 0.",
      });
      setLoading(false);
      return;
    }

    if (type === "bulk" && (!qty || Number(qty) <= 0)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Quantity",
        text: "Please enter a valid quantity greater than 0 for bulk items.",
      });
      setLoading(false);
      return;
    }

    try {
      const normalizedRate = Number(value.replace(/\D/g, ""));
      const normalizedPrice = price ? Number(price.replace(/\D/g, "")) : null;

      let imagePath = itemData?.image_path || null;

      if (imageRemoved) {
        imagePath = null;
      }

      if (imageFile instanceof File) {
        const formDataImage = new FormData();
        formDataImage.append("file", imageFile);
        formDataImage.append("category", "items");

        const uploadResponse = await axios.post("/api/upload", formDataImage, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        imagePath = `${uploadResponse?.data?.payload?.message}` || null;

        if (!imagePath) {
          throw new Error("Image upload failed. Please try again.");
        }
      }

      const payload: any = {
        ...formData,
        image_path: imageFile?.name || itemData?.image_path,
        full_path_image: imagePath || itemData?.full_path_image,
        name:
          `${selectedBrand?.label || itemData?.name || ""} ${model}`
            .trim()
            .replace(/\s+/g, " ") || itemData?.name,
        model,
        brandID: selectedBrand.value,
        categoryID:
          type === "individual"
            ? selectedCategory?.value || itemData?.categoryID
            : undefined,
        pickup_location: selectedLocation.value,
        rate_day: normalizedRate,
        purchase_price: normalizedPrice,
        qty: type === "bulk" ? Number(qty) : undefined,
        purchase_date: formData?.purchase_date
          ? Math.floor(
            new Date(formData?.purchase_date.toString()).getTime() / 1000
          )
          : itemData?.purchase_date
            ? moment(itemData.purchase_date).unix()
            : null,
        warranty_date:
          type === "individual"
            ? formData?.warranty_date
              ? Math.floor(
                new Date(formData?.warranty_date.toString()).getTime() / 1000
              )
              : itemData?.warranty_date
                ? moment(itemData.warranty_date).unix()
                : null
            : undefined,
      };

      if (imageRemoved || imageFile instanceof File || imagePath) {
        payload.image_path = imagePath;
      }

      if (type !== "individual") {
        delete payload.categoryID;
      }

      if (type !== "bulk") {
        delete payload.qty;
      }

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

      let errorMessage = "An error occurred while updating the item";
      let errorTitle = "Item Update Failed";

      if (error.response) {
        const responseData = error.response.data;

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
        errorTitle = "Network Error";
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else {
        errorMessage = error.message || errorMessage;
      }

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
                  value={selectedBrand}
                  onChange={(selectedOption: any) =>
                    setSelectedBrand(selectedOption as OptionType | null)
                  }
                />
                <Input
                  placeholder="Model"
                  label="Model"
                  name="model"
                  fullWidth
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
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
                  value={
                    `${selectedBrand?.label || itemData?.name || "Item Name"} ${model || ""
                      }`
                      .trim()
                      .replace(/\s+/g, " ")
                  }
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
                  value={selectedLocation}
                  onChange={(selectedOption: any) =>
                    setSelectedLocation(selectedOption as OptionType | null)
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
                  defaultValue={formatEpochDate(itemData?.purchase_date, "YYYY-MM-DD")}
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
                    defaultValue={formatEpochDate(itemData?.warranty_date, "YYYY-MM-DD")}
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
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
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
                    value={selectedCategory}
                    onChange={(selectedOption: any) =>
                      setSelectedCategory(selectedOption as OptionType | null)
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
                {images.map((url, i) => (
                  <div className="relative" key={i}>
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                      onClick={() =>
                        handleRemoveImage(i)
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
