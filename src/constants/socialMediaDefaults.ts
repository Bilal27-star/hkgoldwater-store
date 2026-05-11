import type { SocialMediaState } from "../admin/types/socialMedia";

/** Shown in admin + footer when API/DB has no links yet. */
export const SOCIAL_MEDIA_DEFAULTS: SocialMediaState = {
  facebook: {
    enabled: true,
    value: "https://www.facebook.com/HKGoldWater"
  },
  instagram: {
    enabled: true,
    value: "https://www.instagram.com/HKGoldWater"
  },
  tiktok: {
    enabled: false,
    value: ""
  },
  whatsapp: {
    enabled: true,
    value: "+213 555 123 456"
  }
};
