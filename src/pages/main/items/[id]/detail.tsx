import Button from "@/components/Button";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import Header from "@/components/detail-item/Header";
import Tabs, { Tab } from "@/components/Tabs";
import { CONFIG } from "@/config";
import { IItems } from "@/types/single_items";
import { formatEpochDate, toMoney } from "@/utils";
import axios from "axios";
import { parse } from "cookie";
import {
  PencilIcon,
  PlusCircleIcon,
} from "lucide-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Barcode from "react-barcode";
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

    let resultPromise;
    if (query.type === "bulk" && params) {
      resultPromise = axios.get(`${CONFIG.API_URL}/v1/bulk-items/${params.id}`, {
        headers: {
          Authorization: `${token}`,
        },
      });
    } else if (query.type === "single" && params) {
      resultPromise = axios.get(
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

    const [result, notificationsData, unreadNotificationsData] = await Promise.all([
      resultPromise,
      fetchNotificationsServer(token),
      fetchUnreadNotificationsServer(token),
    ]);

    if (result.status !== 200) {
      throw new Error(`API request failed with status code ${result.status}`);
    }

    // Optionally validate token...
    return {
      props: {
        params,
        detail: result?.data,
        query,
        notifications: notificationsData?.data || [],
        unreadNotifications: unreadNotificationsData?.data || [],
      }
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
        unreadNotifications: []
      },
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
  // const [toggle, setToggle] = useState<boolean>(true);
  console.log(itemDetail, "detail");
  const itemInformation = [
    { label: "Item Name", value: itemDetail?.name },
    { label: "Rate/Day", value: toMoney(itemDetail?.rate_day) },
    { label: "Barcode", value: itemDetail?.barcode },
    { label: "Image", value: itemDetail?.full_path_image },
  ];
  const itemInformation2 = [
    { label: "Brand", value: itemDetail?.brand_name || "-" },
    { label: "Location", value: itemDetail?.location },
    { label: "Serial Number", value: itemDetail?.serial_number },
    { label: "Completeness", value: itemDetail?.completeness },
  ];

  const singleInformation = [
    {
      label: "Item Name",
      value: itemDetail?.name,
    },
    {
      label: "Brand",
      value: itemDetail?.brand_name || "-",
    },
    {
      label: "Model",
      value: itemDetail?.model,
    },
    {
      label: "Category Items",
      value: itemDetail?.category_name || "-",
    },
    {
      label: "Purchase Price",
      value: toMoney(Number(itemDetail?.purchase_price)),
    },
    {
      label: "Purchase Date",
      value: formatEpochDate(itemDetail?.purchase_date),
    },
    {
      label: "Warranty Date",
      value: formatEpochDate(itemDetail?.warranty_date),
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
                <div key={index} className={`flex gap-2 ${item.label === "Barcode" ? "flex-col items-start" : "items-center"}`}>
                  <p className="text-xs flex-shrink-0">{item.label}</p>
                  {item.label === "Image" ? (
                    <Image
                      alt="icon"
                      src={typeof item?.value === "string" ? item.value : ""}
                      width={50}
                      height={50}
                      className={"w-[100px] h-[100px]"}
                      unoptimized
                    />
                  ) : item.label === "Barcode" ? (
                    item.value ? (
                      <div className="flex flex-col items-start gap-1">
                        <Barcode
                          value={item.value}
                          format="CODE128"
                          width={1}
                          height={20}
                          displayValue={true}
                          fontSize={12}
                        />
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-gray-400">No barcode</p>
                    )
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
        <div className="flex lg:flex-row flex-col gap-5 mt-4">
          {/* Information Item Card */}
          <div className="border border-gray-300 p-4 rounded w-full lg:w-[60%] h-fit">
            <div className="border-b border-gray-300 w-full flex items-center justify-between pb-2">
              <h3 className="text-md font-bold">Information Item</h3>
            </div>

            <div className="mt-4 grid lg:grid-cols-2 grid-cols-1 gap-x-10 gap-y-4">
              <div className="flex flex-col gap-4">
                {itemInformation.map((item, index) => (
                  <div key={index} className="flex justify-between items-start w-full">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <div className="text-right flex justify-end w-full">
                      {item.label === "Image" ? (
                        <Image
                          alt="item image"
                          src={typeof item?.value === "string" ? item.value : ""}
                          width={40}
                          height={40}
                          className={"w-10 h-10 object-cover rounded"}
                          unoptimized
                        />
                      ) : item.label === "Barcode" ? (
                        item.value ? (
                          <Barcode
                            value={item.value}
                            format="CODE128"
                            width={1}
                            height={25}
                            displayValue={true}
                            fontSize={10}
                          />
                        ) : (
                          <p className="text-xs font-bold text-gray-400">No barcode</p>
                        )
                      ) : (
                        <p className="text-xs font-bold">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                {itemInformation2.map((item, index) => (
                  <div key={index} className="flex justify-between items-start w-full">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <div className="text-right flex justify-end w-full">
                      {item.label === "Serial Number" && item.value ? (
                        <div className="flex flex-col items-end gap-1">
                          <Barcode
                            value={item.value}
                            format="CODE128"
                            width={1}
                            height={25}
                            displayValue={true}
                            fontSize={10}
                          />
                        </div>
                      ) : item.label === "Completeness" ? (
                        <div className="flex flex-col items-start text-left">
                          {String(item.value || "").split(/[,|\n]/).map((point, i) => (
                            point.trim() && (
                              <p key={i} className="text-xs font-bold flex items-center gap-1">
                                <span>•</span> {point.trim()}
                              </p>
                            )
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-bold">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quantity Card */}
          <div className="lg:w-[40%] w-full h-fit border border-gray-300 p-6 rounded flex items-center justify-between">
            <h3 className="text-xl font-bold">Quantity</h3>
            <div className="flex gap-4 items-center">
              <Button
                variant="custom-color"
                className="bg-orange-500 text-white flex items-center gap-2 px-4 py-2 rounded-lg"
                onClick={() => setQty(qty + 1)}
              >
                <PlusCircleIcon className="w-5 h-5 text-white" />
                <span className="font-bold">Add Quantity</span>
              </Button>
              <div className="border border-orange-500 rounded-lg px-8 py-1 min-w-[100px] flex items-center justify-center">
                <p className="text-xl font-bold">{itemDetail?.qty || 0}</p>
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
