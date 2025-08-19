import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import TabsValue from "@/components/TabsValue";
import { PlusCircleIcon, ScanQrCodeIcon, XIcon } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

interface Props {
  open: boolean;
  setOpen: any;
  items: any;
  setItems: any;
  singleItems: any;
  bulkItems: any;
  setFilter?: any;
  filter?: any;
}

export default function AddEquipmentsModal({
  open,
  setOpen,
  items,
  setItems,
  singleItems,
  bulkItems,
  setFilter,
  filter,
}: Props) {
  const [tab, setTab] = useState<string>("single");

  const addEquipment = async (item: any) => {
    setItems([...items, item]);
  };

  const itemTabs = [
    { label: "Single Items", href: `single` },
    { label: "Bulk Items", href: `bulk` },
  ];
  return (
    <div>
      <Modal open={open} setOpen={setOpen} size="md">
        <div className="border-b-2 border-gray-200 pb-4 flex justify-between gap-2">
          <h1 className="text-center font-bold text-xl text-orange-500">
            Add Equipments
          </h1>
          <button type="button" onClick={setOpen}>
            <XIcon className="w-6 h-6 text-orange-500" />
          </button>
        </div>
        <div className="mt-4">
          <TabsValue tabs={itemTabs} value={tab} setValue={setTab} />
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="flex items-center gap-2 border rounded p-2 border-gray-300"
          >
            <ScanQrCodeIcon className="w-5 h-5 text-gray-500" />
            <p className="text-xs text-gray-500">Scan</p>
          </button>
          <div className="w-full">
            <Input
              type="search"
              placeholder="Search product..."
              fullWidth
              onChange={() => {
                setFilter({ ...filter, search: "search" });
              }}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center mt-2">
          <div className="w-full">
            <Select
              options={[]}
              placeholder="Bulk Items"
              onChange={(e) => setFilter({ ...filter, bulk: e })}
            />
          </div>
          <div className="w-full">
            <Select
              options={[
                { value: "all", label: "All" },
                { value: "cipadung", label: "Cipadung" },
                { value: "dipatiukur", label: "Dipatiukur" },
              ]}
              placeholder="Location"
              onChange={(e) => setFilter({ ...filter, location: e })}
            />
          </div>

          <button className="text-red-500 hover:text-red-600 text-xs w-1/3">
            Reset Filter
          </button>
        </div>
        <div className="mt-2">
          <p className="text-xs">Product/ All Equipment/ Camera</p>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {(tab === "single" ? singleItems : bulkItems)?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 border p-2 rounded hover:bg-gray-100 cursor-pointer"
            >
              <div
                className="flex items-center gap-2"
                onClick={() => {
                  if (tab === "single") {
                    setItems([...items, item]);
                  } else {
                    setItems([...items, { ...item, isBulk: true }]);
                  }
                }}
              >
                {item.full_path_image ? (
                  <Image
                    src={item.full_path_image}
                    alt={item.name}
                    width={50}
                    height={50}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded">
                    <p className="text-xs text-gray-500">No Image</p>
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.serial_number || "-"}
                  </p>
                </div>
              </div>
              {tab === "single" ? (
                <button
                  type="button"
                  className="bg-orange-200 rounded p-1"
                  onClick={() => addEquipment(item)}
                  disabled={items.some((i: any) => i.id === item.id)}
                >
                  {items.some((i: any) => i.id === item.id) ? (
                    <span className="text-xs text-orange-500">Added</span>
                  ) : (
                    <PlusCircleIcon className="w-5 h-5 text-orange-500" />
                  )}
                </button>
              ) : (
                <p className="text-xs text-gray-500">
                  {item.quantity} Available
                </p>
              )}
            </div>
          ))}
          <div className="w-full flex justify-end gap-2 border-t-2 border-t-gray-200 pt-4 mt-2">
            <Button
              variant="custom-color"
              className="border border-orange-500 text-orange-500"
              type="button"
              onClick={setOpen}
            >
              Close
            </Button>
            <Button
              variant="submit"
              type="button"
              onClick={() => setOpen()}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
