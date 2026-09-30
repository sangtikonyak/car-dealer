import type { PrismaClient } from '@prisma/client';
import { benefitSchema, faqSchema, homepageUpdateSchema, stepSchema } from './homepage.schema.js';
import type { HomepageContentDto } from './homepage.types.js';
import type {
  HomepageAboutUpdateInput,
  HomepageBookingCtaUpdateInput,
  HomepageBenefitsUpdateInput,
  HomepageFaqsUpdateInput,
  HomepageFooterUpdateInput,
  HomepageHowItWorksUpdateInput,
  HomepageIdentityUpdateInput,
  HomepageSiteIdentityUpdateInput,
  HomepageShowroomUpdateInput,
  HomepageUpdateInput,
} from './homepage.schema.js';

export class HomepageRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findPublished(): Promise<HomepageContentDto | null> {
    const record = await this.prisma.homepageContent.findUnique({
      where: { id: 'default' },
      include: {
        steps: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        faqs: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        benefits: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
      },
    });
    if (!record) return null;

    const content = homepageUpdateSchema.parse({
      site: record.site,
      hero: record.hero,
      howItWorks: record.howItWorks,
      faq: record.faq,
      benefitsIntro: record.benefitsIntro,
      showroom: record.showroom,
      about: record.about,
      bookingCta: record.bookingCta,
      footer: record.footer,
      steps: record.steps.map(
        ({ id, number, title, description, iconKey, displayOrder, isActive }) =>
          stepSchema.parse({ id, number, title, description, iconKey, displayOrder, isActive }),
      ),
      faqs: record.faqs.map(({ id, question, answer, displayOrder, isActive }) =>
        faqSchema.parse({ id, question, answer, displayOrder, isActive }),
      ),
      benefits: record.benefits.map(
        ({ id, iconKey, title, description, tone, displayOrder, isActive }) =>
          benefitSchema.parse({ id, iconKey, title, description, tone, displayOrder, isActive }),
      ),
    });

