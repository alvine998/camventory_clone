import Header from "@/components/detail-item/Header";
import Tabs from "@/components/Tabs";
import React from "react";
import { itemTabs } from "./detail";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import {
  Calendar1Icon,
  CalendarIcon,
  MapPin,
  MapPinIcon,
  UserCircle2Icon,
} from "lucide-react";
import Button from "@/components/Button";
import moment from "moment";

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

export default function Reservations({ params }: any) {
  return (
    <div className="p-2">
      <Header />
      <div className="mt-4">
        <Tabs tabs={itemTabs(params?.id)} />
      </div>

      <div className="flex md:flex-row flex-col gap-4 mt-5">
        <div className="border border-gray-300 rounded p-4 w-full h-[45vh]">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold">Order Item</h1>
            <div className="flex gap-2 items-center">
              <Calendar1Icon className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500">
                {moment().format("MMMM DD, YYYY [at] hh:mm A")}
              </p>
            </div>
          </div>
          <div className="mt-2 border-t border-gray-300 py-4">
            <div className="border border-gray-300 rounded p-4 w-full flex gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle2Icon className="w-8 h-8 text-gray-500" />
                <div>
                  <label
                    className="text-gray-500 text-xs"
                    htmlFor="customer_name"
                  >
                    Customer
                  </label>
                  <p className="text-xs font-bold">Ricky Abdullah</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-300 flex items-center justify-center p-1">
                  <CalendarIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <label
                    className="text-gray-500 text-xs"
                    htmlFor="customer_name"
                  >
                    From
                  </label>
                  <p className="text-xs font-bold">
                    {moment().format("MMM DD, YYYY")}
                  </p>
                </div>
                <div>
                  <label
                    className="text-gray-500 text-xs"
                    htmlFor="customer_name"
                  >
                    To
                  </label>
                  <p className="text-xs font-bold">
                    {moment().format("MMM DD, YYYY")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-300 flex items-center justify-center p-1">
                  <MapPinIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <label
                    className="text-gray-500 text-xs"
                    htmlFor="customer_name"
                  >
                    Location
                  </label>
                  <p className="text-xs font-bold">Cipadung</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2">
          <div className="border border-gray-300 rounded p-4">
            <h1 className="text-lg font-bold">Extra Information</h1>
            <div className="mt-2 border-t border-gray-300">
              <div className="p-2 mt-2 border rounded-full w-full border-gray-300 flex items-center">
                <MapPin className="w-5 h-5" />
                <p className="text-sm ml-2">Cipadung</p>
              </div>
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
