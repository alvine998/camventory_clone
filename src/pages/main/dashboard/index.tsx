import { FilterIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import DonutChart from "@/components/dashboard/DonutChart";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingListCard from "@/components/dashboard/UpcomingListCard";
import BrokenItemsCard from "@/components/dashboard/BrokenItemsCard";
import FilterPopup from "@/components/dashboard/FilterPopup";
import Head from "next/head";
import moment from "moment";
import axios from "axios";
import { parse } from "cookie";
import { useRouter } from "next/router";

interface DashboardPageProps {
  token: string;
}

export default function DashboardPage({ token }: DashboardPageProps) {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: moment().format("YYYY-MM-DD"),
    end: moment().add(30, "days").format("YYYY-MM-DD"),
  });

  const [loading, setLoading] = useState(false);

  // State for data
  const [itemsByStatus, setItemsByStatus] = useState<any>({ labels: [], series: [], colors: ["#A3E635", "#FACC15", "#3B82F6", "#3730A3"] });
  const [reservationsByStatus, setReservationsByStatus] = useState<any>({ labels: [], series: [], colors: ["#3730A3", "#FACC15"] });
  const [checkOutsStatus, setCheckOutsStatus] = useState<any>({ labels: [], series: [], colors: ["#EF4444", "#3B82F6", "#FB923C"] });
  const [itemsByFlag, setItemsByFlag] = useState<any>({ labels: [], series: [], colors: ["#F87171", "#A3E635", "#EA580C", "#3730A3", "#CBD5E1"] });

  const [reservationsByLocation, setReservationsByLocation] = useState<any[]>([]);
  const [checkoutsByLocation, setCheckoutsByLocation] = useState<any[]>([]);

  const [upcomingReservations, setUpcomingReservations] = useState<any[]>([]);
  const [upcomingCheckouts, setUpcomingCheckouts] = useState<any[]>([]);
  const [brokenItemsData, setBrokenItemsData] = useState<any>({ items: [], total: 0 });

  const handleResetFilter = () => {
    setDateRange({
      start: moment().format("YYYY-MM-DD"),
      end: moment().add(30, "days").format("YYYY-MM-DD"),
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDateUnix = moment(dateRange.start).startOf('day').unix();
      const endDateUnix = moment(dateRange.end).endOf('day').unix();
      const params = { startDate: startDateUnix, endDate: endDateUnix };
      const headers = { Authorization: token };

      const [
        statusBooking,
        resStatus,
        checkoutStatus,
        flagStatus,
        resLocation,
        checkoutLocation,
        upcomingRes,
        upcomingCheckout,
        brokenItems
      ] = await Promise.all([
        axios.get(`/api-proxy/v1/dashboard/pie/statusbooking`, { params, headers }),
        axios.get(`/api-proxy/v1/dashboard/pie/reservations`, { params, headers }),
        axios.get(`/api-proxy/v1/dashboard/pie/checkout`, { params, headers }),
        axios.get(`/api-proxy/v1/dashboard/pie/statusflagging`, { params, headers }),
        axios.get(`/api-proxy/v1/dashboard/card/location/rev`, { params, headers }),
        axios.get(`/api-proxy/v1/dashboard/card/location/co`, { params, headers }),
        axios.get(`/api-proxy/v1/dashboard/card/upcoming/reservations`, { params, headers }),
        axios.get(`/api-proxy/v1/dashboard/card/upcoming/checkouts`, { params, headers }),
        axios.get(`/api-proxy/v1/dashboard/card/broken-items`, { params, headers }), // Fixed endpoint URL
      ]);

      // Process Single Item by Status
      const statusBookingData = statusBooking.data.data || [];
      setItemsByStatus({
        labels: statusBookingData.map((d: any) => d.status),
        series: statusBookingData.map((d: any) => d.count),
        colors: ["#A3E635", "#FACC15", "#3B82F6", "#10B981", "#6366F1"], // Added more colors just in case
      });

      // Process Reservation by Status
      const resStatusData = resStatus.data.data || [];
      setReservationsByStatus({
        labels: resStatusData.map((d: any) => d.status),
        series: resStatusData.map((d: any) => d.count),
        colors: ["#3730A3", "#FACC15", "#F87171"],
      });

      // Process Checkout by Status
      const checkoutStatusData = checkoutStatus.data.data || [];
      setCheckOutsStatus({
        labels: checkoutStatusData.map((d: any) => d.status),
        series: checkoutStatusData.map((d: any) => d.count),
        colors: ["#3B82F6", "#EF4444", "#10B981"],
      });

      // Process Single Item by Flag
      const flagStatusData = flagStatus.data.data || [];
      setItemsByFlag({
        labels: flagStatusData.map((d: any) => d.status),
        series: flagStatusData.map((d: any) => d.count),
        colors: checkFlagColors(flagStatusData.map((d: any) => d.status)),
      });

      // Process Stats Cards
      setReservationsByLocation(
        (resLocation.data.data || []).map((d: any) => ({
          label: d.location.charAt(0).toUpperCase() + d.location.slice(1),
          value: d.count,
          subLabel: d.status
        }))
      );
      setCheckoutsByLocation(
        (checkoutLocation.data.data || []).map((d: any) => ({
          label: d.location.charAt(0).toUpperCase() + d.location.slice(1),
          value: d.count,
          subLabel: d.status
        }))
      );

      // Process Upcoming Lists
      const processUpcoming = (data: any[]) => {
        if (!data) return [];
        return data.flatMap(loc =>
          loc.items.slice(0, 5).map((item: any) => ({
            dateRange: `${moment(item.start_date).format('ddd HH:mm')} - ${moment(item.end_date).format('ddd HH:mm')}`,
            title: item.title,
            tags: [item.status, item.reference_code],
            daysLeft: `${item.days_left} Days`,
            statusColor: item.days_left < 0 ? "bg-red-500" : "bg-green-500",
            location: loc.location
          }))
        );
      };

      setUpcomingReservations(processUpcoming(upcomingRes.data.data));
      setUpcomingCheckouts(processUpcoming(upcomingCheckout.data.data));

      // Process Broken Items
      const brokenData = brokenItems.data.data;
      if (brokenData) {
        setBrokenItemsData({
          total: brokenData.total,
          items: brokenData.items.slice(0, 5).map((item: any) => ({
            id: item.item_id,
            name: item.name,
            image: process.env.NEXT_PUBLIC_IMAGE_URL + "/" + item.image_path || "/images/placeholder.png", // Fallback image
            price: item.cost
          })),
          totalItems: brokenData.items.length
        });
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkFlagColors = (statuses: string[]) => {
    const colorMap: Record<string, string> = {
      "BROKEN": "#F87171",
      "GOOD": "#A3E635",
      "NEED_CHECK": "#EA580C",
      "ON_REPAIR": "#3730A3",
      "TAKEOUT": "#CBD5E1"
    };
    return statuses.map(s => colorMap[s] || "#9CA3AF");
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [dateRange, token]);


  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <Head>
        <title>Dashboard | Camventory</title>
      </Head>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-orange-500">Overview</h1>
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="border-2 border-gray-200 bg-white rounded-lg px-4 py-2 flex items-center gap-2 hover:border-orange-500 transition-all shadow-sm"
          >
            <FilterIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-bold text-gray-600">Filter</span>
          </button>
          <FilterPopup
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onReset={handleResetFilter}
            startDate={dateRange.start}
            endDate={dateRange.end}
            onStartDateChange={(date) => setDateRange({ ...dateRange, start: date })}
            onEndDateChange={(date) => setDateRange({ ...dateRange, end: date })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DonutChart
          title="Single Item by Status"
          labels={itemsByStatus.labels}
          series={itemsByStatus.series}
          colors={itemsByStatus.colors}
          totalLabel="Total"
          loading={loading}
        />
        <DonutChart
          title="Reservation by Status"
          labels={reservationsByStatus.labels}
          series={reservationsByStatus.series}
          colors={reservationsByStatus.colors}
          totalLabel="Total"
          loading={loading}
        />
        <DonutChart
          title="Check Outs Status"
          labels={checkOutsStatus.labels}
          series={checkOutsStatus.series}
          colors={checkOutsStatus.colors}
          totalLabel="Total"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Reservation by Location" stats={reservationsByLocation} loading={loading} />
        <StatsCard title="Checkouts by Location" stats={checkoutsByLocation} loading={loading} />
        <DonutChart
          title="Single Items by Flag"
          labels={itemsByFlag.labels}
          series={itemsByFlag.series}
          colors={itemsByFlag.colors}
          totalLabel="Total"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UpcomingListCard
          title="Upcoming Check-outs"
          location="All Locations"
          items={upcomingCheckouts}
          totalItems={upcomingCheckouts.length}
          loading={loading}
          onViewAll={() => router.push("/main/reservation?page=1&limit=10&status=BOOKED")}
        />
        <UpcomingListCard
          title="Upcoming Reservation Location"
          location="All Locations"
          items={upcomingReservations}
          totalItems={upcomingReservations.length}
          loading={loading}
          onViewAll={() => router.push("/main/reservation")}
        />
        <BrokenItemsCard
          items={brokenItemsData.items}
          totalPrice={brokenItemsData.total}
          totalItems={brokenItemsData.totalItems}
          loading={loading}
          onViewAll={() => router.push("/main/items?page=1&limit=10&statusItem=BROKEN")}
        />
      </div>
    </div>
  );
}

export const getServerSideProps = async ({ req }: any) => {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token || "";

  return {
    props: {
      token
    },
  };
};
