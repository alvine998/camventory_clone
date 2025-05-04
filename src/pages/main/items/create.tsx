import Button from "@/components/Button";
import ButtonChoose from "@/components/ButtonChoose";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

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

    const table = await axios.get(
      `${CONFIG.API_URL}/v1/items?${params.toString()}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    if (table?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // Optionally validate token...
    return { props: { table: table?.data?.data } };
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

export default function AdministratorPage() {
  const [type, setType] = useState<string>("individual");
  const router = useRouter();
  const [filter, setFilter] = useState<any>(router.query);

  useEffect(() => {
    const queryFilter = new URLSearchParams(filter).toString();
    router.push(`?${queryFilter}`);
  }, [filter]);
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
          <div className="mt-6">
            <h5 className="text-orange-500 font-bold">Item Details</h5>
            <form action="">
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Select
                  options={[]}
                  placeholder="Brand"
                  label="Brand"
                  fullWidth
                  onChange={(e) => setFilter({ brand: e })}
                />
                <Select
                  options={[]}
                  placeholder="Model"
                  label="Model"
                  fullWidth
                  // onChange={(e) => setFilter({ brand: e })}
                />
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Item Name"
                  label="Item Name"
                  name="name"
                  fullWidth
                />
                <Select
                  options={[]}
                  placeholder="Category"
                  label="Category"
                  fullWidth
                  // onChange={(e) => setFilter({ brand: e })}
                />
              </div>
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
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Select
                  options={[]}
                  placeholder="Location"
                  label="Location"
                  fullWidth
                  // onChange={(e) => setFilter({ brand: e })}
                />
                <Input
                  placeholder="Completeness"
                  label="Completeness"
                  name="completeness"
                  fullWidth
                />
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Rate/Day"
                  label="Rate/Day"
                  name="rate"
                  fullWidth
                  type="number"
                />
                <Input
                  placeholder="Serial Number"
                  label="Serial Number"
                  name="serial_number"
                  fullWidth
                />
              </div>
              <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
                <Input
                  placeholder="Image"
                  label="Image"
                  name="image"
                  fullWidth
                  type="file"
                />
                <Input
                  placeholder="Barcode"
                  label="Barcode"
                  name="barcode"
                  fullWidth
                />
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
