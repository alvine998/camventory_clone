import Header from "@/components/detail-item/Header";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
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
import axios from "axios";
import { CONFIG } from "@/config";

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
    let reservationPromise;
    let logs = null;

    if (query.type === "bulk" && params) {
      resultPromise = axios.get(`${CONFIG.API_URL}/v1/bulk-items/${params.id}`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      reservationPromise = axios.get(
        `${CONFIG.API_URL}/v1/bulk-items/${params.id}/detail/reservations`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
    } else if (query.type === "single" && params) {
      resultPromise = axios.get(
        `${CONFIG.API_URL}/v1/single-items/${params.id}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
      reservationPromise = axios.get(
        `${CONFIG.API_URL}/v1/single-items/${params.id}/detail/reservations`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      // Fetch logs for single items
      try {
        const logsResponse = await axios.get(
          `${CONFIG.API_URL}/v1/single-items/${params.id}/logs?limit=100&page=1`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );
        if (logsResponse.status === 200) {
          logs = logsResponse.data;
        }
      } catch (logsError: any) {
        console.log("Error fetching logs:", logsError);
        // Logs are optional, so we continue even if they fail
        logs = null;
      }
    } else {
      throw new Error(`Invalid query.type: ${query.type}`);
    }

    const [result, reservationRes, notificationsData, unreadNotificationsData] = await Promise.all([
      resultPromise,
      reservationPromise,
      fetchNotificationsServer(token),
      fetchUnreadNotificationsServer(token),
    ]);

    if (reservationRes.status !== 200) {
      throw new Error(
        `API request failed with status code ${reservationRes.status}`
      );
    }

    if (result.status !== 200) {
      throw new Error(`API request failed with status code ${result.status}`);
    }

    // Optionally validate token...
    return {
      props: {
        params,
        detail: result?.data,
        query,
        reservation: reservationRes?.data?.data,
        logs,
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

const ReservationItem = ({ reservation }: any) => {
  return (
    <div key={reservation.id} className="mt-2">
      <div className="border border-gray-300 rounded p-4 w-full flex gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircle2Icon className="w-8 h-8 text-gray-500" />
          <div>
            <label className="text-gray-500 text-xs" htmlFor="customer_name">
              Customer
            </label>
            <p className="text-xs font-bold">{reservation.customer_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-300 flex items-center justify-center p-1">
            <CalendarIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <label className="text-gray-500 text-xs" htmlFor="startdate">
              From
            </label>
            <p className="text-xs font-bold">
              {moment(reservation.start_date).format("MMM DD, YYYY")}
            </p>
          </div>
          <div>
            <label className="text-gray-500 text-xs" htmlFor="enddate">
              To
            </label>
            <p className="text-xs font-bold">
              {moment(reservation.end_date).format("MMM DD, YYYY")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-300 flex items-center justify-center p-1">
            <MapPinIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <label className="text-gray-500 text-xs" htmlFor="location">
              Location
            </label>
            <p className="text-xs font-bold">{reservation.location || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Reservations({
  params,
  detail,
  query,
  reservation,
  logs,
}: any) {
  console.log(reservation, "detail reservations");
  const logsData = logs?.data || [];

  return (
    <div className="p-2">
      <Header detail={detail?.data} query={query} />
      <div className="mt-4">
        <Tabs tabs={itemTabs(params?.id, query)} />
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
          <div className="mt-2 border-t border-gray-300"></div>
          {reservation?.count > 0 ? (
            reservation?.data?.map((item: any) => (
              <ReservationItem key={item.id} reservation={item} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No reservation found</p>
            </div>
          )}
        </div>
        <div className="w-1/2">
          <div className="border border-gray-300 rounded p-4">
            <h1 className="text-lg font-bold">Extra Information</h1>
            <div className="mt-2 border-t border-gray-300">
              {query?.type === "single" ? (
                <div className="mt-4 max-h-[300px] overflow-y-auto">
                  {logsData.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {logsData.map((log: any, index: number) => (
                        <div key={log.id || index} className="border border-gray-200 rounded p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-orange-500">
                                  {log.action || "-"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {moment.unix(log.created_at).format("DD MMM YYYY, HH:mm")}
                                </span>
                              </div>
                              {log.note && (
                                <p className="text-xs text-gray-700 mb-1">{log.note}</p>
                              )}
                              {log.reason && (
                                <p className="text-xs text-gray-500 italic">
                                  Reason: {log.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-gray-500 text-sm">No logs found</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2 mt-2 border rounded-full w-full border-gray-300 flex items-center">
                  <MapPin className="w-5 h-5" />
                  <p className="text-sm ml-2">Cipadung</p>
                </div>
              )}
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
