import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { TrashIcon } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

interface BulkItem {
  id: string;
  name: string;
  qty?: number;
}

interface AddQuantityItem {
  id: string;
  quantity: number;
  reason: string;
}

interface AddQuantityModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
  bulkItems?: BulkItem[];
}

export default function AddQuantityModal({
  open,
  setOpen,
  onSuccess,
  bulkItems = [],
}: AddQuantityModalProps) {
  const [items, setItems] = useState<AddQuantityItem[]>([
    {
      id: "",
      quantity: 0,
      reason: "",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBulkItems, setLoadingBulkItems] = useState(false);

  // Fetch bulk items when modal opens
  useEffect(() => {
    if (open) {
      setLoadingBulkItems(false);
    }
  }, [open]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: "",
        quantity: 0,
        reason: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemIdChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].id = value;
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index].quantity = value;
    setItems(newItems);
  };

  const handleReasonChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].reason = value;
    setItems(newItems);
  };

  // Get available items for a specific row (excluding already selected items)
  const getAvailableItems = (currentIndex: number) => {
    const selectedIds = items
      .map((item, idx) => (idx !== currentIndex ? item.id : null))
      .filter((id) => id !== null && id !== "");

    return bulkItems.filter((item) => !selectedIds.includes(item.id));
  };;

  const handleSave = async () => {
    // Validate
    if (items.some((item) => !item.id)) {
      Swal.fire({
        icon: "warning",
        title: "Missing Product",
        text: "Please select a product for each row",
      });
      return;
    }

    if (items.some((item) => item.quantity <= 0)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Quantity",
        text: "All quantities must be greater than 0",
      });
      return;
    }

    if (items.some((item) => !item.reason.trim())) {
      Swal.fire({
        icon: "warning",
        title: "Missing Reason",
        text: "Please provide a reason for each quantity addition",
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.patch("/api/items/quantity", {
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          reason: item.reason,
        })),
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Quantity added successfully",
      });

      setItems([
        {
          id: "",
          quantity: 0,
          reason: "",
        },
      ]);
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error adding quantity:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to add quantity",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal size="md" open={open} setOpen={setOpen}>
      <div className="p-6 w-full">
        <h2 className="text-2xl font-bold text-orange-500 mb-6">
          Add quantity
        </h2>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded p-4">
              <div className="flex justify-start items-center gap-4">
                <div className="w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={item.id}
                    onChange={(e) => handleItemIdChange(index, e.target.value)}
                    disabled={loadingBulkItems}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">Select item</option>
                    {getAvailableItems(index).map((bulkItem) => (
                      <option key={bulkItem.id} value={bulkItem.id}>
                        {bulkItem.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-w-[100px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    QTY <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="QTY"
                    min="1"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      handleQuantityChange(index, parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Description"
                    value={item.reason}
                    onChange={(e) => handleReasonChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>

                <div className="flex justify-end mt-5">
                  {items.length > 1 && (
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title="Remove item"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddItem}
          className="mt-4 text-orange-500 font-semibold flex items-center gap-2 hover:text-orange-600"
        >
          <span className="text-xl">+</span> Add Another Product Quantity
        </button>

        <div className="flex gap-3 justify-end mt-8">
          <Button
            variant="white"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button variant="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
