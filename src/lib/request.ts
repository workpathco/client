import axios from 'axios';
export default (baseURL: string) => axios.create({ baseURL });
