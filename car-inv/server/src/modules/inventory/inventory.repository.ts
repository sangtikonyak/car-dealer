import type { Prisma, PrismaClient } from '@prisma/client';

const vehicleInclude = {
  make: { select: { name: true } },
  fuelType: { select: { name: true } },
  photos: { orderBy: { displayOrder: 'asc' as const } },
  documents: { orderBy: { displayOrder: 'asc' as const } },
  highlights: { orderBy: { displayOrder: 'asc' as const } },
  customFields: { orderBy: { displayOrder: 'asc' as const } },
};

export class InventoryRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public list(
    where: Prisma.VehicleWhereInput,
    orderBy: Prisma.VehicleOrderByWithRelationInput | Prisma.VehicleOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) {
    return Promise.all([
      this.prisma.vehicle.findMany({ where, orderBy, skip, take, include: vehicleInclude }),
      this.prisma.vehicle.count({ where }),
    ]);
  }

  public findBySlug(slug: string) {
    return this.prisma.vehicle.findUnique({ where: { slug }, include: vehicleInclude });
  }

  public findById(id: string) {
    return this.prisma.vehicle.findUnique({ where: { id }, include: vehicleInclude });
  }

  public create(data: Prisma.VehicleCreateInput) {
    return this.prisma.vehicle.create({ data, include: vehicleInclude });
  }

  public async update(
    id: string,
    data: Prisma.VehicleUpdateInput,
    children: {
      documents: Array<{ name: string; status: string; url?: string }>;
      highlights: Array<{ text: string; order: number }>;
      customFields: Array<{ label: string; value: string; order: number }>;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.vehicle.update({ where: { id }, data });
      await tx.vehicleDocument.deleteMany({ where: { vehicleId: id } });
      await tx.vehicleHighlight.deleteMany({ where: { vehicleId: id } });
      await tx.vehicleCustomField.deleteMany({ where: { vehicleId: id } });
      if (children.documents.length) {
        await tx.vehicleDocument.createMany({
          data: children.documents.map((item, order) => ({
            vehicleId: id,
            name: item.name,
            status: item.status,
            url: item.url || null,
            displayOrder: order,
          })),
        });
      }
      if (children.highlights.length) {
        await tx.vehicleHighlight.createMany({
          data: children.highlights.map((item, order) => ({
            vehicleId: id,
            text: item.text,
            displayOrder: order,
          })),
        });
      }
      if (children.customFields.length) {
        await tx.vehicleCustomField.createMany({
          data: children.customFields.map((item, order) => ({
            vehicleId: id,
            label: item.label,
            value: item.value,
            displayOrder: order,
          })),
        });
      }
      return tx.vehicle.findUniqueOrThrow({ where: { id }, include: vehicleInclude });
    });
  }

  public delete(id: string) {
    return this.prisma.vehicle.delete({ where: { id }, include: { photos: true } });
  }

  public countByMake(id: string) {
    return this.prisma.vehicle.count({ where: { makeId: id } });
  }
  public countByFuelType(id: string) {
    return this.prisma.vehicle.count({ where: { fuelTypeId: id } });
  }
  public listMakes() {
    return this.prisma.vehicleMake.findMany({ orderBy: { name: 'asc' } });
  }
  public listFuelTypes() {
    return this.prisma.vehicleFuelType.findMany({ orderBy: { name: 'asc' } });
  }
  public findMake(id: string) {
    return this.prisma.vehicleMake.findUnique({ where: { id } });
  }
  public findFuelType(id: string) {
    return this.prisma.vehicleFuelType.findUnique({ where: { id } });
  }
  public createMake(data: Prisma.VehicleMakeCreateInput) {
    return this.prisma.vehicleMake.create({ data });
  }
  public createFuelType(data: Prisma.VehicleFuelTypeCreateInput) {
    return this.prisma.vehicleFuelType.create({ data });
  }
  public updateMake(id: string, data: Prisma.VehicleMakeUpdateInput) {
    return this.prisma.vehicleMake.update({ where: { id }, data });
  }
  public updateFuelType(id: string, data: Prisma.VehicleFuelTypeUpdateInput) {
    return this.prisma.vehicleFuelType.update({ where: { id }, data });
  }
  public deleteMake(id: string) {
    return this.prisma.vehicleMake.delete({ where: { id } });
  }
  public deleteFuelType(id: string) {
    return this.prisma.vehicleFuelType.delete({ where: { id } });
  }
  public createPhoto(data: Prisma.VehiclePhotoCreateInput) {
    return this.prisma.vehiclePhoto.create({ data });
  }
  public findPhoto(vehicleId: string, photoId: string) {
    return this.prisma.vehiclePhoto.findFirst({ where: { id: photoId, vehicleId } });
  }
  public updatePhoto(id: string, data: Prisma.VehiclePhotoUpdateInput) {
    return this.prisma.vehiclePhoto.update({ where: { id }, data });
  }
  public deletePhoto(id: string) {
    return this.prisma.vehiclePhoto.delete({ where: { id } });
  }
  public listPhotos(vehicleId: string) {
    return this.prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
