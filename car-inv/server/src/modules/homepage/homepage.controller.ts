import type { Request, Response } from 'express';
import {
  homepageAboutUpdateSchema,
  homepageBookingCtaUpdateSchema,
  homepageBenefitsUpdateSchema,
  homepageFaqsUpdateSchema,
  homepageFooterUpdateSchema,
  homepageHowItWorksUpdateSchema,
  homepageIdentityUpdateSchema,
  homepageSiteIdentityUpdateSchema,
  homepageShowroomUpdateSchema,
  homepageUpdateSchema,
} from './homepage.schema.js';
import { HomepageService } from './homepage.service.js';
import { sendSuccess } from '../../utils/response.js';

export class HomepageController {
  public constructor(private readonly service: HomepageService) {}

  public get = async (_request: Request, response: Response): Promise<void> => {
    sendSuccess(response, 200, 'Homepage content loaded.', await this.service.getHomepage());
  };

  public replace = async (request: Request, response: Response): Promise<void> => {
    const input = homepageUpdateSchema.parse(request.body);
    sendSuccess(
      response,
      200,
      'Homepage content updated.',
      await this.service.updateHomepage(input),
    );
  };

  public updateIdentity = async (request: Request, response: Response): Promise<void> => {
    const input = homepageIdentityUpdateSchema.parse(request.body);
    sendSuccess(
      response,
      200,
      'Homepage brand and hero updated.',
      await this.service.updateIdentity(input),
    );
  };

  public updateSiteIdentity = async (request: Request, response: Response): Promise<void> => {
    const input = homepageSiteIdentityUpdateSchema.parse(request.body);
    sendSuccess(
      response,
      200,
      'Homepage site identity updated.',
      await this.service.updateSiteIdentity(input),
    );
  };

  public replaceBenefits = async (request: Request, response: Response): Promise<void> => {
    const input = homepageBenefitsUpdateSchema.parse(request.body);
    sendSuccess(
      response,
      200,
      'Homepage benefits updated.',
      await this.service.replaceBenefits(input),
    );
  };

  public replaceFaqs = async (request: Request, response: Response): Promise<void> => {
    const input = homepageFaqsUpdateSchema.parse(request.body);
    sendSuccess(response, 200, 'Homepage FAQs updated.', await this.service.replaceFaqs(input));
  };

  public updateHowItWorks = async (request: Request, response: Response): Promise<void> => {
    const input = homepageHowItWorksUpdateSchema.parse(request.body);
    sendSuccess(
      response,
      200,
      'Homepage how-it-works section updated.',
      await this.service.updateHowItWorks(input),
    );
  };

  public updateShowroom = async (request: Request, response: Response): Promise<void> => {
    const input = homepageShowroomUpdateSchema.parse(request.body);
    sendSuccess(
      response,
      200,
      'Homepage showroom updated.',
      await this.service.updateShowroom(input),
    );
  };

  public updateAbout = async (request: Request, response: Response): Promise<void> => {
    const input = homepageAboutUpdateSchema.parse(request.body);
    sendSuccess(
      response,
      200,
      'Homepage about section updated.',
      await this.service.updateAbout(input),
    );
  };

  public updateBookingCta = async (request: Request, response: Response): Promise<void> => {
    const input = homepageBookingCtaUpdateSchema.parse(request.body);
    sendSuccess(
      response,
      200,
      'Homepage booking CTA updated.',
      await this.service.updateBookingCta(input),
    );
  };

  public updateFooter = async (request: Request, response: Response): Promise<void> => {
    const input = homepageFooterUpdateSchema.parse(request.body);
    sendSuccess(response, 200, 'Homepage footer updated.', await this.service.updateFooter(input));
  };
}
