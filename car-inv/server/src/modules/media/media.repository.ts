import type { PrismaClient } from '@prisma/client';

export interface MediaAssetDto {
  id: string;
  url: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
  originalName: string;
}

export interface StoredMediaAsset extends MediaAssetDto {
  storageName: string;
}

export class MediaRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public create(
    input: Omit<MediaAssetDto, 'id'> & { storageName: string },
  ): Promise<MediaAssetDto> {
    return this.prisma.mediaAsset.create({ data: input });
  }

  public list(): Promise<MediaAssetDto[]> {
    return this.prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        url: true,
        mimeType: true,
        width: true,
        height: true,
        bytes: true,
        originalName: true,
      },
    });
  }

  public async delete(id: string): Promise<StoredMediaAsset | null> {
    const existing = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) return null;
    await this.prisma.mediaAsset.delete({ where: { id } });
    return existing;
  }
}
