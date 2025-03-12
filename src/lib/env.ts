// Environment variables with validation
export const env = {
  facebook: {
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN || (() => {
      console.error('FACEBOOK_ACCESS_TOKEN is not set');
      return '';
    })(),
    userId: process.env.FACEBOOK_USER_ID || '',
    pages: {
      queDuBien: process.env.FACEBOOK_PAGE_ID_QUE_DU_BIEN || '',
      astucesCuisine: process.env.FACEBOOK_PAGE_ID_ASTUCES_CUISINE || ''
    }
  }
} as const;

// Log environment status on startup
console.log('Environment loaded:', {
  hasFacebookToken: !!env.facebook.accessToken,
  tokenLength: env.facebook.accessToken?.length || 0,
  hasUserId: !!env.facebook.userId,
  hasPageIds: {
    queDuBien: !!env.facebook.pages.queDuBien,
    astucesCuisine: !!env.facebook.pages.astucesCuisine
  }
}); 