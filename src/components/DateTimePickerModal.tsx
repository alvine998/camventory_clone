"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import moment from "moment";
import Modal from "./Modal";
import { X } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onApply: (date: Date) => void;
    initialDate?: string | Date; // Can be YYYY-MM-DD or Unix timestamp or Date object
    title?: string;
    disabled?: any; // DayPicker's disabled prop (e.g., { before: new Date() })
}

export default function DateTimePickerModal({
    open,
    onClose,
    onApply,
    initialDate,
    title = "Select Date and Time",
    disabled,
}: Props) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
        if (!initialDate) return new Date();
        if (initialDate instanceof Date) return initialDate;
        if (typeof initialDate === "number") return new Date(initialDate * 1000);
        const m = moment(initialDate);
        return m.isValid() ? m.toDate() : new Date();
    });

    const [selectedTime, setSelectedTime] = useState<string>(() => {
        if (!initialDate) return "09:00 AM";
        if (initialDate instanceof Date) return moment(initialDate).format("hh:mm A");
        if (typeof initialDate === "number") return moment(initialDate * 1000).format("hh:mm A");
        const m = moment(initialDate);
        return m.isValid() ? m.format("hh:mm A") : "09:00 AM";
    });

    // Time slots from 08:00 AM to 09:00 PM in 15-minute increments
    const timeSlots: string[] = [];
    const current = moment().startOf('day').add(8, 'hours');
    const end = moment().startOf('day').add(21, 'hours');

    while (current <= end) {
        timeSlots.push(current.format("hh:mm A"));
        current.add(15, 'minutes');
    }

    const handleApply = () => {
        if (selectedDate) {
            const dateTime = moment(selectedDate)
                .set({
                    hour: moment(selectedTime, "hh:mm A").hour(),
                    minute: moment(selectedTime, "hh:mm A").minute(),
                    second: 0,
                    millisecond: 0,
                })
                .toDate();
            onApply(dateTime);
            onClose();
        }
    };

    return (
        <Modal open={open} setOpen={onClose} size="md">
            <div className="flex flex-col h-full max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-row flex-1 overflow-hidden">
                    {/* Calendar Section */}
                    <div className="flex-1 p-4 border-r overflow-y-auto flex flex-col items-center">
                        {/* <h3 className="font-semibold text-gray-700 mb-2 w-full text-left">Select Date</h3> */}
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            showOutsideDays
                            disabled={disabled}
                            className="m-0"
                            modifiersStyles={{
                                selected: {
                                    backgroundColor: '#f97316',
                                    color: 'white'
                                }
                            }}
                        />
                    </div>

                    {/* Time Section */}
                    <div className="w-1/3 p-4 flex flex-col overflow-hidden">
                        <h3 className="font-semibold text-gray-700 mb-2">Available times</h3>
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                            {timeSlots.map((time) => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`py-2 px-1 text-[11px] font-medium border rounded transition-all ${selectedTime === time
                                        ? "bg-orange-500 border-orange-500 text-white shadow-md scale-105"
                                        : "bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600">
                                {selectedDate ? (
                                    <>
                                        Selected on{" "}
                                        <span className="font-bold text-orange-600">
                                            {moment(selectedDate).format("dddd, DD MMM YYYY")} at {selectedTime}
                                        </span>
                                    </>
                                ) : (
                                    "No date selected"
                                )}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-orange-500 text-orange-500 rounded font-bold hover:bg-orange-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!selectedDate}
                                onClick={handleApply}
                                className="px-6 py-2 bg-orange-500 text-white rounded font-bold hover:bg-orange-600 disabled:bg-gray-300 transition-colors shadow-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
        </Modal>
    );
}
