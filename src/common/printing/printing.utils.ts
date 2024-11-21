import { PrintConfig } from './printing.config';

export function calculateNumPages(
  totalPages: number,
  pageSize: number[],
  duplex: boolean,
  copies: number,
): number {
  if (!Array.isArray(pageSize) || pageSize.length !== 2) {
    throw new Error(
      'Invalid pageSize. It must be an array with two values: [height, width].',
    );
  }

  const [height, width] = pageSize;

  if (height <= 0 || width <= 0) {
    throw new Error('Height and width must be positive numbers.');
  }

  if (totalPages <= 0) {
    throw new Error('Total pages must be a positive number.');
  }

  const [standardHeight, standardWidth] = PrintConfig.printingStadarSize;

  // Calculate area-based adjustment factor
  const standardArea = standardHeight * standardWidth; // Standard area in mm²
  const pageArea = height * width; // Current page area in mm²
  const areaAdjustmentFactor = pageArea / standardArea;

  // Adjust total pages based on area
  const adjustedPages = Math.ceil(totalPages / areaAdjustmentFactor) * copies;

  // Handle duplex printing
  if (duplex) {
    return Math.ceil(adjustedPages / 2); // Each sheet can print 2 pages
  } else {
    return adjustedPages; // Single-sided: each page requires one sheet
  }
}
