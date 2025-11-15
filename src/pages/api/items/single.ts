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

    if (req.method === "POST") {
      const result = await axios.post(
        CONFIG.API_URL + "/v1/single-items",
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

      if (result.status !== 201) {
        return res.status(400).json({ message: result?.data?.error });
      }

      return res.status(201).json({
        message: "Single Items created successfully",
        payload: { ...req.body },
      });
    }

    if (req.method === "PUT") {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: "Item ID is required" });
      }
      console.log(req.body, "req.body")

      const result = await axios.put(
        CONFIG.API_URL + `/v1/single-items/${id}`,
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

      if (result.status !== 200 && result.status !== 201) {
        return res.status(400).json({ message: result?.data?.error || result?.data?.message });
      }

      return res.status(200).json({
        message: "Single Item updated successfully",
        payload: { ...req.body, id },
      });
    }

    // if (req.method === 'PATCH') {

    //     // Simulate user creation (normally, you’d interact with DB here)
    //     for (let index = 0; index < requiredBody.length; index++) {
    //         const element = requiredBody[index];
    //         if (!element) {
    //             return res.status(400).json({ message: `${element} are required` })
    //         }
    //     }

    //     const result = await axios.patch(CONFIG.API_URL + '/v1/customers' + `/${id}`, {
    //         nik, name, phone_number, instagram_acc, path_ktp
    //     }, {
    //         headers: {
    //             'Content-Type': 'application/json',
    //             Authorization: `${req.cookies.token}`
    //         }
    //     });

    //     if (result.status === 400) {
    //         return res.status(400).json({ message: result?.data?.error })
    //     }

    //     return res.status(201).json({
    //         message: 'Customer updated successfully',
    //         payload: { nik, name, phone_number, instagram_acc, path_ktp, id },
    //     })
    // }

    // if (req.method === 'DELETE') {

    //     await axios.delete(CONFIG.API_URL + '/v1/customers' + `/${id}`, {
    //         headers: {
    //             'Content-Type': 'application/json',
    //             Authorization: `${req.cookies.token}`
    //         }
    //     });

    //     return res.status(201).json({
    //         message: 'Customer deleted successfully',
    //     })
    // }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (error: any) {
    console.log(error, "error msg");
    return res.status(400).json({
      message: error?.response?.data?.error || error?.response?.data?.message,
    });
  }
}
