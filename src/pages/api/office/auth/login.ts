import { CONFIG } from '@/config';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie';

type Data = {
    message: string;
    payload?: {
        username: string;
        password: string;
        user: any;
        token: string;
        is_remember: boolean;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    try {
        if (req.method === 'POST') {
            const { username, password, login_for = "BO", is_remember } = req.body

            // Simulate user creation (normally, you’d interact with DB here)
            if (!username || !password) {
                return res.status(400).json({ message: 'Username and Password are required' })
            }

            const result = await axios.post(CONFIG.API_URL + '/auth/v1/login', {
                email: username,
                password,
                login_for
            });

            const token = is_remember ? result.data?.data?.refresh_token : result.data?.data?.access_token;

            const user = await axios.get(CONFIG.API_URL + "/accounts/v1/back-office", {
                headers: {
                    Authorization: `${token}`,
                },
            });

            const serialized = serialize('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 1, // 1 day
                path: '/',
            })

            res.setHeader('Set-Cookie', serialized)

            return res.status(201).json({
                message: 'Admin login successfully',
                payload: { username, password, user: user?.data?.data, token: token, is_remember: is_remember },
            })
        }

        return res.status(405).json({ message: 'Method Not Allowed' })
    } catch (error: any) {
        console.log(error, "error msg");
        return res.status(400).json({ message: error?.response?.data?.error })
    }
}