    return {
      ...content,
      steps: content.steps.map((step, index) => ({
        ...step,
        id: record.steps[index]?.id ?? step.id ?? `step-${index}`,
      })),
      faqs: content.faqs.map((faq, index) => ({
        ...faq,
        id: record.faqs[index]?.id ?? faq.id ?? `faq-${index}`,
      })),
      benefits: content.benefits.map((benefit, index) => ({
        ...benefit,
        id: record.benefits[index]?.id ?? benefit.id ?? `benefit-${index}`,
      })),
    };
  }

  public async replace(input: HomepageUpdateInput): Promise<HomepageContentDto> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.homepageContent.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          site: input.site,
          hero: input.hero,
          howItWorks: input.howItWorks,
          faq: input.faq,
          benefitsIntro: input.benefitsIntro,
          showroom: input.showroom,
          about: input.about,
          bookingCta: input.bookingCta,
          footer: input.footer,
        },
        update: {
          site: input.site,
          hero: input.hero,
          howItWorks: input.howItWorks,
          faq: input.faq,
          benefitsIntro: input.benefitsIntro,
          showroom: input.showroom,
          about: input.about,
          bookingCta: input.bookingCta,
          footer: input.footer,
        },
      });

      await transaction.homepageStep.deleteMany({ where: { homepageId: 'default' } });
      await transaction.homepageFaq.deleteMany({ where: { homepageId: 'default' } });
      await transaction.homepageBenefit.deleteMany({ where: { homepageId: 'default' } });

      if (input.steps.length > 0) {
        await transaction.homepageStep.createMany({
          data: input.steps.map((step) => ({ ...step, homepageId: 'default' })),
        });
      }
      if (input.faqs.length > 0) {
        await transaction.homepageFaq.createMany({
          data: input.faqs.map((faq) => ({ ...faq, homepageId: 'default' })),
        });
      }
      if (input.benefits.length > 0) {
        await transaction.homepageBenefit.createMany({
          data: input.benefits.map((benefit) => ({ ...benefit, homepageId: 'default' })),
        });
      }
    });

    const updated = await this.findPublished();
    if (!updated) throw new Error('Homepage content was not persisted.');
    return updated;
  }

  public async updateIdentity(
    input: HomepageIdentityUpdateInput,
  ): Promise<HomepageContentDto | null> {
    const updated = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.homepageContent.findUnique({ where: { id: 'default' } });
      if (!existing) return false;

      await transaction.homepageContent.update({
        where: { id: 'default' },
        data: { site: input.site, hero: input.hero },
      });
      return true;
    });

    return updated ? this.findPublished() : null;
  }

  public async updateSiteIdentity(
    input: HomepageSiteIdentityUpdateInput,
  ): Promise<HomepageContentDto | null> {
    const updated = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.homepageContent.findUnique({ where: { id: 'default' } });
      if (!existing) return false;

      await transaction.homepageContent.update({
        where: { id: 'default' },
        data: { site: input.site },
      });
      return true;
    });

    return updated ? this.findPublished() : null;
  }

  public async replaceBenefits(
    input: HomepageBenefitsUpdateInput,
  ): Promise<HomepageContentDto | null> {
    const updated = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.homepageContent.findUnique({ where: { id: 'default' } });
      if (!existing) return false;

      await transaction.homepageBenefit.deleteMany({ where: { homepageId: 'default' } });
      if (input.benefitsIntro) {
        await transaction.homepageContent.update({
          where: { id: 'default' },
          data: { benefitsIntro: input.benefitsIntro },
        });
      }
      if (input.benefits.length > 0) {
        await transaction.homepageBenefit.createMany({
          data: input.benefits.map((benefit) => ({ ...benefit, homepageId: 'default' })),
        });
      }
      return true;
    });

    return updated ? this.findPublished() : null;
  }

  public async replaceFaqs(input: HomepageFaqsUpdateInput): Promise<HomepageContentDto | null> {
    const updated = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.homepageContent.findUnique({ where: { id: 'default' } });
      if (!existing) return false;

      await transaction.homepageFaq.deleteMany({ where: { homepageId: 'default' } });
      if (input.faq) {
        await transaction.homepageContent.update({
          where: { id: 'default' },
          data: { faq: input.faq },
        });
      }
      if (input.faqs.length > 0) {
        await transaction.homepageFaq.createMany({
          data: input.faqs.map((faq) => ({ ...faq, homepageId: 'default' })),
        });
      }
      return true;
    });

    return updated ? this.findPublished() : null;
  }

  public async updateHowItWorks(
    input: HomepageHowItWorksUpdateInput,
  ): Promise<HomepageContentDto | null> {
    const updated = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.homepageContent.findUnique({ where: { id: 'default' } });
      if (!existing) return false;

      await transaction.homepageContent.update({
        where: { id: 'default' },
        data: { howItWorks: input.howItWorks },
      });
      await transaction.homepageStep.deleteMany({ where: { homepageId: 'default' } });
      if (input.steps.length > 0) {
        await transaction.homepageStep.createMany({
          data: input.steps.map((step) => ({ ...step, homepageId: 'default' })),
        });
      }
      return true;
    });

    return updated ? this.findPublished() : null;
  }

  public async updateShowroom(
    input: HomepageShowroomUpdateInput,
  ): Promise<HomepageContentDto | null> {
    return this.updateJsonSection('showroom', input.showroom);
  }

  public async updateAbout(input: HomepageAboutUpdateInput): Promise<HomepageContentDto | null> {
    return this.updateJsonSection('about', input.about);
  }

  public async updateBookingCta(
    input: HomepageBookingCtaUpdateInput,
  ): Promise<HomepageContentDto | null> {
    return this.updateJsonSection('bookingCta', input.bookingCta);
  }

  public async updateFooter(input: HomepageFooterUpdateInput): Promise<HomepageContentDto | null> {
    return this.updateJsonSection('footer', input.footer);
  }

  private async updateJsonSection(
    field: 'showroom' | 'about' | 'bookingCta' | 'footer',
    value: unknown,
  ): Promise<HomepageContentDto | null> {
    const updated = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.homepageContent.findUnique({ where: { id: 'default' } });
      if (!existing) return false;

      await transaction.homepageContent.update({
        where: { id: 'default' },
        data: { [field]: value },
      });
      return true;
    });

    return updated ? this.findPublished() : null;
  }
}
