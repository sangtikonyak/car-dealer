import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteScrollReset() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      let targetId = hash.slice(1);

      try {
        targetId = decodeURIComponent(targetId);
      } catch {
        return;
      }

      let frameId: number | undefined;
      let settleFrameId: number | undefined;
      let settleTimeoutId: number | undefined;
      let attempts = 0;
      let isActive = true;
      let mutationObserver: MutationObserver | undefined;
      let resizeObserver: ResizeObserver | undefined;
      const imageCleanups = new Set<() => void>();

      const scrollToTarget = (target: HTMLElement) => {
        target.scrollIntoView?.({ block: 'start', behavior: 'auto' });
      };

      const waitForImage = (image: HTMLImageElement) => {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          const settle = () => {
            image.removeEventListener('load', settle);
            image.removeEventListener('error', settle);
            imageCleanups.delete(settle);
            resolve();
          };

          imageCleanups.add(settle);
          image.addEventListener('load', settle, { once: true });
          image.addEventListener('error', settle, { once: true });
        });
      };

      const stopLayoutObservation = () => {
        mutationObserver?.disconnect();
        resizeObserver?.disconnect();
        mutationObserver = undefined;
        resizeObserver = undefined;

        if (settleFrameId !== undefined) {
          window.cancelAnimationFrame(settleFrameId);
          settleFrameId = undefined;
        }

        if (settleTimeoutId !== undefined) {
          window.clearTimeout(settleTimeoutId);
          settleTimeoutId = undefined;
        }
      };

      const watchForLayoutChanges = (target: HTMLElement) => {
        const resettle = () => {
          if (!isActive || settleFrameId !== undefined) {
            return;
          }

          settleFrameId = window.requestAnimationFrame(() => {
            settleFrameId = undefined;

            if (isActive) {
              scrollToTarget(target);
            }
          });

          if (settleTimeoutId !== undefined) {
            window.clearTimeout(settleTimeoutId);
          }

          settleTimeoutId = window.setTimeout(stopLayoutObservation, 1200);
        };

        if (typeof MutationObserver === 'function') {
          mutationObserver = new MutationObserver(resettle);
          mutationObserver.observe(document.body, { childList: true, subtree: true });
        }

        if (typeof ResizeObserver === 'function') {
          resizeObserver = new ResizeObserver(resettle);
          resizeObserver.observe(document.body);
        }

        settleTimeoutId = window.setTimeout(stopLayoutObservation, 1200);
      };

      const resettleAfterImages = async (target: HTMLElement) => {
        const targetTop = target.getBoundingClientRect().top;
        const pendingImages = Array.from(document.images).filter(
          (image) =>
            !image.complete &&
            (typeof target.compareDocumentPosition === 'function'
              ? Boolean(target.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_PRECEDING)
              : image.getBoundingClientRect().top < targetTop),
        );

        if (pendingImages.length === 0) {
          return;
        }

        await Promise.all(pendingImages.map(waitForImage));

        if (isActive) {
          window.requestAnimationFrame(() => {
            if (isActive) {
              scrollToTarget(target);
            }
          });
        }
      };

      const findAndScrollToTarget = () => {
        const target = document.getElementById(targetId);

        if (target) {
          scrollToTarget(target);
          watchForLayoutChanges(target);
          void resettleAfterImages(target);
          return;
        }

        if (attempts < 8) {
          attempts += 1;
          frameId = window.requestAnimationFrame(findAndScrollToTarget);
        }
      };

      findAndScrollToTarget();

      return () => {
        isActive = false;
        stopLayoutObservation();

        if (frameId !== undefined) {
          window.cancelAnimationFrame(frameId);
        }

        imageCleanups.forEach((cleanup) => cleanup());
        imageCleanups.clear();
      };
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [hash, pathname]);

  return null;
}
