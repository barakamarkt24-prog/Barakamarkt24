import React, { useState } from 'react';
import { FALLBACK_PRODUCT_IMAGE, getOptimizedImageUrl } from '../../utils/imageOptimizer';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  containerClassName?: string;
  targetWidth?: number;
  quality?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = '',
  fallbackSrc = FALLBACK_PRODUCT_IMAGE,
  className = '',
  containerClassName = '',
  targetWidth,
  quality,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const finalSrc = hasError || !src ? fallbackSrc : getOptimizedImageUrl(src, targetWidth || 400);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-80'} ${className}`}
        {...props}
      />
    </div>
  );
};
