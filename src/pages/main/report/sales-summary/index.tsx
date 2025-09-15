import DateRangePicker from "@/components/DateRangePicker";
import Modal, { useModal } from "@/components/Modal";
import { CalendarDays } from "lucide-react";
import moment from "moment";
import React from "react";

export default function SalesSummaryPage() {
  const [date, setDate] = React.useState<any>({
    start: moment().format("DD/MM/YYYY"),
    end: moment().add(30, "days").format("DD/MM/YYYY"),
  });
  const [modal, setModal] = React.useState<useModal>();
  return (
    <div>
      <h1 className="text-2xl font-bold text-orange-500">Sales Summary</h1>
      <div className="flex justify-between items-center gap-2">
        <div>
          <button
            type="button"
            onClick={() => {
              setModal({ open: true, key: "date", data: date });
            }}
            className="border border-gray-300 rounded px-2 pr-16 py-2 mt-4 flex items-center justify-start gap-2"
          >
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-500">
              {date.start} - {date.end}
            </p>
          </button>
        </div>
      </div>
      {modal?.key === "date" && (
        <Modal
          open={modal?.open}
          setOpen={() => setModal({ open: false, key: "", data: {} })}
          size="xl"
        >
          <DateRangePicker date={date} setDate={setDate} />
        </Modal>
      )}
    </div>
  );
}
