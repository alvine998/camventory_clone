import { PackageIcon } from "lucide-react";
import React, { useState } from "react";
import Button from "../Button";
import Badge from "../Badge";
import Select from "../Select";
import Image from "next/image";
import { IItems } from "@/types/single_items";
import { useRouter } from "next/router";
import NotesModal from "../modals/items/NotesModal";
import Barcode from "react-barcode";

interface Props {
  detail: IItems;
  query: any;
}

export default function Header({ detail, query }: Props) {
  const router = useRouter();
  const [notesModalOpen, setNotesModalOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const conditions = [
    {
      label: "Good",
      value: "GOOD",
    },
    {
      label: "On Repair",
      value: "ON_REPAIR",
    },
    {
      label: "Need Check",
      value: "NEED_CHECK",
    },
    {
      label: "Broken",
      value: "BROKEN",
    },
    {
      label: "Takeout",
      value: "TAKEOUT",
    },
  ];

  const handleReserve = () => {
    // Navigate to create reservation with item data
    router.push({
      pathname: "/main/reservation/create",
      query: {
        itemId: detail?.id,
        itemType: query?.type || "single",
        itemName: detail?.name || "",
      },
    });
  };

  const handleChangeStatus = (e: any) => {
    // Store selected status and open notes modal
    // Status will be updated when notes are submitted
    const newStatus = e.value;
    setSelectedStatus(newStatus);
    setNotesModalOpen(true);
  };
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
              {!detail?.qty && (
                <Select
                  options={conditions}
                  defaultValue={detail?.status_items}
                  placeholder={detail?.status_items}
                  onChange={handleChangeStatus}
                />
              )}
              {/* <Button
                className="flex items-center gap-1 border border-orange-500"
                variant="custom-color"
                type="button"
                onClick={handleGenerateBarcode}
                disabled={generatingBarcode}
              >
                <QrCode className="w-4 h-4 text-orange-500" />
                <p className="text-orange-500 text-xs">
                  {generatingBarcode ? "Generating..." : "Generate Barcode"}
                </p>
              </Button> */}
              {/* <Button
                className="flex items-center gap-1 border border-orange-500"
                variant="custom-color"
              >
                <PencilIcon className="w-4 h-4 text-orange-500" />
                <p className="text-orange-500 text-xs">Edit</p>
              </Button> */}
              <Button
                className="flex items-center gap-1"
                variant="submit"
                type="button"
                onClick={handleReserve}
              >
                <PackageIcon className="w-4 h-4 text-white" />
                <p className="text-white text-xs">Reserve</p>
              </Button>
            </div>
          </div>
          <div className="flex gap-4 mt-2 flex-wrap items-start">
            <div className="flex gap-1 items-center min-w-0">
              {detail?.barcode ? (
                <div className="flex flex-col items-start gap-1">
                  <Barcode
                    value={detail.barcode}
                    format="CODE128"
                    width={1}
                    height={20}
                    displayValue={true}
                    fontSize={12}
                  />
                </div>
              ) : (
                <div className="flex gap-1 items-center min-w-0">
                  <Image
                    alt="icon"
                    src={"/icons/barcode.svg"}
                    width={20}
                    height={20}
                    className={"w-auto h-auto flex-shrink-0"}
                  />
                  <p className="text-xs text-gray-500 break-words break-all">
                    No barcode
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-1 items-center flex-shrink-0 mt-2">
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

      {/* Notes Modal */}
      {notesModalOpen && (
        <NotesModal
          open={notesModalOpen}
          setOpen={setNotesModalOpen}
          itemId={detail?.id}
          status={selectedStatus}
          onSuccess={() => {
            // Reset selected status after notes are saved
            setSelectedStatus("");
            // Optionally refresh data or show success message
            console.log("Notes and status updated successfully");
          }}
        />
      )}
    </div>
  );
}
