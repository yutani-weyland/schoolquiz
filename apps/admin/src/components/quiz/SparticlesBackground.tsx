'use client';

import { useEffect, useRef } from 'react';

interface SparticlesBackgroundProps {
  isActive: boolean;
}

export function SparticlesBackground({ isActive }: SparticlesBackgroundProps) {
  const containerRef = useRef<HTMLCanvasElement>(null);
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
          } else if (typeof sparticlesInstanceRef.current.stop === 'function') {
            sparticlesInstanceRef.current.stop();
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
      // @ts-ignore
      if (window.Sparticles && containerRef.current) {
        initializeSparticles();
        return;
      }

      // Check if script is already being loaded
      if (scriptLoadedRef.current && document.querySelector('script[src*="sparticles"]')) {
        // Wait for script to load
        const checkInterval = setInterval(() => {
          // @ts-ignore
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
          // @ts-ignore
          if (window.Sparticles) {
            initializeSparticles();
          }
        }, 100);
        return;
      }

      // Load script from CDN
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      // Use jsdelivr CDN for sparticles
      script.src = 'https://cdn.jsdelivr.net/npm/sparticles@1.3.1/dist/sparticles.min.js';
      script.async = true;
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializeSparticles();
      };

      script.onerror = () => {
        console.warn('Failed to load sparticles from jsdelivr, trying unpkg');
        scriptLoadedRef.current = false;
        // Try alternative CDN
        const altScript = document.createElement('script');
        altScript.src = 'https://unpkg.com/sparticles@1.3.1/dist/sparticles.min.js';
        altScript.async = true;
        altScript.onload = () => {
          scriptLoadedRef.current = true;
          initializeSparticles();
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
      if (!containerRef.current) return;
      if (initializedRef.current) return;

      // Set canvas dimensions
      const canvas = containerRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      try {
        // @ts-ignore
        const Sparticles = window.Sparticles || (window as any).sparticles;
        if (!Sparticles) {
          console.error('Sparticles not available on window');
          return;
        }

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
          color: ["random"],
          shape: "diamond",
          imageUrl: "",
        };

        // Try different initialization methods
        if (typeof Sparticles === 'function') {
          sparticlesInstanceRef.current = new Sparticles(containerRef.current, config);
          initializedRef.current = true;
        } else if (Sparticles.default && typeof Sparticles.default === 'function') {
          sparticlesInstanceRef.current = new Sparticles.default(containerRef.current, config);
          initializedRef.current = true;
        } else if (Sparticles.create && typeof Sparticles.create === 'function') {
          sparticlesInstanceRef.current = Sparticles.create(containerRef.current, config);
          initializedRef.current = true;
        } else if (Sparticles.init && typeof Sparticles.init === 'function') {
          sparticlesInstanceRef.current = Sparticles.init(containerRef.current, config);
          initializedRef.current = true;
        } else {
          console.error('Sparticles API not recognized', Sparticles);
        }
      } catch (error) {
        console.error('Failed to initialize sparticles:', error);
      }
    };

    loadSparticles();

    // Handle window resize to update canvas dimensions
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.width = window.innerWidth;
        containerRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sparticlesInstanceRef.current) {
        try {
          if (typeof sparticlesInstanceRef.current.destroy === 'function') {
            sparticlesInstanceRef.current.destroy();
          } else if (typeof sparticlesInstanceRef.current.stop === 'function') {
            sparticlesInstanceRef.current.stop();
          }
        } catch (error) {
          console.warn('Error cleaning up sparticles:', error);
        }
        sparticlesInstanceRef.current = null;
        initializedRef.current = false;
      }
    };
  }, [isActive]); // Only re-run when isActive changes

  if (!isActive) return null;

  return (
    <canvas
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'block',
      }}
    />
  );
}

