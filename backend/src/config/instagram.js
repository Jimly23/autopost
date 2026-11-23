import env from './env.js';

const instagramConfig = {
  appId: env.META_APP_ID,
  appSecret: env.META_APP_SECRET,
  redirectUri: env.META_REDIRECT_URI,
  apiVersion: env.META_API_VERSION,
  configId: env.CONFIGURATION_ID,

  // Unified Login (Facebook Login for Business) or legacy Instagram Login endpoints
  get authorizationUrl() {
    if (this.configId) {
      return this.apiVersion
        ? `https://www.facebook.com/${this.apiVersion}/dialog/oauth`
        : `https://www.facebook.com/dialog/oauth`;
    }
    return `https://www.instagram.com/oauth/authorize`;
  },

  get tokenUrl() {
    const versionPrefix = this.apiVersion ? `/${this.apiVersion}` : '';
    if (this.configId) {
      return `https://graph.facebook.com${versionPrefix}/oauth/access_token`;
    }
    return `https://api.instagram.com/oauth/access_token`;
  },

  get longLivedTokenUrl() {
    const versionPrefix = this.apiVersion ? `/${this.apiVersion}` : '';
    if (this.configId) {
      return `https://graph.facebook.com${versionPrefix}/oauth/access_token`;
    }
    return `https://graph.instagram.com/access_token`;
  },

  get graphApiBaseUrl() {
    const versionPrefix = this.apiVersion ? `/${this.apiVersion}` : '';
    return `https://graph.instagram.com${versionPrefix}`;
  },

  get graphFbApiBaseUrl() {
    const versionPrefix = this.apiVersion ? `/${this.apiVersion}` : '';
    return `https://graph.facebook.com${versionPrefix}`;
  },

  getBaseUrl(token) {
    if (token && typeof token === 'string' && token.startsWith('EAA')) {
      return this.graphFbApiBaseUrl;
    }
    return this.graphApiBaseUrl;
  },

  // Scopes for Instagram Login
  // instagram_business_basic — read profile + media
  // instagram_business_content_publish — publish content
  // instagram_business_manage_messages — manage messages (optional)
  scopes: [
    'instagram_business_basic',
    'instagram_business_content_publish',
  ],

  isConfigured() {
    return !!(this.appId && this.appSecret && this.redirectUri);
  },
};

export default instagramConfig;
