import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { NotFoundAppError, ValidationAppError } from '../../errors/app-error.js';
import type { MediaAssetDto, MediaRepository } from './media.repository.js';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
}

type MediaStore = Pick<MediaRepository, 'create' | 'delete'> &
  Partial<Pick<MediaRepository, 'list'>>;

export class MediaService {
  public constructor(
    private readonly repository: MediaStore,
    private readonly uploadDirectory: string,
    private readonly maxDimension = 2400,
  ) {}

  public list(): Promise<MediaAssetDto[]> {
    return this.repository.list ? this.repository.list() : Promise.resolve([]);
  }

  public async upload(file: UploadedFile): Promise<MediaAssetDto> {
    await mkdir(this.uploadDirectory, { recursive: true });
    const image = sharp(file.buffer, { failOn: 'error' }).rotate();
    let metadata;
    try {
      metadata = await image.metadata();
    } catch {
      throw new ValidationAppError('The uploaded file is not a valid image.');
    }
    if (!metadata.width || !metadata.height) {
      throw new ValidationAppError('The uploaded file is not a valid image.');
    }

    const storageName = `${randomUUID()}.webp`;
    const targetPath = path.join(this.uploadDirectory, storageName);
    try {
      const output = await image
        .resize({
          width: this.maxDimension,
          height: this.maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 90, effort: 5, smartSubsample: true })
        .toFile(targetPath);

      return await this.repository.create({
        originalName: file.originalname.slice(0, 255),
        storageName,
        mimeType: 'image/webp',
        url: `/uploads/${storageName}`,
        width: output.width,
        height: output.height,
        bytes: output.size,
      });
    } catch (error) {
      await unlink(targetPath).catch(() => undefined);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    const asset = await this.repository.delete(id);
    if (!asset) throw new NotFoundAppError('Media asset was not found.');
    await unlink(path.join(this.uploadDirectory, asset.storageName)).catch(() => undefined);
  }
}
