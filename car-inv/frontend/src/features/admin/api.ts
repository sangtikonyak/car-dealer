import { apiClient } from '../../lib/apiClient';
import type { HomepageContent } from '../homepage/types';
import type {
  AdminHomepagePayload,
  AdminEnquirySummary,
  AdminUser,
  AdminVehicleEnquiry,
  AdminVehicleEnquiryList,
  MediaAsset,
  VehicleEnquiryStatus,
} from './types';

interface ApiSuccess<T> {
  data: T;
}

export const fetchAdminSession = async (): Promise<AdminUser | null> => {
  try {
    const response = await apiClient.get<ApiSuccess<{ user: AdminUser }>>('/admin/auth/me');
    return response.data.data.user;
  } catch {
    return null;
  }
};

export const loginAdmin = async (email: string, password: string): Promise<AdminUser> => {
  const response = await apiClient.post<ApiSuccess<{ user: AdminUser }>>('/admin/auth/login', {
    email,
    password,
  });
  return response.data.data.user;
};

export const logoutAdmin = async (): Promise<void> => {
  await apiClient.post('/admin/auth/logout');
};

export const fetchAdminHomepage = async (): Promise<AdminHomepagePayload> => {
  const response = await apiClient.get<ApiSuccess<AdminHomepagePayload>>('/admin/homepage');
  return response.data.data;
};

export const updateAdminHomepage = async (
  content: AdminHomepagePayload,
): Promise<AdminHomepagePayload> => {
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>(
    '/admin/homepage',
    content,
  );
  return response.data.data;
};

export const updateAdminHomepageIdentity = async (
  content: Pick<AdminHomepagePayload, 'site' | 'hero'>,
): Promise<AdminHomepagePayload> => {
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>(
    '/admin/homepage/identity',
    content,
  );
  return response.data.data;
};

export const updateAdminHomepageSiteIdentity = async (
  content: Pick<AdminHomepagePayload, 'site'>,
): Promise<AdminHomepagePayload> => {
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>(
    '/admin/homepage/site-identity',
    content,
  );
  return response.data.data;
};

export const updateAdminHomepageBenefits = async (
  content:
    | AdminHomepagePayload['benefits']
    | (Pick<AdminHomepagePayload, 'benefits'> &
        Partial<Pick<AdminHomepagePayload, 'benefitsIntro'>>),
): Promise<AdminHomepagePayload> => {
  const payload = Array.isArray(content) ? { benefits: content } : content;
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>(
    '/admin/homepage/benefits',
    payload,
  );
  return response.data.data;
};

export const updateAdminHomepageFaqs = async (
  content:
    | AdminHomepagePayload['faqs']
    | (Pick<AdminHomepagePayload, 'faqs'> & Partial<Pick<AdminHomepagePayload, 'faq'>>),
): Promise<AdminHomepagePayload> => {
  const payload = Array.isArray(content) ? { faqs: content } : content;
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>('/admin/homepage/faqs', {
    ...payload,
  });
  return response.data.data;
};

export const updateAdminHomepageHowItWorks = async (
  content: Pick<AdminHomepagePayload, 'howItWorks' | 'steps'>,
): Promise<AdminHomepagePayload> => {
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>(
    '/admin/homepage/how-it-works',
    content,
  );
  return response.data.data;
};

export const updateAdminHomepageShowroom = async (
  showroom: AdminHomepagePayload['showroom'],
): Promise<AdminHomepagePayload> => {
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>(
    '/admin/homepage/showroom',
    { showroom },
  );
  return response.data.data;
};

export const updateAdminHomepageAbout = async (
  about: AdminHomepagePayload['about'],
): Promise<AdminHomepagePayload> => {
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>('/admin/homepage/about', {
    about,
  });
  return response.data.data;
};

export const updateAdminHomepageBookingCta = async (
  bookingCta: AdminHomepagePayload['bookingCta'],
): Promise<AdminHomepagePayload> => {
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>(
    '/admin/homepage/booking-cta',
    { bookingCta },
  );
  return response.data.data;
};

export const updateAdminHomepageFooter = async (
  footer: AdminHomepagePayload['footer'],
): Promise<AdminHomepagePayload> => {
  const response = await apiClient.put<ApiSuccess<AdminHomepagePayload>>('/admin/homepage/footer', {
    footer,
  });
  return response.data.data;
};

export const fetchMediaAssets = async (): Promise<MediaAsset[]> => {
  const response = await apiClient.get<ApiSuccess<MediaAsset[]>>('/admin/media');
  return response.data.data;
};

export const uploadMediaAsset = async (file: File): Promise<MediaAsset> => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await apiClient.post<ApiSuccess<MediaAsset>>('/admin/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const deleteMediaAsset = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/media/${id}`);
};

export const fetchAdminEnquiries = async (
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: VehicleEnquiryStatus;
  } = {},
): Promise<AdminVehicleEnquiryList> => {
  const response = await apiClient.get<ApiSuccess<AdminVehicleEnquiryList>>('/admin/enquiries', {
    params,
  });
  return response.data.data;
};

export const fetchAdminEnquirySummary = async (params: {
  from: string;
  to: string;
}): Promise<AdminEnquirySummary> => {
  const response = await apiClient.get<ApiSuccess<AdminEnquirySummary>>(
    '/admin/enquiries/summary',
    {
      params,
    },
  );
  return response.data.data;
};

export const updateAdminEnquiry = async (
  id: string,
  payload: {
    status: VehicleEnquiryStatus;
    remarks: string;
    purchasePrice: number | null;
    purchaseDate: string | null;
  },
): Promise<AdminVehicleEnquiry> => {
  const response = await apiClient.patch<ApiSuccess<AdminVehicleEnquiry>>(
    `/admin/enquiries/${id}`,
    payload,
  );
  return response.data.data;
};

export const deleteAdminEnquiry = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/enquiries/${id}`);
};

export const cloneHomepage = (content: HomepageContent): AdminHomepagePayload =>
  structuredClone(content);
