import { hc } from "hono/client";
import type { AppType } from "../../api";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;
console.log("API_URL =", import.meta.env.VITE_API_URL);
export const api = hc<AppType>(API_URL, {
  fetch: async (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => {
    const token = getToken();

    return fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
}).api;