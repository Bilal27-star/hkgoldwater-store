/** Website settings payload — mirrors future `PUT /settings` body */
export type WebsiteSettings = {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  /** Base64 data URL or external image URL */
  logo: string;
  footerText: string;
};

export const WEBSITE_SETTINGS_INITIAL: WebsiteSettings = {
  storeName: "",
  email: "",
  phone: "",
  address: "",
  logo: "",
  footerText: ""
};
