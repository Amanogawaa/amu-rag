/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type ResponseType } from 'axios';

const api = axios.create({
	baseURL: 'http://127.0.0.1:8000/'
});

const getHeaders = (token?: string, isFormData?: boolean) => {
	const headers: Record<string, string> = {};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	if (!isFormData) {
		headers['Content-Type'] = 'application/json';
	}

	return headers;
};

export default async function dataFetch(
	endpoint: string,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	data?: any,
	// token?: string,
	responseType?: ResponseType
) {
	try {
		const isFormData = data instanceof FormData;
		const response = await api.request({
			url: endpoint,
			method,
			data: data ? data : JSON.stringify(data),
			// headers: getHeaders(token, isFormData),
			responseType: responseType || 'json'
		});

		return response.data;
	} catch (error) {
		console.error('API request error:', error);
		throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
	}
}
