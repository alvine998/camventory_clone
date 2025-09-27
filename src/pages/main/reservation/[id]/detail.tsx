import Badge from "@/components/Badge";
import HeaderReservation from "@/components/detail-reservation/Header";
import Input from "@/components/Input";
import { CONFIG } from "@/config";
import { IReservation } from "@/types/reservation";
import axios from "axios";
import { parse } from "cookie";
import { Calendar1Icon, CalendarIcon } from "lucide-react";
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

    const result = await axios.get(
      `${CONFIG.API_URL}/v1/reservation/${params.id}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

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
export default function Detail({ detail, query }: any) {
  const itemDetail: IReservation = detail?.data;
  const [itemOrder, setItemOrder] = useState<any>(itemDetail?.details || []);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    
    const filtered = (itemDetail?.details || []).filter((item: any) =>
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
                    CONFIG.IMAGE_URL + item?.item_image_path ||
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
        <div className="border border-gray-300 p-4 rounded w-full">
          <h3 className="text-md font-bold">Extra Information</h3>
          <div className="mt-4 grid lg:grid-cols-5 grid-cols-1 gap-10 w-full"></div>
        </div>
      </div>
    </div>
  );
}
