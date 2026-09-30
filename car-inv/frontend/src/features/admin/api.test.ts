import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../lib/apiClient';
import { homepageDefaults } from '../homepage/homepageDefaults';
import {
  updateAdminHomepageAbout,
  updateAdminHomepageBenefits,
  updateAdminHomepageBookingCta,
  updateAdminHomepageFaqs,
  updateAdminHomepageFooter,
  updateAdminHomepageHowItWorks,
  updateAdminHomepageIdentity,
  updateAdminHomepageSiteIdentity,
  updateAdminHomepageShowroom,
  fetchAdminEnquirySummary,
} from './api';

describe('admin homepage section API boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates only brand and hero content', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { data: homepageDefaults } });
    await updateAdminHomepageIdentity({ site: homepageDefaults.site, hero: homepageDefaults.hero });

    expect(put).toHaveBeenCalledWith('/admin/homepage/identity', {
      site: homepageDefaults.site,
      hero: homepageDefaults.hero,
    });
  });

  it('updates only site identity content', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { data: homepageDefaults } });
    await updateAdminHomepageSiteIdentity({ site: homepageDefaults.site });

    expect(put).toHaveBeenCalledWith('/admin/homepage/site-identity', {
      site: homepageDefaults.site,
    });
  });

  it('updates only benefit rows', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { data: homepageDefaults } });
    await updateAdminHomepageBenefits(homepageDefaults.benefits);

    expect(put).toHaveBeenCalledWith('/admin/homepage/benefits', {
      benefits: homepageDefaults.benefits,
    });
  });

  it('updates only FAQ rows', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { data: homepageDefaults } });
    await updateAdminHomepageFaqs(homepageDefaults.faqs);

    expect(put).toHaveBeenCalledWith('/admin/homepage/faqs', {
      faqs: homepageDefaults.faqs,
    });
  });

  it('uses dedicated endpoints for the remaining homepage sections', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { data: homepageDefaults } });

    await updateAdminHomepageHowItWorks({
      howItWorks: homepageDefaults.howItWorks,
      steps: homepageDefaults.steps,
    });
    await updateAdminHomepageShowroom(homepageDefaults.showroom);
    await updateAdminHomepageAbout(homepageDefaults.about);
    await updateAdminHomepageBookingCta(homepageDefaults.bookingCta);
    await updateAdminHomepageFooter(homepageDefaults.footer);

    expect(put).toHaveBeenNthCalledWith(1, '/admin/homepage/how-it-works', {
      howItWorks: homepageDefaults.howItWorks,
      steps: homepageDefaults.steps,
    });
    expect(put).toHaveBeenNthCalledWith(2, '/admin/homepage/showroom', {
      showroom: homepageDefaults.showroom,
    });
    expect(put).toHaveBeenNthCalledWith(3, '/admin/homepage/about', {
      about: homepageDefaults.about,
    });
    expect(put).toHaveBeenNthCalledWith(4, '/admin/homepage/booking-cta', {
      bookingCta: homepageDefaults.bookingCta,
    });
    expect(put).toHaveBeenNthCalledWith(5, '/admin/homepage/footer', {
      footer: homepageDefaults.footer,
    });
  });

  it('loads date-filtered enquiry summary data', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        data: {
          totalVehicleEnquiries: 2,
          purchasedEnquiries: 1,
          totalPurchasePrice: 31750,
          statusCounts: {
            NEW: 1,
            CONTACTED: 0,
            FOLLOW_UP: 0,
            PURCHASED: 1,
            LOST: 0,
            CLOSED: 0,
          },
          timeline: [],
        },
      },
    });

    await fetchAdminEnquirySummary({ from: '2026-09-01', to: '2026-09-29' });

    expect(get).toHaveBeenCalledWith('/admin/enquiries/summary', {
      params: { from: '2026-09-01', to: '2026-09-29' },
    });
  });
});
