import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouteScrollReset } from './RouteScrollReset';

describe('RouteScrollReset', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('scrolls to the top when the pathname changes', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <RouteScrollReset />
        <Link to="/inventory/vehicle-one">Open vehicle</Link>
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('link', { name: 'Open vehicle' }));

    await waitFor(() => expect(scrollTo).toHaveBeenCalledTimes(2));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('does not interrupt same-page anchor navigation', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteScrollReset />
        <Link to="/#benefits">View benefits</Link>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'View benefits' }));

    await waitFor(() => expect(window.location).toBeDefined());
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('scrolls to a hash target when navigating from another page', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const scrollIntoView = vi.fn();

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <RouteScrollReset />
        <div
          id="about"
          ref={(element) => {
            if (element) element.scrollIntoView = scrollIntoView;
          }}
        />
        <Link to="/#about">About us</Link>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'About us' }));

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it.each(['how-it-works', 'benefits'])(
    'retries a hash target for %s until it mounts',
    async (targetId) => {
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
      const scrollIntoView = vi.fn();
      const target = document.createElement('section');
      target.id = targetId;
      target.scrollIntoView = scrollIntoView;
      const requestAnimationFrame = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((callback) => {
          callback(0);
          return 1;
        });
      const getElementById = vi
        .spyOn(document, 'getElementById')
        .mockReturnValueOnce(null)
        .mockReturnValue(target);

      render(
        <MemoryRouter initialEntries={['/inventory']}>
          <RouteScrollReset />
          <Link to={`/#${targetId}`}>Open section</Link>
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByRole('link', { name: 'Open section' }));

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
      expect(getElementById).toHaveBeenCalledWith(targetId);
      expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
    },
  );

  it('re-scrolls after an incomplete image before the target finishes loading', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const scrollIntoView = vi.fn();
    let imageLoaded = false;

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <RouteScrollReset />
        <img
          ref={(element) => {
            if (element) {
              Object.defineProperty(element, 'complete', {
                configurable: true,
                get: () => imageLoaded,
              });
            }
          }}
          alt=""
        />
        <Link to="/#how-it-works">Open section</Link>
        <section
          id="how-it-works"
          ref={(element) => {
            if (element) element.scrollIntoView = scrollIntoView;
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Open section' }));

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    imageLoaded = true;
    document.querySelector<HTMLImageElement>('img')?.dispatchEvent(new Event('load'));

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(2));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
