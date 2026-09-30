import type { PrismaClient } from '@prisma/client';

export class NewsletterRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public subscribe(email: string) {
    return this.prisma.newsletterSubscription.upsert({
      where: { email },
      create: { email },
      update: { isActive: true },
      select: { id: true, email: true, isActive: true, createdAt: true },
    });
  }

  public list() {
    return this.prisma.newsletterSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, email: true, isActive: true, source: true, createdAt: true },
    });
  }
}
