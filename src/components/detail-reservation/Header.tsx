import {
  ArrowLeftIcon,
  PencilIcon,
  ShoppingCartIcon,
  XCircleIcon,
} from "lucide-react";
import React, { useState } from "react";
import Button from "../Button";
import Badge from "../Badge";
import Dropdown from "../Dropdown";
import { useRouter } from "next/router";
import { IReservation } from "@/types/reservation";
import CancelModal from "../modals/reservation/CancelModal";
import axios from "axios";
import Swal from "sweetalert2";
import { getStatusBadgeColor } from "@/utils";

interface Props {
  detail: IReservation;
  query: any;
}

export default function HeaderReservation({ detail }: Props) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancelReservation = async (description: string) => {
    setIsLoading(true);

    try {
      await axios.patch("/api/reservation/cancel", {
        reason: description,
        id: detail?.id,
      });

      Swal.fire({
        icon: "success",
        title: "Reservation Cancelled",
        text: "The reservation has been successfully cancelled.",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowCancelModal(false);
      router.push("/main/reservation");
    } catch (error: any) {
      console.error("Cancel error:", error);
      const apiMessage = error.response?.data?.message;
      const errorMessage = typeof apiMessage === 'object' ? apiMessage.message : apiMessage;

      Swal.fire({
        icon: "error",
        title: "Cancel Failed",
        text:
          errorMessage ||
          error.message ||
          "An error occurred while cancelling the reservation",
      });
    } finally {
      setIsLoading(false);
    }
  };
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
              <h5>{detail?.book_id ?? "NK0001"}</h5>
              <Badge
                text={detail?.status || "Booked"}
                color={getStatusBadgeColor(detail?.status)}
              >
                {detail?.status}
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
              {detail?.status?.toUpperCase() === "BOOKED" && (
                <Button
                  variant="custom-color"
                  className="flex items-center gap-1 border border-orange-500"
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                >
                  <XCircleIcon className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-orange-500">Cancel</p>
                </Button>
              )}
              <Dropdown
                label={`Check Out ${detail?.details?.length || 0} items`}
                triggerIcon={<ShoppingCartIcon className="w-4 h-4 text-white" />}
                options={[
                  {
                    label: "Checkout",
                    onClick: () => {
                      console.log("Checkout clicked");
                      Swal.fire({
                        icon: "info",
                        title: "Checkout",
                        text: "Checkout action triggered",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                    },
                  },
                  {
                    label: "Check In",
                    onClick: () => {
                      console.log("Check In clicked");
                      Swal.fire({
                        icon: "info",
                        title: "Check In",
                        text: "Check In action triggered",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                    },
                  },
                  {
                    label: "Pickup of goods",
                    onClick: () => {
                      console.log("Pickup of goods clicked");
                      Swal.fire({
                        icon: "info",
                        title: "Pickup",
                        text: "Pickup of goods action triggered",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                    },
                  },
                ]}
              />
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <p className="text-xs text-gray-500">
              This reservation is due to be checked out in 5 days
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <CancelModal
        open={showCancelModal}
        setOpen={setShowCancelModal}
        onConfirm={handleCancelReservation}
        isLoading={isLoading}
      />
    </div>
  );
}
