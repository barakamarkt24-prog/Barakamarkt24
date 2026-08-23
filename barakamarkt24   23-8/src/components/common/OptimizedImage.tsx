import React, { useState } from 'react';
import { FALLBACK_PRODUCT_IMAGE, getOptimizedImageUrl } from '../../utils/imageOptimizer';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  targetWidth?: number;
  quality?: number;
  fallbackSrc?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  targetWidth = 400,
  quality = 75,
  fallbackSrc = FALLBACK_PRODUCT_IMAGE,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = hasError 
    ? fallbackSrc 
    : getOptimizedImageUrl(src, { width: targetWidth, quality });

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-100/80">
      {/* Shimmer skeleton while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 animate-pulse" />
      )}
      
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
