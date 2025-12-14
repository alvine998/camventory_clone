import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import { XIcon } from "lucide-react";
import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { CONFIG } from "@/config";
import { parse } from "cookie";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  itemId: string;
  itemType: "single" | "bulk";
  status?: string;
  token?: string;
  onSuccess?: () => void;
}

export default function NotesModal({
  open,
  setOpen,
  itemId,
  itemType,
  status,
  token,
  onSuccess,
}: Props) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!notes.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Notes Required",
        text: "Please enter notes before submitting",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setLoading(true);
    try {
      // Update status first if status is provided
      try {
        await axios.patch(`/api/items/update-status`, {
          status: status,
          id: itemId,
        });
      } catch (statusError: any) {
        console.error("Error updating status:", statusError);
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            statusError.response?.data?.message || "Failed to update status",
          timer: 2000,
          showConfirmButton: false,
        });
        setLoading(false);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: status
          ? "Status updated and notes saved successfully"
          : "Notes have been saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      setNotes("");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving notes:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to save notes",
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNotes("");
      setOpen(false);
    }
  };

  return (
    <Modal open={open} setOpen={handleClose} size="md">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-4 flex justify-between items-center">
        <h1 className="font-bold text-xl text-orange-500">Add Notes</h1>
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="disabled:opacity-50"
        >
          <XIcon className="w-6 h-6 text-orange-500" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-4">
        {status && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Changed To
            </label>
            <p className="text-sm font-semibold text-orange-500">{status}</p>
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your notes here..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={6}
            disabled={loading}
            required
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 border-t-2 border-t-gray-200 pt-4 mt-4">
          <Button
            variant="custom-color"
            className="border border-orange-500 text-orange-500"
            type="button"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="submit" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
