/**
 * Image Validation & Processing Utilities
 * Provides safe handling of product images arrays with proper type checking
 */

import { Product } from '../types';

/**
 * Validates that a product has a valid images array
 * @param product - The product to validate
 * @returns true if images is a non-empty array of valid URLs
 */
export const hasValidImages = (product: Product | null | undefined): boolean => {
  if (!product) return false;
  return (
    Array.isArray(product.images) &&
    product.images.length > 0 &&
    product.images.every((url) => typeof url === 'string' && url.trim() !== '')
  );
};

/**
 * Gets a safe array of valid image URLs from a product
 * Filters out empty strings and invalid values
 * @param product - The product to extract images from
 * @returns Array of valid image URLs (empty array if none found)
 */
export const getValidImageUrls = (product: Product | null | undefined): string[] => {
  if (!product) return [];
  
  if (!Array.isArray(product.images)) {
    console.warn('Product.images is not an array:', product.images);
    return [];
  }

  return product.images.filter(
    (url): url is string => typeof url === 'string' && url.trim() !== ''
  );
};

/**
 * Gets the first valid image URL from a product
 * @param product - The product to get image from
 * @returns First valid image URL or empty string if none found
 */
export const getFirstImageUrl = (product: Product | null | undefined): string => {
  const urls = getValidImageUrls(product);
  return urls.length > 0 ? urls[0] : '';
};

/**
 * Validates image URL is from expected Supabase bucket
 * @param url - The image URL to validate
 * @param supabaseProjectId - The Supabase project ID
 * @returns true if URL is valid Supabase public URL
 */
export const isValidSupabaseUrl = (
  url: string,
  supabaseProjectId = 'nufeuxdqjfithhleezox'
): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const expected = `https://${supabaseProjectId}.supabase.co/storage/v1/object/public/`;
  return url.startsWith(expected);
};

/**
 * Validates image array structure and logs issues
 * Useful for debugging image-related issues
 * @param product - The product to validate
 */
export const validateAndLogImageState = (product: Product | null | undefined): void => {
  if (!product) {
    console.warn('Product is null or undefined');
    return;
  }

  console.group(`🖼️ Image Validation: "${product.title}"`);
  console.log('Product:', product);
  
  // Check images is array
  if (!Array.isArray(product.images)) {
    console.error('❌ images field is NOT an array:', typeof product.images, product.images);
    console.groupEnd();
    return;
  }

  console.log('✅ images is an array');
  console.log(`   Length: ${product.images.length}`);

  if (product.images.length === 0) {
    console.warn('⚠️  images array is empty');
    console.groupEnd();
    return;
  }

  // Check each URL
  product.images.forEach((url, index) => {
    if (!url) {
      console.warn(`❌ Image ${index + 1}: Empty/null value`);
    } else if (typeof url !== 'string') {
      console.error(`❌ Image ${index + 1}: Not a string (${typeof url})`);
    } else if (url.trim() === '') {
      console.warn(`❌ Image ${index + 1}: Whitespace-only string`);
    } else if (!isValidSupabaseUrl(url)) {
      console.warn(`⚠️  Image ${index + 1}: Not from expected Supabase bucket`);
      console.log(`   URL: ${url}`);
    } else {
      console.log(`✅ Image ${index + 1}: Valid Supabase URL`);
      console.log(`   ${url}`);
    }
  });

  console.groupEnd();
};

/**
 * Creates a fallback image object for display
 * Used when no valid images are available
 */
export const getImageFallback = () => ({
  src: '',
  alt: 'No image available',
  isPlaceholder: true,
});

/**
 * Type guard for Product with images
 */
export const isProductWithImages = (
  product: Product | null | undefined
): product is Product => {
  return hasValidImages(product);
};
