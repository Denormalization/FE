'use client';

import { useEffect, useRef } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

const nprogressStyles = `
#nprogress {
  pointer-events: none;
}

#nprogress .bar {
  background: linear-gradient(90deg, #e57373, #d65d5d, #c62828);
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  box-shadow: 0 0 10px rgba(229, 115, 115, 0.5);
}

#nprogress .peg {
  display: block;
  position: absolute;
  right: 0px;
  width: 100px;
  height: 100%;
  box-shadow: 0 0 10px rgba(229, 115, 115, 0.8), 0 0 5px rgba(229, 115, 115, 0.6);
  opacity: 1.0;
  transform: rotate(3deg) translate(0px, -4px);
}

#nprogress .spinner {
  display: block;
  position: fixed;
  z-index: 9999;
  top: 15px;
  right: 15px;
}

#nprogress .spinner-icon {
  width: 18px;
  height: 18px;
  box-sizing: border-box;
  border: solid 3px transparent;
  border-top-color: #e57373;
  border-left-color: #d65d5d;
  border-radius: 50%;
  animation: nprogress-spinner 400ms linear infinite;
}

@keyframes nprogress-spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark theme adjustments */
.dark #nprogress .bar {
  background: linear-gradient(90deg, #e57373, #d65d5d, #c62828);
  box-shadow: 0 0 15px rgba(229, 115, 115, 0.7);
}

.dark #nprogress .peg {
  box-shadow: 0 0 15px rgba(229, 115, 115, 0.9), 0 0 8px rgba(229, 115, 115, 0.7);
}
`;

// Inject styles
if (typeof window !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = nprogressStyles;
  document.head.appendChild(styleElement);
}

// Configure NProgress
NProgress.configure({
  minimum: 0.1,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
  trickleSpeed: 200,
});

export function useNProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleRouteStart = () => {
      NProgress.start();
    };

    const handleRouteDone = () => {
      setTimeout(() => NProgress.done(), 100);
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.getAttribute('href')?.startsWith('/')) {
        handleRouteStart();
      }
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(state: any, unused: string, url?: string | URL | null) {
      handleRouteStart();
      setTimeout(handleRouteDone, 300);
      return originalPushState.call(history, state, unused, url);
    };

    history.replaceState = function(state: any, unused: string, url?: string | URL | null) {
      handleRouteStart();
      setTimeout(handleRouteDone, 300);
      return originalReplaceState.call(history, state, unused, url);
    };

    document.addEventListener('click', handleLinkClick);
    window.addEventListener('popstate', () => {
      handleRouteStart();
      setTimeout(handleRouteDone, 300);
    });

    return () => {
      document.removeEventListener('click', handleLinkClick);
      window.removeEventListener('popstate', handleRouteStart);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);
}
