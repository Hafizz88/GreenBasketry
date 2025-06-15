import axios from 'axios';

const fetchVegetableImages = async () => {
  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        Authorization: process.env.REACT_APP_PEXELS_API_KEY, // Use API key from .env file
      },
      params: {
        query: 'vegetables',
        per_page: 15,
      },
    });
    return response.data.photos;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
};

export { fetchVegetableImages };