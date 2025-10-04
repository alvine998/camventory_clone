"use client";

import { FilterIcon, ChevronLeft, ChevronRight, Calendar, CalendarDays, Clock, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { IReservation } from "@/types/reservation";
import axios from "axios";
import Modal from "@/components/Modal";

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Filter options
  const filterOptions = [
    { id: 'reservations', label: 'Reservations', value: 'confirmed' },
    { id: 'overdue-reservations', label: 'Overdue (Reservation)', value: 'overdue-reservation' },
    { id: 'checkouts', label: 'Checkouts', value: 'checkout' },
    { id: 'overdue-checkouts', label: 'Overdue (Checkouts)', value: 'overdue-checkout' },
    { id: 'checkin-done', label: 'Check In / Done', value: 'completed' },
  ];

  // Fetch reservations data
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/reservation");
        setReservations(response.data.data || []);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Convert reservations to FullCalendar events with filtering
  const calendarEvents = reservations
    .filter((reservation) => {
      // If no filters are active, show all events
      if (activeFilters.length === 0) return true;
      
      // Check if reservation status matches any active filter
      return activeFilters.some(filter => {
        switch (filter) {
          case 'confirmed':
            return reservation.status.toLowerCase() === 'confirmed';
          case 'overdue-reservation':
            return reservation.status.toLowerCase() === 'overdue' && 
                   new Date(reservation.start_date) < new Date();
          case 'checkout':
            return reservation.status.toLowerCase() === 'checkout';
          case 'overdue-checkout':
            return reservation.status.toLowerCase() === 'overdue' && 
                   new Date(reservation.end_date) < new Date();
          case 'completed':
            return reservation.status.toLowerCase() === 'completed';
          default:
            return true;
        }
      });
    })
    .map((reservation) => ({
      id: reservation.id,
      title: `Reservation #${reservation.book_id}`,
      start: new Date(reservation.start_date),
      end: new Date(reservation.end_date),
      backgroundColor: getStatusColor(reservation.status),
      borderColor: getStatusColor(reservation.status),
      textColor: "#ffffff",
      extendedProps: {
        reservation: reservation,
      },
    }));

  // Get color based on reservation status
  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "#10b981"; // green
      case "pending":
        return "#f59e0b"; // yellow
      case "cancelled":
        return "#ef4444"; // red
      case "completed":
        return "#6b7280"; // gray
      default:
        return "#3b82f6"; // blue
    }
  }

  // View switching handler
  const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
      setCurrentView(view);
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
      setCurrentDate(calendarRef.current.getApi().getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
      setCurrentDate(calendarRef.current.getApi().getDate());
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      setCurrentDate(calendarRef.current.getApi().getDate());
    }
  };

  // Event click handler
  const handleEventClick = (clickInfo: any) => {
    const reservation = clickInfo.event.extendedProps.reservation;
    // You can implement a modal or navigation to reservation details here
    console.log("Clicked reservation:", reservation);
    alert(`Reservation #${reservation.book_id}\nCustomer: ${reservation.ref_customer.name}\nStatus: ${reservation.status}`);
  };

  // Date click handler
  const handleDateClick = (dateClickInfo: any) => {
    console.log("Date clicked:", dateClickInfo.dateStr);
    // You can implement creating new reservations here
  };

  // Filter handlers
  const handleFilterToggle = (filterValue: string) => {
    setActiveFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const handleSaveFilters = () => {
    setShowFilterModal(false);
    // Filters are automatically applied through the calendarEvents computation
  };

  const handleCloseFilters = () => {
    setShowFilterModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex lg:flex-row flex-col gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Switcher */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewChange('dayGridMonth')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dayGridMonth'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Month
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'timeGridWeek'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Week
            </button>
            <button
              onClick={() => handleViewChange('timeGridDay')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'timeGridDay'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              Day
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {currentView === 'dayGridMonth' && currentDate.toLocaleDateString("en-US", { 
              month: "long", 
              year: "numeric" 
            })}
            {currentView === 'timeGridWeek' && `Week of ${currentDate.toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric",
              year: "numeric" 
            })}`}
            {currentView === 'timeGridDay' && currentDate.toLocaleDateString("en-US", { 
              weekday: "long",
              month: "long", 
              day: "numeric",
              year: "numeric" 
            })}
          </div>
          
          <button 
            onClick={() => setShowFilterModal(true)}
            className="py-1 px-3 bg-white rounded border-2 border-gray-500 flex items-center hover:bg-gray-200 duration-200 transition-all"
          >
            <FilterIcon className="w-4 h-4" />
            <p className="text-xs">Filter</p>
            {activeFilters.length > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#10b981" }}></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }}></div>
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#6b7280" }}></div>
          <span>Completed</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-500">Loading calendar...</div>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={{
              left: "",
              center: "",
              right: "",
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            dayMaxEvents={currentView === 'dayGridMonth' ? 3 : false}
            moreLinkClick="popover"
            eventDisplay="block"
            dayHeaderFormat={{ weekday: "short" }}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            slotDuration="01:00:00"
            slotLabelInterval="01:00:00"
            weekends={true}
            editable={false}
            selectable={true}
            selectMirror={true}
            locale="en"
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            allDaySlot={false}
            eventDidMount={(info) => {
              // Add custom styling or tooltips here if needed
              info.el.title = `Reservation #${info.event.extendedProps.reservation.book_id} - ${info.event.extendedProps.reservation.ref_customer.name}`;
            }}
          />
        )}
      </div>

      {/* Filter Modal */}
      <Modal 
        open={showFilterModal} 
        setOpen={setShowFilterModal} 
        size="md"
      >
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-600">Filter Calendar</h3>
            <button
              onClick={handleCloseFilters}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 mb-4"></div>

          {/* Filter Options */}
          <div className="mb-6">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Status Calendar</h4>
            <div className="grid grid-cols-3 gap-4">
              {filterOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center space-x-3 p-4 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(option.value)}
                    onChange={() => handleFilterToggle(option.value)}
                    className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 mb-4"></div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleCloseFilters}
              className="px-4 py-2 text-sm font-medium text-orange-600 bg-white border border-orange-300 rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
