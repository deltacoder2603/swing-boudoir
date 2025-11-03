/**
 * Production-grade Image Helper for Swing Magazine
 * 
 * This module provides comprehensive image transformation utilities using the
 * on-the-fly image transformation API at /api/v1/images/transform
 */

import type {
    ImageSize,
    ImageSizeConfig,
    ImageTransformOptions,
    ImageTransformError,
    ImageTransformResponse
} from '@/types/image.types';
import { API_CONFIG } from './config';

/**
 * Predefined image size configurations for common use cases
 */
const IMAGE_SIZE_CONFIGS: Record<ImageSize, ImageSizeConfig> = {
    avatar: { w: 80, h: 80, q: 80, f: 'webp', fit: 'cover' },
    thumbnail: { w: 150, h: 150, q: 80, f: 'webp', fit: 'cover' },
    small: { w: 300, h: 300, q: 85, f: 'webp', fit: 'cover' },
    medium: { w: 600, h: 600, q: 90, f: 'webp', fit: 'cover' },
    large: { w: 1200, h: 1200, q: 95, f: 'webp', fit: 'cover' },
    full: { w: 1920, h: 1920, q: 95, f: 'webp', fit: 'cover' },
    original: { w: undefined, h: undefined, q: 100, f: 'webp', fit: 'cover' },
    banner: { w: 1920, h: undefined, q: 95, f: 'webp', fit: 'cover' },
    gallery: { w: 600, h: undefined, q: 80, f: 'webp', fit: 'cover' },
};

/**
 * Default transformation options
 */
const DEFAULT_OPTIONS: Partial<ImageTransformOptions> = {
    q: 85,
    f: 'webp',
    fit: 'cover',
    position: 'center'
};

/**
 * Parameter order for consistent URL generation and caching
 * This ensures that the same transformation options always produce the same URL
 */
const PARAMETER_ORDER: (keyof ImageTransformOptions)[] = [
    'w',          // width
    'h',          // height
    'q',          // quality
    'f',          // format
    'fit',        // fit mode
    'position',   // position
    'bg',         // background
    'blur',       // blur
    'sharpen',    // sharpen
    'grayscale',  // grayscale
    'negate',     // negate
    'normalize',  // normalize
    'threshold',  // threshold
    'gamma',      // gamma
    'brightness', // brightness
    'saturation', // saturation
    'hue',        // hue
    'rotate',     // rotate
    'flip',       // flip
    'flop'        // flop
];

/**
 * Cache for transformed image URLs to avoid redundant API calls
 */
const imageCache = new Map<string, CacheEntry>();

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Cache entry with timestamp
 */
interface CacheEntry {
    url: string;
    timestamp: number;
}

/**
 * Build query parameters for the image transformation API
 * Parameters are added in a specific order to ensure consistent URLs
 */
function buildQueryParams(options: ImageTransformOptions): URLSearchParams {
    const params = new URLSearchParams();

    // Add parameters in the defined order
    PARAMETER_ORDER.forEach(key => {
        const value = options[key];
        if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
                params.append(key, value ? 'true' : 'false');
            } else {
                params.append(key, String(value));
            }
        }
    });

    return params;
}

/**
 * Generate cache key for transformed image URL
 * Uses the same parameter ordering as buildQueryParams for consistency
 */
