'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import nprogress from 'nprogress';
import 'nprogress/nprogress.css';


const nprogressStyles = `
  #nprogress .bar {
    background: #BA3C3C !important;
    height: 3px !important;
  }
  
  #nprogress .peg {
    box-shadow: 0 0 10px #BA3C3C, 0 0 5px #BA3C3C !important;
  }
  
  #nprogress .spinner {
    display: none !important;
  }
`;

export default function NProgressProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {

    if (typeof window !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = nprogressStyles;
      document.head.appendChild(styleElement);
      
      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  useEffect(() => {

    nprogress.done();
  }, [pathname, searchParams]);

  return null;
}
