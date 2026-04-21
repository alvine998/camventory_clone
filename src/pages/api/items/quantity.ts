import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { CONFIG } from "@/config";
import { parse } from "cookie";

interface QuantityItem {
  id: string;
  quantity: number;
  reason: string;
}

interface RequestBody {
  items: QuantityItem[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow PATCH requests
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { items } = req.body as RequestBody;

    // Validate request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Invalid request body. items array is required.",
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.id || !item.quantity || !item.reason) {
        return res.status(400).json({
          message:
            "Each item must have id, quantity, and reason fields.",
        });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({
          message: "Quantity must be greater than 0.",
        });
      }
    }

    // Get token from cookies
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized. No token provided.",
      });
    }

    // Call backend API
    const response = await axios.patch(
      `${CONFIG.API_URL}/v1/bulk-items/stock/batch`,
      {
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          reason: item.reason,
        })),
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error adding quantity:", error);

    if (error.response?.status === 401) {
      return res.status(401).json({
        message: "Unauthorized. Invalid or expired token.",
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        message: "One or more items not found.",
      });
    }

    if (error.response?.data) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      message: "Internal server error. Failed to add quantity.",
      error: error.message,
    });
  }
}
