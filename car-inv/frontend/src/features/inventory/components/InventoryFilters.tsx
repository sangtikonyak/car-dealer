import { Search, SlidersHorizontal } from 'lucide-react';
import type { InventoryOption } from '../api';

export type InventorySort = 'featured' | 'price-low' | 'price-high' | 'newest' | 'mileage';

interface InventoryFiltersProps {
  readonly search: string;
  readonly make: string;
  readonly fuel: string;
  readonly sort: InventorySort;
  readonly makes: readonly InventoryOption[];
  readonly fuels?: readonly InventoryOption[];
  readonly onSearchChange: (value: string) => void;
  readonly onMakeChange: (value: string) => void;
  readonly onFuelChange: (value: string) => void;
  readonly onSortChange: (value: InventorySort) => void;
}

export function InventoryFilters({
  search,
  make,
  fuel,
  sort,
  makes,
  onSearchChange,
  onMakeChange,
  onFuelChange,
  onSortChange,
  fuels = [],
}: InventoryFiltersProps) {
  return (
    <div className="inventory-filter-bar" aria-label="Filter and sort inventory">
      <label className="inventory-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search cars</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search make or model"
        />
      </label>
      <label className="inventory-select-label">
        <span className="sr-only">Make</span>
        <select value={make} onChange={(event) => onMakeChange(event.target.value)}>
          <option value="all" key="all-makes">All makes</option>
          {makes.map((item) => (
            <option value={item.slug} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="inventory-select-label">
        <span className="sr-only">Fuel type</span>
        <select value={fuel} onChange={(event) => onFuelChange(event.target.value)}>
          <option value="all" key="all-fuel-types">All fuel types</option>
          {fuels.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="inventory-select-label inventory-sort">
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span className="sr-only">Sort inventory</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as InventorySort)}
        >
          <option value="featured">Featured</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
          <option value="newest">Newest year</option>
          <option value="mileage">Lowest mileage</option>
        </select>
      </label>
    </div>
  );
}
