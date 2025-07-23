# Image Upload Setup Guide

## Prerequisites

1. **Cloudinary Account**: Sign up at [cloudinary.com](https://cloudinary.com) and get your credentials
2. **Environment Variables**: Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=5000
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure you have the required dependencies:
- `multer` - for file upload handling
- `cloudinary` - for cloud image storage
- `dotenv` - for environment variables

## Features

### Image Upload Functionality
- **File Types**: Supports JPG, PNG, GIF, WebP
- **File Size**: Maximum 5MB per image
- **Organization**: Images are automatically organized by category folders in Cloudinary
- **Optimization**: Images are automatically resized and optimized for web use

### Category-based Organization
Images are stored in Cloudinary with the following folder structure:
```
ecommerce/
├── electronics/
├── clothing/
├── books/
└── [other_categories]/
```

### Image Processing
- Automatic resizing to 800x800 pixels (maintaining aspect ratio)
- Quality optimization for web delivery
- Secure HTTPS URLs for all uploaded images

## Usage

1. **Admin Panel**: Navigate to the admin dashboard and use the "Add New Product" form
2. **Image Selection**: Click "Choose File" to select an image from your device
3. **Preview**: See a preview of the selected image before uploading
4. **Category**: Enter the product category - this will determine the folder structure in Cloudinary
5. **Upload**: Submit the form to upload the image and create the product

## Error Handling

The system includes comprehensive error handling for:
- Invalid file types
- File size limits
- Upload failures
- Network errors
- Database errors

## Security Features

- File type validation
- File size limits
- Secure file handling with multer
- Environment variable protection
- JWT authentication for admin access 