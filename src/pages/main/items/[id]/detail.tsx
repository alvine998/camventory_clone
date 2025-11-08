import Button from "@/components/Button";
import Header from "@/components/detail-item/Header";
import Tabs, { Tab } from "@/components/Tabs";
import Toggle from "@/components/Toggle";
import { CONFIG } from "@/config";
import { IItems } from "@/types/single_items";
import { toMoney } from "@/utils";
import axios from "axios";
import { parse } from "cookie";
import {
  MinusCircleIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
} from "lucide-react";
import moment from "moment";
import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, params, query } = ctx;
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

    let result = null;
    if (query.type === "bulk" && params) {
      result = await axios.get(`${CONFIG.API_URL}/v1/bulk-items/${params.id}`, {
        headers: {
          Authorization: `${token}`,
        },
      });
    } else if (query.type === "single" && params) {
      result = await axios.get(
        `${CONFIG.API_URL}/v1/single-items/${params.id}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
    } else {
      throw new Error(`Invalid query.type: ${query.type}`);
    }

    if (result.status !== 200) {
      throw new Error(`API request failed with status code ${result.status}`);
    }

    // Optionally validate token...
    return { props: { params, detail: result?.data, query } };
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

export const itemTabs = (id: string, query: any): Tab[] => [
  { label: "Information", href: `/main/items/${id}/detail?type=${query.type}` },
  {
    label: "Dashboard",
    href: `/main/items/${id}/dashboard?type=${query.type}`,
  },
  {
    label: "Depreciation",
    href: `/main/items/${id}/depreciation?type=${query.type}`,
  },
  {
    label: "Reservations",
    href: `/main/items/${id}/reservations?type=${query.type}`,
  },
  {
    label: "Check-outs",
    href: `/main/items/${id}/checkouts?type=${query.type}`,
  },
];
export default function Detail({ params, detail, query }: any) {
  const itemDetail: IItems = detail?.data;
  const [qty, setQty] = useState<number>(1);
  const [toggle, setToggle] = useState<boolean>(true);
  console.log(itemDetail, "detail");
  const itemInformation = [
    {
      label: "Item Name",
      value: itemDetail?.name,
    },
    {
      label: "Model",
      value: itemDetail?.model,
    },
    {
      label: "Purchase Price",
      value: toMoney(itemDetail?.purchase_price),
    },
    {
      label: "Warranty Date",
      value: moment(itemDetail?.warranty_date).format("DD-MM-YYYY"),
    },
    {
      label: "Rate/Day",
      value: toMoney(itemDetail?.rate_day),
    },
    {
      label: "Barcode",
      value: itemDetail?.barcode,
    },
    {
      label: "Image",
      value: itemDetail?.full_path_image,
    },
  ];
  const itemInformation2 = [
    {
      label: "Brand",
      value: itemDetail?.brandID,
    },
    {
      label: "Category",
      value: itemDetail?.categoryID,
    },
    {
      label: "Purchase Date",
      value: moment(itemDetail?.purchase_date).format("DD-MM-YYYY"),
    },
    {
      label: "Location",
      value: itemDetail?.location,
    },
    {
      label: "Serial Number",
      value: itemDetail?.serial_number,
    },
    {
      label: "Completeness",
      value: itemDetail?.completeness,
    },
  ];

  const singleInformation = [
    {
      label: "Item Name",
      value: itemDetail?.name,
    },
    {
      label: "Brand",
      value: itemDetail?.brandID,
    },
    {
      label: "Model",
      value: itemDetail?.model,
    },
    {
      label: "Category Items",
      value: itemDetail?.categoryID,
    },
    {
      label: "Purchase Price",
      value: toMoney(Number(itemDetail?.purchase_price)),
    },
    {
      label: "Purchase Date",
      value: moment(itemDetail?.purchase_date).format("DD-MM-YYYY"),
    },
    {
      label: "Warranty Date",
      value: moment(itemDetail?.warranty_date).format("DD-MM-YYYY"),
    },
    {
      label: "Location",
      value: itemDetail?.location,
    },
    {
      label: "Rate/Day",
      value: toMoney(itemDetail?.rate_day),
    },
    {
      label: "Serial Number",
      value: itemDetail?.serial_number,
    },
    {
      label: "Barcode",
      value: itemDetail?.barcode,
    },
    {
      label: "Completeness",
      value: itemDetail?.completeness,
    },
    {
      label: "Image",
      value: itemDetail?.full_path_image,
    },
  ];
  const trackers = [
    {
      label: "Tracker 1",
      value: "123456789",
    },
    {
      label: "Tracker 2",
      value: "123456789",
    },
    {
      label: "Tracker 3",
      value: "123456789",
    },
  ];
  return (
    <div className="p-2">
      <Header detail={itemDetail} query={query} />
      <div className="mt-4">
        <Tabs tabs={itemTabs(params?.id, query)} />
      </div>

      {query?.type === "single" && (
        <div className="flex gap-5 mt-4">
          <div className="border border-gray-300 p-4 rounded w-full">
            <div className="border-b border-gray-300 w-full flex items-center justify-between pb-2">
              <h3 className="text-md font-bold">Information Items</h3>
              <Link href={`/main/items/${params?.id}/edit?type=single`}>
                <Button
                  variant="custom-color"
                  className="flex items-center gap-1 border border-orange-500"
                >
                  <PencilIcon className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-orange-500">Edit</p>
                </Button>
              </Link>
            </div>

            <div className="mt-4 grid lg:grid-cols-5 grid-cols-1 gap-10 w-full">
              {singleInformation.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <p className="text-xs">{item.label}</p>
                  {item.label === "Image" ? (
                    <Image
                      alt="icon"
                      src={typeof item?.value === "string" ? item.value : ""}
                      width={50}
                      height={50}
                      className={"w-auto h-auto"}
                      unoptimized
                    />
                  ) : (
                    <p className="text-xs font-bold">{item.value}</p>
                  )}{" "}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {query?.type === "bulk" && (
        <div className="flex gap-5 mt-4">
          {/* Row 1 */}
          <div className="border border-gray-300 p-4 rounded w-full">
            <div className="border-b border-gray-300 w-full flex items-center justify-between pb-2">
              <h3 className="text-md font-bold">Information Items</h3>
              <Button
                variant="custom-color"
                className="flex items-center gap-1 border border-orange-500"
              >
                <Image
                  alt="icon"
                  src={"/icons/send-2.svg"}
                  width={20}
                  height={20}
                  className={"w-auto h-auto"}
                  unoptimized
                />
                <p className="text-xs text-orange-500">Action</p>
              </Button>
            </div>

            <Image
              alt="icon"
              src={itemDetail?.full_path_image || ""}
              width={50}
              height={50}
              className={"w-auto h-auto"}
              unoptimized
            />

            <div className="mt-4 grid lg:grid-cols-2 grid-cols-1 gap-10">
              <div className="flex flex-col gap-2">
                {itemInformation.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center w-full"
                  >
                    <p className="text-xs">{item.label}</p>
                    {item.label === "Image" ? (
                      <Image
                        alt="icon"
                        src={typeof item?.value === "string" ? item.value : ""}
                        width={50}
                        height={50}
                        className={"w-auto h-auto"}
                        unoptimized
                      />
                    ) : (
                      <p className="text-xs font-bold">{item.value}</p>
                    )}{" "}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {itemInformation2.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <p className="text-xs">{item.label}</p>
                    {item.label === "Image" ? (
                      <Image
                        alt="icon"
                        src={item?.value || ""}
                        width={50}
                        height={50}
                        className={"w-auto h-auto"}
                        unoptimized
                      />
                    ) : (
                      <p className="text-xs font-bold">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="lg:w-1/2 w-full flex flex-col gap-4">
            <div className="border border-gray-300 p-4 rounded flex justify-between items-center h-auto">
              <h3 className="text-md font-bold">Quantity</h3>
              <div className="flex gap-5 border border-orange-500 py-1 px-2 rounded">
                <button
                  type="button"
                  onClick={() => {
                    setQty(qty - 1);
                  }}
                  disabled={qty <= 1}
                >
                  <MinusCircleIcon color={qty > 1 ? "orange" : "black"} />
                </button>
                <p className="font-bold">{qty}</p>
                <button
                  type="button"
                  onClick={() => {
                    setQty(qty + 1);
                  }}
                >
                  <PlusCircleIcon color="orange" />
                </button>
              </div>
            </div>

            <div className="border border-gray-300 p-4 rounded">
              <div className="pb-2 border-b border-gray-300 flex justify-between items-center">
                <h3 className="text-md font-bold">Tracking Code</h3>
                <Button variant="submit" className="flex items-center gap-1">
                  <PlusCircleIcon className="w-4 h-4" />
                  <p className="text-xs text-white">Add Code</p>
                </Button>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {trackers?.map((tracker, index) => (
                  <div
                    className="flex justify-between items-center"
                    key={index}
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <Image
                        alt="icon"
                        src="/icons/barcode.svg"
                        width={20}
                        height={20}
                        unoptimized
                      />
                      <p className="text-xs">{tracker.value}</p>
                    </div>
                    <button>
                      <TrashIcon color="red" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-300 p-4 rounded h-auto">
              <div className="pb-2 border-b border-gray-300 flex justify-between items-center">
                <h3 className="text-md font-bold">Settings</h3>
              </div>

              <div className="mt-4 flex flex-row gap-2 items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold">
                    Available for reservation
                  </h5>
                  <h5 className="text-xs text-gray-500 mt-2">
                    Item is available to be used in reservations
                  </h5>
                </div>
                <Toggle setValue={setToggle} value={toggle} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-gray-300 w-full flex justify-end items-center">
        <div className="flex gap-4 mt-2">
          <Link href={`/main/items`}>
            <Button variant="white">Cancel</Button>
          </Link>
          <Link href={`/main/checkout`}>
            <Button variant="submit" type="button">
              Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
