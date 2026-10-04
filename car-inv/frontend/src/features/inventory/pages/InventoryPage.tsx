import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CarFront, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { fetchInventory, fetchInventoryOptions } from '../api';
import { InventoryNotice } from '../components/InventoryNotice';
import { InventoryFilters, type InventorySort } from '../components/InventoryFilters';
import { VehicleCard } from '../components/VehicleCard';
import { trackAnalyticsEvent } from '../../analytics/hooks/useAnalyticsTracking';

const INVENTORY_PAGE_SIZE = 12;

export function InventoryPage() {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [searchSubmission, setSearchSubmission] = useState(0);
  const lastTrackedInteractionRef = useRef('');
  const [make, setMake] = useState('all');
  const [fuel, setFuel] = useState('all');
  const [sort, setSort] = useState<InventorySort>('featured');
  const [page, setPage] = useState(1);
  const options = useQuery({
    queryKey: ['inventory-options'],
    queryFn: fetchInventoryOptions,
    staleTime: 60_000,
  });
  const inventory = useQuery({
    queryKey: ['inventory', search, make, fuel, sort, page],
    queryFn: () =>
      fetchInventory({
        search,
        make,
        fuelType: fuel,
        sort,
        page,
        pageSize: INVENTORY_PAGE_SIZE,
      }),
    staleTime: 10_000,
  });
  const vehicles = inventory.data?.items ?? [];
  const totalPages = inventory.data?.totalPages ?? 0;
  const firstResult =
    inventory.data && inventory.data.total > 0 ? (page - 1) * INVENTORY_PAGE_SIZE + 1 : 0;
  const lastResult = inventory.data
    ? Math.min(page * INVENTORY_PAGE_SIZE, inventory.data.total)
    : 0;
  const updateSearchDraft = (value: string) => {
    setSearchDraft(value);
  };
  const submitSearch = () => {
    setSearch(searchDraft.trim());
    setPage(1);
    setSearchSubmission((submission) => submission + 1);
  };
  const updateMake = (value: string) => {
    setMake(value);
    setPage(1);
  };
  const updateFuel = (value: string) => {
    setFuel(value);
    setPage(1);
  };
  const updateSort = (value: InventorySort) => {
    setSort(value);
    setPage(1);
  };
  const clearFilters = () => {
    setSearchDraft('');
    setSearch('');
    setMake('all');
    setFuel('all');
    setPage(1);
  };

  useEffect(() => {
    if (
      inventory.isLoading ||
      inventory.isFetching ||
      inventory.isError ||
      (!search && make === 'all' && fuel === 'all' && page === 1)
    )
      return;

    const interactionKey = JSON.stringify([searchSubmission, search, make, fuel, sort, page]);
    if (lastTrackedInteractionRef.current === interactionKey) return;

    const timer = window.setTimeout(() => {
      if (lastTrackedInteractionRef.current === interactionKey) return;
      lastTrackedInteractionRef.current = interactionKey;
      trackAnalyticsEvent({
        eventType: 'INVENTORY_SEARCHED',
        route: '/inventory',
        searchTerm: search.trim() || undefined,
        makeSlug: make === 'all' ? undefined : make,
        fuelTypeSlug: fuel === 'all' ? undefined : fuel,
        sort,
        resultCount: inventory.data?.total ?? 0,
      });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [
    fuel,
    inventory.data?.total,
    inventory.isFetching,
    inventory.isError,
    inventory.isLoading,
    make,
    page,
    search,
    searchSubmission,
    sort,
  ]);

  return (
    <main className="inventory-page">
      <section className="inventory-heading">
        <p className="section-eyebrow">The collection · {inventory.data?.total ?? 0} vehicles</p>
        <div className="inventory-heading-row">
          <div>
            <h1>Find your next drive.</h1>
            <p>Thoughtfully selected pre-owned cars, ready for a closer look.</p>
          </div>
          <span className="inventory-count">{vehicles.length} cars shown</span>
        </div>
        <InventoryNotice />
      </section>

      <section className="inventory-results" aria-label="Available vehicles">
        <InventoryFilters
          search={searchDraft}
          make={make}
          fuel={fuel}
          sort={sort}
          makes={options.data?.makes ?? []}
          fuels={options.data?.fuelTypes ?? []}
          onSearchChange={updateSearchDraft}
          onSearchSubmit={submitSearch}
          onMakeChange={updateMake}
          onFuelChange={updateFuel}
          onSortChange={updateSort}
        />
        {inventory.isLoading ? (
          <div className="inventory-empty">
            <h2>Loading the collection…</h2>
          </div>
        ) : inventory.isError ? (
          <div className="inventory-empty">
            <h2>We couldn’t load the collection.</h2>
            <button
              className="outline-button mt-5"
              type="button"
              onClick={() => void inventory.refetch()}
            >
              Try again
            </button>
          </div>
        ) : vehicles.length > 0 ? (
          <div className="vehicle-grid">
            {vehicles.map((vehicle, index) => (
              <VehicleCard key={vehicle.slug} vehicle={vehicle} index={index} />
            ))}
          </div>
        ) : (
          <div className="inventory-empty" role="status">
            <div className="inventory-empty-illustration" aria-hidden="true">
              <CarFront className="inventory-empty-car" size={88} strokeWidth={1.35} />
              <span className="inventory-empty-search">
                <Search size={30} strokeWidth={1.8} />
              </span>
            </div>
            <h2>No cars match those filters.</h2>
            <p>Try another search or broaden your selections.</p>
            <div className="inventory-empty-actions">
              <button className="primary-button" type="button" onClick={clearFilters}>
                Clear filters
              </button>
              <button className="outline-button" type="button" onClick={clearFilters}>
                View all cars
              </button>
            </div>
          </div>
        )}
        {totalPages > 1 && (
          <nav className="inventory-pagination" aria-label="Inventory pages">
            <p className="inventory-pagination-summary">
              Showing {firstResult}–{lastResult} of {inventory.data?.total ?? 0} cars
            </p>
            <div className="inventory-pagination-controls">
              <button
                className="inventory-pagination-button"
                type="button"
                aria-label="Previous inventory page"
                disabled={page === 1}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                <ChevronLeft size={17} aria-hidden="true" />
                <span>Previous</span>
              </button>
              <span className="inventory-pagination-current" aria-current="page">
                Page {page} of {totalPages}
              </span>
              <button
                className="inventory-pagination-button"
                type="button"
                aria-label="Next inventory page"
                disabled={page === totalPages}
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              >
                <span>Next</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
