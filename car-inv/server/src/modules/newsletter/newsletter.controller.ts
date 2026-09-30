import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { newsletterSubscriptionSchema } from './newsletter.schema.js';
import { NewsletterService } from './newsletter.service.js';

export class NewsletterController {
  public constructor(private readonly service: NewsletterService) {}

  public subscribe = async (request: Request, response: Response): Promise<void> => {
    const input = newsletterSubscriptionSchema.parse(request.body);
    sendSuccess(response, 201, 'Subscription saved.', await this.service.subscribe(input));
  };

  public list = async (_request: Request, response: Response): Promise<void> => {
    sendSuccess(response, 200, 'Newsletter subscriptions loaded.', await this.service.list());
  };
}
