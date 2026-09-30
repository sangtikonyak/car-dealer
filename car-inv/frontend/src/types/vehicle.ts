export type FuelType = string;

export interface VehiclePhoto {
  readonly id: string;
  readonly src: string;
  readonly label: string;
  readonly alt: string;
  readonly source?: string;
  readonly credit?: string;
  readonly license?: string;
}

export type DocumentStatus = 'On file' | 'Partial' | 'On request' | 'Not provided' | 'Online';

export interface VehicleDocument {
  readonly name: string;
  readonly status: DocumentStatus;
  readonly url?: string;
}

export interface Vehicle {
  readonly slug: string;
  readonly make: string;
  readonly model: string;
  readonly trim: string;
  readonly category: string;
  readonly year: number;
  readonly price: number;
  readonly mileage: number;
  readonly fuel: FuelType;
  readonly priceNegotiable: boolean;
  readonly photos: readonly VehiclePhoto[];
  readonly documents: readonly VehicleDocument[];
  readonly exterior: string;
  readonly interior: string;
  readonly vin: string;
  readonly engine: string;
  readonly power: string;
  readonly torque: string;
  readonly transmission: string;
  readonly drivetrain: string;
  readonly range?: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly id?: string;
  readonly makeId?: string;
  readonly fuelTypeId?: string;
  readonly customFields?: readonly VehicleCustomField[];
  readonly isPublished?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface VehicleCustomField {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly order: number;
}
