import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';


dotenv.config(); // Load environment variables

console.log('Cloudinary config:', process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('Cloudinary runtime config:', cloudinary.config());

// Test upload
cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', { folder: 'test' })
  .then(result => console.log('Test upload success:', result))
  .catch(error => console.error('Test upload error:', error));

// Set up multer storage and file size limit
const storage = multer.memoryStorage(); 
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // Limit file size to 5MB

// Cloudinary configuration

// Function to upload image to Cloudinary
const uploadImageToCloudinary = async (imageBuffer, folderPath = 'ecommerce') => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: 'image',
          folder: folderPath,
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        }, 
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
