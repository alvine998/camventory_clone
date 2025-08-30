import {
  ArrowLeftIcon,
  ChevronDownIcon,
  PencilIcon,
  ShoppingCartIcon,
  XCircleIcon,
} from "lucide-react";
import React from "react";
import Button from "../Button";
import Badge from "../Badge";
import { useRouter } from "next/router";
import { IReservation } from "@/types/reservation";

interface Props {
  detail: IReservation;
  query: any;
}

export default function HeaderReservation({ detail }: Props) {
  const router = useRouter();
  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            router.push("/main/reservation");
          }}
        >
          <ArrowLeftIcon className="w-7 h-5 text-orange-500" />
        </button>
        <h1 className="text-2xl font-bold text-orange-500">
          Detail Reservation
        </h1>
      </div>
      <div className="mt-4 border rounded border-gray-500 p-4">
        <div>
          <div className="flex justify-between gap-4">
            <div className="flex gap-5 items-center">
              <h5>{detail?.id ?? "NK0001"}</h5>
              <Badge text={detail?.status || "Booked"} color="warning">
                <p className="text-xs text-yellow-600">Booked</p>
              </Badge>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="custom-color"
                className="flex items-center gap-1 border border-orange-500"
                type="button"
                onClick={() => {
                  router.push(`/main/reservation/${detail?.id}/edit`);
                }}
              >
                <PencilIcon className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-orange-500">Edit</p>
              </Button>
              <Button
                variant="custom-color"
                className="flex items-center gap-1 border border-orange-500"
              >
                <XCircleIcon className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-orange-500">Cancel</p>
              </Button>
              <Button variant="submit" className="flex items-center gap-1">
                <ShoppingCartIcon className="w-4 h-4 text-white" />
                <p className="text-xs text-white">Checkout</p>
                <ChevronDownIcon className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <p className="text-xs text-gray-500">
              This reservation is due to be checked out in 5 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
