import { CONFIG } from '@/config';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
    message: string;
    payload?: {
        username: string;
        password: string;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    try {
        if (req.method === 'POST') {
            const { username, password, login_for = "BO" } = req.body

            // Simulate user creation (normally, you’d interact with DB here)
            if (!username || !password) {
                return res.status(400).json({ message: 'Username and Password are required' })
            }

            await axios.post(CONFIG.API_URL + '/auth/v1/login', {
                email: username,
                password,
                login_for
            });

            return res.status(201).json({
                message: 'Admin login successfully',
                payload: { username, password },
            })
        }

        return res.status(405).json({ message: 'Method Not Allowed' })
    } catch (error: any) {
        console.log(error, "error msg");
        return res.status(400).json({ message: error?.response?.data?.error })
    }
}