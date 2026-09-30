import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../lib/apiClient';
import { uploadVehiclePhotos } from '../inventory/api';

describe('vehicle image upload API boundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('clears the JSON default so the browser can set the multipart boundary', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { data: [] } });
    const file = new File(['image-bytes'], 'vehicle.jpg', { type: 'image/jpeg' });

    await uploadVehiclePhotos('vehicle-id', [file]);

    const [url, body, config] = post.mock.calls[0] ?? [];
    expect(url).toBe('/admin/inventory/vehicles/vehicle-id/photos');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).getAll('images')).toHaveLength(1);
    expect(config).toEqual({ headers: { 'Content-Type': undefined } });
  });
});
