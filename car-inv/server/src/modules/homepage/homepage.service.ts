import { NotFoundAppError } from '../../errors/app-error.js';
import type {
  HomepageAboutUpdateInput,
  HomepageBookingCtaUpdateInput,
  HomepageBenefitsUpdateInput,
  HomepageFaqsUpdateInput,
  HomepageFooterUpdateInput,
  HomepageHowItWorksUpdateInput,
  HomepageIdentityUpdateInput,
  HomepageSiteIdentityUpdateInput,
  HomepageShowroomUpdateInput,
  HomepageUpdateInput,
} from './homepage.schema.js';
import { HomepageRepository } from './homepage.repository.js';

export class HomepageService {
  public constructor(private readonly repository: HomepageRepository) {}

  public async getHomepage() {
    const homepage = await this.repository.findPublished();
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public updateHomepage(input: HomepageUpdateInput) {
    return this.repository.replace(input);
  }

  public async updateIdentity(input: HomepageIdentityUpdateInput) {
    const homepage = await this.repository.updateIdentity(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public async updateSiteIdentity(input: HomepageSiteIdentityUpdateInput) {
    const homepage = await this.repository.updateSiteIdentity(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public async replaceBenefits(input: HomepageBenefitsUpdateInput) {
    const homepage = await this.repository.replaceBenefits(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public async replaceFaqs(input: HomepageFaqsUpdateInput) {
    const homepage = await this.repository.replaceFaqs(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public async updateHowItWorks(input: HomepageHowItWorksUpdateInput) {
    const homepage = await this.repository.updateHowItWorks(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public async updateShowroom(input: HomepageShowroomUpdateInput) {
    const homepage = await this.repository.updateShowroom(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public async updateAbout(input: HomepageAboutUpdateInput) {
    const homepage = await this.repository.updateAbout(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public async updateBookingCta(input: HomepageBookingCtaUpdateInput) {
    const homepage = await this.repository.updateBookingCta(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }

  public async updateFooter(input: HomepageFooterUpdateInput) {
    const homepage = await this.repository.updateFooter(input);
    if (!homepage) throw new NotFoundAppError('Homepage content has not been configured.');
    return homepage;
  }
}
