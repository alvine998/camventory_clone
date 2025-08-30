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
      // Simulate user creation (normally, you’d interact with DB here)
      for (let index = 0; index < requiredBody.length; index++) {
        const element = requiredBody[index];
        if (!element) {
          return res.status(400).json({ message: `${element} are required` });
        }
      }

      const payload = {
        start_date,
        end_date,
        customer_uuid,
        location,
        user_uuid,
        items: JSON.parse(items),
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
      // Simulate user creation (normally, you’d interact with DB here)
      for (let index = 0; index < requiredBody.length; index++) {
        const element = requiredBody[index];
        if (!element) {
          return res.status(400).json({ message: `${element} are required` });
        }
      }

      const result = await axios.put(
        CONFIG.API_URL + "/v1/reservation" + `/${id}`,
        {
          start_date,
          end_date,
          customer_uuid,
          location,
          user_uuid,
          items,
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
          items,
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
