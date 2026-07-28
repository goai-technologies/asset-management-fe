import axios, { type AxiosError, type AxiosInstance } from "axios";
import { toast } from "sonner";
import { getApiBaseUrl, getStoredToken, setStoredToken } from "./client";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: string[];
}

const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let handlingAuthError = false;

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ??
      (error.code === "ERR_NETWORK"
        ? "Cannot reach the API server. Ensure the backend is running on port 5001."
        : error.message) ??
      "Request failed";

    if (status === 401) {
      if (!handlingAuthError) {
        handlingAuthError = true;
        setStoredToken(null);
        toast.error("Session expired. Please sign in again.");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("eams:auth-changed"));
        }
        window.setTimeout(() => {
          handlingAuthError = false;
        }, 1000);
      }
    } else if (status === 403) {
      toast.error(message || "You do not have permission to perform this action.");
    } else if (status === 500) {
      toast.error(message || "A server error occurred. Please try again.");
    }

    return Promise.reject(new Error(message));
  },
);

export async function apiGet<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const res = await api.get<ApiSuccess<T>>(url, { params });
  return res.data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<ApiSuccess<T>>(url, body);
  return res.data.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put<ApiSuccess<T>>(url, body);
  return res.data.data;
}

export async function apiDelete<T = null>(url: string): Promise<T> {
  const res = await api.delete<ApiSuccess<T>>(url);
  return res.data.data;
}

export async function apiSendFormData<T>(
  url: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST",
): Promise<T> {
  const config = { headers: { "Content-Type": "multipart/form-data" } };
  const res =
    method === "PUT"
      ? await api.put<ApiSuccess<T>>(url, formData, config)
      : await api.post<ApiSuccess<T>>(url, formData, config);
  return res.data.data;
}

export async function apiDownload(
  url: string,
  filename: string,
  params?: Record<string, string | number | undefined>,
): Promise<void> {
  const res = await api.get(url, { params, responseType: "blob" });
  const blob = new Blob([res.data]);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function resolveUploadUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const origin = getApiBaseUrl().replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export { api };
