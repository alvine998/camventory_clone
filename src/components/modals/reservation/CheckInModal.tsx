import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import Select from "@/components/Select";
import Input from "@/components/Input";
import { ShoppingCartIcon } from "lucide-react";
import { IDetail } from "@/types/reservation";

interface CheckInModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    items: IDetail[];
    onConfirm: (checkInItems: any[]) => void;
    isLoading?: boolean;
}

const statusOptions = [
    { value: "GOOD", label: "GOOD" },
    { value: "ON_REPAIR", label: "ON REPAIR" },
    { value: "TAKEOUT", label: "TAKEOUT" },
    { value: "BROKEN", label: "BROKEN" },
    { value: "NEED_CHECK", label: "NEED CHECK" },
];

export default function CheckInModal({
    open,
    setOpen,
    items,
    onConfirm,
    isLoading = false,
}: CheckInModalProps) {
    const [itemStates, setItemStates] = useState<any[]>([]);

    useEffect(() => {
        if (open && items) {
            setItemStates(
                items.map((item) => ({
                    item_id: item.item_id,
                    item_name: item.item_name,
                    item_status: "GOOD",
                    remarks: "",
                }))
            );
        }
    }, [open, items]);

    const handleStatusChange = (index: number, selectedOption: any) => {
        const newState = [...itemStates];
        newState[index].item_status = selectedOption?.value || "GOOD";
        setItemStates(newState);
    };

    const handleRemarksChange = (index: number, value: string) => {
        const newState = [...itemStates];
        newState[index].remarks = value;
        setItemStates(newState);
    };

    const handleConfirm = () => {
        const payload = itemStates.map(({ item_id, item_status, remarks }) => ({
            item_id,
            item_status,
            remarks,
        }));
        onConfirm(payload);
    };

    return (
        <Modal open={open} setOpen={setOpen} size="md">
            <div className="p-6">
                <div className="flex flex-col items-center mb-6 border-b pb-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <ShoppingCartIcon className="w-8 h-8 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Check In Items</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Please update the status and add remarks for each item being returned.
                    </p>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 mb-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-3 text-sm font-semibold text-gray-700 w-1/3">Item Name</th>
                                <th className="py-3 text-sm font-semibold text-gray-700 w-1/4">Status</th>
                                <th className="py-3 text-sm font-semibold text-gray-700">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemStates.map((item, index) => (
                                <tr key={item.item_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="py-4">
                                        <span className="text-sm font-medium text-gray-800">{item.item_name}</span>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <Select
                                            options={statusOptions}
                                            value={statusOptions.find((opt) => opt.value === item.item_status)}
                                            onChange={(opt: any) => handleStatusChange(index, opt)}
                                            isClearable={false}
                                            fullWidth
                                        />
                                    </td>
                                    <td className="py-4">
                                        <Input
                                            placeholder="Optional remarks"
                                            value={item.remarks}
                                            onChange={(e) => handleRemarksChange(index, e.target.value)}
                                            fullWidth
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="custom-color"
                        className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="submit"
                        className="px-6 py-2 text-sm font-medium"
                        onClick={handleConfirm}
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        Confirm Check In
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
