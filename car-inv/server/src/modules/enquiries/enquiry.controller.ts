import type { Request, Response } from 'express';
import { NotFoundAppError } from '../../errors/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import {
  enquiryCreateSchema,
  enquiryListQuerySchema,
  enquirySummaryQuerySchema,
  enquiryUpdateSchema,
} from './enquiry.schema.js';
import { EnquiryService } from './enquiry.service.js';

const idParam = (request: Request): string => {
  const value = request.params.id;
  if (!value || Array.isArray(value)) throw new NotFoundAppError('Enquiry was not found.');
  return value;
};

export class EnquiryController {
  public constructor(private readonly service: EnquiryService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      201,
      'Enquiry submitted.',
      await this.service.create(enquiryCreateSchema.parse(request.body)),
    );
  };

  public listAdmin = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Enquiries loaded.',
      await this.service.listAdmin(enquiryListQuerySchema.parse(request.query)),
    );
  };

  public summary = async (_request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Enquiry summary loaded.',
      await this.service.summary(enquirySummaryQuerySchema.parse(_request.query)),
    );
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Enquiry updated.',
      await this.service.update(idParam(request), enquiryUpdateSchema.parse(request.body)),
    );
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(idParam(request));
    sendSuccess(response, 200, 'Enquiry deleted.', null);
  };
}
