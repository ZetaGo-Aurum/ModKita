const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ubn1ot3x";
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || "993553917685161";
const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || "OJ3JB52L8jpnNqVYNhqoURYZQaQ";

/**
 * Helper to generate Cloudinary signature using browser Web Crypto API (SHA-1)
 */
const generateSignature = async (params, secret) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const stringToSign = sortedParams + secret;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Uploads a file to Cloudinary using signed upload
 * @param {File} file File object to upload
 * @param {string} folder Target folder name in Cloudinary (e.g. 'covers', 'videos', 'archives')
 * @param {string} resourceType 'image', 'video', or 'raw'
 * @returns {Promise<string>} Download URL of the uploaded asset
 */
export const uploadFileToCloudinary = async (file, folder = 'modkita', resourceType = 'auto') => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  // Parameters to sign
  const params = {
    folder: folder,
    timestamp: timestamp
  };

  const signature = await generateSignature(params, apiSecret);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('timestamp', timestamp);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
  }

  const result = await response.json();
  return result.secure_url; // Return the HTTPS URL
};
