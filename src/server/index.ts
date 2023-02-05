import axios from 'axios';

export interface ResponseSuccessProps {
  data: {
    message: string;
  };
}

export const api = axios.create({
  baseURL: 'https://api-multialcance.online', // import.meta.env.VITE_API_URL || process.env.VITE_API_URL, //    import.meta.env.VITE_API_URL || process.env.VITE_API_URL, //, // 'http://127.0.0.1:3333', //'https://api-multialcance.online/', //
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  },
});

export const intercepttRoute = (token: string, login: string) => {
  api.interceptors.request.use(
    async (config: any) => {
      if (!config.url.endsWith('login')) {
        // const userTokenExpiration = new Date(auth.accessToken);
        // const today = new Date();
        // if (today > userTokenExpiration) {
        //   config.headers.Authorization = null
        // } else {
        //   config.headers.Authorization = `Bearer ${auth.accessToken}`;
        // }
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.login = login;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

export const dropDown = async (type: string, query?: string) => {
  const url = query ? `${type}?${query}` : type;
  const response = await api(`/dropdrown/${url}`);
  if (response.status === 200) {
    return response.data?.data || response.data;
  }
  return [];
};

export const create = async (url: string, data: any) => {
  return await api.post(url, data);
};

export const update = async (url: string, data: any) => {
  return await api.put(url, data);
};

export const deleteItem = async (url: string) => {
  return await api.delete(`${url}`);
};

export const getList = async (type: string) => {
  const response = await api(type);
  if (response.status === 200) {
    return response.data?.data || response.data;
  }
  return [];
};

export const search = async (type: string, work: string) => {
  return await api(`${type}/${work}`);
};

export const filter = async (type: string, _filter: object) => {
  return await api.post(`filtro/${type}`, _filter);
};
