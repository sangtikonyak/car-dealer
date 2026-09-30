import { Info } from 'lucide-react';

export function InventoryNotice() {
  return (
    <p className="inventory-notice" role="note">
      <Info size={16} aria-hidden="true" />
      <span>
        Sample inventory for demonstration. Availability, price, mileage, VIN and condition are
        illustrative—not live dealer stock.
      </span>
    </p>
  );
}
