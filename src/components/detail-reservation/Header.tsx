import {
  ArrowLeftIcon,
  PencilIcon,
  ShoppingCartIcon,
  XCircleIcon,
  PrinterIcon,
} from "lucide-react";
import React, { useState } from "react";
import Button from "../Button";
import Badge from "../Badge";
import Dropdown from "../Dropdown";
import { useRouter } from "next/router";
import { IReservation } from "@/types/reservation";
import CancelModal from "../modals/reservation/CancelModal";
import CheckInModal from "../modals/reservation/CheckInModal";
import axios from "axios";
import Swal from "sweetalert2";
import { getStatusBadgeColor } from "@/utils";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
  detail: IReservation;
  query: any;
}

export default function HeaderReservation({ detail }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
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

  const handleCheckout = async () => {
    if (!user?.id) {
      Swal.fire({
        icon: "error",
        title: "Unauthorized",
        text: "User ID not found. Please log in again.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id: detail?.id,
        user_id: user.id,
        items: detail?.details?.map((item) => ({
          item_id: item.item_id,
        })),
      };

      const res = await axios.post("/api/reservation/checkout", payload);

      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Checkout Successful",
          text: "The checkout process has been completed successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        // Reload page to reflect new status
        router.reload();
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      const apiMessage = error.response?.data?.message;
      const errorMessage = typeof apiMessage === "object" ? apiMessage.message : apiMessage;

      Swal.fire({
        icon: "error",
        title: "Checkout Failed",
        text: errorMessage || error.message || "An error occurred during checkout.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (checkInItems: any[]) => {
    setIsLoading(true);
    try {
      const payload = {
        id: detail?.id,
        items: checkInItems,
      };

      const res = await axios.post("/api/reservation/checkin", payload);

      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Check In Successful",
          text: "The check in process has been completed successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        setShowCheckInModal(false);
        // Reload page to reflect new status
        router.reload();
      }
    } catch (error: any) {
      console.error("Check in error:", error);
      const apiMessage = error.response?.data?.message;
      const errorMessage = typeof apiMessage === "object" ? apiMessage.message : apiMessage;

      Swal.fire({
        icon: "error",
        title: "Check In Failed",
        text: errorMessage || error.message || "An error occurred during check in.",
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
              {detail?.status?.toUpperCase() === "BOOKED" && (
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
              )}
              {detail?.status?.toUpperCase() === "BOOKED" && (
                <Button
                  variant="custom-color"
                  className="flex items-center gap-1 border border-orange-500"
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  disabled={isLoading}
                >
                  <XCircleIcon className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-orange-500">Cancel</p>
                </Button>
              )}

              {detail?.status?.toUpperCase() === "BOOKED" ? (
                <Dropdown
                  label={`Check Out ${detail?.details?.length || 0} items`}
                  triggerIcon={<ShoppingCartIcon className="w-4 h-4 text-white" />}
                  isLoading={isLoading}
                  options={[
                    {
                      label: "Checkout",
                      onClick: handleCheckout,
                    },
                    // {
                    //   label: "Pickup of goods",
                    //   onClick: () => {
                    //     console.log("Pickup of goods clicked");
                    //     Swal.fire({
                    //       icon: "info",
                    //       title: "Pickup",
                    //       text: "Pickup of goods action triggered",
                    //       timer: 1500,
                    //       showConfirmButton: false,
                    //     });
                    //   },
                    // },
                  ]}
                />
              ) : detail?.status?.toUpperCase() === "CHECKOUT" ? (
                <Dropdown
                  label={`Check In ${detail?.details?.length || 0} items`}
                  triggerIcon={<ShoppingCartIcon className="w-4 h-4 text-white" />}
                  isLoading={isLoading}
                  options={[
                    {
                      label: "Check In",
                      onClick: () => setShowCheckInModal(true),
                    },
                  ]}
                />
              ) : (
                <Button
                  variant="submit"
                  className="flex items-center gap-2"
                  onClick={() => {
                    console.log("Print PDF clicked");
                    Swal.fire({
                      icon: "info",
                      title: "Print PDF",
                      text: "Print PDF action triggered",
                      timer: 1500,
                      showConfirmButton: false,
                    });
                  }}
                >
                  <PrinterIcon className="w-4 h-4 text-white" />
                  Print PDF
                </Button>
              )}
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

      {/* Check In Modal */}
      <CheckInModal
        open={showCheckInModal}
        setOpen={setShowCheckInModal}
        items={detail?.details || []}
        onConfirm={handleCheckIn}
        isLoading={isLoading}
      />
    </div>
  );
}
