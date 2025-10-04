import { CONFIG } from "@/config";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
    message: string;
    payload?: {
        reason?: string;
        id?: string;
    };
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    try {
        const {
            reason,
            id
        } = req.body;

        if (req.method === "PATCH") {

            const result = await axios.put(
                CONFIG.API_URL + "/v1/reservation/cancel" + `/${id}`,
                {
                    reason
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
                    id,
                    reason
                },
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
