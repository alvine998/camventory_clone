import type { NextApiRequest, NextApiResponse } from 'next';
import { CONFIG } from '@/config';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
    api: {
        bodyParser: false,
    },
};

type ResponseData = {
    message: string;
    payload?: any;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const form = formidable({ keepExtensions: true, multiples: false });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Formidable error:', err);
            return res.status(500).json({ message: 'Error parsing form' });
        }

        const category = fields.category?.toString() || 'unknown';
        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!uploadedFile || !uploadedFile.filepath) {
            console.error('Uploaded file is missing or has no path:', uploadedFile);
            return res.status(400).json({ message: 'No file uploaded or invalid file structure' });
        }
        console.log(req.cookies.token, 'tokkn');

        try {
            const stream = fs.createReadStream(uploadedFile.filepath);

            const formData = new FormData();
            formData.append('file', stream, uploadedFile.originalFilename || 'upload.file');
            formData.append('category', category);

            const response = await axios.post(
                `${CONFIG.API_URL}/v1/file/upload`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        Authorization: req.cookies.token || '',
                    },
                    maxBodyLength: Infinity, // important for large files
                    maxContentLength: Infinity,
                }
            );

            return res.status(201).json({
                message: 'Upload success',
                payload: response.data,
            });
        } catch (uploadError: any) {
            console.error('Upload error:', uploadError);
            return res.status(500).json({ message: uploadError.message || 'Upload error' });
        }
    });
}
