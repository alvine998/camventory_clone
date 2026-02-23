import Button from "@/components/Button";
import { fetchNotificationsServer, fetchUnreadNotificationsServer } from "@/utils/notification";
import Input from "@/components/Input";
import AddEquipmentView from "@/components/reservation/AddEquipmentView";
import Select from "@/components/Select";
import { CONFIG } from "@/config";
import axios from "axios";
import { parse } from "cookie";
import { ArrowLeftIcon, PlusSquareIcon, Trash2Icon } from "lucide-react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

// ✅ Types
interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  serial_number?: string;
  full_path_image: string;
}

interface Props {
  categories: Category[];
  brands: Brand[];
  bulkItems: Item[];
  singleItems: Item[];
  users: { id: string; name: string }[];
  customers: { id: string; name: string }[];
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;

  if (!token) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  try {
    const { page = "1", limit = "10", search = "" } = query;

    const [
      categories,
      brands,
      bulkItems,
      singleItems,
      users,
      customers,
      notificationsData,
      unreadNotificationsData,
    ] = await Promise.all([
      axios.get(`${CONFIG.API_URL}/v1/master/categories`, {
        headers: { Authorization: token },
      }),
      axios.get(`${CONFIG.API_URL}/v1/master/brands`, {
        headers: { Authorization: token },
      }),
      axios.get(
        `${CONFIG.API_URL}/v1/bulk-items?isAvailable=true&page=${page}&limit=${limit}${search ? `&search=${search}` : ""
        }`,
        {
          headers: { Authorization: token },
        }
      ),
      axios.get(
        `${CONFIG.API_URL}/v1/single-items?statusItem=GOOD&statusBooking=AVAILABLE&page=${page}&limit=${limit}${search ? `&search=${search}` : ""
        }`,
        {
          headers: { Authorization: token },
        }
      ),
      axios.get(`${CONFIG.API_URL}/accounts/v1/users/all?page=1&limit=100`, {
        headers: {
          Authorization: `${token}`,
        },
      }),
      axios.get(`${CONFIG.API_URL}/v1/customers?page=1&limit=100`, {
        headers: {
          Authorization: `${token}`,
        },
      }),
      fetchNotificationsServer(token),
      fetchUnreadNotificationsServer(token),
    ]);

    return {
      props: {
        categories: categories.data?.data || [],
        brands: brands.data?.data || [],
        bulkItems: bulkItems.data?.data || [],
        singleItems: singleItems.data?.data || [],
        users: users.data?.data || [],
        customers: customers.data?.data || [],
        notifications: notificationsData?.data || [],
        unreadNotifications: unreadNotificationsData?.data || [],
      },
    };
  } catch (error: any) {
    if (error?.response?.status === 401) {
      return { redirect: { destination: "/", permanent: false } };
    }
    return {
      props: {
        categories: [],
        brands: [],
        bulkItems: [],
        singleItems: [],
        users: [],
        customers: [],
        notifications: [],
        unreadNotifications: [],
      },
    };
  }
};

