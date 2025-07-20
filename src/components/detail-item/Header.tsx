import { PackageIcon } from "lucide-react";
import React from "react";
import Button from "../Button";
import Badge from "../Badge";
import Select from "../Select";
import Image from "next/image";
import { IItems } from "@/types/single_items";

interface Props {
  detail: IItems;
  query: any;
}

export default function Header({ detail, query }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">Detail Items</h1>
      <div className="mt-4 border rounded border-gray-500 p-4">
        <div>
          <div className="flex justify-between gap-4">
            <div className="flex gap-5 items-center">
              <h5>{detail?.name ?? "-"}</h5>
              <Badge text={detail?.status_booking} />
            </div>
            <div className="flex gap-2 items-center">
              <Select options={[]} placeholder={detail?.status_items} />
              {/* <Button
                className="flex items-center gap-1 border border-orange-500"
                variant="custom-color"
              >
                <PencilIcon className="w-4 h-4 text-orange-500" />
                <p className="text-orange-500 text-xs">Edit</p>
              </Button> */}
              <Button className="flex items-center gap-1" variant="submit">
                <PackageIcon className="w-4 h-4 text-white" />
                <p className="text-white text-xs">Reserve</p>
              </Button>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex gap-1 items-center">
              <Image
                alt="icon"
                src={"/icons/barcode.svg"}
                width={20}
                height={20}
                className={"w-auto h-auto"}
              />
              <p className="text-xs text-gray-500">{detail?.serial_number}</p>
            </div>
            <div className="flex gap-1 items-center">
              <Image
                alt="icon"
                src={"/icons/box_gray.svg"}
                width={20}
                height={20}
                className={"w-auto h-auto"}
              />
              <p className="text-xs text-gray-500">{query.type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
