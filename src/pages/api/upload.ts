import type { NextApiRequest, NextApiResponse } from "next";
import { CONFIG } from "@/config";
import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  message: string;
  payload?: any;
  debug?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const form = formidable({ keepExtensions: true, multiples: false });

  let fields: formidable.Fields;
  let files: formidable.Files;

  try {
    ({ fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      form.parse(req, (err, parsedFields, parsedFiles) => {
        if (err) {
          return reject(err);
        }

        console.log("Upload API - Received fields:", parsedFields);
        console.log("Upload API - Received files:", parsedFiles);

        resolve({ fields: parsedFields, files: parsedFiles });
      });
    }));
  } catch (err) {
    console.error("Formidable error:", err);
    return res.status(500).json({ message: "Error parsing form" });
  }

  console.log("Upload API - Category field:", fields.category);
  const category = Array.isArray(fields.category)
    ? fields.category[0]
    : fields.category || "items";
  const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

  if (!uploadedFile || !uploadedFile.filepath) {
    console.error("Uploaded file is missing or has no path:", uploadedFile);
    return res.status(400).json({
      message: "No file uploaded or invalid file structure",
      debug: { filesKeys: Object.keys(files) },
    });
  }

  const token = req.cookies?.token ?? "";

  try {
    const stream = fs.createReadStream(uploadedFile.filepath);

    const formData = new FormData();
    formData.append(
      "file",
      stream,
      uploadedFile.originalFilename || "upload.file",
    );
    formData.append("category", category);

    const response = await axios.post(
      `${CONFIG.API_URL}/v1/file/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: token ? `Bearer ${token}` : "",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    return res.status(201).json({
      message: "Upload success",
      payload: response.data,
    });
  } catch (uploadError: any) {
    console.error("Upload error:", uploadError);

    const status = uploadError?.response?.status ?? 500;
    const message =
      uploadError?.response?.data?.message ||
      uploadError?.message ||
      "Upload error";

    return res.status(status).json({ message });
  }
}
