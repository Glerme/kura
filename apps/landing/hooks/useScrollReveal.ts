import { useEffect, useRef } from "react";

/** Observe a single element — adds `is-visible` class when it enters the viewport. */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px", ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * Observe a container — when it enters the viewport, all direct `.reveal`
 * children get `is-visible` added with a staggered delay.
 */
export function useScrollRevealChildren<T extends HTMLElement = HTMLDivElement>(
  staggerMs = 110
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const children = Array.from(
      container.querySelectorAll<HTMLElement>(".reveal")
    );
    children.forEach((el, i) => {
      el.style.setProperty("--reveal-delay", `${i * staggerMs}ms`);
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach((el) => el.classList.add("is-visible"));
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return ref;
}
