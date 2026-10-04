import { useState } from 'react';

interface AdminBrandLockupProps {
  brandName: string;
  brandMark: string;
  showName?: boolean;
  suffix?: string;
}

const isImageBrandMark = (value: string): boolean =>
  /^https?:\/\//i.test(value) || value.startsWith('/uploads/');

export function AdminBrandLockup({
  brandName,
  brandMark,
  showName = true,
  suffix,
}: AdminBrandLockupProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasImage = isImageBrandMark(brandMark) && failedImage !== brandMark;
  const fallbackMark =
    brandMark && !isImageBrandMark(brandMark) ? brandMark : brandName.trim().charAt(0) || 'D';

  return (
    <>
      <span
        className={`admin-brand-mark${hasImage ? ' admin-brand-mark-image-frame' : ''}`}
        aria-hidden="true"
      >
        {hasImage ? (
          <img src={brandMark} alt="" onError={() => setFailedImage(brandMark)} />
        ) : (
          fallbackMark
        )}
      </span>
      {showName ? (
        <span className="admin-brand-name">
          {brandName}
          {suffix ? ` ${suffix}` : ''}
        </span>
      ) : null}
    </>
  );
}
