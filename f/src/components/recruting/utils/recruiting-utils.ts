/**
 * Format score from decimal to percentage
 */
export const formatScore = (score: number): number => {
  return Math.round(score * 100);
};

/**
 * Get score badge color class based on score value
 */
export const getScoreBadgeStyle = (score: number): string => {
  if (score >= 0.7) {
    return 'bg-green-500 text-white';
  } else if (score >= 0.5) {
    return 'bg-yellow-500 text-white';
  } else {
    return 'bg-red-500 text-white';
  }
};

/**
 * Get score badge color for hover states
 */
export const getScoreBadgeHoverStyle = (score: number): string => {
  if (score >= 0.7) {
    return 'bg-green-500 hover:bg-green-600 text-white border-green-600';
  } else if (score >= 0.5) {
    return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600';
  } else {
    return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
  }
};

/**
 * Get score text color for display
 */
export const getScoreColor = (score: number): string => {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.8) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Construct photo URL from base64 or URL string
 */
export const getPhotoUrl = (photo: any): string => {
  if (!photo) return '';

  // If photo is an object with base64 data
  if (typeof photo === 'object' && photo.base64) {
    return `data:image/jpeg;base64,${photo.base64}`;
  }

  // If photo is a string (old format or URL)
  if (typeof photo === 'string') {
    // If it's already a full URL, return it as is
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    // If it's a relative path, prepend API base URL
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';
    return `${API_BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
  }

  return '';
};

/**
 * Extract user's company from JWT token
 */
export const extractUserCompany = (token: string): string => {
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));

    // Company can be an object {id, name} or a string
    if (
      typeof tokenPayload.company === 'object' &&
      tokenPayload.company?.name
    ) {
      return tokenPayload.company.name;
    } else if (typeof tokenPayload.company === 'string') {
      return tokenPayload.company;
    } else {
      return tokenPayload.company_name || '';
    }
  } catch (error) {
    return '';
  }
};
