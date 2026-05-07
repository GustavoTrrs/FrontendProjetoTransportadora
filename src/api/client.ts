import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Frete {
  id: number;
  destino?: string;
  cep?: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  peso: number;
  transportadora: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface FreteCreate {
  destino?: string;
  cep?: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  peso: number;
  transportadora: string;
  descricao?: string;
}

export const freteApi = {
  list: async () => {
    const response = await api.get<Frete[]>('/fretes/');
    return response.data;
  },
  create: async (data: FreteCreate) => {
    const response = await api.post<Frete>('/fretes/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<FreteCreate>) => {
    const response = await api.put<Frete>(`/fretes/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/fretes/${id}`);
  },
};

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  signup: async (userData: any) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
};

export default api;
