import { CONFIG } from "@/config";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
  payload?: {
    nik: string;
    name: string;
    phone_number: string;
    instagram_acc?: string;
    id?: string;
    path_ktp: string;
    data?: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    if (req.method === "PATCH") {
        console.log(req.body, "body")
      const result = await axios.patch(
        CONFIG.API_URL + "/v1/single-items/status" + `/${req.body.id}`,
        {
          ...req.body,
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
        message: "Status Items updated successfully",
        payload: { ...req.body },
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