function generateCacheKey(originalUrl: string, options: ImageTransformOptions): string {
    const sortedOptions: Record<string, string | number | boolean> = {};

    // Add parameters in the defined order, only including defined values
    PARAMETER_ORDER.forEach(key => {
        const value = options[key];
        if (value !== undefined && value !== null) {
            sortedOptions[key] = value;
        }
    });

    return `${originalUrl}::${JSON.stringify(sortedOptions)}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Get cached transformed URL if available and valid
 */
function getCachedUrl(cacheKey: string): string | null {
    const entry = imageCache.get(cacheKey);
    if (entry && isCacheValid(entry)) {
        return entry.url;
    }

    if (entry) {
        imageCache.delete(cacheKey);
    }

    return null;
}

/**
 * Cache transformed URL
 */
function setCachedUrl(cacheKey: string, url: string): void {
    imageCache.set(cacheKey, {
        url,
        timestamp: Date.now()
    });
}

/**
 * Validate image URL
 */
function validateImageUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of imageCache.entries()) {
        if (now - entry.timestamp >= CACHE_TTL) {
            imageCache.delete(key);
        }
    }
}

/**
 * Transform image URL with the specified options
 * 
 * @param originalUrl - The original image URL
 * @param options - Transformation options
 * @returns Transformed image URL
 * 
 * @example
 * ```typescript
 * const thumbnailUrl = transformImageUrl(
 *   'https://example.com/image.jpg',
 *   { w: 150, h: 150, q: 80, f: 'webp' }
 * );
 * ```
 */
export function transformImageUrl(
    originalUrl: string,
    options: ImageTransformOptions = {}
): string {
    if (!originalUrl) {
        throw new Error('Original URL is required');
    }

    if (!validateImageUrl(originalUrl)) {
        throw new Error('Invalid image URL provided');
    }

    // Generate cache key
    const cacheKey = generateCacheKey(originalUrl, options);

    // Check cache first
    const cachedUrl = getCachedUrl(cacheKey);
    if (cachedUrl) {
        return cachedUrl;
    }

    // Clean up expired cache entries periodically
    if (imageCache.size > 100) {
        cleanupCache();
    }

    // Build transformation URL
    const baseUrl = `${API_CONFIG.API_BASE_HOST}/api/v1/images/transform`;
    const queryParams = buildQueryParams(options);

    // Add original URL as the 'url' parameter
    queryParams.set('url', originalUrl);

    const transformedUrl = `${baseUrl}?${queryParams.toString()}`;

    // Cache the result
    setCachedUrl(cacheKey, transformedUrl);

    return transformedUrl;
}

/**
 * Get image URL for a specific size variant
 * 
 * @param originalUrl - The original image URL
 * @param size - Predefined size variant
 * @param customOptions - Additional transformation options
 * @returns Transformed image URL for the specified size
 * 
 * @example
 * ```typescript
 * const thumbnailUrl = getImageUrl('https://example.com/image.jpg', 'thumbnail');
 * const customUrl = getImageUrl('https://example.com/image.jpg', 'medium', { q: 95 });
 * ```
 */
export function getImageUrl(
    originalUrl: string,
    size: ImageSize = 'medium',
    customOptions: Partial<ImageTransformOptions> = {}
): string {
    // Return empty string if originalUrl is null, undefined, or empty
    if (!originalUrl || originalUrl.trim() === '') {
        return '';
    }

    // Validate URL before processing
    if (!validateImageUrl(originalUrl)) {
        return '';
    }

    const sizeConfig = IMAGE_SIZE_CONFIGS[size];
    const options: ImageTransformOptions = {
        ...DEFAULT_OPTIONS,
        ...sizeConfig,
        ...customOptions
    };

    try {
        return transformImageUrl(originalUrl, options);
    } catch (error) {
        // If transformation fails, return empty string instead of throwing
        console.warn('Image transformation failed:', error);
        return '';
    }
}

/**
 * Get multiple image URLs for different sizes
 * 
 * @param originalUrl - The original image URL
 * @param sizes - Array of size variants
 * @param customOptions - Additional transformation options
 * @returns Object with size variants as keys and URLs as values
 * 
 * @example
 * ```typescript
 * const urls = getMultipleImageUrls('https://example.com/image.jpg', ['thumbnail', 'medium', 'large']);
 * // Returns: { thumbnail: '...', medium: '...', large: '...' }
 * ```
 */
export function getMultipleImageUrls(
    originalUrl: string,
    sizes: ImageSize[],
    customOptions: Partial<ImageTransformOptions> = {}
): Record<ImageSize, string> {
    // Return empty object if originalUrl is null, undefined, or empty
    if (!originalUrl || originalUrl.trim() === '') {
        const result = {} as Record<ImageSize, string>;
        sizes.forEach(size => {
            result[size] = '';
        });
        return result;
    }

    const result = {} as Record<ImageSize, string>;

    sizes.forEach(size => {
        result[size] = getImageUrl(originalUrl, size, customOptions);
    });

    return result;
}

/**
 * Get responsive image URLs for srcset
 * 
 * @param originalUrl - The original image URL
 * @param sizes - Array of size variants with their pixel densities
 * @param customOptions - Additional transformation options
 * @returns Formatted srcset string
 * 
 * @example
 * ```typescript
 * const srcset = getResponsiveImageSrcset('https://example.com/image.jpg', [
 *   { size: 'small', density: 1 },
 *   { size: 'medium', density: 2 },
 *   { size: 'large', density: 3 }
 * ]);
 * ```
 */
export function getResponsiveImageSrcset(
    originalUrl: string,
    sizes: Array<{ size: ImageSize; density: number }>,
    customOptions: Partial<ImageTransformOptions> = {}
): string {
    // Return empty string if originalUrl is null, undefined, or empty
    if (!originalUrl || originalUrl.trim() === '') {
        return '';
    }

    return sizes
        .map(({ size, density }) => {
            const url = getImageUrl(originalUrl, size, customOptions);
            return url ? `${url} ${density}x` : '';
        })
        .filter(Boolean)
        .join(', ');
}

/**
 * Preload transformed image
 * 
 * @param originalUrl - The original image URL
 * @param options - Transformation options
 * @returns Promise that resolves when image is loaded
 */
export function preloadImage(
    originalUrl: string,
    options: ImageTransformOptions = {}
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const transformedUrl = transformImageUrl(originalUrl, options);

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${transformedUrl}`));

        img.src = transformedUrl;
    });
}

