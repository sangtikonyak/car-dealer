import 'dotenv/config';

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
let enquiryId: string | undefined;

describe('vehicle enquiries end-to-end', () => {
  beforeAll(async () => prisma.$connect());
  afterAll(async () => {
    if (enquiryId) await prisma.vehicleEnquiry.delete({ where: { id: enquiryId } });
    await prisma.$disconnect();
  });

  it('creates a public enquiry, lists it with an image preview, and updates purchase details', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const beforeSummaryResponse = await api
      .get('/api/v1/admin/enquiries/summary')
      .set(adminHeaders)
      .expect(200);
    const beforeSummary = (
      beforeSummaryResponse.body as ApiSuccess<{
        totalVehicleEnquiries: number;
        totalPurchasePrice: number;
      }>
    ).data;
    const beforeDateSummaryResponse = await api
      .get('/api/v1/admin/enquiries/summary')
      .set(adminHeaders)
      .query({ from: today, to: today })
      .expect(200);
    const beforeDateSummary = (
      beforeDateSummaryResponse.body as ApiSuccess<{
        totalVehicleEnquiries: number;
        totalPurchasePrice: number;
        statusCounts: { PURCHASED: number };
        timeline: Array<{ enquiryCount: number; purchaseValue: number }>;
      }>
    ).data;

    const vehicle = await prisma.vehicle.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      include: { photos: { orderBy: { displayOrder: 'asc' }, take: 1 } },
    });
    if (!vehicle) throw new Error('A published vehicle fixture is required.');

    await api
      .post('/api/v1/enquiries')
      .send({
        vehicleSlug: vehicle.slug,
        name: `E2E Enquirer ${Date.now()}`,
        fullAddress: 'Chennai, Tamil Nadu',
        unexpected: true,
      })
      .expect(400);

    const created = await api
      .post('/api/v1/enquiries')
      .send({
        vehicleSlug: vehicle.slug,
        name: `E2E Enquirer ${Date.now()}`,
        phone: '+91 98765 43210',
        email: 'e2e-enquirer@example.com',
        fullAddress: 'Chennai, Tamil Nadu',
      })
      .expect(201);
    const createdData = (created.body as ApiSuccess<{ id: string; status: string }>).data;
    enquiryId = createdData.id;
    expect(createdData.status).toBe('NEW');

    const listed = await api
      .get('/api/v1/admin/enquiries')
      .set(adminHeaders)
      .query({ search: 'e2e-enquirer@example.com', page: 1, pageSize: 1 })
      .expect(200);
    const result = (
      listed.body as ApiSuccess<{
        items: Array<{
          id: string;
          vehicle: { label: string; imageUrl?: string };
          customer: { email?: string };
        }>;
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      }>
    ).data;
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
    expect(result.items[0]?.id).toBe(enquiryId);
    expect(result.items[0]?.customer.email).toBe('e2e-enquirer@example.com');
    expect(result.items[0]?.vehicle.imageUrl).toBe(vehicle.photos[0]?.url);

    const contacted = await api
      .patch(`/api/v1/admin/enquiries/${enquiryId}`)
      .set(adminHeaders)
      .send({
        status: 'CONTACTED',
        remarks: 'Initial contact completed.',
        purchasePrice: null,
        purchaseDate: null,
      })
      .expect(200);
    const contactedData = (
      contacted.body as ApiSuccess<{
        remarks?: string;
        remarksHistory: Array<{ text: string }>;
      }>
    ).data;
    expect(contactedData.remarks).toBe('Initial contact completed.');
    expect(contactedData.remarksHistory).toHaveLength(1);

    const updated = await api
      .patch(`/api/v1/admin/enquiries/${enquiryId}`)
      .set(adminHeaders)
      .send({
        status: 'PURCHASED',
        remarks: 'Completed inspection and purchase.',
        purchasePrice: 31_750,
        purchaseDate: '2026-09-27',
      })
      .expect(200);
    const updatedData = (
      updated.body as ApiSuccess<{
        status: string;
        remarks?: string;
        purchasePrice?: number;
        purchaseDate?: string;
        remarksHistory: Array<{ text: string }>;
      }>
    ).data;
    expect(updatedData.status).toBe('PURCHASED');
    expect(updatedData.remarks).toBe('Completed inspection and purchase.');
    expect(updatedData.purchasePrice).toBe(31_750);
    expect(updatedData.purchaseDate).toContain('2026-09-27');
    expect(updatedData.remarksHistory.map((remark) => remark.text)).toEqual([
      'Completed inspection and purchase.',
      'Initial contact completed.',
    ]);

    const afterSummaryResponse = await api
      .get('/api/v1/admin/enquiries/summary')
      .set(adminHeaders)
      .expect(200);
    const afterSummary = (
      afterSummaryResponse.body as ApiSuccess<{
        totalVehicleEnquiries: number;
        totalPurchasePrice: number;
      }>
    ).data;
    expect(afterSummary.totalVehicleEnquiries).toBe(beforeSummary.totalVehicleEnquiries + 1);
    expect(afterSummary.totalPurchasePrice).toBe(beforeSummary.totalPurchasePrice + 31_750);

    const afterDateSummaryResponse = await api
      .get('/api/v1/admin/enquiries/summary')
      .set(adminHeaders)
      .query({ from: today, to: today })
      .expect(200);
    const afterDateSummary = (
      afterDateSummaryResponse.body as ApiSuccess<{
        totalVehicleEnquiries: number;
        purchasedEnquiries: number;
        totalPurchasePrice: number;
        statusCounts: { PURCHASED: number };
        timeline: Array<{ enquiryCount: number; purchaseValue: number }>;
      }>
    ).data;
    expect(afterDateSummary.totalVehicleEnquiries).toBe(
      beforeDateSummary.totalVehicleEnquiries + 1,
    );
    expect(afterDateSummary.purchasedEnquiries).toBe(afterDateSummary.statusCounts.PURCHASED);
    expect(afterDateSummary.statusCounts.PURCHASED).toBe(
      beforeDateSummary.statusCounts.PURCHASED + 1,
    );
    expect(afterDateSummary.totalPurchasePrice).toBe(beforeDateSummary.totalPurchasePrice + 31_750);
    expect(afterDateSummary.timeline.reduce((sum, point) => sum + point.enquiryCount, 0)).toBe(
      afterDateSummary.totalVehicleEnquiries,
    );
    expect(afterDateSummary.timeline.reduce((sum, point) => sum + point.purchaseValue, 0)).toBe(
      afterDateSummary.totalPurchasePrice,
    );

    await api
      .get('/api/v1/admin/enquiries/summary')
      .set(adminHeaders)
      .query({ from: today, to: '2000-01-01' })
      .expect(400);
    await api
      .get('/api/v1/admin/enquiries/summary')
      .set(adminHeaders)
      .query({ from: today, to: today, unexpected: 'true' })
      .expect(400);

    await api
      .get('/api/v1/admin/enquiries')
      .set(adminHeaders)
      .query({ status: 'PURCHASED', search: 'e2e-enquirer@example.com' })
      .expect(200);

    await api.delete(`/api/v1/admin/enquiries/${enquiryId}`).expect(401);
    await api.delete(`/api/v1/admin/enquiries/${enquiryId}`).set(adminHeaders).expect(200);
    enquiryId = undefined;

    const afterDelete = await api
      .get('/api/v1/admin/enquiries')
      .set(adminHeaders)
      .query({ search: 'e2e-enquirer@example.com' })
      .expect(200);
    expect((afterDelete.body as ApiSuccess<{ total: number }>).data.total).toBe(0);
  });

  it('rejects unauthorized listing and invalid purchase updates', async () => {
    await api.get('/api/v1/admin/enquiries').expect(401);
    await api.get('/api/v1/admin/enquiries/summary').expect(401);
    await api
      .patch('/api/v1/admin/enquiries/missing')
      .set(adminHeaders)
      .send({
        status: 'PURCHASED',
        remarks: '',
        purchasePrice: null,
        purchaseDate: null,
      })
      .expect(404);
    await api.delete('/api/v1/admin/enquiries/missing').set(adminHeaders).expect(404);
  });
});
