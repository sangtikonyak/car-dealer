import { apiClient } from '../../lib/apiClient';
import { frontendEnvironment } from '../../config/env';
import type { Vehicle } from '../../types/vehicle';

interface ApiSuccess<T> {
  data: T;
}

export interface InventoryOption {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}
export interface InventoryOptions {
  makes: InventoryOption[];
  fuelTypes: InventoryOption[];
}

export interface VehicleEnquiryPayload {
  vehicleSlug: string;
  name: string;
  phone: string;
  email: string;
  fullAddress: string;
}

export interface VehicleEnquiryReceipt {
  id: string;
}
export interface InventoryList {
  items: Vehicle[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export type InventorySort =
  'featured' | 'latest' | 'price-low' | 'price-high' | 'newest' | 'mileage';
export type AdminInventoryStatus = 'all' | 'published' | 'draft';

export interface InventoryQueryParams {
  search?: string;
  make?: string;
  fuelType?: string;
  sort?: InventorySort;
  page?: number;
  pageSize?: number;
  includeUnpublished?: boolean;
}

export interface AdminInventoryQueryParams {
  search?: string;
  status?: AdminInventoryStatus;
  fuelType?: string;
  year?: number;
  page?: number;
  pageSize?: number;
  includeUnpublished?: boolean;
}

const mediaOrigin = (): string => {
  const apiUrl = new URL(frontendEnvironment.VITE_API_BASE_URL);
  return `${apiUrl.protocol}//${apiUrl.host}`;
};

export const resolveInventoryMediaUrl = (url: string): string =>
  url.startsWith('/uploads/') ? `${mediaOrigin()}${url}` : url;

const normalizeVehicleMedia = (vehicle: Vehicle): Vehicle => ({
  ...vehicle,
  photos: vehicle.photos.map((photo) => ({ ...photo, src: resolveInventoryMediaUrl(photo.src) })),
  documents: vehicle.documents.map((document) => ({
    ...document,
    ...(document.url ? { url: resolveInventoryMediaUrl(document.url) } : {}),
  })),
});

export interface VehiclePayload {
  slug: string;
  makeId: string;
  fuelTypeId: string;
  model: string;
  trim: string;
  category: string;
  year: number;
  price: number;
  mileage: number;
  priceNegotiable: boolean;
  exterior: string;
  interior: string;
  vin: string;
  engine: string;
  power: string;
  torque: string;
  transmission: string;
  drivetrain: string;
  range?: string;
  description: string;
  isPublished: boolean;
  documents: Array<{ name: string; status: string; url?: string; order: number }>;
  highlights: Array<{ text: string; order: number }>;
  customFields: Array<{ label: string; value: string; order: number }>;
}

export const fetchInventory = async (params: InventoryQueryParams = {}): Promise<InventoryList> => {
  const response = await apiClient.get<ApiSuccess<InventoryList>>('/inventory', { params });
  return { ...response.data.data, items: response.data.data.items.map(normalizeVehicleMedia) };
};
export const fetchVehicle = async (slug: string): Promise<Vehicle> => {
  const response = await apiClient.get<ApiSuccess<Vehicle>>(`/inventory/${slug}`);
  return normalizeVehicleMedia(response.data.data);
};
export const submitVehicleEnquiry = async (
  payload: VehicleEnquiryPayload,
): Promise<VehicleEnquiryReceipt> => {
  const response = await apiClient.post<ApiSuccess<VehicleEnquiryReceipt>>('/enquiries', payload);
  return response.data.data;
};
export const fetchInventoryOptions = async (): Promise<InventoryOptions> => {
  const response = await apiClient.get<ApiSuccess<InventoryOptions>>('/inventory/options');
  return response.data.data;
};
export const fetchAdminVehicles = async (
  params: AdminInventoryQueryParams = {},
): Promise<InventoryList> => {
  const response = await apiClient.get<ApiSuccess<InventoryList>>('/admin/inventory/vehicles', {
    params,
  });
  return { ...response.data.data, items: response.data.data.items.map(normalizeVehicleMedia) };
};
export const fetchAdminVehicle = async (id: string): Promise<Vehicle> => {
  const response = await apiClient.get<ApiSuccess<Vehicle>>(`/admin/inventory/vehicles/${id}`);
  return normalizeVehicleMedia(response.data.data);
};
export const createAdminVehicle = async (payload: VehiclePayload): Promise<Vehicle> => {
  const response = await apiClient.post<ApiSuccess<Vehicle>>('/admin/inventory/vehicles', payload);
  return response.data.data;
};
export const updateAdminVehicle = async (id: string, payload: VehiclePayload): Promise<Vehicle> => {
  const response = await apiClient.put<ApiSuccess<Vehicle>>(
    `/admin/inventory/vehicles/${id}`,
    payload,
  );
  return response.data.data;
};
export const deleteAdminVehicle = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/inventory/vehicles/${id}`);
};
export const fetchAdminMakes = async (): Promise<InventoryOption[]> =>
  (await apiClient.get<ApiSuccess<InventoryOption[]>>('/admin/inventory/makes')).data.data;
export const fetchAdminFuelTypes = async (): Promise<InventoryOption[]> =>
  (await apiClient.get<ApiSuccess<InventoryOption[]>>('/admin/inventory/fuel-types')).data.data;
export const createAdminMake = async (name: string): Promise<InventoryOption> =>
  (
    await apiClient.post<ApiSuccess<InventoryOption>>('/admin/inventory/makes', {
      name,
      isActive: true,
    })
  ).data.data;
export const createAdminFuelType = async (name: string): Promise<InventoryOption> =>
  (
    await apiClient.post<ApiSuccess<InventoryOption>>('/admin/inventory/fuel-types', {
      name,
      isActive: true,
    })
  ).data.data;
export const updateAdminMake = async (
  id: string,
  name: string,
  isActive = true,
): Promise<InventoryOption> =>
  (
    await apiClient.put<ApiSuccess<InventoryOption>>(`/admin/inventory/makes/${id}`, {
      name,
      isActive,
    })
  ).data.data;
export const updateAdminFuelType = async (
  id: string,
  name: string,
  isActive = true,
): Promise<InventoryOption> =>
  (
    await apiClient.put<ApiSuccess<InventoryOption>>(`/admin/inventory/fuel-types/${id}`, {
      name,
      isActive,
    })
  ).data.data;
export const deleteAdminMake = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/inventory/makes/${id}`);
};
export const deleteAdminFuelType = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/inventory/fuel-types/${id}`);
};
export const uploadVehiclePhotos = async (id: string, files: File[]): Promise<unknown[]> => {
  const body = new FormData();
  files.forEach((file) => body.append('images', file));
  // The shared client defaults to JSON. Clearing the inherited content type lets
  // Axios/browser add the multipart boundary so Multer can read the image parts.
  return (
    await apiClient.post<ApiSuccess<unknown[]>>(`/admin/inventory/vehicles/${id}/photos`, body, {
      headers: { 'Content-Type': undefined },
    })
  ).data.data;
};
export const reorderVehiclePhotos = async (id: string, photoIds: string[]): Promise<void> => {
  await apiClient.put(`/admin/inventory/vehicles/${id}/photos/order`, { photoIds });
};
export const deleteVehiclePhoto = async (id: string, photoId: string): Promise<void> => {
  await apiClient.delete(`/admin/inventory/vehicles/${id}/photos/${photoId}`);
};
