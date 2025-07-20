import Header from "@/components/detail-item/Header";
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

export default function Checkouts({ params, detail, query }: any) {
  const [show, setShow] = useState<boolean>(false);

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
