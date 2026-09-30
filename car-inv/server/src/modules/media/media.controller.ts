import type { Request, Response } from 'express';
import { NotFoundAppError, ValidationAppError } from '../../errors/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { MediaService } from './media.service.js';

export class MediaController {
  public constructor(private readonly service: MediaService) {}

  public list = async (_request: Request, response: Response): Promise<void> => {
    sendSuccess(response, 200, 'Media assets loaded.', await this.service.list());
  };

  public upload = async (request: Request, response: Response): Promise<void> => {
    if (!request.file) throw new ValidationAppError('An image file is required.');
    const asset = await this.service.upload(request.file);
    sendSuccess(response, 201, 'Image uploaded as WebP.', asset);
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    const assetId = request.params.id;
    if (!assetId || Array.isArray(assetId))
      throw new NotFoundAppError('Media asset was not found.');
    await this.service.delete(assetId);
    sendSuccess(response, 204, 'Image deleted.', null);
  };
}
