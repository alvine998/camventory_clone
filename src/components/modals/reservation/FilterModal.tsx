import React, { useState, useEffect, useRef } from "react";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import DateRangePicker from "@/components/DateRangePicker";
import moment from "moment";
import { CalendarDays } from "lucide-react";

interface FilterModalProps {
  open: boolean;
  setOpen: (modal: any) => void;
  onApply: (filters: any) => void;
  initialFilters?: any;
  customers?: any[];
}

export default function FilterModal({
  open,
  setOpen,
  onApply,
  initialFilters = {},
  customers = []
}: FilterModalProps) {
  const [filters, setFilters] = useState({
    customer: initialFilters.customer || null,
    status: initialFilters.status || null,
    location: initialFilters.location || null,
    startDate: initialFilters.startDate || "",
    endDate: initialFilters.endDate || "",
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // Status options
  const statusOptions = [
    { value: "all", label: "All" },
    { value: "cancelled", label: "Cancel" },
    { value: "booked", label: "Booked" },
    { value: "checkout", label: "Checkout" },
    { value: "checkin", label: "Check In" },
  ];

  // Location options
  const locationOptions = [
    { value: "all", label: "All" },
    { value: "dipatiukur", label: "Dipatiukur" },
    { value: "cipadung", label: "Cipadung" },
  ];

  // Convert customers prop to options format and handle search
  useEffect(() => {
    if (customers && customers.length > 0) {
      let filteredCustomers = customers;

      // Filter customers based on search term
      if (customerSearchTerm && customerSearchTerm.length >= 3) {
        filteredCustomers = customers.filter((customer: any) =>
          customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
        );
      }

      const options = filteredCustomers.map((customer: any) => ({
        value: customer.id,
        label: customer.name,
      }));
      setCustomerOptions([{ value: "", label: "All Customers" }, ...options]);
    }
  }, [customers, customerSearchTerm]);

  // Handle customer search
  const handleCustomerSearch = (inputValue: string) => {
    setCustomerSearchTerm(inputValue);
  };

  const handleReset = () => {
    setFilters({
      customer: null,
      status: null,
      location: null,
      startDate: "",
      endDate: "",
    });
    setCustomerSearchTerm("");
    setIsDatePickerOpen(false);
  };

  const handleApply = () => {
    onApply(filters);
    setOpen({ open: false });
  };

  const handleCancel = () => {
    setOpen({ open: false });
  };

  return (
    <Modal open={open} setOpen={setOpen} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
          <button
            onClick={handleReset}
            className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Filter Fields */}
        <div className="space-y-6 relative" ref={datePickerRef}>
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer
            </label>
            <Select
              options={customerOptions}
              value={filters.customer}
              onChange={(selectedOption) =>
                setFilters(prev => ({ ...prev, customer: selectedOption }))
              }
              placeholder="Customer"
              isClearable
              isLoading={false}
              onInputChange={handleCustomerSearch}
              noOptionsMessage={() =>
                customerSearchTerm.length < 3
                  ? "Type at least 3 characters to search"
                  : "No customers found"
              }
              fullWidth
            />
          </div>

          {/* Status and Location Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="relative">
                <Select
                  options={statusOptions}
                  value={filters.status}
                  onChange={(selectedOption) =>
                    setFilters(prev => ({ ...prev, status: selectedOption }))
                  }
                  defaultValue={{ value: "all", label: "All" }}
                  placeholder="Status"
                  isClearable
                  fullWidth
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <Select
                  options={locationOptions}
                  value={filters.location}
                  onChange={(selectedOption) =>
                    setFilters(prev => ({ ...prev, location: selectedOption }))
                  }
                  defaultValue={{ value: "all", label: "All" }}
                  placeholder="Location"
                  isClearable
                  fullWidth
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm cursor-pointer flex justify-between items-center bg-white"
            >
              <span
                className={filters.startDate ? "text-gray-900" : "text-gray-400"}
              >
                {filters.startDate && filters.endDate
                  ? `${moment(filters.startDate).format("DD/MM/YYYY")} - ${moment(
                    filters.endDate
                  ).format("DD/MM/YYYY")}`
                  : "Select Date Range"}
              </span>
              <CalendarDays className="w-4 h-4 text-gray-400" />
            </div>

            {isDatePickerOpen && (
              <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-2xl border p-4">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h4 className="font-bold text-gray-800">Select Date Range</h4>
                  <button
                    onClick={() => setIsDatePickerOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <DateRangePicker
                  showHeader={false}
                  className="w-full flex flex-col items-center"
                  date={{
                    start: filters.startDate
                      ? moment(
                        filters.startDate,
                        filters.startDate.includes("/")
                          ? "DD/MM/YYYY"
                          : "YYYY-MM-DD"
                      ).toDate()
                      : (null as any),
                    end: filters.endDate
                      ? moment(
                        filters.endDate,
                        filters.endDate.includes("/")
                          ? "DD/MM/YYYY"
                          : "YYYY-MM-DD"
                      ).toDate()
                      : (null as any),
                  }}
                  setDate={(date: { start: string; end: string }) => {
                    setFilters((prev) => ({
                      ...prev,
                      startDate: date.start
                        ? moment(date.start, "DD/MM/YYYY").format("YYYY-MM-DD")
                        : null,
                      endDate: date.end
                        ? moment(date.end, "DD/MM/YYYY").format("YYYY-MM-DD")
                        : null,
                    }));
                  }}
                />
                {/* <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setIsDatePickerOpen(false)}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-md"
                  >
                    Done
                  </button>
                </div> */}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-orange-600 bg-white border border-orange-300 rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
}
