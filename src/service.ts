import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
});

export const getProduct = async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
}

export const validateProduct = async (id: number, sales_price:number) => {
    const response = await api.post(`/products/validate`, {id, sales_price});
    return response.data;
}

export const isPackage = async (id: number) => {
    const response = await api.get(`/packs/${id}`);
    return response.data;
}

export const getPackageByProduct = async (id: number) => {
    const response = await api.get(`/packs/product/${id}`);
    return response.data;
}

export const attProduct = async (id: number, sales_price:number) => {
    const response = await api.patch(`/products/${id}`, {sales_price});
    return response.data;
}