import { CONFIG } from '@/config';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next'

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
        email: string;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    try {
        const { nik, name, phone_number, instagram_acc, path_ktp, id, email } = req.body
        const requiredBody = ["nik", "name", "phone_number", "instagram_acc", "path_ktp"];

        if (req.method === 'POST') {

            // Simulate user creation (normally, you’d interact with DB here)
            for (let index = 0; index < requiredBody.length; index++) {
                const element = requiredBody[index];
                if (!element) {
                    return res.status(400).json({ message: `${element} are required` })
                }
            }

            const result = await axios.post(CONFIG.API_URL + '/v1/customers', {
                nik, name, phone_number, instagram_acc, path_ktp, email
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `${req.cookies.token}`
                }
            });

            if (result.status !== 201) {
                return res.status(400).json({ message: result?.data?.error })
            }

            return res.status(201).json({
                message: 'User created successfully',
                payload: { nik, name, phone_number, instagram_acc, path_ktp, id, email },
            })
        }

        if (req.method === 'PATCH') {

            // Simulate user creation (normally, you’d interact with DB here)
            for (let index = 0; index < requiredBody.length; index++) {
                const element = requiredBody[index];
                if (!element) {
                    return res.status(400).json({ message: `${element} are required` })
                }
            }

            const result = await axios.patch(CONFIG.API_URL + '/v1/customers' + `/${id}`, {
                nik, name, phone_number, instagram_acc, path_ktp, email
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `${req.cookies.token}`
                }
            });

            if (result.status === 400) {
                return res.status(400).json({ message: result?.data?.error })
            }

            return res.status(201).json({
                message: 'Customer updated successfully',
                payload: { nik, name, phone_number, instagram_acc, path_ktp, id, email },
            })
        }

        if (req.method === 'DELETE') {

            await axios.delete(CONFIG.API_URL + '/v1/customers' + `/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `${req.cookies.token}`
                }
            });

            return res.status(201).json({
                message: 'Customer deleted successfully',
            })
        }

        return res.status(405).json({ message: 'Method Not Allowed' })
    } catch (error: any) {
        console.log(error, "error msg");
        return res.status(400).json({ message: error?.response?.data?.error || error?.response?.data?.message })
    }
}