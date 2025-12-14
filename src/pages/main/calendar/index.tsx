import {
  FilterIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  CalendarDays,
  Clock,
  X,
} from "lucide-react";
import React, { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Dynamic import FullCalendar to avoid SSR issues
const FullCalendar = dynamic(
  () => import("@fullcalendar/react").then((mod) => mod.default),
  { ssr: false }
);
import axios from "axios";
import Modal from "@/components/Modal";
import { CONFIG } from "@/config";
import { parse } from "cookie";
import moment from "moment";
import { GetServerSideProps } from "next";

interface Props {
  initialTimelineData: any[];
  initialStartDate: number;
  initialEndDate: number;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;

  try {
    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // Get date range from query or use current month
    const startDate = query.startDate ? Number(query.startDate) : moment().startOf("month").unix();
    const endDate = query.endDate ? Number(query.endDate) : moment().endOf("month").unix();

    // Fetch timeline data
    const response = await axios.get(`${CONFIG.API_URL}/v1/timeline`, {
      params: {
        startDate: startDate,
        endDate: endDate,
      },
      headers: {
        Authorization: token,
      },
    });

    if (response?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return {
      props: {
        initialTimelineData: response.data?.data || [],
        initialStartDate: startDate,
        initialEndDate: endDate,
      },
    };
  } catch (error: any) {
    console.log(error);
    if (error?.response?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return {
      props: {
        initialTimelineData: [],
        initialStartDate: moment().startOf("month").unix(),
        initialEndDate: moment().endOf("month").unix(),
      },
    };
  }
};

export default function CalendarPage({ initialTimelineData, initialStartDate, initialEndDate }: Props) {
  const calendarApiRef = useRef<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("dayGridMonth");
  const [timelineData, setTimelineData] = useState<any[]>(initialTimelineData);
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const lastFetchRef = useRef<{ start: number; end: number } | null>(null);

  // Filter options
  const filterOptions = [
    { id: "reservations", label: "Reservations", value: "confirmed" },
    {
      id: "overdue-reservations",
      label: "Overdue (Reservation)",
      value: "overdue-reservation",
    },
    { id: "checkouts", label: "Checkouts", value: "checkout" },
    {
      id: "overdue-checkouts",
      label: "Overdue (Checkouts)",
      value: "overdue-checkout",
    },
    { id: "checkin-done", label: "Check In / Done", value: "completed" },
  ];

  // Fetch timeline data based on calendar view
  const fetchTimelineData = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      // Convert dates to Unix timestamps
      const startTimestamp = moment(startDate).unix();
      const endTimestamp = moment(endDate).unix();

      // Prevent duplicate calls with same date range
      if (
        lastFetchRef.current &&
        lastFetchRef.current.start === startTimestamp &&
        lastFetchRef.current.end === endTimestamp
      ) {
        return;
      }

      lastFetchRef.current = { start: startTimestamp, end: endTimestamp };
      setLoading(true);

      const cookies = parse(document.cookie || "");
      const token = cookies.token;

      if (!token) {
        console.error("No authentication token found");
        setTimelineData([]);
        setLoading(false);
        return;
      }

      if (!CONFIG.API_URL) {
        console.error("API URL not configured");
        setTimelineData([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${CONFIG.API_URL}/v1/timeline`, {
        params: {
          startDate: startTimestamp,
          endDate: endTimestamp,
        },
        headers: {
          Authorization: token,
        },
      });

      if (response.data.status === 1) {
        setTimelineData(response.data.data || []);
      } else {
        console.error("Failed to fetch timeline data:", response.data);
        setTimelineData([]);
      }
    } catch (error: any) {
      console.error("Error fetching timeline data:", error);
      setTimelineData([]);
      // Make sure loading is set to false even on error
      if (error.response?.status === 401) {
        console.error("Unauthorized - please login again");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle dates change in calendar
  const handleDatesSet = useCallback((dateInfo: any) => {
    // Store calendar API reference
    if (dateInfo.view && !calendarApiRef.current) {
      calendarApiRef.current = dateInfo.view.calendar;
    }
    
    // Fetch data when calendar dates change (but skip initial load since we have SSR data)
    if (dateInfo && dateInfo.start && dateInfo.end) {
      const startTimestamp = moment(dateInfo.start).unix();
      const endTimestamp = moment(dateInfo.end).unix();
      
      // Only fetch if date range changed from initial SSR data
      if (
        startTimestamp !== initialStartDate ||
        endTimestamp !== initialEndDate
      ) {
        fetchTimelineData(dateInfo.start, dateInfo.end);
      }
    }
  }, [fetchTimelineData, initialStartDate, initialEndDate]);

  // Get icon based on status
  function getStatusIcon(status: string) {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case "checkout":
        return "hourglass";
      case "booked":
      case "confirmed":
        return "settings";
      case "checkin":
      case "completed":
        return "check";
      default:
        return null;
    }
  }

  // Format event title like "10:00 B247082 | Fajar"
  function formatEventTitle(item: any): string {
    const startTime = moment(item.start_date).format("HH:mm");
    const bookId = item.book_id || "";
    const customerName = item.customer_name || "";
    // If book_id is empty, just show time and customer name
    if (!bookId) {
      return `${startTime} | ${customerName}`;
    }
    return `${startTime} ${bookId} | ${customerName}`;
  }

  // Convert timeline data to FullCalendar events with filtering
  const calendarEvents = timelineData
    .filter((item) => {
      // If no filters are active, show all events
      if (activeFilters.length === 0) return true;

      // Check if item status matches any active filter
      return activeFilters.some((filter) => {
        switch (filter) {
          case "confirmed":
            return item.status?.toLowerCase() === "booked" || item.status?.toLowerCase() === "confirmed";
          case "overdue-reservation":
            return (
              (item.status?.toLowerCase() === "booked" || item.status?.toLowerCase() === "confirmed") &&
              new Date(item.start_date) < new Date()
            );
          case "checkout":
            return item.status?.toLowerCase() === "checkout";
          case "overdue-checkout":
            return (
              item.status?.toLowerCase() === "checkout" &&
              new Date(item.end_date) < new Date()
            );
          case "completed":
            return item.status?.toLowerCase() === "checkin" || item.status?.toLowerCase() === "completed";
          default:
            return true;
        }
      });
    })
    .map((item) => ({
      id: item.id,
      title: formatEventTitle(item),
      start: new Date(item.start_date),
      end: new Date(item.end_date),
      backgroundColor: getStatusColor(item.status),
      borderColor: getStatusColor(item.status),
      textColor: "#ffffff",
      extendedProps: {
        timelineItem: item,
        statusIcon: getStatusIcon(item.status),
      },
    }));

  // Get color based on timeline item status (matching the image colors)
  function getStatusColor(status: string): string {
    if (!status) return "#3b82f6"; // default blue
    
    switch (status.toLowerCase()) {
      case "booked":
      case "confirmed":
        return "#fbbf24"; // yellow (like in image)
      case "checkout":
        return "#60a5fa"; // light blue
      case "checkin":
      case "completed":
        return "#34d399"; // light green
      case "cancel":
      case "cancelled":
        return "#ef4444"; // red
      default:
        return "#3b82f6"; // dark blue
    }
  }

  // View switching handler
  const handleViewChange = useCallback((
    view: "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  ) => {
    if (calendarApiRef.current) {
      calendarApiRef.current.changeView(view);
      setCurrentView(view);
      
      // Fetch new data for the new view
      const calendarView = calendarApiRef.current.view;
      fetchTimelineData(calendarView.activeStart, calendarView.activeEnd);
    }
  }, [fetchTimelineData]);

  // Navigation handlers
  const handlePrevYear = useCallback(() => {
    if (calendarApiRef.current) {
      calendarApiRef.current.prevYear();
      setCurrentDate(calendarApiRef.current.getDate());
      
      // Fetch new data for the new date range
      const view = calendarApiRef.current.view;
      fetchTimelineData(view.activeStart, view.activeEnd);
    }
  }, [fetchTimelineData]);

  const handlePrev = useCallback(() => {
    if (calendarApiRef.current) {
      calendarApiRef.current.prev();
      setCurrentDate(calendarApiRef.current.getDate());
      
      // Fetch new data for the new date range
      const view = calendarApiRef.current.view;
      fetchTimelineData(view.activeStart, view.activeEnd);
    }
  }, [fetchTimelineData]);

  const handleNext = useCallback(() => {
    if (calendarApiRef.current) {
      calendarApiRef.current.next();
      setCurrentDate(calendarApiRef.current.getDate());
      
      // Fetch new data for the new date range
      const view = calendarApiRef.current.view;
      fetchTimelineData(view.activeStart, view.activeEnd);
    }
  }, [fetchTimelineData]);

  const handleNextYear = useCallback(() => {
    if (calendarApiRef.current) {
      calendarApiRef.current.nextYear();
      setCurrentDate(calendarApiRef.current.getDate());
      
      // Fetch new data for the new date range
      const view = calendarApiRef.current.view;
      fetchTimelineData(view.activeStart, view.activeEnd);
    }
  }, [fetchTimelineData]);

  const handleToday = useCallback(() => {
    if (calendarApiRef.current) {
      calendarApiRef.current.today();
      setCurrentDate(calendarApiRef.current.getDate());
      
      // Fetch new data for the new date range
      const view = calendarApiRef.current.view;
      fetchTimelineData(view.activeStart, view.activeEnd);
    }
  }, [fetchTimelineData]);

  // Event click handler
  const handleEventClick = (clickInfo: any) => {
    const timelineItem = clickInfo.event.extendedProps.timelineItem;
    // You can implement a modal or navigation to reservation details here
    console.log("Clicked timeline item:", timelineItem);
    alert(
      `Item: ${timelineItem.item_name}\nCustomer: ${timelineItem.customer_name}\nBook ID: ${timelineItem.book_id}\nStatus: ${timelineItem.status}\nBarcode: ${timelineItem.barcode}`
    );
  };

  // Date click handler
  const handleDateClick = (dateClickInfo: any) => {
    console.log("Date clicked:", dateClickInfo.dateStr);
    // You can implement creating new reservations here
  };

  // Filter handlers
  const handleFilterToggle = (filterValue: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterValue)
        ? prev.filter((f) => f !== filterValue)
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
    <div className="space-y-2 px-2">
      {/* Header */}
      <div className="flex lg:flex-row flex-col gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-orange-600">
            {currentView === "dayGridMonth" &&
              currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevYear}
            className="p-2 bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Previous Year"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            className="p-2 bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Previous Month"
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
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextYear}
            className="p-2 bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Next Year"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
        {/* View Switcher */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleViewChange("dayGridMonth")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "dayGridMonth"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Month
          </button>
          <button
            onClick={() => handleViewChange("timeGridWeek")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "timeGridWeek"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Week
          </button>
          <button
            onClick={() => handleViewChange("timeGridDay")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "timeGridDay"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            Day
          </button>
        </div>
        <div className="flex items-center gap-4">
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
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "#fbbf24" }}
          ></div>
          <span>Booked/Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "#60a5fa" }}
          ></div>
          <span>Checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "#34d399" }}
          ></div>
          <span>Check In/Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: "#ef4444" }}
          ></div>
          <span>Cancelled</span>
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
            dayMaxEvents={currentView === "dayGridMonth" ? 3 : false}
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
              const timelineItem = info.event.extendedProps.timelineItem;
              const statusIcon = info.event.extendedProps.statusIcon;
              
              if (timelineItem) {
                info.el.title = `${timelineItem.item_name} - ${timelineItem.customer_name} (${timelineItem.book_id})`;
              }

              // Add icon to event if available
              if (statusIcon && info.el) {
                const titleEl = info.el.querySelector(".fc-event-title");
                if (titleEl && !titleEl.querySelector(".event-icon")) {
                  const iconElement = document.createElement("span");
                  iconElement.className = "event-icon";
                  iconElement.style.marginRight = "4px";
                  iconElement.style.display = "inline-flex";
                  iconElement.style.alignItems = "center";
                  iconElement.style.verticalAlign = "middle";
                  
                  // Create icon based on status using lucide-react style
                  if (statusIcon === "hourglass") {
                    // Hourglass icon
                    iconElement.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14M5 2h14M12 2v4M12 18v4M7 2l5 5-5 5m10-10l-5 5 5 5"></path></svg>`;
                  } else if (statusIcon === "settings") {
                    // Settings/cogwheel icon
                    iconElement.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                  } else if (statusIcon === "check") {
                    // Checkmark icon
                    iconElement.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>`;
                  }
                  
                  // Insert icon at the beginning of event title
                  titleEl.insertBefore(iconElement, titleEl.firstChild);
                }
              }
            }}
            nowIndicator={true}
            dayCellClassNames={(arg) => {
              // Highlight today's date with orange circle
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const cellDate = new Date(arg.date);
              cellDate.setHours(0, 0, 0, 0);
              if (cellDate.getTime() === today.getTime()) {
                return "fc-day-today";
              }
              return "";
            }}
            datesSet={handleDatesSet}
          />
        )}
      </div>

      {/* Filter Modal */}
      <Modal open={showFilterModal} setOpen={setShowFilterModal} size="md">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-600">
              Filter Calendar
            </h3>
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
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              Status Calendar
            </h4>
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
                  <span className="text-sm text-gray-900">{option.label}</span>
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
