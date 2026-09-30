import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { NotFoundAppError, ValidationAppError } from '../../errors/app-error.js';
import type { Environment } from '../../config/env.js';
import { toVehicleDto } from './inventory.dto.js';
import type { InventoryRepository } from './inventory.repository.js';
import type {
  FuelTypeInput,
  InventoryListQuery,
  MakeInput,
  PhotoOrderInput,
  VehicleCreateInput,
} from './inventory.schema.js';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');

export class InventoryService {
  public constructor(
    private readonly repository: InventoryRepository,
    private readonly environment: Environment,
  ) {}

  public async listPublic(query: InventoryListQuery) {
    const where = this.buildWhere(query, false);
    const orderBy = this.buildOrderBy(query.sort);
    const [records, total] = await this.repository.list(
      where,
      orderBy,
      (query.page - 1) * query.pageSize,
      query.pageSize,
    );
    return {
      items: records.map(toVehicleDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  public async listAdmin(query: InventoryListQuery) {
    const where = this.buildWhere(query, query.includeUnpublished);
    const [records, total] = await this.repository.list(
      where,
      this.buildOrderBy(query.sort),
      (query.page - 1) * query.pageSize,
      query.pageSize,
    );
    return {
      items: records.map(toVehicleDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  public async getPublic(slug: string) {
    const record = await this.repository.findBySlug(slug);
    if (!record || !record.isPublished) throw new NotFoundAppError('Vehicle was not found.');
    return toVehicleDto(record);
  }

  public async getAdmin(id: string) {
    const record = await this.repository.findById(id);
    if (!record) throw new NotFoundAppError('Vehicle was not found.');
    return toVehicleDto(record);
  }

  public async create(input: VehicleCreateInput) {
    await this.assertRelations(input.makeId, input.fuelTypeId);
    const record = await this.repository.create(this.toVehicleCreateData(input));
    return toVehicleDto(record);
  }

  public async update(id: string, input: VehicleCreateInput) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundAppError('Vehicle was not found.');
    await this.assertRelations(input.makeId, input.fuelTypeId);
    const record = await this.repository.update(id, this.toVehicleUpdateData(input), {
      documents: input.documents,
      highlights: input.highlights,
      customFields: input.customFields,
    });
    return toVehicleDto(record);
  }

  public async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundAppError('Vehicle was not found.');
    const deleted = await this.repository.delete(id);
    await Promise.all(
      deleted.photos.map((photo) =>
        unlink(path.join(this.environment.UPLOAD_DIR, 'inventory', photo.storageName)).catch(
          () => undefined,
        ),
      ),
    );
  }

  public options() {
    return Promise.all([this.repository.listMakes(), this.repository.listFuelTypes()]).then(
      ([makes, fuelTypes]) => ({
        makes: makes
          .filter((item) => item.isActive)
          .map(({ id, name, slug }) => ({ id, name, slug })),
        fuelTypes: fuelTypes
          .filter((item) => item.isActive)
          .map(({ id, name, slug }) => ({ id, name, slug })),
      }),
    );
  }

  public listMakes() {
    return this.repository.listMakes();
  }
  public listFuelTypes() {
    return this.repository.listFuelTypes();
  }

  public async createMake(input: MakeInput) {
    return this.repository.createMake({
      name: input.name,
      slug: slugify(input.name),
      isActive: input.isActive,
    });
  }
  public async updateMake(id: string, input: MakeInput) {
    if (!(await this.repository.findMake(id))) throw new NotFoundAppError('Make was not found.');
    return this.repository.updateMake(id, {
      name: input.name,
      slug: slugify(input.name),
      isActive: input.isActive,
    });
  }
  public async deleteMake(id: string) {
    if (!(await this.repository.findMake(id))) throw new NotFoundAppError('Make was not found.');
    if (await this.repository.countByMake(id))
      throw new ValidationAppError(
        'A make used by a vehicle cannot be deleted. Deactivate it instead.',
      );
    await this.repository.deleteMake(id);
  }
  public async createFuelType(input: FuelTypeInput) {
    return this.repository.createFuelType({
      name: input.name,
      slug: slugify(input.name),
      isActive: input.isActive,
    });
  }
  public async updateFuelType(id: string, input: FuelTypeInput) {
    if (!(await this.repository.findFuelType(id)))
      throw new NotFoundAppError('Fuel type was not found.');
    return this.repository.updateFuelType(id, {
      name: input.name,
      slug: slugify(input.name),
      isActive: input.isActive,
    });
  }
  public async deleteFuelType(id: string) {
    if (!(await this.repository.findFuelType(id)))
      throw new NotFoundAppError('Fuel type was not found.');
    if (await this.repository.countByFuelType(id))
      throw new ValidationAppError(
        'A fuel type used by a vehicle cannot be deleted. Deactivate it instead.',
      );
    await this.repository.deleteFuelType(id);
  }

  public async uploadPhotos(
    vehicleId: string,
    files: Array<{ buffer: Buffer; originalname: string }>,
  ) {
    if (!(await this.repository.findById(vehicleId)))
      throw new NotFoundAppError('Vehicle was not found.');
    if (!files.length) throw new ValidationAppError('At least one image is required.');
    const directory = path.join(this.environment.UPLOAD_DIR, 'inventory');
    await mkdir(directory, { recursive: true });
    const current = await this.repository.listPhotos(vehicleId);
    const stored: string[] = [];
    const createdPhotoIds: string[] = [];
    try {
      const result = [];
      for (const [index, file] of files.entries()) {
        const image = sharp(file.buffer, { failOn: 'error' }).rotate();
        const metadata = await image.metadata().catch(() => null);
        if (!metadata?.width || !metadata.height)
          throw new ValidationAppError('One uploaded file is not a valid image.');
        const storageName = `${randomUUID()}.webp`;
        const targetPath = path.join(directory, storageName);
        const output = await image
          .resize({ width: 2400, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90, effort: 5, smartSubsample: true })
          .toFile(targetPath);
        stored.push(storageName);
        const created = await this.repository.createPhoto({
          vehicle: { connect: { id: vehicleId } },
          storageName,
          originalName: file.originalname.slice(0, 255),
          url: `/uploads/inventory/${storageName}`,
          alt: file.originalname.slice(0, 240),
          width: output.width,
          height: output.height,
          bytes: output.size,
          displayOrder: current.length + index,
        });
        createdPhotoIds.push(created.id);
        result.push(created);
      }
      return result;
    } catch (error) {
      await Promise.all(
        createdPhotoIds.map((id) => this.repository.deletePhoto(id).catch(() => undefined)),
      );
      await Promise.all(
        stored.map((name) => unlink(path.join(directory, name)).catch(() => undefined)),
      );
      throw error;
    }
  }

  public async reorderPhotos(vehicleId: string, input: PhotoOrderInput) {
    if (!(await this.repository.findById(vehicleId)))
      throw new NotFoundAppError('Vehicle was not found.');
    const photos = await this.repository.listPhotos(vehicleId);
    if (
      photos.length !== input.photoIds.length ||
      photos.some((photo) => !input.photoIds.includes(photo.id))
    )
      throw new ValidationAppError(
        'The photo order must include every vehicle photo exactly once.',
      );
    await Promise.all(
      input.photoIds.map((id, order) => this.repository.updatePhoto(id, { displayOrder: order })),
    );
    return this.repository.listPhotos(vehicleId);
  }

  public async deletePhoto(vehicleId: string, photoId: string) {
    const photo = await this.repository.findPhoto(vehicleId, photoId);
    if (!photo) throw new NotFoundAppError('Vehicle photo was not found.');
    await this.repository.deletePhoto(photoId);
    await unlink(path.join(this.environment.UPLOAD_DIR, 'inventory', photo.storageName)).catch(
      () => undefined,
    );
  }

  private async assertRelations(makeId: string, fuelTypeId: string) {
    const [make, fuel] = await Promise.all([
      this.repository.findMake(makeId),
      this.repository.findFuelType(fuelTypeId),
    ]);
    if (!make || !make.isActive) throw new ValidationAppError('Select an active make.');
    if (!fuel || !fuel.isActive) throw new ValidationAppError('Select an active fuel type.');
  }

  private buildWhere(query: InventoryListQuery, includeUnpublished: boolean) {
    return {
      ...(includeUnpublished
        ? query.status === 'published'
          ? { isPublished: true }
          : query.status === 'draft'
            ? { isPublished: false }
            : {}
        : { isPublished: true }),
      ...(query.make && query.make !== 'all' ? { make: { slug: query.make } } : {}),
      ...(query.fuelType && query.fuelType !== 'all' ? { fuelType: { slug: query.fuelType } } : {}),
      ...(query.year ? { year: query.year } : {}),
      ...(query.search
        ? {
            OR: [
              { model: { contains: query.search } },
              { trim: { contains: query.search } },
              { make: { name: { contains: query.search } } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(sort: InventoryListQuery['sort']) {
    if (sort === 'latest') return [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
    if (sort === 'price-low') return { price: 'asc' as const };
    if (sort === 'price-high') return { price: 'desc' as const };
    if (sort === 'newest') return { year: 'desc' as const };
    if (sort === 'mileage') return { mileage: 'asc' as const };
    return { updatedAt: 'desc' as const };
  }

  private toVehicleCreateData(input: VehicleCreateInput) {
    return {
      slug: input.slug,
      make: { connect: { id: input.makeId } },
      fuelType: { connect: { id: input.fuelTypeId } },
      model: input.model,
      trim: input.trim,
      category: input.category,
      year: input.year,
      price: input.price,
      mileage: input.mileage,
      priceNegotiable: input.priceNegotiable,
      exterior: input.exterior,
      interior: input.interior,
      vin: input.vin,
      engine: input.engine,
      power: input.power,
      torque: input.torque,
      transmission: input.transmission,
      drivetrain: input.drivetrain,
      range: input.range || null,
      description: input.description,
      isPublished: input.isPublished,
      documents: {
        create: input.documents.map((item, order) => ({
          name: item.name,
          status: item.status,
          url: item.url || null,
          displayOrder: order,
        })),
      },
      highlights: {
        create: input.highlights.map((item, order) => ({ text: item.text, displayOrder: order })),
      },
      customFields: {
        create: input.customFields.map((item, order) => ({
          label: item.label,
          value: item.value,
          displayOrder: order,
        })),
      },
    };
  }

  private toVehicleUpdateData(input: VehicleCreateInput) {
    return {
      slug: input.slug,
      make: { connect: { id: input.makeId } },
      fuelType: { connect: { id: input.fuelTypeId } },
      model: input.model,
      trim: input.trim,
      category: input.category,
      year: input.year,
      price: input.price,
      mileage: input.mileage,
      priceNegotiable: input.priceNegotiable,
      exterior: input.exterior,
      interior: input.interior,
      vin: input.vin,
      engine: input.engine,
      power: input.power,
      torque: input.torque,
      transmission: input.transmission,
      drivetrain: input.drivetrain,
      range: input.range || null,
      description: input.description,
      isPublished: input.isPublished,
    };
  }
}
