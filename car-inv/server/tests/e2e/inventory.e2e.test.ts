import 'dotenv/config';

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { buildDatabaseUrl } from '../../src/config/database-url.js';
import { parseEnvironment } from '../../src/config/env.js';

interface ApiSuccess<T> {
  data: T;
}
const environment = parseEnvironment(process.env);
const prisma = new PrismaClient({ datasourceUrl: buildDatabaseUrl(environment) });
const app = createApp({ environment, prisma });
const api = request(app);
const adminHeaders = { 'x-admin-api-key': environment.ADMIN_API_KEY };
const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
  'test-image',
  'e2e-car.jpg',
);
let vehicleId: string | undefined;
let makeId: string | undefined;
let fuelId: string | undefined;

describe('inventory management end-to-end', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  afterAll(async () => {
    if (vehicleId)
      await api.delete(`/api/v1/admin/inventory/vehicles/${vehicleId}`).set(adminHeaders);
    if (makeId) await api.delete(`/api/v1/admin/inventory/makes/${makeId}`).set(adminHeaders);
    if (fuelId) await api.delete(`/api/v1/admin/inventory/fuel-types/${fuelId}`).set(adminHeaders);
    await prisma.$disconnect();
  });

  it('creates lookup values, rejects unknown fields, and creates a vehicle with ordered custom fields', async () => {
    const suffix = Date.now();
    const makeResponse = await api
      .post('/api/v1/admin/inventory/makes')
      .set(adminHeaders)
      .send({ name: `E2E Make ${suffix}`, isActive: true })
      .expect(201);
    makeId = (makeResponse.body as ApiSuccess<{ id: string }>).data.id;
    const fuelResponse = await api
      .post('/api/v1/admin/inventory/fuel-types')
      .set(adminHeaders)
      .send({ name: `E2E Fuel ${suffix}`, isActive: true })
      .expect(201);
    fuelId = (fuelResponse.body as ApiSuccess<{ id: string }>).data.id;
    await api
      .post('/api/v1/admin/inventory/makes')
      .set(adminHeaders)
      .send({ name: `E2E Make ${suffix}`, isActive: true })
      .expect(409);
    await api
      .post('/api/v1/admin/inventory/vehicles')
      .set(adminHeaders)
      .send({ unexpected: true })
      .expect(400);

    const payload = {
      slug: `e2e-vehicle-${suffix}`,
      makeId,
      fuelTypeId: fuelId,
      model: 'Test Model',
      trim: 'Launch',
      category: 'Coupe',
      year: 2024,
      price: 42000,
      mileage: 1200,
      priceNegotiable: false,
      exterior: 'Black',
      interior: 'Black',
      vin: `E2E-${suffix}`,
      engine: 'Electric motor',
      power: '300 hp',
      torque: '400 Nm',
      transmission: 'Single speed',
      drivetrain: 'AWD',
      range: '500 km',
      description: 'E2E vehicle description.',
      isPublished: true,
      documents: [{ name: 'Registration', status: 'On file', order: 0 }],
      highlights: [{ text: 'Verified history', order: 0 }],
      customFields: [
        { label: 'Warranty', value: '5 years', order: 0 },
        { label: 'Owners', value: '1', order: 1 },
      ],
    };
    const create = await api
      .post('/api/v1/admin/inventory/vehicles')
      .set(adminHeaders)
      .send(payload)
      .expect(201);
    vehicleId = (create.body as ApiSuccess<{ id: string }>).data.id;
    const created = (create.body as ApiSuccess<{ customFields: Array<{ label: string }> }>).data;
    expect(created.customFields.map((field) => field.label)).toEqual(['Warranty', 'Owners']);

    const filtered = await api
      .get('/api/v1/admin/inventory/vehicles')
      .set(adminHeaders)
      .query({
        status: 'published',
        fuelType: `e2e-fuel-${suffix}`,
        year: 2024,
        page: 1,
        pageSize: 20,
        includeUnpublished: true,
      })
      .expect(200);
    const filteredList = (
      filtered.body as ApiSuccess<{ items: Array<{ id: string }>; pageSize: number }>
    ).data;
    expect(filteredList.pageSize).toBe(20);
    expect(filteredList.items.some((item) => item.id === vehicleId)).toBe(true);
    await api
      .get('/api/v1/admin/inventory/vehicles')
      .set(adminHeaders)
      .query({ status: 'invalid' })
      .expect(400);
    await api
      .get('/api/v1/admin/inventory/vehicles')
      .set(adminHeaders)
      .query({ pageSize: 21 })
      .expect(400);
  });

  it('returns only the six latest published vehicles for the homepage query', async () => {
    if (!makeId || !fuelId) throw new Error('Lookup setup failed.');
    const latestMakeId = makeId;
    const latestFuelId = fuelId;
    const suffix = Date.now();
    const slugPrefix = `e2e-latest-${suffix}`;
    const publishedSlugs = Array.from(
      { length: 7 },
      (_, index) => `${slugPrefix}-published-${index}`,
    );
    const unpublishedSlug = `${slugPrefix}-unpublished`;

    try {
      await prisma.vehicle.createMany({
        data: [
          ...publishedSlugs.map((slug, index) => ({
            slug,
            makeId: latestMakeId,
            fuelTypeId: latestFuelId,
            model: `Latest ${index}`,
            trim: 'E2E',
            category: 'Coupe',
            year: 2024,
            price: 50_000 + index,
            mileage: 1_000 + index,
            priceNegotiable: false,
            exterior: 'Black',
            interior: 'Black',
            vin: `LATEST-PUBLISHED-${suffix}-${index}`,
            engine: 'Test engine',
            power: '300 hp',
            torque: '400 Nm',
            transmission: 'Automatic',
            drivetrain: 'AWD',
            description: 'Latest inventory E2E fixture.',
            isPublished: true,
            createdAt: new Date(Date.UTC(2090, 0, index + 1)),
          })),
          {
            slug: unpublishedSlug,
            makeId: latestMakeId,
            fuelTypeId: latestFuelId,
            model: 'Unpublished latest',
            trim: 'E2E',
            category: 'Coupe',
            year: 2024,
            price: 99_999,
            mileage: 1,
            priceNegotiable: false,
            exterior: 'Black',
            interior: 'Black',
            vin: `LATEST-UNPUBLISHED-${suffix}`,
            engine: 'Test engine',
            power: '300 hp',
            torque: '400 Nm',
            transmission: 'Automatic',
            drivetrain: 'AWD',
            description: 'Unpublished inventory E2E fixture.',
            isPublished: false,
            createdAt: new Date(Date.UTC(2091, 0, 1)),
          },
        ],
      });

      const response = await api
        .get('/api/v1/inventory')
        .query({ sort: 'latest', page: 1, pageSize: 6, includeUnpublished: true })
        .expect(200);
      const result = (
        response.body as ApiSuccess<{
          items: Array<{ slug: string; isPublished: boolean }>;
          pageSize: number;
        }>
      ).data;

      expect(result.pageSize).toBe(6);
      expect(result.items).toHaveLength(6);
      expect(result.items.map((item) => item.slug)).toEqual(publishedSlugs.slice(1).reverse());
      expect(result.items.every((item) => item.isPublished)).toBe(true);
      expect(result.items.some((item) => item.slug === unpublishedSlug)).toBe(false);
    } finally {
      await prisma.vehicle.deleteMany({ where: { slug: { startsWith: slugPrefix } } });
    }
  });

  it('defaults public inventory pagination to twelve vehicles', async () => {
    const response = await api.get('/api/v1/inventory').expect(200);
    const result = (response.body as ApiSuccess<{ page: number; pageSize: number }>).data;

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(12);
  });

  it('uploads WebP photos, serves them publicly, reorders them, and deletes the vehicle safely', async () => {
    if (!vehicleId) throw new Error('Vehicle setup failed.');
    const fixture = await readFile(fixturePath);
    const upload = await api
      .post(`/api/v1/admin/inventory/vehicles/${vehicleId}/photos`)
      .set(adminHeaders)
      .attach('images', fixture, { filename: 'e2e-car.jpg', contentType: 'image/jpeg' })
      .expect(201);
    const photo = (upload.body as ApiSuccess<Array<{ id: string; url: string }>>).data[0];
    if (!photo) throw new Error('Photo upload returned no photo.');
    expect(photo.url).toMatch(/^\/uploads\/inventory\/.+\.webp$/u);
    await api
      .get(photo.url)
      .expect('Content-Type', /image\/webp/u)
      .expect(200);
    await access(path.resolve(environment.UPLOAD_DIR, 'inventory', path.basename(photo.url)));
    const photoCountBeforeFailure = await prisma.vehiclePhoto.count({ where: { vehicleId } });
    await api
      .post(`/api/v1/admin/inventory/vehicles/${vehicleId}/photos`)
      .set(adminHeaders)
      .attach('images', fixture, {
        filename: 'valid-before-corrupt.jpg',
        contentType: 'image/jpeg',
      })
      .attach('images', Buffer.from('not-an-image'), {
        filename: 'corrupt.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);
    expect(await prisma.vehiclePhoto.count({ where: { vehicleId } })).toBe(photoCountBeforeFailure);

    const admin = await api
      .get(`/api/v1/admin/inventory/vehicles/${vehicleId}`)
      .set(adminHeaders)
      .expect(200);
    const photos = (admin.body as ApiSuccess<{ photos: Array<{ id: string }> }>).data.photos;
    await api
      .put(`/api/v1/admin/inventory/vehicles/${vehicleId}/photos/order`)
      .set(adminHeaders)
      .send({ photoIds: photos.map((item) => item.id) })
      .expect(200);
    await api.get('/api/v1/inventory/options').expect(200);
    const slug = (admin.body as ApiSuccess<{ slug: string }>).data.slug;
    const publicDetail = await api.get(`/api/v1/inventory/${slug}`).expect(200);
    expect(
      (publicDetail.body as ApiSuccess<{ customFields: Array<{ label: string }> }>).data
        .customFields[0]?.label,
    ).toBe('Warranty');

    await api.delete(`/api/v1/admin/inventory/vehicles/${vehicleId}`).set(adminHeaders).expect(200);
    await api.get(`/api/v1/inventory/${slug}`).expect(404);
    vehicleId = undefined;
  });

  it('rejects unauthorized mutations and invalid photo ordering', async () => {
    await api.get('/api/v1/admin/inventory/vehicles').expect(401);
    await api.get('/api/v1/inventory').expect(200);
    await api
      .put('/api/v1/admin/inventory/vehicles/missing/photos/order')
      .set(adminHeaders)
      .send({ photoIds: [] })
      .expect(400);
  });
});
