import React from 'react';
import Image from 'next/image';

interface PromotionBannerProps {
  promotion: {
    title: string;
    description?: string;
    image_url?: string;
    store: {
      name: string;
      color_hex: string;
      website_url: string;
    };
  };
}

export function PromotionBanner({ promotion }: PromotionBannerProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-bg-card border border-border shadow-md flex flex-col md:flex-row items-center mb-8">
      {promotion.image_url && (
        <div className="relative w-full md:w-1/3 h-48 md:h-56">
          <Image
            src={promotion.image_url}
            alt={promotion.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority
          />
        </div>
      )}
      
      <div className="p-8 flex-1 flex flex-col justify-center">
        <span 
          className="text-xs font-bold tracking-widest uppercase mb-2"
          style={{ color: promotion.store.color_hex }}
        >
          {promotion.store.name}
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {promotion.title}
        </h2>
        {promotion.description && (
          <p className="text-gray-600 mb-6 line-clamp-2">
            {promotion.description}
          </p>
        )}
        
        <a 
          href={promotion.store.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit bg-purple text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-opacity"
        >
          Ver promoción
        </a>
      </div>
    </div>
  );
}
