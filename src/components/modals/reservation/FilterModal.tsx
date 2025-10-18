import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import Select from "@/components/Select";

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

  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // Status options
  const statusOptions = [
    { value: "confirmed", label: "Confirmed" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
    { value: "overdue", label: "Overdue" },
  ];

  // Location options
  const locationOptions = [
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
      setCustomerOptions([{value: "", label: "All Customers"}, ...options]);
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
  };

  const handleApply = () => {
    onApply(filters);
    setOpen({ open: false });
  };

  const handleCancel = () => {
    setOpen({ open: false });
  };

  return (
    <Modal open={open} setOpen={setOpen} size="md">
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
        <div className="space-y-4">
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
                  placeholder="Location"
                  isClearable
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Start Date and End Date Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
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
