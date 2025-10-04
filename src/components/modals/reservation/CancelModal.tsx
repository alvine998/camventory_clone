import React, { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { X } from "lucide-react";

interface CancelModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: (description: string) => void;
  isLoading?: boolean;
}

export default function CancelModal({ 
  open, 
  setOpen, 
  onConfirm, 
  isLoading = false 
}: CancelModalProps) {
  const [description, setDescription] = useState("");

  const handleCancel = () => {
    setDescription("");
    setOpen(false);
  };

  const handleConfirm = () => {
    if (!description.trim()) {
      return; // Don't allow empty description
    }
    onConfirm(description);
    setDescription("");
  };

  return (
    <Modal open={open} setOpen={setOpen} size="sm">
      <div className="p-6">
        {/* Header with Icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-600">Cancel</h2>
        </div>

        {/* Description Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="custom-color"
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="custom-color"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!description.trim() || isLoading}
          >
            {isLoading ? "Processing..." : "Yes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
