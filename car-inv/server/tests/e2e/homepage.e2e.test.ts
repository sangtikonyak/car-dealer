import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { buildDatabaseUrl } from '../../src/config/database-url.js';
import { parseEnvironment } from '../../src/config/env.js';
import { homepageIconKeys } from '../../src/constants/homepage-icons.js';
import type { HomepageUpdateInput } from '../../src/modules/homepage/homepage.schema.js';

interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  data: T;
}

interface ApiFailure {
  success: false;
  statusCode: number;
  error: { code: string };
}

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(testDirectory, '../../..', 'test-image', 'e2e-car.jpg');
const environment = parseEnvironment(process.env);
const prisma = new PrismaClient({ datasourceUrl: buildDatabaseUrl(environment) });
const app = createApp({ environment, prisma });
const api = request(app);
const adminHeaders = { 'x-admin-api-key': environment.ADMIN_API_KEY };

let originalHomepage: HomepageUpdateInput | undefined;

const asUpdateInput = (content: HomepageUpdateInput): HomepageUpdateInput => content;

const getHomepage = async (): Promise<HomepageUpdateInput> => {
  const response = await api.get('/api/v1/homepage').expect(200);
  return (response.body as ApiSuccess<HomepageUpdateInput>).data;
};

describe('homepage changes end-to-end', () => {
  beforeAll(async () => {
    await prisma.$connect();
    originalHomepage = asUpdateInput(await getHomepage());
  });

  afterAll(async () => {
    if (originalHomepage) {
      await api.put('/api/v1/admin/homepage').set(adminHeaders).send(originalHomepage).expect(200);
    }
    await prisma.newsletterSubscription.deleteMany({ where: { email: { startsWith: 'e2e-' } } });
    await prisma.$disconnect();
  });

  it('serves the seeded public homepage without leaking persistence fields', async () => {
    const response = await api.get('/api/v1/homepage').expect(200);
    const body = response.body as ApiSuccess<HomepageUpdateInput>;

    expect(body.success).toBe(true);
    expect(body.data.steps.length).toBeGreaterThan(0);
    expect(body.data.faqs.length).toBeGreaterThan(0);
    expect(body.data.benefits.length).toBeGreaterThan(0);
    expect(body.data.steps[0]).not.toHaveProperty('homepageId');
    expect(body.data.benefits[0]).not.toHaveProperty('homepageId');
  });

  it('rejects missing and incorrect admin credentials', async () => {
    await api.get('/api/v1/admin/homepage').expect(401);
    const response = await api
      .get('/api/v1/admin/homepage')
      .set('x-admin-api-key', 'incorrect-admin-key-value')
      .expect(401);
    expect((response.body as ApiFailure).error.code).toBe('UNAUTHORIZED');
  });

  it('persists all twenty supported icon keys and filters inactive rows publicly', async () => {
    const current = await getHomepage();
    const payload: HomepageUpdateInput = {
      ...asUpdateInput(current),
      benefits: [
        ...homepageIconKeys.map((iconKey, index) => ({
          iconKey,
          title: `E2E benefit ${index + 1}`,
          description: 'E2E benefit description',
          tone: ['mint', 'rose', 'blue', 'sand'][index % 4] as 'mint' | 'rose' | 'blue' | 'sand',
          displayOrder: index,
          isActive: true,
        })),
        {
          iconKey: 'support',
          title: 'Inactive E2E benefit',
          description: 'This row must not be publicly visible.',
          tone: 'mint',
          displayOrder: 20,
          isActive: false,
        },
      ],
      steps: current.steps.map((step, index) => ({ ...step, isActive: index === 0 })),
      faqs: current.faqs.map((faq, index) => ({ ...faq, isActive: index === 0 })),
    };

    const updateResponse = await api
      .put('/api/v1/admin/homepage')
      .set(adminHeaders)
      .send(payload)
      .expect(200);
    expect((updateResponse.body as ApiSuccess<HomepageUpdateInput>).data.benefits).toHaveLength(20);

    const publicContent = await getHomepage();
    expect(publicContent.benefits).toHaveLength(20);
    expect(publicContent.steps).toHaveLength(1);
    expect(publicContent.faqs).toHaveLength(1);
    expect(publicContent.benefits.map((benefit) => benefit.iconKey)).toEqual(homepageIconKeys);
  });

  it('saves identity, benefits, and FAQs independently', async () => {
    const current = asUpdateInput(await getHomepage());
    const siteIdentityPayload = {
      site: {
        ...current.site,
        brandName: 'Driva',
        title: 'Driva showroom',
      },
    };

    await api
      .put('/api/v1/admin/homepage/site-identity')
      .set(adminHeaders)
      .send(siteIdentityPayload)
      .expect(200);

    const afterSiteIdentity = await getHomepage();
    expect(afterSiteIdentity.site.brandName).toBe('Driva');
    expect(afterSiteIdentity.site.title).toBe('Driva showroom');
    expect(afterSiteIdentity.hero).toEqual(current.hero);
    expect(afterSiteIdentity.benefits).toEqual(current.benefits);
    await api
      .put('/api/v1/admin/homepage/site-identity')
      .set(adminHeaders)
      .send({ ...siteIdentityPayload, unexpected: true })
      .expect(400);

    const identityPayload = {
      site: {
        ...afterSiteIdentity.site,
        brandName: 'E2E Independent Brand',
        brandMark: '/uploads/e2e-logo.webp',
      },
      hero: { ...current.hero, description: 'E2E independent hero content.' },
    };

    await api
      .put('/api/v1/admin/homepage/identity')
      .set(adminHeaders)
      .send(identityPayload)
      .expect(200);

    const afterIdentity = await getHomepage();
    expect(afterIdentity.site.brandName).toBe('E2E Independent Brand');
    expect(afterIdentity.site.brandMark).toBe('/uploads/e2e-logo.webp');
    expect(afterIdentity.hero.description).toBe('E2E independent hero content.');
    expect(afterIdentity.benefits).toEqual(current.benefits);
    expect(afterIdentity.faqs).toEqual(current.faqs);

    const benefitsPayload = afterIdentity.benefits.map((benefit, index) =>
      index === 0 ? { ...benefit, title: 'E2E independent benefit', displayOrder: index } : benefit,
    );
    await api
      .put('/api/v1/admin/homepage/benefits')
      .set(adminHeaders)
      .send({ benefits: benefitsPayload })
      .expect(200);

    const afterBenefits = await getHomepage();
    expect(afterBenefits.benefits[0]?.title).toBe('E2E independent benefit');
    expect(afterBenefits.site).toEqual(afterIdentity.site);
    expect(afterBenefits.hero).toEqual(afterIdentity.hero);
    expect(afterBenefits.faqs).toEqual(afterIdentity.faqs);

    const faqsPayload = [
      ...afterBenefits.faqs,
      {
        question: 'E2E independent FAQ?',
        answer: 'This FAQ was saved independently.',
        displayOrder: afterBenefits.faqs.length,
        isActive: true,
      },
    ];
    await api
      .put('/api/v1/admin/homepage/faqs')
      .set(adminHeaders)
      .send({ faqs: faqsPayload })
      .expect(200);

    const afterFaqs = await getHomepage();
    expect(afterFaqs.faqs.at(-1)?.question).toBe('E2E independent FAQ?');
    expect(afterFaqs.site).toEqual(afterBenefits.site);
    expect(afterFaqs.hero).toEqual(afterBenefits.hero);
    expect(afterFaqs.benefits).toEqual(afterBenefits.benefits);
  });

  it('saves every Homepage submenu section independently and persists fresh reads', async () => {
    const current = asUpdateInput(await getHomepage());

    const howItWorks = {
      ...current.howItWorks,
      title: 'E2E buying journey title',
    };
    await api
      .put('/api/v1/admin/homepage/how-it-works')
      .set(adminHeaders)
      .send({ howItWorks, steps: current.steps })
      .expect(200);
    const afterHowItWorks = await getHomepage();
    expect(afterHowItWorks.howItWorks.title).toBe(howItWorks.title);
    expect(afterHowItWorks.showroom).toEqual(current.showroom);

    const showroom = {
      ...afterHowItWorks.showroom,
      title: 'E2E showroom title',
      latitude: 13.01234,
      longitude: 80.23456,
      zoom: 15,
    };
    await api
      .put('/api/v1/admin/homepage/showroom')
      .set(adminHeaders)
      .send({ showroom })
      .expect(200);
    const afterShowroom = await getHomepage();
    expect(afterShowroom.showroom.title).toBe(showroom.title);
    expect(afterShowroom.showroom.latitude).toBe(showroom.latitude);
    expect(afterShowroom.showroom.longitude).toBe(showroom.longitude);
    expect(afterShowroom.showroom.zoom).toBe(showroom.zoom);
    expect(afterShowroom.about).toEqual(current.about);

    await api
      .put('/api/v1/admin/homepage/showroom')
      .set(adminHeaders)
      .send({ showroom: { ...showroom, latitude: 91 } })
      .expect(400);
    await api
      .put('/api/v1/admin/homepage/showroom')
      .set(adminHeaders)
      .send({ showroom: { ...showroom, longitude: 181 } })
      .expect(400);

    const about = { ...afterShowroom.about, title: 'E2E about title' };
    await api.put('/api/v1/admin/homepage/about').set(adminHeaders).send({ about }).expect(200);
    const afterAbout = await getHomepage();
    expect(afterAbout.about.title).toBe(about.title);

    const bookingCta = { ...afterAbout.bookingCta, title: 'E2E booking CTA title' };
    await api
      .put('/api/v1/admin/homepage/booking-cta')
      .set(adminHeaders)
      .send({ bookingCta })
      .expect(200);
    const afterBookingCta = await getHomepage();
    expect(afterBookingCta.bookingCta.title).toBe(bookingCta.title);

    const footer = {
      ...afterBookingCta.footer,
      description: 'E2E footer description',
      email: 'footer@example.com',
      phone: '+91 90000 12345',
      copyright: 'E2E footer copyright',
    };
    await api.put('/api/v1/admin/homepage/footer').set(adminHeaders).send({ footer }).expect(200);
    const afterFooter = await getHomepage();
    expect(afterFooter.footer.copyright).toBe(footer.copyright);
    expect(afterFooter.footer.description).toBe(footer.description);
    expect(afterFooter.footer.email).toBe(footer.email);
    expect(afterFooter.footer.phone).toBe(footer.phone);
    expect(afterFooter.bookingCta).toEqual(bookingCta);

    await api
      .put('/api/v1/admin/homepage/showroom')
      .set(adminHeaders)
      .send({ showroom, unexpected: true })
      .expect(400);
    await api
      .put('/api/v1/admin/homepage/footer')
      .set(adminHeaders)
      .send({ footer: { ...footer, termsHref: 'javascript:alert(1)' } })
      .expect(400);
  });

  it('rejects unknown fields, unsafe links, invalid icons, and collection limits', async () => {
    const current = asUpdateInput(await getHomepage());

    const unknownFieldResponse = await api
      .put('/api/v1/admin/homepage')
      .set(adminHeaders)
      .send({ ...current, unexpected: true })
      .expect(400);
    expect((unknownFieldResponse.body as ApiFailure).error.code).toBe('VALIDATION_ERROR');

    await api
      .put('/api/v1/admin/homepage')
      .set(adminHeaders)
      .send({ ...current, hero: { ...current.hero, imageUrl: 'javascript:alert(1)' } })
      .expect(400);

    await api
      .put('/api/v1/admin/homepage')
      .set(adminHeaders)
      .send({
        ...current,
        benefits: [{ ...current.benefits[0], iconKey: 'not-a-supported-icon' }],
      })
      .expect(400);

    await api
      .put('/api/v1/admin/homepage')
      .set(adminHeaders)
      .send({
        ...current,
        steps: Array.from({ length: 21 }, (_, index) => ({
          number: String(index + 1),
          title: 'Too many steps',
          description: 'This should be rejected.',
          iconKey: 'search',
          displayOrder: index,
          isActive: true,
        })),
      })
      .expect(400);
  });

  it('supports empty dynamic collections without failing the homepage API', async () => {
    const current = asUpdateInput(await getHomepage());
    const response = await api
      .put('/api/v1/admin/homepage')
      .set(adminHeaders)
      .send({ ...current, steps: [], faqs: [], benefits: [] })
      .expect(200);
    const content = (response.body as ApiSuccess<HomepageUpdateInput>).data;
    expect(content.steps).toEqual([]);
    expect(content.faqs).toEqual([]);
    expect(content.benefits).toEqual([]);
  });

  it('uploads, serves, and deletes a WebP media asset', async () => {
    const fixture = await readFile(fixturePath);
    const uploadResponse = await api
      .post('/api/v1/admin/media')
      .set(adminHeaders)
      .attach('image', fixture, { filename: 'e2e-car.jpg', contentType: 'image/jpeg' })
      .expect(201);
    const asset = (
      uploadResponse.body as ApiSuccess<{
        id: string;
        url: string;
        mimeType: string;
        width: number;
        height: number;
        bytes: number;
      }>
    ).data;

    expect(asset.mimeType).toBe('image/webp');
    expect(asset.url).toMatch(/^\/uploads\/.+\.webp$/u);
    expect(asset.width).toBeGreaterThan(0);
    expect(asset.height).toBeGreaterThan(0);
    expect(asset.bytes).toBeGreaterThan(0);
    await api
      .get(asset.url)
      .expect('Content-Type', /image\/webp/u)
      .expect(200);

    await api.delete(`/api/v1/admin/media/${asset.id}`).set(adminHeaders).expect(204);
    await api.get(asset.url).expect(404);
    await api.delete(`/api/v1/admin/media/${asset.id}`).set(adminHeaders).expect(404);
  });

  it('rejects missing, invalid, unsupported, and oversized uploads', async () => {
    await api.post('/api/v1/admin/media').set(adminHeaders).expect(400);

    await api
      .post('/api/v1/admin/media')
      .set(adminHeaders)
      .attach('image', Buffer.from('not an image'), {
        filename: 'invalid.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);

    await api
      .post('/api/v1/admin/media')
      .set(adminHeaders)
      .attach('image', Buffer.from('plain text'), {
        filename: 'unsupported.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    await api
      .post('/api/v1/admin/media')
      .set(adminHeaders)
      .attach('image', Buffer.alloc(environment.MAX_UPLOAD_BYTES + 1), {
        filename: 'oversized.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);
  });

  it('validates and normalizes newsletter subscriptions idempotently', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const first = await api
      .post('/api/v1/newsletter-subscriptions')
      .send({ email: `  ${email.toUpperCase()}  ` })
      .expect(201);
    const second = await api.post('/api/v1/newsletter-subscriptions').send({ email }).expect(201);

    expect((first.body as ApiSuccess<{ email: string }>).data.email).toBe(email);
    expect((second.body as ApiSuccess<{ email: string }>).data.email).toBe(email);

    await api.post('/api/v1/newsletter-subscriptions').send({ email: 'invalid' }).expect(400);
    await api
      .post('/api/v1/newsletter-subscriptions')
      .send({ email, unexpected: true })
      .expect(400);
  });

  it('returns consistent health and not-found responses', async () => {
    await api.get('/api/v1/health/live').expect(200);
    await api.get('/api/v1/health/ready').expect(200);
    const response = await api.get('/api/v1/does-not-exist').expect(404);
    expect((response.body as ApiFailure).statusCode).toBe(404);
  });
});
