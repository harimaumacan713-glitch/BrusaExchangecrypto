import React from 'react';

export function StockPriceSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-6 bg-gray-300 rounded w-full"></div>
    </div>
  );
}
