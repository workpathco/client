import axios from 'axios';
export default axios.create({
  baseURL:
    process.env.AUTH_URL || process.env.API_URL || 'https://auth.workpath.co'
});
