"use client";

import React, { useState, useEffect } from 'react';

export default function NextQuizCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [currentMessage, setCurrentMessage] = useState(0);
  const [isRetracted, setIsRetracted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const messages = [
    {
      type: 'countdown',
      label: 'Next quiz drop:',
      content: timeLeft
    },
    {
      type: 'latest',
      label: 'Latest Quiz:',
      content: '#42 - Current Affairs & Pop Culture'
    }
  ];

  useEffect(() => {
    setIsMounted(true);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextMonday = new Date();
      
      // Get next Monday at 7:00 AM Australia/Sydney
      const daysUntilMonday = (1 - now.getDay() + 7) % 7;
      nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
      nextMonday.setHours(7, 0, 0, 0);
      
      // Convert to Sydney time (UTC+10 or UTC+11 for DST)
      const sydneyOffset = 10; // Simplified - in real app, handle DST
      const sydneyTime = new Date(nextMonday.getTime() + (sydneyOffset * 60 * 60 * 1000));
      
      const difference = sydneyTime.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // Ticker animation
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 5000); // Change message every 5 seconds

    return () => clearInterval(tickerInterval);
  }, [messages.length]);

  // Scroll listener for auto-retract and reappear
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Auto-retract when scrolling down past 100px
      if (currentScrollY > 100 && !isRetracted) {
        setIsRetracted(true);
      }
      // Reappear when scrolling back to top (within 50px)
      else if (currentScrollY <= 50 && isRetracted) {
        setIsRetracted(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isRetracted]);

  // Resize listener to detect narrow viewports
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Retract at a higher threshold (900px) - hides earlier when viewport reduces
      const isNarrow = width < 900;
      setIsNarrowViewport(isNarrow);
      
      // Auto-retract on narrow viewports
      if (isNarrow && !isRetracted) {
        setIsRetracted(true);
      }
    };

    // Check on mount
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isRetracted]);

  const handleNotchClick = () => {
    // Don't allow manual toggle on narrow viewports - keep it retracted
    if (!isNarrowViewport) {
      setIsRetracted(!isRetracted);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
      <div className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-500 ease-out ${isRetracted ? '-translate-y-full' : 'translate-y-0'}`}>
        {/* Apple-style notch with curved top edges */}
        <div 
          className={`bg-[#3B82F6] text-white mx-auto shadow-lg overflow-hidden relative rounded-b-2xl transition-all duration-300 ${
            isNarrowViewport ? 'cursor-default w-full' : 'cursor-pointer hover:bg-[#2563EB] w-[clamp(300px,85vw,420px)] max-w-[calc(100%-40px)]'
          }`}
          style={{
            borderTopLeftRadius: '0px',
            borderTopRightRadius: '0px',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            padding: isNarrowViewport 
              ? 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)' 
              : 'clamp(0.5rem, 1vw, 0.75rem) clamp(1rem, 2vw, 1.5rem)',
          }}
          onClick={handleNotchClick}
        >
        <div className="relative" style={{ height: isNarrowViewport ? 'clamp(1.5rem, 4vw, 2rem)' : '2rem' }}>
          <div 
            className="absolute inset-0 flex items-center gap-1.5 sm:gap-2 transition-transform duration-500 ease-in-out whitespace-nowrap"
            style={{ transform: `translateX(${currentMessage * -100}%)` }}
          >
                        {/* Countdown Message */}
                        <div className="w-full flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-1">
                          <span className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90">Your next quiz drops in:</span>
                          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-mono">
                            <span className="bg-white/20 px-1 sm:px-1.5 py-0.5 rounded text-white font-semibold">{timeLeft.days}d</span>
                            <span className="text-white/60">:</span>
                            <span className="bg-white/20 px-1 sm:px-1.5 py-0.5 rounded text-white font-semibold">{timeLeft.hours.toString().padStart(2, '0')}h</span>
                            <span className="text-white/60">:</span>
                            <span className="bg-white/20 px-1 sm:px-1.5 py-0.5 rounded text-white font-semibold">{timeLeft.minutes.toString().padStart(2, '0')}m</span>
                            <span className="text-white/60">:</span>
                            <span className="bg-white/20 px-1 sm:px-1.5 py-0.5 rounded text-white font-semibold">{timeLeft.seconds.toString().padStart(2, '0')}s</span>
                          </div>
                        </div>

                        {/* Latest Quiz Message */}
                        <div className="w-full flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-1">
                          <span className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90">Latest Quiz:</span>
                          <span className="text-[10px] sm:text-xs md:text-sm font-medium truncate max-w-[150px] sm:max-w-[250px] md:max-w-none">{typeof messages[1].content === 'string' ? messages[1].content : ''}</span>
                        </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

