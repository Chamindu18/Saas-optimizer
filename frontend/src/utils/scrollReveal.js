// Scroll Reveal Animation — IntersectionObserver setup
export const initScrollReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Don't unobserve — allow for re-trigger on scroll up
        } else {
          // Optionally reset if scrolling away
          // entry.target.classList.remove('visible');
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  // Observe all elements with .reveal class
  document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el);
  });

  return observer;
};

// Cleanup function
export const cleanupScrollReveal = (observer) => {
  if (observer) {
    observer.disconnect();
  }
};
