import type { Vehicle } from '@prisma/client';

export interface InventoryVehicleDto {
  id: string;
  slug: string;
  makeId?: string;
  fuelTypeId?: string;
  make: string;
  model: string;
  trim: string;
  category: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  priceNegotiable: boolean;
  photos: Array<{ id: string; src: string; label: string; alt: string }>;
  documents: Array<{ id: string; name: string; status: string; url?: string }>;
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
  highlights: string[];
  customFields: Array<{ id: string; label: string; value: string; order: number }>;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryVehicleRecord extends Vehicle {
  make: { name: string };
  fuelType: { name: string };
  photos: Array<{
    id: string; storageName: string; url: string; originalName: string; alt: string;
    width: number; height: number; bytes: number; displayOrder: number;
  }>;
  documents: Array<{ id: string; name: string; status: string; url: string | null; displayOrder: number }>;
  highlights: Array<{ id: string; text: string; displayOrder: number }>;
  customFields: Array<{ id: string; label: string; value: string; displayOrder: number }>;
}

export const toVehicleDto = (record: InventoryVehicleRecord): InventoryVehicleDto => ({
  id: record.id,
  slug: record.slug,
  makeId: record.makeId,
  fuelTypeId: record.fuelTypeId,
  make: record.make.name,
  model: record.model,
  trim: record.trim,
  category: record.category,
  year: record.year,
  price: Number(record.price),
  mileage: record.mileage,
  fuel: record.fuelType.name,
  priceNegotiable: record.priceNegotiable,
  photos: record.photos.map((photo) => ({
    id: photo.id,
    src: photo.url,
    label: photo.originalName,
    alt: photo.alt,
  })),
  documents: record.documents.map((document) => ({
    id: document.id,
    name: document.name,
    status: document.status,
    ...(document.url ? { url: document.url } : {}),
  })),
  exterior: record.exterior,
  interior: record.interior,
  vin: record.vin,
  engine: record.engine,
  power: record.power,
  torque: record.torque,
  transmission: record.transmission,
  drivetrain: record.drivetrain,
  ...(record.range ? { range: record.range } : {}),
  description: record.description,
  highlights: record.highlights.map((highlight) => highlight.text),
  customFields: record.customFields.map((field) => ({
    id: field.id,
    label: field.label,
    value: field.value,
    order: field.displayOrder,
  })),
  isPublished: record.isPublished,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
