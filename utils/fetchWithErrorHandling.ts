/**
 * Enhanced fetch wrapper with better error handling
 * Provides more detailed error messages for debugging
 */
export const fetchWithErrorHandling = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    
    // If response is not ok, try to get error details
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.clone().json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If JSON parsing fails, use status text
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).response = response;
      throw error;
    }
    
    return response;
  } catch (error: any) {
    // Handle network errors (Failed to fetch)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const apiUrl = url.split('/api')[0] + '/api';
      const enhancedError = new Error(
        `Network error: Unable to connect to API at ${apiUrl}. ` +
        `Please check:\n` +
        `1. API server is running\n` +
        `2. API URL is correct (${apiUrl})\n` +
        `3. CORS is configured correctly\n` +
        `4. Network connection is active`
      );
      (enhancedError as any).isNetworkError = true;
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
    
    // Re-throw other errors
    throw error;
  }
};

