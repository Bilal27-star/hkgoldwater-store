export type SocialPlatformId = "facebook" | "instagram" | "tiktok" | "whatsapp";

export type SocialPlatformEntry = {
  enabled: boolean;
  /** Full URL for facebook/instagram/tiktok; E.164-style phone for WhatsApp */
  value: string;
};

export type SocialMediaState = Record<SocialPlatformId, SocialPlatformEntry>;
