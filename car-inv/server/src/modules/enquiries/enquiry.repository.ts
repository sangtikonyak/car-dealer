import type { Prisma, PrismaClient } from '@prisma/client';

const enquiryInclude = {
  vehicle: {
    select: {
      id: true,
      slug: true,
      make: { select: { name: true } },
      model: true,
      trim: true,
      year: true,
      photos: {
        select: { url: true, alt: true },
        orderBy: { displayOrder: 'asc' as const },
        take: 1,
      },
    },
  },
  remarkHistory: {
    select: {
      id: true,
      text: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.VehicleEnquiryInclude;

export class EnquiryRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public findVehicleBySlug(slug: string) {
    return this.prisma.vehicle.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        make: { select: { name: true } },
        model: true,
        trim: true,
        year: true,
        isPublished: true,
        photos: {
          select: { url: true, alt: true },
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });
  }

  public create(data: Prisma.VehicleEnquiryCreateInput) {
    return this.prisma.vehicleEnquiry.create({ data, include: enquiryInclude });
  }

  public list(where: Prisma.VehicleEnquiryWhereInput, skip: number, take: number) {
    return Promise.all([
      this.prisma.vehicleEnquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: enquiryInclude,
      }),
      this.prisma.vehicleEnquiry.count({ where }),
    ]);
  }

  public summary(where: Prisma.VehicleEnquiryWhereInput) {
    return Promise.all([
      this.prisma.vehicleEnquiry.count({ where }),
      this.prisma.vehicleEnquiry.aggregate({
        where: { ...where, status: 'PURCHASED' },
        _sum: { purchasePrice: true },
      }),
      this.prisma.vehicleEnquiry.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.vehicleEnquiry.findMany({
        where,
        select: { status: true, purchasePrice: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
  }

  public findById(id: string) {
    return this.prisma.vehicleEnquiry.findUnique({ where: { id }, include: enquiryInclude });
  }

  public updateWithRemark(id: string, data: Prisma.VehicleEnquiryUpdateInput, remarkText?: string) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.vehicleEnquiry.update({ where: { id }, data });

      if (remarkText) {
        await transaction.vehicleEnquiryRemark.create({
          data: {
            enquiryId: id,
            text: remarkText,
          },
        });
      }

      return transaction.vehicleEnquiry.findUniqueOrThrow({
        where: { id },
        include: enquiryInclude,
      });
    });
  }

  public delete(id: string) {
    return this.prisma.vehicleEnquiry.delete({ where: { id } });
  }
}
