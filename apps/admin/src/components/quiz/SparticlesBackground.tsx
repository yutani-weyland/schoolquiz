'use client';

import { useEffect, useRef } from 'react';

interface SparticlesBackgroundProps {
  isActive: boolean;
}

// Extend Window interface for sparticles
declare global {
  interface Window {
    Sparticles?: any;
    sparticles?: any;
    SparticlesJS?: any;
  }
}

export function SparticlesBackground({ isActive }: SparticlesBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null); // Sparticles creates canvas inside this div
  const sparticlesInstanceRef = useRef<any>(null);
  const scriptLoadedRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Cleanup when inactive
      if (sparticlesInstanceRef.current) {
        try {
          if (typeof sparticlesInstanceRef.current.destroy === 'function') {
            sparticlesInstanceRef.current.destroy();
          }
        } catch (error) {
          console.warn('Error cleaning up sparticles:', error);
        }
        sparticlesInstanceRef.current = null;
        initializedRef.current = false;
      }
      return;
    }

    // Prevent multiple initializations
    if (initializedRef.current && sparticlesInstanceRef.current) {
      return;
    }

    // Load sparticles from CDN
    const loadSparticles = () => {
      // Check if already loaded
      if (window.Sparticles && containerRef.current) {
        initializeSparticles();
        return;
      }

      // Check if script is already being loaded
      if (scriptLoadedRef.current && document.querySelector('script[src*="sparticles"]')) {
        const checkInterval = setInterval(() => {
          if (window.Sparticles && containerRef.current) {
            clearInterval(checkInterval);
            initializeSparticles();
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 5000);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="sparticles"]');
      if (existingScript) {
        scriptLoadedRef.current = true;
        setTimeout(() => {
          if (window.Sparticles) {
            initializeSparticles();
          }
        }, 100);
        return;
      }

      // Load script from CDN
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sparticles@1.3.1/dist/sparticles.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Sparticles script loaded successfully from jsdelivr');
        scriptLoadedRef.current = true;
        setTimeout(() => {
          initializeSparticles();
        }, 100);
      };

      script.onerror = () => {
        console.warn('Failed to load sparticles from jsdelivr, trying unpkg');
        scriptLoadedRef.current = false;
        const altScript = document.createElement('script');
        altScript.src = 'https://unpkg.com/sparticles@1.3.1/dist/sparticles.min.js';
        altScript.async = true;
        altScript.onload = () => {
          console.log('Sparticles script loaded successfully from unpkg');
          scriptLoadedRef.current = true;
          setTimeout(() => {
            initializeSparticles();
          }, 100);
        };
        altScript.onerror = () => {
          console.error('Failed to load sparticles from all CDNs. Background animation will not be available.');
          scriptLoadedRef.current = false;
        };
        document.head.appendChild(altScript);
      };

      document.head.appendChild(script);
    };

    const initializeSparticles = () => {
      if (!containerRef.current) {
        console.warn('Sparticles: containerRef.current is null');
        return;
      }
      if (initializedRef.current) {
        console.log('Sparticles: Already initialized, skipping');
        return;
      }

      try {
        const Sparticles = window.Sparticles;
        
        if (!Sparticles) {
          console.error('Sparticles not available on window');
          return;
        }

        // Config matching sparticlesjs.dev format from user's original request
        const config = {
          composition: "source-over",
          count: 500,
          speed: 10,
          parallax: 1,
          direction: 180,
          xVariance: 2,
          yVariance: 2,
          rotate: true,
          rotation: 1,
          alphaSpeed: 10,
          alphaVariance: 1,
          minAlpha: 0,
          maxAlpha: 1,
          minSize: 8,
          maxSize: 18,
          style: "fill",
          bounce: false,
          drift: 1,
          glow: 0,
          twinkle: false,
          color: "random", // Sparticles supports "random" as a string
          shape: "diamond",
          imageUrl: "",
        };

        console.log('Initializing Sparticles with container element and config:', config);

        // According to docs: new Sparticles(element, options)
        // Sparticles will create a canvas inside the container element
        const instance = new Sparticles(containerRef.current, config);
        
        sparticlesInstanceRef.current = instance;
        initializedRef.current = true;
        
        console.log('Sparticles initialized successfully!', {
          instance: instance,
          container: containerRef.current,
        });
      } catch (error) {
        console.error('Failed to initialize sparticles:', error);
      }
    };

    loadSparticles();

    // Handle window resize - sparticles handles this internally, but we can call setCanvasSize if needed
    const handleResize = () => {
      if (sparticlesInstanceRef.current && typeof sparticlesInstanceRef.current.setCanvasSize === 'function') {
        sparticlesInstanceRef.current.setCanvasSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sparticlesInstanceRef.current) {
        try {
          if (typeof sparticlesInstanceRef.current.destroy === 'function') {
            sparticlesInstanceRef.current.destroy();
          }
        } catch (error) {
          console.warn('Error cleaning up sparticles:', error);
        }
        sparticlesInstanceRef.current = null;
        initializedRef.current = false;
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  // Sparticles expects a container element - it will create the canvas inside
  // Use z-46 to appear just below header (z-50) so sparkles show through semi-transparent header background
  // Logo and menu button have z-10 relative within header, so they appear above sparkles
  // pointer-events-none ensures it doesn't block interactions
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 46, // Just below header (z-50) so sparkles appear on header background
        position: 'fixed',
      }}
    />
  );
}