export default function CreateReservationPage({
  categories,
  bulkItems,
  singleItems,
  users,
  customers,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<"form" | "select">("form");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const processedItemIdRef = useRef<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fromDate = formData.get("from")?.toString();
    const toDate = formData.get("to")?.toString();
    const today = new Date().toISOString().split("T")[0];

    // Validate dates
    if (fromDate && fromDate < today) {
      Swal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "The 'From' date cannot be before today.",
      });
      setLoading(false);
      return;
    }

    if (toDate && toDate < today) {
      Swal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "The 'To' date cannot be before today.",
      });
      setLoading(false);
      return;
    }

    if (fromDate && toDate && toDate < fromDate) {
      Swal.fire({
        icon: "error",
        title: "Invalid Date Range",
        text: "The 'To' date cannot be before the 'From' date.",
      });
      setLoading(false);
      return;
    }

    // Validate items
    if (!items || items.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No Items Selected",
        text: "Please add at least one item to the reservation.",
      });
      setLoading(false);
      return;
    }

    const payload = {
      ...Object.fromEntries(formData),
      start_date: formData.get("from")
        ? Math.floor(
          new Date(formData.get("from")!.toString()).getTime() / 1000
        )
        : null,
      end_date: formData.get("to")
        ? Math.floor(new Date(formData.get("to")!.toString()).getTime() / 1000)
        : null,
      items: JSON.stringify(
        items?.map((item: any) => ({
          uuid: item.id,
          qty: item?.added || 1,
          type: item?.category ? "single" : "bulk",
        })) || []
      ),
    };

    try {
      await axios.post("/api/reservation", payload);
      Swal.fire({
        icon: "success",
        title: "Reservation Created Successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      router.push(`/main/reservation`);
    } catch (error: any) {
      console.error("Reservation creation error:", error);

      // Extract error message from different possible response structures
      let errorMessage = "An error occurred while creating the reservation";
      let errorTitle = "Reservation Creation Failed";

      if (error.response) {
        // API error response
        const responseData = error.response.data;

        // Check for message in different possible locations
        if (responseData?.message) {
          errorMessage = typeof responseData.message === 'string'
            ? responseData.message
            : responseData.message?.message || errorMessage;
        } else if (responseData?.error?.message) {
          errorMessage = responseData.error.message;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }

        // Handle specific error status codes
        if (error.response.status === 400) {
          errorTitle = "Invalid Request";
        } else if (error.response.status === 401) {
          errorTitle = "Authentication Failed";
          errorMessage = "Your session has expired. Please log in again.";
        } else if (error.response.status === 403) {
          errorTitle = "Permission Denied";
          errorMessage = "You don't have permission to create this reservation.";
        } else if (error.response.status === 409) {
          errorTitle = "Conflict Detected";
        } else if (error.response.status === 422) {
          errorTitle = "Validation Error";
        } else if (error.response.status >= 500) {
          errorTitle = "Server Error";
          errorMessage = "The server encountered an error. Please try again later.";
        }
      } else if (error.request) {
        // Request was made but no response received
        errorTitle = "Network Error";
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      } else {
        // Error in request setup
        errorMessage = error.message || errorMessage;
      }

      // Format error message for display
      const isMultiLine = errorMessage.includes('\n') || errorMessage.includes('Date conflict');

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: !isMultiLine ? errorMessage : undefined,
        html: isMultiLine
          ? `<div style="text-align: left; white-space: pre-line; font-size: 14px;">${errorMessage}</div>`
          : undefined,
        confirmButtonText: "OK",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };


  // Handle item from detail page (when navigating from Reserve button)
  useEffect(() => {
    const { itemId, itemType } = router.query;

    if (!itemId || !itemType || typeof itemId !== "string" || typeof itemType !== "string") {
      processedItemIdRef.current = null;
      return;
    }

    // Skip if we already processed this itemId
    if (processedItemIdRef.current === itemId) {
      return;
    }

    // Mark as processing immediately
    processedItemIdRef.current = itemId;

    const addItemToList = (itemData: any) => {
      setItems((currentItems) => {
        // Check if item is already in the list
        if (currentItems.some((i) => i.id === itemId)) {
          return currentItems;
        }

        // Add item to list
        if (itemType === "single") {
          return [...currentItems, { ...itemData, added: 1 }];
        } else {
          return [...currentItems, { ...itemData, qty: 1, isBulk: true, added: 1 }];
        }
      });

      // Clean up query params
      const restQuery = { ...router.query };
      delete restQuery.itemId;
      delete restQuery.itemType;
      delete restQuery.itemName;
      router.replace(
        {
          pathname: router.pathname,
          query: restQuery,
        },
        undefined,
        { shallow: true }
      );
    };

    // First, try to find in the loaded lists
    const itemList = itemType === "single" ? singleItems : bulkItems;
    const foundItem = itemList.find((item) => item.id === itemId);

    if (foundItem) {
      // Item found in list, add it
      addItemToList(foundItem);
    } else {
      // Item not found in list, fetch from API
      const fetchItem = async () => {
        try {
          const cookies = parse(document.cookie || "");
          const token = cookies.token;

          if (!token) {
            console.error("No token found");
            processedItemIdRef.current = null;
            return;
          }

          const endpoint = itemType === "single"
            ? `${CONFIG.API_URL}/v1/single-items/${itemId}`
            : `${CONFIG.API_URL}/v1/bulk-items/${itemId}`;

          const response = await axios.get(endpoint, {
            headers: { Authorization: token },
          });

          const itemData = response.data?.data;
          if (itemData) {
            addItemToList(itemData);
          } else {
            processedItemIdRef.current = null;
          }
        } catch (error) {
          console.error("Error fetching item:", error);
          processedItemIdRef.current = null; // Reset on error so it can retry
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load item details",
            timer: 2000,
            showConfirmButton: false,
          });

          // Clean up query params even on error
          const restQuery = { ...router.query };
          delete restQuery.itemId;
          delete restQuery.itemType;
          delete restQuery.itemName;
          router.replace(
            {
              pathname: router.pathname,
              query: restQuery,
            },
            undefined,
            { shallow: true }
          );
        }
      };

      fetchItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.itemId, router.query.itemType, singleItems, bulkItems]);

  if (view === "select") {
    return (
      <AddEquipmentView
        items={items}
        setItems={setItems}
        singleItems={singleItems}
        bulkItems={bulkItems}
        categories={categories}
        onBack={() => setView("form")}
        onSave={() => setView("form")}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-row gap-2 items-center">
        <button onClick={() => router.push(`/main/reservation`)} type="button">
          <ArrowLeftIcon className="w-6 h-6 text-orange-500" />
        </button>
        <h1 className="text-2xl font-bold text-orange-500">
          Add Reservation Data
        </h1>
      </div>

      <form onSubmit={onSubmit} className="mt-6 mb-20">
        {/* Customer & User */}
        <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
          <Select
            options={customers.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            placeholder="Customer"
            label="Customer"
            fullWidth
            required
            name="customer_uuid"
          />
          <Select
            options={users.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            placeholder="User/Employee"
            label="User/Employee"
            fullWidth
            required
            name="user_uuid"
          />
        </div>

        {/* Dates & Location */}
        <div className="flex md:flex-row flex-col gap-4 mt-4 w-full">
          <div className="grid grid-cols-2 gap-4 w-full">
            <Input
              placeholder="From"
              label="From"
              name="from"
              fullWidth
              required
              type="date"
              min={today}
              value={fromDate}
              onChange={(e) => {
                const selectedFromDate = e.target.value;
                setFromDate(selectedFromDate);
                // If "to" date is before the new "from" date, clear it
                if (toDate && selectedFromDate && toDate < selectedFromDate) {
                  setToDate("");
                }
              }}
            />
            <Input
              placeholder="To"
              label="To"
              name="to"
              fullWidth
              required
              type="date"
              min={fromDate || today}
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
              }}
            />
          </div>
          <Select
            options={[
              { label: "Dipatiukur", value: "dipatiukur" },
              { label: "Cipadung", value: "cipadung" },
            ]}
            placeholder="Pickup Location"
            label="Pickup Location"
            fullWidth
            required
            name="location"
          />
        </div>

        {/* Equipment Section */}
        <div className="mt-4">
          <h1 className="text-xl font-bold text-orange-500">Equipments</h1>
          <div className="border rounded p-4 mt-2">
            <div className="flex justify-center items-center">
              <button
                className="border border-orange-500 p-2 rounded flex items-center gap-2"
                type="button"
                onClick={() => setView("select")}
              >
                <PlusSquareIcon className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-orange-500">Add product or Item</p>
              </button>
            </div>

            {items.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b py-2"
                  >
                    <div className="flex gap-2 items-center">
                      <Image
                        src={item.full_path_image}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="w-24 h-20 object-cover rounded"
                      />
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item?.isBulk ? "Item" : "Product"}
                        </p>
                        <p className="text-xs text-gray-500 font-bold">
                          {item?.added || "1"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setItems(items.filter((i) => i.id !== item.id));
                        Swal.fire({
                          icon: "success",
                          title: "Item removed successfully",
                          timer: 1500,
                          showConfirmButton: false,
                        });
                      }}
                    >
                      <Trash2Icon className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-end mt-4">
          <Button
            variant="white"
            type="button"
            onClick={() => router.push("/main/reservation")}
          >
            Cancel
          </Button>
          <Button disabled={loading} variant="submit" type="submit">
            {loading ? "Loading..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
