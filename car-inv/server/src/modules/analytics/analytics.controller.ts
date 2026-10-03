import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { analyticsEventSchema, analyticsQuerySchema } from './analytics.schema.js';
import { AnalyticsService } from './analytics.service.js';

export class AnalyticsController {
  public constructor(private readonly service: AnalyticsService) {}

  public record = async (request: Request, response: Response): Promise<void> => {
    await this.service.record(analyticsEventSchema.parse(request.body));
    sendSuccess(response, 202, 'Analytics event accepted.', null);
  };

  public overview = async (request: Request, response: Response): Promise<void> => {
    sendSuccess(
      response,
      200,
      'Analytics overview loaded.',
      await this.service.overview(analyticsQuerySchema.parse(request.query)),
    );
  };
}
