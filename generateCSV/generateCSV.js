const axios = require('axios');
const fs = require('fs'); // File system module to save the CSV file

// Fetch all categories
const fetchCategories = async () => {
  try {
    const response = await axios.get('https://dummyjson.com/products/categories'); // DummyJSON API
    console.log('Categories:', response.data); // Debug categories
    return response.data; // Return category slugs directly
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Fetch products by category
const fetchProductsByCategory = async (categorySlug) => {
  try {
    const response = await axios.get(`https://dummyjson.com/products/category/${categorySlug}`); // DummyJSON API
    console.log(`Products for category ${categorySlug}:`, response.data.products); // Debug products
    return response.data.products;
  } catch (error) {
    console.error(`Error fetching products for category ${categorySlug}:`, error);
    return [];
  }
};

// Generate CSV file
const generateCSV = async () => {
  const categories = await fetchCategories();
  const allProducts = [];

  // Fetch products for each category
  for (const categorySlug of categories) {
    const products = await fetchProductsByCategory(categorySlug); // Use category slug directly
    allProducts.push(
      ...products.map((product) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        category: categorySlug,
        thumbnail: product.thumbnail || 'N/A',
      }))
    );
  }

  console.log('All Products:', allProducts); // Debug all products

  if (allProducts.length === 0) {
    console.error('No products available to export.');
    return;
  }

  // Define CSV headers
  const headers = ['ID', 'Title', 'Price', 'Category', 'Thumbnail'];

  // Map products to CSV rows
  const rows = allProducts.map((product) => [
    product.id,
    product.title,
    product.price,
    product.category,
    product.thumbnail,
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.join(',')) // Convert each row to a comma-separated string
    .join('\n'); // Combine rows with newline characters

  // Save the CSV file
  fs.writeFileSync('products.csv', csvContent);
  console.log('CSV file generated successfully: products.csv');
};

// Run the script
generateCSV();