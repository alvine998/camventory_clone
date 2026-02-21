import { CONFIG } from "@/config";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
  payload?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { id, items } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Reservation ID is required" });
    }

    const result = await axios.post(
      `${CONFIG.API_URL}/v1/reservation/${id}/checkin`,
      {
        items,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${req.cookies.token}`,
        },
      },
    );

    return res.status(200).json({
      message: "Check-in successful",
      payload: result.data,
    });
  } catch (error: any) {
    console.error(
      "Check-in API error:",
      error?.response?.data || error.message,
    );
    const apiError =
      error?.response?.data?.error || error?.response?.data?.message;
    const errorMessage =
      typeof apiError === "object" ? apiError.message : apiError;

    return res.status(error?.response?.status || 500).json({
      message: errorMessage || error.message || "Internal Server Error",
    });
  }
}
