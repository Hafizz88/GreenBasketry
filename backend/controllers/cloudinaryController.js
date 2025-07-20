import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';


dotenv.config(); // Load environment variables

// Set up multer storage and file size limit
const storage = multer.memoryStorage(); 
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // Limit file size to 5MB

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload image to Cloudinary
const uploadImageToCloudinary = async (imageBuffer) => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image' }, 
        (error, result) => {
          if (error) {
            reject(error); 
          } else {
            resolve(result.secure_url); // Return Cloudinary URL
          }
        }
      ).end(imageBuffer); // End the upload stream with the image buffer
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Cloudinary upload failed");
  }
};

export { upload, uploadImageToCloudinary };
