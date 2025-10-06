import { CONFIG } from "@/config";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
  payload?: {
    start_date: string;
    end_date: string;
    customer_uuid: string;
    location: string;
    user_uuid: string;
    items: string;
    id?: string;
  };
  conflicts?: Array<{
    item_name: string;
    item_id: string;
    existing_start: string;
    existing_end: string;
    reservation_id: string;
  }>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const {
      start_date,
      end_date,
      customer_uuid,
      location,
      user_uuid,
      items,
      id,
    } = req.body;
    const requiredBody = [
      "start_date",
      "end_date",
      "customer_uuid",
      "location",
      "user_uuid",
      "items",
    ];

    if (req.method === "POST") {
      // Validate required fields
      for (let index = 0; index < requiredBody.length; index++) {
        const element = requiredBody[index];
        if (!req.body[element]) {
          return res.status(400).json({ message: `${element} is required` });
        }
      }

      const parsedItems = JSON.parse(items);
      
      // Check for date conflicts with existing reservations
      try {
        const existingReservations = await axios.get(
          CONFIG.API_URL + "/v1/reservation",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${req.cookies.token}`,
            },
          }
        );

        const conflicts = [];
        const newStartDate = parseInt(start_date);
        const newEndDate = parseInt(end_date);

        // Check each item for conflicts
        for (const newItem of parsedItems) {
          for (const existingReservation of existingReservations.data.data || []) {
            // Skip cancelled reservations
            if (existingReservation.status === 'cancelled') continue;
            
            for (const existingItem of existingReservation.details || []) {
              if (existingItem.item_id === newItem.uuid) {
                const existingStartDate = existingItem.start_date;
                const existingEndDate = existingItem.end_date;
                
                // Check for date overlap
                if (
                  (newStartDate >= existingStartDate && newStartDate <= existingEndDate) ||
                  (newEndDate >= existingStartDate && newEndDate <= existingEndDate) ||
                  (newStartDate <= existingStartDate && newEndDate >= existingEndDate)
                ) {
                  conflicts.push({
                    item_name: existingItem.item_name,
                    item_id: existingItem.item_id,
                    existing_start: new Date(existingStartDate * 1000).toLocaleDateString(),
                    existing_end: new Date(existingEndDate * 1000).toLocaleDateString(),
                    reservation_id: existingReservation.id
                  });
                }
              }
            }
          }
        }

        if (conflicts.length > 0) {
          const conflictMessage = conflicts.map(conflict => 
            `${conflict.item_name} is already reserved from ${conflict.existing_start} to ${conflict.existing_end} (Reservation ID: ${conflict.reservation_id})`
          ).join('\n');
          
          return res.status(400).json({ 
            message: `Date conflict detected:\n${conflictMessage}`,
            conflicts: conflicts
          });
        }
      } catch (error) {
        console.error("Error checking for conflicts:", error);
        // Continue with creation if conflict check fails
      }

      const payload = {
        start_date,
        end_date,
        customer_uuid,
        location,
        user_uuid,
        items: parsedItems,
      };

      await axios.post(
        CONFIG.API_URL + "/v1/reservation",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${req.cookies.token}`,
          },
        }
      );

      return res.status(201).json({
        message: "Reservation created successfully",
        payload: {
          ...payload,
          id,
        },
      });
    }

    if (req.method === "PATCH") {
      // Validate required fields
      for (let index = 0; index < requiredBody.length; index++) {
        const element = requiredBody[index];
        if (!req.body[element]) {
          return res.status(400).json({ message: `${element} is required` });
        }
      }

      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      
      // Check for date conflicts with existing reservations (excluding current reservation)
      try {
        const existingReservations = await axios.get(
          CONFIG.API_URL + "/v1/reservation",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${req.cookies.token}`,
            },
          }
        );

        const conflicts = [];
        const newStartDate = parseInt(start_date);
        const newEndDate = parseInt(end_date);

        // Check each item for conflicts
        for (const newItem of parsedItems) {
          for (const existingReservation of existingReservations.data.data || []) {
            // Skip cancelled reservations and current reservation being edited
            if (existingReservation.status === 'cancelled' || existingReservation.id === id) continue;
            
            for (const existingItem of existingReservation.details || []) {
              if (existingItem.item_id === newItem.uuid) {
                const existingStartDate = existingItem.start_date;
                const existingEndDate = existingItem.end_date;
                
                // Check for date overlap
                if (
                  (newStartDate >= existingStartDate && newStartDate <= existingEndDate) ||
                  (newEndDate >= existingStartDate && newEndDate <= existingEndDate) ||
                  (newStartDate <= existingStartDate && newEndDate >= existingEndDate)
                ) {
                  conflicts.push({
                    item_name: existingItem.item_name,
                    item_id: existingItem.item_id,
                    existing_start: new Date(existingStartDate * 1000).toLocaleDateString(),
                    existing_end: new Date(existingEndDate * 1000).toLocaleDateString(),
                    reservation_id: existingReservation.id
                  });
                }
              }
            }
          }
        }

        if (conflicts.length > 0) {
          const conflictMessage = conflicts.map(conflict => 
            `${conflict.item_name} is already reserved from ${conflict.existing_start} to ${conflict.existing_end} (Reservation ID: ${conflict.reservation_id})`
          ).join('\n');
          
          return res.status(400).json({ 
            message: `Date conflict detected:\n${conflictMessage}`,
            conflicts: conflicts
          });
        }
      } catch (error) {
        console.error("Error checking for conflicts:", error);
        // Continue with update if conflict check fails
      }

      const result = await axios.put(
        CONFIG.API_URL + "/v1/reservation" + `/${id}`,
        {
          start_date,
          end_date,
          customer_uuid,
          location,
          user_uuid,
          items: parsedItems,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${req.cookies.token}`,
          },
        }
      );

      if (result.status === 400) {
        return res.status(400).json({ message: result?.data?.error });
      }

      return res.status(201).json({
        message: "Reservation updated successfully",
        payload: {
          start_date,
          end_date,
          customer_uuid,
          location,
          user_uuid,
          items: parsedItems,
          id,
        },
      });
    }

    if (req.method === "DELETE") {
      await axios.delete(CONFIG.API_URL + "/v1/reservation" + `/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${req.cookies.token}`,
        },
      });

      return res.status(201).json({
        message: "Reservation deleted successfully",
      });
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (error: any) {
    console.log(error, "error msg");
    return res.status(400).json({
      message: error?.response?.data?.error || error?.response?.data?.message,
    });
  }
}
