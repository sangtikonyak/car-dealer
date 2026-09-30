import type { Request, Response } from 'express';
import { NotFoundAppError, ValidationAppError } from '../../errors/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import {
  adminInventoryListQuerySchema,
  fuelTypeSchema,
  inventoryListQuerySchema,
  makeSchema,
  photoOrderSchema,
  vehicleCreateSchema,
} from './inventory.schema.js';
import { InventoryService } from './inventory.service.js';

const idParam = (request: Request, key: string): string => {
  const value = request.params[key];
  if (!value || Array.isArray(value)) throw new NotFoundAppError('Resource was not found.');
  return value;
};

export class InventoryController {
  public constructor(private readonly service: InventoryService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Inventory loaded.',
      await this.service.listPublic(inventoryListQuerySchema.parse(request.query)),
    );
  };
  public get = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Vehicle loaded.',
      await this.service.getPublic(idParam(request, 'slug')),
    );
  };
  public adminList = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Admin inventory loaded.',
      await this.service.listAdmin(adminInventoryListQuerySchema.parse(request.query)),
    );
  };
  public adminGet = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Vehicle loaded.',
      await this.service.getAdmin(idParam(request, 'id')),
    );
  };
  public create = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      201,
      'Vehicle created.',
      await this.service.create(vehicleCreateSchema.parse(request.body)),
    );
  };
  public update = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Vehicle updated.',
      await this.service.update(idParam(request, 'id'), vehicleCreateSchema.parse(request.body)),
    );
  };
  public delete = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(idParam(request, 'id'));
    sendSuccess(response, 200, 'Vehicle deleted.', null);
  };
  public options = async (_request: Request, response: Response): Promise<void> => {
    sendSuccess(response, 200, 'Inventory options loaded.', await this.service.options());
  };
  public makes = async (_request: Request, response: Response): Promise<void> => {
    sendSuccess(response, 200, 'Makes loaded.', await this.service.listMakes());
  };
  public createMake = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      201,
      'Make created.',
      await this.service.createMake(makeSchema.parse(request.body)),
    );
  };
  public updateMake = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Make updated.',
      await this.service.updateMake(idParam(request, 'id'), makeSchema.parse(request.body)),
    );
  };
  public deleteMake = async (request: Request, response: Response): Promise<void> => {
    await this.service.deleteMake(idParam(request, 'id'));
    sendSuccess(response, 200, 'Make deleted.', null);
  };
  public fuelTypes = async (_request: Request, response: Response): Promise<void> => {
    sendSuccess(response, 200, 'Fuel types loaded.', await this.service.listFuelTypes());
  };
  public createFuelType = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      201,
      'Fuel type created.',
      await this.service.createFuelType(fuelTypeSchema.parse(request.body)),
    );
  };
  public updateFuelType = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Fuel type updated.',
      await this.service.updateFuelType(idParam(request, 'id'), fuelTypeSchema.parse(request.body)),
    );
  };
  public deleteFuelType = async (request: Request, response: Response): Promise<void> => {
    await this.service.deleteFuelType(idParam(request, 'id'));
    sendSuccess(response, 200, 'Fuel type deleted.', null);
  };
  public uploadPhotos = async (request: Request, response: Response): Promise<void> => {
    if (!request.files || !Array.isArray(request.files))
      throw new ValidationAppError('At least one image is required.');
    sendSuccess(
      response,
      201,
      'Vehicle images uploaded.',
      await this.service.uploadPhotos(idParam(request, 'id'), request.files),
    );
  };
  public reorderPhotos = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Vehicle images reordered.',
      await this.service.reorderPhotos(
        idParam(request, 'id'),
        photoOrderSchema.parse(request.body),
      ),
    );
  };
  public deletePhoto = async (request: Request, response: Response): Promise<void> => {
    await this.service.deletePhoto(idParam(request, 'id'), idParam(request, 'photoId'));
    sendSuccess(response, 200, 'Vehicle image deleted.', null);
  };
}
