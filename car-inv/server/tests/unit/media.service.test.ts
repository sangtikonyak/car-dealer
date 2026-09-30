import { mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaService } from '../../src/modules/media/media.service.js';
import type { MediaRepository } from '../../src/modules/media/media.repository.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('MediaService', () => {
  it('converts uploaded images to high-quality WebP files', async () => {
    const directory = path.join(os.tmpdir(), `car-inv-media-${Date.now()}`);
    temporaryDirectories.push(directory);
    await mkdir(directory, { recursive: true });
    const repository = {
      create: vi.fn(async (asset: Parameters<MediaRepository['create']>[0]) => ({
        id: 'asset-1',
        ...asset,
      })),
      delete: vi.fn(),
    };
    const service = new MediaService(repository, directory);
    const input = await sharp({
      create: { width: 40, height: 30, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();

    const output = await service.upload({ buffer: input, originalname: 'hero.png' });
    expect(output.mimeType).toBe('image/webp');
    expect(output.url).toMatch(/\.webp$/u);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'image/webp' }),
    );
  });
});
