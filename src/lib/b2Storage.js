import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// WARNING: Hardcoding or exposing these credentials in the frontend Vite application 
// is considered highly insecure for a production environment. 
// Anyone inspecting the network can extract the VITE_B2_APPLICATION_KEY and gain full access to your bucket.
// It is recommended to use Firebase Cloud Functions or an API route to handle B2 operations securely.

const b2Client = new S3Client({
  endpoint: import.meta.env.VITE_B2_ENDPOINT || "https://s3.us-east-005.backblazeb2.com", // Replace region
  region: import.meta.env.VITE_B2_REGION || "us-east-005",
  credentials: {
    accessKeyId: import.meta.env.VITE_B2_KEY_ID || "005e9c1ca2d7dda0000000001",
    secretAccessKey: import.meta.env.VITE_B2_APPLICATION_KEY || "YOUR_SECRET_APPLICATION_KEY",
  },
});

export const BUCKET_NAME = "Main-Cluster";

/**
 * Generates a presigned URL for uploading directly to Backblaze B2.
 */
export const getB2UploadUrl = async (fileName, fileType) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `ztg/${fileName}`,
    ContentType: fileType,
  });
  return await getSignedUrl(b2Client, command, { expiresIn: 3600 });
};

/**
 * Uploads a file directly to Backblaze B2 using the generated Presigned URL.
 */
export const uploadFileToB2 = async (file, fileName) => {
  const uploadUrl = await getB2UploadUrl(fileName, file.type);
  
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to upload file to Backblaze B2");
  }

  // Generate public download URL if the bucket is public,
  // Or keep it private and fetch via Presigned GET URLs.
  // Assuming a standard B2 URL format for returning:
  return `${import.meta.env.VITE_B2_ENDPOINT}/file/${BUCKET_NAME}/ztg/${fileName}`;
};

/**
 * Deletes a file from Backblaze B2.
 */
export const deleteFileFromB2 = async (fileName) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `ztg/${fileName}`,
  });
  return await b2Client.send(command);
};
