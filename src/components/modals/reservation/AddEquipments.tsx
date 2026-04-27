import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import TabsValue from "@/components/TabsValue";
import {
  MinusCircleIcon,
  PlusCircleIcon,
  ScanQrCodeIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import ScannerModal from "../../ScannerModal";
import Swal from "sweetalert2";

// Removed Quagga declaration as we're using ScannerModal

interface Item {
  id: string;
  name: string;
  serial_number?: string;
  full_path_image?: string;
  qty?: number;
  isBulk?: boolean;
  added?: number;
}

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: Item[];
  setItems: any;
  singleItems: Item[];
  bulkItems: Item[];
  setFilter?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  filter?: Record<string, string>;
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
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  /** ✅ Add single item */
  const addEquipment = (item: Item) => {
    if (!items.some((i) => i.id === item.id)) {
      setItems([...items, { ...item, added: 1 }]);
    }
  };

  /** ✅ Adjust bulk quantity */
  const adjustBulkQty = (item: Item, change: number) => {
    setItems((prev: any) => {
      const existingIndex = prev.findIndex(
        (i: any) => i.id === item.id && i.isBulk
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].qty = (updated[existingIndex].qty || 0) + change;
        if (updated[existingIndex].qty! <= 0) {
          updated.splice(existingIndex, 1);
        }
        return updated;
      }
      if (change > 0) {
        return [...prev, { ...item, qty: 1, isBulk: true }];
      }
      return prev;
    });
  };

  const handleScanSuccess = (decodedText: string) => {
    // Search in singleItems and bulkItems
    const allItems = [...singleItems, ...bulkItems];

    // Find item by ID or Serial Number (barcode)
    const foundItem = allItems.find(item =>
      item.id === decodedText ||
      item.serial_number === decodedText
    );

    if (foundItem) {
      // Determine if it's single or bulk
      const isSingle = tab === "single";

      if (isSingle) {
        addEquipment(foundItem);
      } else {
        adjustBulkQty(foundItem, 1);
      }

      Swal.fire({
        icon: 'success',
        title: 'Item Added',
        text: `${foundItem.name} has been added to the list.`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Not Found',
        text: `No item found with ID or Serial Number: ${decodedText}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  /** ✅ Reset filters */
  const resetFilters = () => {
    setSearchTerm("");
    setLocationFilter("all");
    setFilter?.({});
  };

  // Cleanup removed as we're using ScannerModal

  const getFilteredItems = () => {
    const currentItems = tab === "single" ? singleItems : bulkItems;

    return currentItems.filter((item) => {
      // Search filter - now includes barcode/serial number
      const matchesSearch = searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase()));

      // Location filter (assuming items have a location property)
      const matchesLocation = locationFilter === "all" ||
        (item as any).location === locationFilter;

      return matchesSearch && matchesLocation;
    });
  };

  const itemTabs = [
    { label: "Single Items", href: "single" },
    { label: "Bulk Items", href: "bulk" },
  ];

  const filteredItems = getFilteredItems();

  return (
    <Modal open={open} setOpen={setOpen} size="md">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-4 flex justify-between items-center">
        <h1 className="font-bold text-xl text-orange-500">Add Equipments</h1>
        <button type="button" onClick={() => setOpen(false)}>
          <XIcon className="w-6 h-6 text-orange-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <TabsValue
          tabs={itemTabs}
          value={tab}
          setValue={(val) => setTab(val as "single" | "bulk")}
        />
      </div>

      {/* Search & Filter */}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="flex items-center gap-2 border rounded p-2 transition-colors border-gray-300 hover:border-orange-500 hover:bg-orange-50"
          onClick={() => setIsScannerOpen(true)}
        >
          <ScanQrCodeIcon className="w-5 h-5 text-orange-500" />
          <p className="text-xs text-gray-500">Scan QR / Barcode</p>
        </button>
        <Input
          type="search"
          placeholder="Search product by name or barcode..."
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-2 items-center mt-2">
        <Select
          options={[]}
          placeholder="Bulk Items"
          onChange={(val) =>
            setFilter?.({
              ...filter,
              bulk: val && "value" in val && val.value ? String(val.value) : "",
            })
          }
        />
        <Select
          options={[
            { value: "all", label: "All" },
            { value: "cipadung", label: "Cipadung" },
            { value: "dipatiukur", label: "Dipatiukur" },
          ]}
          placeholder="Location"
          value={{ value: locationFilter, label: locationFilter === "all" ? "All" : locationFilter.charAt(0).toUpperCase() + locationFilter.slice(1) }}
          onChange={(val) =>
            setLocationFilter(
              val && typeof val === "object" && "value" in val && val.value
                ? String(val.value)
                : "all"
            )
          }
        />
        <button
          className="text-red-500 hover:text-red-600 text-xs"
          onClick={resetFilters}
          type="button"
        >
          Reset Filter
        </button>
      </div>

      {/* Scanner Modal Triggered */}
      <ScannerModal
        open={isScannerOpen}
        setOpen={setIsScannerOpen}
        onScanSuccess={handleScanSuccess}
      />

      {/* Item List */}
      <div className="mt-4 flex flex-col gap-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No items found matching your search criteria.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 border p-2 rounded hover:bg-gray-100"
              >
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() =>
                    tab === "single" ? addEquipment(item) : adjustBulkQty(item, 1)
                  }
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
                      {item?.qty ? "Item" : "Product"}
                    </p>
                  </div>
                </div>

                {tab === "single" ? (
                  <button
                    type="button"
                    className="bg-orange-200 rounded p-1"
                    onClick={() => addEquipment(item)}
                    disabled={item?.added == 1}
                  >
                    {item?.added == 1 ? (
                      <span className="text-xs text-orange-500">Added</span>
                    ) : (
                      <PlusCircleIcon className="w-5 h-5 text-orange-500" />
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={items.find((i) => i.id === item.id)?.added === 0}
                      onClick={() => {
                        if (items.find((i) => i.id === item.id)?.added == 1) {
                          setItems(items.filter((i) => i.id !== item.id));
                          return;
                        }
                        if (item?.added && item?.added > 0) {
                          const result = items.map((i) => {
                            if (i.id === item.id) {
                              return { ...i, added: (i.added || 0) - 1 };
                            }
                            return i;
                          });
                          setItems(result);
                        }
                      }}
                    >
                      <MinusCircleIcon
                        className={`w-5 h-5 ${item?.qty ? "text-orange-500" : "text-gray-400"
                          }`}
                      />
                    </button>
                    <p>{items.find((i) => i.id === item.id)?.added || 0}</p>
                    <button
                      type="button"
                      disabled={
                        items.find((i) => i.id === item.id)?.added === item?.qty
                      }
                      onClick={() => {
                        if (
                          items?.find(
                            (i) => i.id === item.id && i?.qty && i?.added
                          )
                        ) {
                          const result = items.map((i) => {
                            if (i.id === item.id) {
                              return { ...i, added: (i.added || 0) + 1 };
                            }
                            return i;
                          });
                          setItems(result);
                        } else {
                          const result = [...items, { ...item, added: 1 }];
                          setItems(result);
                        }
                      }}
                    >
                      <PlusCircleIcon className="w-5 h-5 text-orange-500" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Buttons */}
      <div className="w-full flex justify-end gap-2 border-t-2 border-t-gray-200 pt-4 mt-4">
        <Button
          variant="custom-color"
          className="border border-orange-500 text-orange-500"
          type="button"
          onClick={() => setOpen(false)}
        >
          Close
        </Button>
        <Button variant="submit" type="button" onClick={() => setOpen(false)}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
