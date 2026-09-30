import type { HomepageContent } from '../homepage/types';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
  originalName: string;
}

export type VehicleEnquiryStatus =
  'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'PURCHASED' | 'LOST' | 'CLOSED';

export interface AdminVehicleEnquiry {
  id: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    fullAddress: string;
  };
  vehicle: {
    id?: string;
    slug?: string;
    label: string;
    imageUrl?: string;
    imageAlt?: string;
  };
  status: VehicleEnquiryStatus;
  remarks?: string;
  remarksHistory: Array<{
    id: string;
    text: string;
    createdAt: string;
  }>;
  purchasePrice?: number;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVehicleEnquiryList {
  items: AdminVehicleEnquiry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminEnquirySummary {
  totalVehicleEnquiries: number;
  purchasedEnquiries: number;
  totalPurchasePrice: number;
  statusCounts: Record<VehicleEnquiryStatus, number>;
  timeline: Array<{
    date: string;
    label: string;
    enquiryCount: number;
    purchaseValue: number;
  }>;
}

export type AdminHomepagePayload = HomepageContent;
