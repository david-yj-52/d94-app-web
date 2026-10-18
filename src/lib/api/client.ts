"use client";

import axios from "axios";
import {signOut} from "next-auth/react";

const apiClient = axios.create({
    baseURL: "/api/proxy",
    headers: {"Content-Type": "application/json"},
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await signOut({callbackUrl: "/login"});
        }
        return Promise.reject(error);
    },
);

export default apiClient;
