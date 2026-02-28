import Header from "@/components/detail-item/Header";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import Tabs from "@/components/Tabs";
import React, { useState } from "react";
import Modal, { useModal } from "@/components/Modal";
import { itemTabs } from "./detail";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { MapPin } from "lucide-react";
import Button from "@/components/Button";
import axios from "axios";
import { CONFIG } from "@/config";
import Image from "next/image";
import moment from "moment";

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
    let logs = null;
    let reservations = null;

    if (query.type === "bulk" && params) {
      resultPromise = axios.get(`${CONFIG.API_URL}/v1/bulk-items/${params.id}`, {
        headers: {
          Authorization: `${token}`,
        },
      });

      try {
        const resResponse = await axios.get(
          `${CONFIG.API_URL}/v1/bulk-items/${params.id}/detail/reservations`,
          {
            headers: { Authorization: `${token}` },
          }
        );
        reservations = resResponse.data?.data;
      } catch (e) {
        console.log("Error fetching bulk reservations:", e);
      }
    } else if (query.type === "single" && params) {
      resultPromise = axios.get(
        `${CONFIG.API_URL}/v1/single-items/${params.id}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      try {
        const resResponse = await axios.get(
          `${CONFIG.API_URL}/v1/single-items/${params.id}/detail/reservations`,
          {
            headers: { Authorization: `${token}` },
          }
        );
        reservations = resResponse.data?.data;
      } catch (e) {
        console.log("Error fetching single reservations:", e);
      }

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
        logs,
        reservations,
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
        unreadNotifications: [],
      },
    };
  }
};
export default function Dashboard({ params, detail, query, logs, reservations }: any) {
  const [modal, setModal] = useState<useModal>();
  const [showAllLogs, setShowAllLogs] = useState(false);
  const logsData = logs?.data || [];

  // Map reservations to events
  const reservationEvents = (reservations?.data || []).map((res: any) => ({
    title: res.customer_name || "Reserved",
    start: moment(res.start_date).format("YYYY-MM-DD"),
    end: moment(res.end_date).add(1, 'days').format("YYYY-MM-DD"), // Add 1 day for end date inclusive in FullCalendar
    color: "#f97316", // Tailwind orange-500
    allDay: true,
    extendedProps: {
      type: 'reservation'
    }
  }));

  // Map logs to events
  const logEvents = logsData.map((log: any) => ({
    title: `[LOG] ${log.action || "Action"}`,
    start: moment.unix(log.created_at).format("YYYY-MM-DD"),
    color: "#3b82f6", // Tailwind blue-500
    allDay: true,
    extendedProps: {
      log: log,
      type: 'log'
    }
  }));

  const allEvents = [...reservationEvents, ...logEvents];

  const handleEventClick = (info: any) => {
    const { extendedProps } = info.event;
    if (extendedProps.type === 'log') {
      setModal({ open: true, key: "log_detail", data: extendedProps.log });
    }
  };

  return (
    <div className="p-2">
      <Header detail={detail?.data} query={query} />
      <div className="mt-4">
        <Tabs tabs={itemTabs(params?.id, query)} />
      </div>

      <div className="flex md:flex-row flex-col gap-8 mt-5">
        <div className="max-w-full w-full h-[400px] overflow-auto">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={allEvents}
            eventClick={handleEventClick}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek",
            }}
          />
        </div>
        <div className="w-full">
          <div className="border border-gray-300 rounded p-4">
            <h1 className="text-lg font-bold">Extra Information</h1>
            <div className="mt-2 border-t border-gray-300">
              {query?.type === "single" ? (
                <div className="mt-4 max-h-[400px] overflow-y-auto relative pl-2">
                  {/* Vertical line connector */}
                  <div className="absolute left-[13px] top-4 bottom-4 w-[1px] bg-gray-200 z-0" />

                  {logsData.length > 0 ? (
                    <div className="flex flex-col gap-8">
                      {logsData.slice(0, showAllLogs ? logsData.length : 5).map((log: any, index: number) => (
                        <div key={log.id || index} className="relative flex flex-col pt-0.5">
                          {/* Dot on line */}
                          <div className="absolute left-[0px] top-[10px] w-7 h-7 flex items-center justify-center z-10">
                            <div className="w-4 h-4 rounded-full border border-gray-300 bg-white" />
                          </div>

                          <div className="pl-12">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                                {log.action || "-"}
                              </span>
                              <span className="text-xs text-gray-400">
                                {moment.unix(log.created_at).format("DD MMM YYYY, HH:mm")}
                              </span>
                            </div>

                            <div className="flex gap-4 items-center">
                              <Image
                                alt="Avatar"
                                src="/images/default-photo.svg"
                                width={32}
                                height={32}
                                className="rounded-full bg-gray-100 flex-shrink-0 border border-gray-100"
                              />
                              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm w-full">
                                {log.note && (
                                  <p className="text-sm text-gray-700">{log.note}</p>
                                )}
                                {log.reason && (
                                  <p className="text-xs text-gray-500 italic mt-1">
                                    Reason: {log.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {logsData.length > 5 && (
                        <div className="pl-12">
                          <button
                            onClick={() => setShowAllLogs(!showAllLogs)}
                            className="text-orange-500 text-xs font-bold hover:text-orange-600 transition-colors mt-2"
                          >
                            {showAllLogs ? "Show Less" : `Show More (${logsData.length - 5} more)`}
                          </button>
                        </div>
                      )}
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

      {modal?.key === "log_detail" && (
        <Modal
          open={modal?.open}
          setOpen={() => setModal({ open: false, key: "", data: {} })}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Log Detail</h2>
              <button
                onClick={() => setModal({ open: false, key: "", data: {} })}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">Action</p>
                <p className="text-base font-bold text-gray-800">{modal.data?.action || "-"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm text-gray-800">{moment.unix(modal.data?.created_at).format("DD MMM YYYY")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Time</p>
                  <p className="text-sm text-gray-800">{moment.unix(modal.data?.created_at).format("HH:mm")}</p>
                </div>
              </div>

              {modal.data?.note && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Note</p>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{modal.data.note}</p>
                  </div>
                </div>
              )}

              {modal.data?.reason && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Reason</p>
                  <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded border border-gray-200">
                    {modal.data.reason}
                  </p>
                </div>
              )}

              {modal.data?.creator_name && (
                <div className="mt-2 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Created By</p>
                  <p className="text-sm font-medium text-gray-800">{modal.data.creator_name}</p>
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                variant="submit"
                onClick={() => setModal({ open: false, key: "", data: {} })}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
