import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import TabsValue from "@/components/TabsValue";
import {
  ArrowLeftIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  ScanQrCodeIcon,
  ShoppingCartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import ScannerModal from "../ScannerModal";
import Swal from "sweetalert2";

interface Item {
  id: string;
  name: string;
  serial_number?: string;
  full_path_image?: string;
  qty?: number;
  isBulk?: boolean;
  added?: number;
  category?: string;
  location?: string;
  barcode?: string;
}

interface Props {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  singleItems: Item[];
  bulkItems: Item[];
  onBack: () => void;
  onSave: () => void;
  categories: { id: string; name: string }[];
}

export default function AddEquipmentView({
  items,
  setItems,
  singleItems,
  bulkItems,
  onBack,
  onSave,
  categories,
}: Props) {
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const adjustItemQty = (item: Item, change: number) => {
    const existingItem = items.find((i) => i.id === item.id);
    const currentQty = existingItem?.added || 0;
    const newQty = currentQty + change;
    console.log(newQty, "new qty")

    // Prevent going below 0
    if (newQty < 0) {
      return;
    }

    // Prevent exceeding max quantity for bulk items
    if (item.isBulk && item.qty !== undefined && newQty > item.qty) {
      Swal.fire({
        icon: "warning",
        title: "Quantity Exceeded",
        text: `Maximum available quantity is ${item.qty}`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      return;
    }

    // Update the quantity in the items state
    setItems([
      ...items.filter((i) => i.id !== item.id),
      { ...item, added: newQty },
    ]);
  };

  const handleScanSuccess = (decodedText: string) => {
    // Search in singleItems and bulkItems
    const allItems = [...singleItems, ...bulkItems];
    console.log("Decoded text:", decodedText);

    // Find item by ID or Serial Number (barcode)
    const foundItem = allItems.find(
      (item) =>
        item.id === decodedText ||
        item.serial_number === decodedText ||
        item.barcode === decodedText,
    );

    if (foundItem) {
      // Add/adjust quantity
      adjustItemQty(foundItem, 1);

      Swal.fire({
        icon: "success",
        title: "Item Added",
        text: `${foundItem.name} has been added to the list.`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Not Found",
        text: `No item found with ID or Serial Number: ${decodedText}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  const getFilteredItems = () => {
    const currentItems = tab === "single" ? singleItems : bulkItems;
    return currentItems.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serial_number &&
          item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        categoryFilter === "all" || item.id === categoryFilter; // This might need adjustment based on how categories are linked
      const matchesLocation =
        locationFilter === "all" || item.location === locationFilter;
      return matchesSearch && matchesCategory && matchesLocation;
    });
  };

  const filteredItems = getFilteredItems();
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setLocationFilter("all");
    setCurrentPage(1);
  };

  const itemTabs = [
    { label: "Single Items", href: "single" },
    { label: "Bulk Items", href: "bulk" },
  ];

  // const filteredItemsCount = filteredItems.length;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={onBack} type="button">
              <ArrowLeftIcon className="w-6 h-6 text-orange-500" />
            </button>
            <h1 className="text-2xl font-bold text-orange-500">
              Add Equipment
            </h1>
          </div>
          <div className="text-xs text-gray-400">
            Reservation &gt; Add Reservation &gt;{" "}
            <span className="text-orange-500 font-medium">Add Equipment</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <TabsValue
            tabs={itemTabs}
            value={tab}
            setValue={(val) => {
              setTab(val as "single" | "bulk");
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 border rounded-md px-3 py-2 text-gray-500 hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <ScanQrCodeIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Scan QR / Barcode</span>
          </button>

          <div className="flex-1 min-w-[200px]">
            <Input
              type="search"
              placeholder="Search Product ..."
              fullWidth
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="w-64">
            <Select
              options={[
                { value: "all", label: "Category Product" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              placeholder="Category Product"
              value={
                categoryFilter === "all"
                  ? null
                  : {
                      value: categoryFilter,
                      label:
                        categories.find((c) => c.id === categoryFilter)?.name ||
                        "Category",
                    }
              }
              onChange={(opt: any) => {
                setCategoryFilter(opt?.value || "all");
                setCurrentPage(1);
              }}
              fullWidth
            />
          </div>

          <div className="w-64">
            <Select
              options={[
                { value: "all", label: "Location" },
                { value: "dipatiukur", label: "Dipatiukur" },
                { value: "cipadung", label: "Cipadung" },
              ]}
              placeholder="Location"
              value={
                locationFilter === "all"
                  ? null
                  : {
                      value: locationFilter,
                      label:
                        locationFilter.charAt(0).toUpperCase() +
                        locationFilter.slice(1),
                    }
              }
              onChange={(opt: any) => {
                setLocationFilter(opt?.value || "all");
                setCurrentPage(1);
              }}
              fullWidth
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-red-500 text-sm font-medium hover:underline px-2"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 p-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <ShoppingCartIcon className="w-16 h-16 mb-4 opacity-20" />
            <p>No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {paginatedItems.map((item) => {
              const addedItem = items.find((i) => i.id === item.id);
              const addedCount = addedItem?.added || 0;

              return (
                <div
                  key={item.id}
                  className="border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-50">
                    <Image
                      src={item.full_path_image || "/placeholder-item.png"}
                      alt={item.name}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <h3 className="font-bold text-sm truncate">{item.name}</h3>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>Type: {item.isBulk ? "Product" : "Product"}</span>
                      {tab === "bulk" && (
                        <span>Avail: {item.qty || 10} item</span>
                      )}
                    </div>

                    {tab === "single" ? (
                      <div className="mt-2 flex items-center gap-2">
                        {/* <div className="flex-1 flex items-center justify-center border rounded h-8 gap-3">
                          <button
                            onClick={() => adjustItemQty(item, -1)}
                            className="text-orange-500 hover:bg-orange-50 disabled:text-gray-300"
                            disabled={addedCount === 0}
                          >
                            <MinusCircleIcon className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold min-w-[1rem] text-center">
                            {addedCount}
                          </span>
                          <button
                            onClick={() => adjustItemQty(item, 1)}
                            className="text-orange-500 hover:bg-orange-50 disabled:text-gray-300"
                            disabled={addedCount >= (item.qty || 1)}
                          >
                            <PlusCircleIcon className="w-4 h-4" />
                          </button>
                        </div> */}
                        <button
                          onClick={() => adjustItemQty(item, 1)}
                          disabled={addedCount > 0}
                          className={`h-8 w-full px-2 rounded text-[10px] font-bold ${
                            addedCount > 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-orange-500 text-white hover:bg-orange-600"
                          }`}
                        >
                          Add Item
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-center border rounded h-8 gap-3">
                          <button
                            onClick={() => adjustItemQty(item, -1)}
                            className="text-orange-500 hover:bg-orange-50 disabled:text-gray-300"
                            disabled={addedCount === 0}
                          >
                            <MinusCircleIcon className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold min-w-[1rem] text-center">
                            {addedCount}
                          </span>
                          <button
                            onClick={() => adjustItemQty(item, 1)}
                            className="text-orange-500 hover:bg-orange-50 disabled:text-gray-300"
                            disabled={addedCount >= (item.qty || 0)}
                          >
                            <PlusCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex justify-center">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronsLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              // Show first page, last page, and pages around current page
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded font-bold ${
                      currentPage === page
                        ? "bg-orange-500 text-white"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-1 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronsRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-4 shadow-lg">
        <Button variant="white" className="px-8" onClick={onBack}>
          Back
        </Button>
        <Button variant="submit" className="px-8" onClick={onSave}>
          Save
        </Button>
      </div>

      <ScannerModal
        open={isScannerOpen}
        setOpen={setIsScannerOpen}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
