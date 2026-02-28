import Badge from "@/components/Badge";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import HeaderReservation from "@/components/detail-reservation/Header";
import Input from "@/components/Input";
import { CONFIG } from "@/config";
import { IReservation, IReservationLogResponse } from "@/types/reservation";
import axios from "axios";
import { parse } from "cookie";
import {
  Calendar1Icon,
  CalendarIcon,
  Mail,
  MapPin,
} from "lucide-react";
import moment from "moment";
import { GetServerSideProps } from "next";
import Image from "next/image";
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

    if (!params) {
      return {
        redirect: {
          destination: "/main/reservation",
          permanent: false,
        },
      };
    }

    const [result, logsResult, notificationsData, unreadNotificationsData] = await Promise.all([
      axios.get(`${CONFIG.API_URL}/v1/reservation/${params.id}`, {
        headers: {
          Authorization: `${token}`,
        },
      }),
      axios.get(`${CONFIG.API_URL}/v1/reservation/${params.id}/logs`, {
        headers: {
          Authorization: `${token}`,
        },
      }),
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
        logs: logsResult?.data || null,
        query,
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
        logs: null,
        notifications: [],
        unreadNotifications: [],
      },
    };
  }
}
export default function Detail({ detail, logs, query }: any) {
  const itemDetail: IReservation = detail?.data;
  const reservationLogs: IReservationLogResponse = logs;
  const [itemOrder, setItemOrder] = useState<any>(itemDetail?.details || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Update itemOrder when details change
  React.useEffect(() => {
    setItemOrder(itemDetail?.details || []);
  }, [itemDetail?.details]);

  // Handle search with debounce
  React.useEffect(() => {
    if (!searchTerm) {
      setItemOrder(itemDetail?.details || []);
      return;
    }

    const filtered = (itemDetail?.details || []).filter(
      (item: any) =>
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_id?.toString().includes(searchTerm)
    );
    setItemOrder(filtered);
  }, [searchTerm, itemDetail?.details]);
  return (
    <div className="p-2">
      <HeaderReservation detail={itemDetail} query={query} />

      <div className="flex gap-5 mt-4">
        {/* Col 1 */}
        <div className="border border-gray-300 p-4 rounded w-full">
          <div className="flex items-center gap-2 justify-between border-b border-b-gray-400 pb-4">
            <h3 className="text-md font-bold">Order Items</h3>
            <div className="flex gap-2 items-center">
              <Calendar1Icon className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500">
                {moment().format("MMMM DD, YYYY [at] hh:mm A")}
              </p>
            </div>
          </div>

          {/* Date & Customer Name */}
          <div className="border p-2 border-gray-400 mt-2 px-4 rounded flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              <Image
                alt={"photo"}
                src={`/images/default-photo.svg`}
                className={`w-auto h-auto duration-200 transition-all rounded-full`}
                layout="relative"
                width={40}
                height={40}
              />
              <div>
                <h5 className="text-gray-500 text-sm">Customer</h5>
                <h5 className="font-bold text-sm uppercase">
                  {itemDetail?.ref_customer?.name || "Alvine Y P"}
                </h5>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center p-1">
                <CalendarIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <label
                  className="text-gray-500 text-xs"
                  htmlFor="customer_name"
                >
                  From
                </label>
                <p className="text-xs font-bold">
                  {moment(itemDetail?.start_date * 1000).format("MMM DD, YYYY")}
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
                  {moment(itemDetail?.end_date * 1000).format("MMM DD, YYYY")}
                </p>
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div className=" flex items-center gap-2 justify-between py-4 border-b border-b-gray-300">
            <div className="flex gap-2 items-center">
              <h5>Equipment</h5>
              <Badge
                color="empty"
                text={String(itemDetail?.details?.length) || `0` + " Items"}
              >
                <p className="text-xs text-orange-600">
                  {itemDetail?.details?.length || "0"} Items
                </p>
              </Badge>
            </div>
            <div>
              <Input
                placeholder="Search Equipment"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
            </div>
          </div>

          {/* List Equipment */}
          <div className="flex flex-col gap-2">
            {itemOrder?.map((item: any, index: number) => (
              <div className="flex gap-4 items-center py-4" key={index}>
                <Image
                  src={
                    CONFIG.IMAGE_URL + "/" + item?.item_image_path ||
                    "/images/camera.png"
                  }
                  alt={"photo"}
                  className={`w-20 h-20 duration-200 transition-all rounded-full`}
                  layout="relative"
                  width={50}
                  height={50}
                />
                <div>
                  <h5 className="font-bold text-sm">{item?.item_name}</h5>
                  <h5 className="text-gray-400 text-xs">
                    {item?.item_type === "single" ? "Product" : "Items"}
                  </h5>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2 */}
        <div className="border border-gray-300 p-6 rounded-lg w-full flex flex-col gap-6 bg-white shadow-sm">
          <div className="border-b border-gray-200 pb-3">
            <h3 className="text-lg font-bold text-gray-800">Extra Information</h3>
          </div>

          <div className="flex flex-col gap-6">
            {/* Pickup Location */}
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-100">
                  <MapPin className="w-5 h-5 text-gray-700" />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {itemDetail?.pickup_location || "Not specified"}
                </span>
              </div>
            </div>

            {/* Logs Timeline */}
            <div className="flex flex-col relative pl-2">
              {/* Vertical line connector - Adjusted to align with dots */}
              {/* <div className="absolute left-[13px] top-4 bottom-4 w-[1px] bg-gray-200 z-0 " /> */}

              <div className="flex flex-col gap-2">
                {reservationLogs?.data && reservationLogs.data.length > 0 ? (
                  <>
                    {[...reservationLogs.data]
                      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, showAllLogs ? reservationLogs.data.length : 5)
                      .map((log: any, index: number) => {
                        const isEmail = log.note.toLowerCase().includes("email");

                        return (
                          <div key={log.id} className="relative flex flex-col pt-0.5">
                            {/* Dot on line - Hollow circle matching image */}
                            <div>
                              <div className="absolute left-[0px] top-[0px] w-7 h-7 flex items-center justify-center z-10">
                                <div className="w-4 h-4 rounded-full border border-gray-300 bg-white" />
                              </div>
                              <div className="absolute left-[0px] top-[35px] w-7 h-7 flex items-center justify-center z-10">
                                <div className="w-0.5 h-[50px] border rounded border-gray-300 bg-gray-300" />
                              </div>
                            </div>

                            <div className="pl-12">
                              {/* Timestamp - Above the content as in image */}
                              <p className="text-xs text-gray-400 mb-3 font-medium">
                                {moment(log.created_at).format("DD MMMM YYYY, HH:mm [WIB]")}
                              </p>

                              {index === 0 || log.is_important ? (
                                // Special entries or first entry boxed as in image
                                <div className="flex gap-4 items-center">
                                  <Image
                                    alt="Avatar"
                                    src="/images/default-photo.svg"
                                    width={36}
                                    height={36}
                                    className="rounded-full bg-gray-100 flex-shrink-0"
                                  />
                                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm w-full">
                                    <p className="text-sm text-gray-700 font-medium">
                                      {log.note}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-4 items-center">
                                  {isEmail ? (
                                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center border border-green-200 flex-shrink-0">
                                      <Mail className="w-5 h-5 text-green-600" />
                                    </div>
                                  ) : (
                                    <Image
                                      alt="Avatar"
                                      src="/images/default-photo.svg"
                                      width={36}
                                      height={36}
                                      className="rounded-full bg-gray-100 border border-gray-200 flex-shrink-0"
                                    />
                                  )}
                                  <p className="text-sm text-gray-700 font-medium">
                                    {log.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {reservationLogs.data.length > 5 && (
                      <div className="pl-10 mt-4">
                        <button
                          onClick={() => setShowAllLogs(!showAllLogs)}
                          className="text-orange-500 text-sm font-bold hover:text-orange-600 transition-colors"
                        >
                          {showAllLogs ? "Show Less" : `Show More (${reservationLogs.data.length - 5} more)`}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg ml-8">
                    <p className="text-sm text-gray-500 italic">
                      No extra information available for this reservation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