/**
 * Transform image with proper error handling
 * 
 * @param originalUrl - The original image URL
 * @param options - Transformation options
 * @returns Promise with transformation result or error
 */
export async function transformImageWithErrorHandling(
    originalUrl: string,
    options: ImageTransformOptions = {}
): Promise<ImageTransformResponse> {
    try {
        const transformedUrl = transformImageUrl(originalUrl, options);

        // Fetch the transformed image as binary data
        const response = await fetch(transformedUrl);

        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            return {
                success: true,
                data: uint8Array,
                url: transformedUrl
            };
        } else {
            // Try to get error details from the response
            let errorData: Partial<ImageTransformError> = {};
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    errorData = await response.json();
                }
            } catch {
                // Ignore JSON parsing errors
            }

            return {
                success: false,
                error: {
                    error: errorData.error || 'Image transformation failed',
                    message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                    code: errorData.code || response.status.toString()
                }
            };
        }
    } catch (error) {
        return {
            success: false,
            error: {
                error: 'Network error',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                code: 'NETWORK_ERROR'
            }
        };
    }
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
    imageCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
} {
    return {
        size: imageCache.size,
        maxSize: 1000, // Configurable limit
        // Note: Hit rate would require tracking hits/misses, not implemented for simplicity
    };
}

/**
 * Utility function to get optimized image URL for different contexts
 */
export const ImageHelper = {
    /**
     * Get avatar/profile image URL
     */
    avatar: (url: string, size: ImageSize = 'thumbnail') => {
        if (!url || url.trim() === '') return '';
        return getImageUrl(url, size, { fit: 'cover', position: 'center' });
    },

    /**
     * Get cover image URL
     */
    cover: (url: string, size: ImageSize = 'large') => {
        if (!url || url.trim() === '') return '';
        return getImageUrl(url, size, { fit: 'cover', position: 'center' });
    },

    /**
     * Get thumbnail URL
     */
    thumbnail: (url: string) => {
        if (!url || url.trim() === '') return '';
        return getImageUrl(url, 'thumbnail', { fit: 'cover', position: 'center' });
    },

    /**
     * Get gallery image URL
     */
    gallery: (url: string, size: ImageSize = 'medium') => {
        if (!url || url.trim() === '') return '';
        return getImageUrl(url, size, { fit: 'cover', position: 'center' });
    },

    /**
     * Get hero/banner image URL
     */
    hero: (url: string) => {
        if (!url || url.trim() === '') return '';
        return getImageUrl(url, 'full', { fit: 'cover', position: 'center' });
    },

    /**
     * Get responsive image URLs for different screen sizes
     */
    responsive: (url: string) => {
        if (!url || url.trim() === '') {
            return {
                mobile: '',
                tablet: '',
                desktop: '',
                retina: ''
            };
        }
        return {
            mobile: getImageUrl(url, 'small', { w: 480, h: 320, fit: 'cover' }),
            tablet: getImageUrl(url, 'medium', { w: 768, h: 512, fit: 'cover' }),
            desktop: getImageUrl(url, 'large', { w: 1200, h: 800, fit: 'cover' }),
            retina: getImageUrl(url, 'full', { w: 1920, h: 1280, fit: 'cover' })
        };
    }
};

// Export types for external use
export type {
    ImageSize,
    ImageSizeConfig,
    ImageTransformOptions,
    TransformedImageUrl,
    ImageTransformError,
    ImageTransformResponse,
    ImageLoadingState,
    ImageErrorType
} from '@/types/image.types';

