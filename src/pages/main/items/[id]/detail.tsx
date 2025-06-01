import Button from "@/components/Button";
import Header from "@/components/detail-item/Header";
import Tabs, { Tab } from "@/components/Tabs";
import Toggle from "@/components/Toggle";
import { parse } from "cookie";
import { MinusCircleIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import React, { useState } from "react";
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, params } = ctx;
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

    // Optionally validate token...
    return { props: { params } };
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

export const itemTabs = (id: string): Tab[] => [
  { label: "Information", href: `/main/items/${id}/detail` },
  { label: "Dashboard", href: `/main/items/${id}/dashboard` },
  { label: "Depreciation", href: `/main/items/${id}/depreciation` },
  { label: "Reservations", href: `/main/items/${id}/reservations` },
  { label: "Check-outs", href: `/main/items/${id}/checkouts` },
];
export default function Detail({ params }: any) {
  const itemInformation = [
    {
      label: "Item Name",
      value: "Canon EOS R100",
    },
    {
      label: "Model",
      value: "EOS R100",
    },
    {
      label: "Purchase Price",
      value: 15000000,
    },
    {
      label: "Warranty Date",
      value: "2023-01-01",
    },
    {
      label: "Rate/Day",
      value: 1500000,
    },
    {
      label: "Barcode",
      value: "123456789",
    },
    {
      label: "Image",
      value: "/images/camera.png",
    },
  ];

  const itemInformation2 = [
    {
      label: "Brand",
      value: "Canon",
    },
    {
      label: "Category",
      value: "Bulk Item",
    },
    {
      label: "Purchase Date",
      value: "2023-01-01",
    },
    {
      label: "Location",
      value: "Dipatiukur",
    },
    {
      label: "Serial Number",
      value: "KD12345",
    },
    {
      label: "Completeness",
      value: "Complete",
    },
  ];
  const [qty, setQty] = useState<number>(1);
  const [toggle, setToggle] = useState<boolean>(true);

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
      <Header />
      <div className="mt-4">
        <Tabs tabs={itemTabs(params?.id)} />
      </div>

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
              />
              <p className="text-xs text-orange-500">Action</p>
            </Button>
          </div>

          <div className="mt-4 grid lg:grid-cols-2 grid-cols-1 gap-10">
            <div className="flex flex-col gap-2">
              {itemInformation.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <p className="text-xs">{item.label}</p>
                  {item.label === "Image" ? (
                    <Image
                      alt="icon"
                      src={typeof item?.value === "string" ? item.value : ""}
                      width={50}
                      height={50}
                      className={"w-auto h-auto"}
                    />
                  ) : (
                    <p className="text-xs font-bold">{item.value}</p>
                  )}{" "}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {itemInformation2.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <p className="text-xs">{item.label}</p>
                  {item.label === "Image" ? (
                    <Image
                      alt="icon"
                      src={item?.value || ""}
                      width={50}
                      height={50}
                      className={"w-auto h-auto"}
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
                <div className="flex justify-between items-center" key={index}>
                  <div className="flex flex-row gap-2 items-center">
                    <Image
                      alt="icon"
                      src="/icons/barcode.svg"
                      width={20}
                      height={20}
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
                <h5 className="text-xs font-bold">Available for reservation</h5>
                <h5 className="text-xs text-gray-500 mt-2">
                  Item is available to be used in reservations
                </h5>
              </div>
              <Toggle setValue={setToggle} value={toggle} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-300 w-full flex justify-end items-center">
        <div className="flex gap-4 mt-2">
          <Button variant="white">Cancel</Button>
          <Button variant="submit">Checkout</Button>
        </div>
      </div>
    </div>
  );
}
