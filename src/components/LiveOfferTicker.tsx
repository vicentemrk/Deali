"use client";

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

/** Ticker animado que muestra ofertas en tiempo real via Supabase Realtime. */
export function LiveOfferTicker() {
  const [tickerItems, setTickerItems] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel('new-offers')
      .on(
        'broadcast',
        { event: 'new-offer' },
        (payload) => {
          const { storeSlug, productName, offerPrice } = payload.payload;
          const msg = `🔥 ¡Nueva oferta en ${storeSlug}! ${productName} a $${offerPrice.toLocaleString('es-CL')}`;
          
          setTickerItems(prev => {
            const next = [msg, ...prev];
            return next.slice(0, 5);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (tickerItems.length === 0) return null;

  return (
    <div className="bg-teal text-white py-2 overflow-hidden whitespace-nowrap">
      <div className="inline-block animate-[ticker_20s_linear_infinite] hover:[animation-play-state:paused]">
        {tickerItems.map((item, i) => (
          <span key={i} className="mx-8 text-sm font-medium">
            {item}
          </span>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes ticker {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}}/>
    </div>
  );
}
