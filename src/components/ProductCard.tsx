import React, { useState } from "react";
import { Product } from "../types";
import { validateAndLogImageState } from "../utils/imageValidation";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Handle image navigation
  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? validImageUrls.length - 1 : prev - 1,
    );
  };

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === validImageUrls.length - 1 ? 0 : prev + 1,
    );
  };

  // Handle image load failure
  const handleImageError = (index: number) => {
    console.error(
      `✗ Image ${index + 1} failed to load for "${product.title}"`,
      {
        url: validImageUrls[index],
      },
    );
  };

  // Validate images array
  const hasValidImages =
    Array.isArray(product.images) && product.images.length > 0;
  const validImageUrls = hasValidImages
    ? product.images.filter(
        (url) => typeof url === "string" && url.trim() !== "",
      )
    : [];
  const displayImage = validImageUrls[currentImageIndex];

  // Debug logging
  React.useEffect(() => {
    validateAndLogImageState(product);
  }, [product]);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {validImageUrls.length > 0 && displayImage ? (
          <>
            {/* Image counter badge */}
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-bold z-20">
              {currentImageIndex + 1}/{validImageUrls.length}
            </div>

            {/* Main image */}
            <img
              key={displayImage}
              src={displayImage}
              alt={`${product.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              crossOrigin="anonymous"
              onLoad={() => {
                console.log(
                  `✓ Image ${currentImageIndex + 1} loaded: "${product.title}"`,
                );
              }}
              onError={() => {
                handleImageError(currentImageIndex);
              }}
            />

            {/* Navigation arrows (only show if multiple images) */}
            {validImageUrls.length > 1 && (
              <>
                <button
                  onClick={goToPreviousImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all z-10"
                  aria-label="Previous image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all z-10"
                  aria-label="Next image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Thumbnail indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {validImageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-white w-3"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          /* Fallback placeholder when no valid images */
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500 text-xs font-medium">
                No image available
              </p>
            </div>
          </div>
        )}

        {/* Sold overlay */}
        {product.isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="bg-red-500 text-white px-4 py-1 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg">
              Sold
            </span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          <span className="bg-[#044414] text-white text-[10px] px-2 py-1 rounded-md font-bold">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-gray-800 line-clamp-1 group-hover:text-[#044414]">
            {product.title}
          </h3>
        </div>
        <p className="text-xl font-bold text-[#044414] mb-2">
          KSh {product.price.toLocaleString()}
        </p>

        <div className="flex items-center gap-1 text-xs text-gray-500 border-t pt-3 mt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{timeAgo(product.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};