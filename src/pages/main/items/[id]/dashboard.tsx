import Header from "@/components/detail-item/Header";
import Tabs from "@/components/Tabs";
import React from "react";
import { itemTabs } from "./detail";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { MapPin } from "lucide-react";
import Button from "@/components/Button";

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
export default function Dashboard({ params }: any) {
  return (
    <div className="p-2">
      <Header />
      <div className="mt-4">
        <Tabs tabs={itemTabs(params?.id)} />
      </div>

      <div className="flex md:flex-row flex-col gap-8 mt-5">
        <div className="max-w-full w-full h-[400px] overflow-auto">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={[
              { title: "Event 1", date: "2025-06-01" },
              { title: "Event 2", date: "2025-06-10" },
            ]}
          />
        </div>
        <div className="w-full">
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
