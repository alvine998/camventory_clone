import Header from "@/components/detail-item/Header";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import Tabs from "@/components/Tabs";
import React, { useEffect, useState } from "react";
import { itemTabs } from "./detail";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import { Calendar1Icon, MapPin } from "lucide-react";
import Button from "@/components/Button";
import moment from "moment";
import DataTable from "react-data-table-component";
import { ColumnCheckout } from "@/constants/column_checkout";
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
    let logs = null;

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
        notifications: notificationsData?.data || [],
        unreadNotifications: unreadNotificationsData?.data || [],
      }
    };

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
      props: {
        table: [],
        notifications: [],
        unreadNotifications: []
      },
    };
  }
};

export default function Checkouts({ params, detail, query, logs }: any) {
  const [show, setShow] = useState<boolean>(false);
  const logsData = logs?.data || [];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShow(true);
    }
  }, []);
  return (
    <div className="p-2">
      <Header detail={detail?.data} query={query} />
      <div className="mt-4">
        <Tabs tabs={itemTabs(params?.id, query)} />
      </div>

      <div className="flex md:flex-row flex-col gap-4 mt-5">
        <div className="border border-gray-300 rounded p-4 w-full h-[45vh]">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold">List Checkout</h1>
            <div className="flex gap-2 items-center">
              <Calendar1Icon className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500">
                {moment().format("MMMM DD, YYYY [at] hh:mm A")}
              </p>
            </div>
          </div>
          <div className="mt-2 border-t border-gray-300 py-4">
            <div className="w-full overflow-x-auto">
              {show && (
                <div className="mt-4">
                  <DataTable
                    columns={ColumnCheckout}
                    data={[]}
                    pagination
                    highlightOnHover
                    responsive
                    customStyles={{
                      headCells: {
                        style: {
                          backgroundColor: "#f3f4f6",
                          fontWeight: "bold",
                        },
                      },
                      rows: {
                        style: {
                          "&:hover": {
                            backgroundColor: "#e5e7eb",
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
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
