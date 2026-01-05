import { CONFIG } from "@/config";
import type { ICalendarResponse } from "@/types/reservation";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ICalendarResponse | { message: string }>
) {
    try {
        if (req.method !== "GET") {
            return res.status(405).json({ message: "Method Not Allowed" });
        }

        const { startDate, endDate, status } = req.query;

        // Validate required query parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                message: "startDate and endDate are required query parameters"
            });
        }

        // Build query string
        const queryParams = new URLSearchParams();
        queryParams.append("startDate", startDate as string);
        queryParams.append("endDate", endDate as string);

        if (status) {
            queryParams.append("status", status as string);
        }

        // Make request to backend API (note: backend uses "calender" spelling)
        const response = await axios.get<ICalendarResponse>(
            `${CONFIG.API_URL}/v1/calender?${queryParams.toString()}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${req.cookies.token}`,
                },
            }
        );

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Calendar API error:", error);

        // Handle axios errors
        if (error.response) {
            return res.status(error.response.status).json({
                message: error.response.data?.error?.message || error.response.data?.message || "Error fetching calendar data",
            });
        }

        return res.status(500).json({
            message: error?.message || "Internal server error",
        });
    }
}
