import { CONFIG } from '@/config';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
    message: string;
    payload?: {
        email: string;
        name: string;
        phone: string;
        password?: string;
        id?: string;
        location: string;
        role: string;
        status: string;
        data?: string;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    try {
        const { email, name, phone, location, role, status, password, id, data } = req.body
        const requiredBody = ["email", "name", "phone", "location", "role", "status"];

        if (req.method === 'POST') {

            // Simulate user creation (normally, you’d interact with DB here)
            for (let index = 0; index < requiredBody.length; index++) {
                const element = requiredBody[index];
                if (!element) {
                    return res.status(400).json({ message: `${element} are required` })
                }
            }

            const result = await axios.post(CONFIG.API_URL + '/accounts/v1/users', {
                email, full_name: name, phone, location, role: role.toUpperCase(), status: status.toUpperCase(), password
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
                payload: { email, name, phone, location, role, status },
            })
        }

        // if (req.method === 'PATCH') {

        //     // Simulate user creation (normally, you’d interact with DB here)
        //     for (let index = 0; index < requiredBody.length; index++) {
        //         const element = requiredBody[index];
        //         if (!element) {
        //             return res.status(400).json({ message: `${element} are required` })
        //         }
        //     }

        //     const result = await axios.patch(CONFIG.API_URL + '/accounts/v1/users/profile', {
        //         email, full_name: name, phone, location, role: role.toUpperCase(), status: status.toUpperCase(), password: password || null, id
        //     }, {
        //         headers: {
        //             'Content-Type': 'application/json',
        //             Authorization: `${req.cookies.token}`
        //         }
        //     });

        //     if (result.status !== 201) {
        //         return res.status(400).json({ message: result?.data?.error })
        //     }

        //     return res.status(201).json({
        //         message: 'User updated successfully',
        //         payload: { email, name, phone, location, role, status, id },
        //     })
        // }

        // if (req.method === 'DELETE') {

        //     const result = await axios.delete(CONFIG.API_URL + '/accounts/v1/users', {
        //         data: {
        //             ...JSON.parse(data)
        //         },
        //         headers: {
        //             'Content-Type': 'application/json',
        //             Authorization: `${req.cookies.token}`
        //         }
        //     });

        //     if (result.status !== 201) {
        //         return res.status(400).json({ message: result?.data?.error })
        //     }

        //     return res.status(201).json({
        //         message: 'User deleted successfully',
        //         payload: { email, name, phone, location, role, status, id, data },
        //     })
        // }

        return res.status(405).json({ message: 'Method Not Allowed' })
    } catch (error: any) {
        console.log(error, "error msg");
        return res.status(400).json({ message: error?.response?.data?.error || error?.response?.data?.message })
    }
}