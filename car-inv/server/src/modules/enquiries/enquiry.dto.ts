import type { VehicleEnquiry, VehicleEnquiryStatus } from '@prisma/client';

interface EnquiryVehicleRecord {
  id: string;
  slug: string;
  make: { name: string };
  model: string;
  trim: string;
  year: number;
  photos: Array<{ url: string; alt: string }>;
}

export interface VehicleEnquiryRecord extends VehicleEnquiry {
  vehicle: EnquiryVehicleRecord | null;
  remarkHistory: Array<{
    id: string;
    text: string;
    createdAt: Date;
  }>;
}

export interface VehicleEnquiryDto {
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

export interface VehicleEnquirySummaryDto {
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

export const toVehicleEnquiryDto = (record: VehicleEnquiryRecord): VehicleEnquiryDto => {
  const vehicleImageUrl = record.vehicleImageUrl ?? record.vehicle?.photos[0]?.url;
  const vehicleImageAlt = record.vehicleImageAlt ?? record.vehicle?.photos[0]?.alt;

  return {
    id: record.id,
    customer: {
      name: record.name,
      ...(record.phone ? { phone: record.phone } : {}),
      ...(record.email ? { email: record.email } : {}),
      fullAddress: record.fullAddress,
    },
    vehicle: {
      ...(record.vehicleId ? { id: record.vehicleId } : {}),
      ...(record.vehicleSlug ? { slug: record.vehicleSlug } : {}),
      label: record.vehicleLabel,
      ...(vehicleImageUrl ? { imageUrl: vehicleImageUrl } : {}),
      ...(vehicleImageAlt ? { imageAlt: vehicleImageAlt } : {}),
    },
    status: record.status,
    ...(record.remarks ? { remarks: record.remarks } : {}),
    remarksHistory: record.remarkHistory.map((remark) => ({
      id: remark.id,
      text: remark.text,
      createdAt: remark.createdAt.toISOString(),
    })),
    ...(record.purchasePrice !== null ? { purchasePrice: Number(record.purchasePrice) } : {}),
    ...(record.purchaseDate ? { purchaseDate: record.purchaseDate.toISOString() } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
};
