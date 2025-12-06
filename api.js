import axios from 'axios';

const api = axios.create({
  baseURL: 'https://argilink-default-rtdb.firebaseio.com/',
});

export default api;