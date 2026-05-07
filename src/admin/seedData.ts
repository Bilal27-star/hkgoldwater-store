import type {
  AdminCategory,
  AdminCustomer,
  AdminOrder,
  SiteSettings
} from "./types";

export const seedCategories: AdminCategory[] = [];

export const seedOrders: AdminOrder[] = [];

export const seedCustomers: AdminCustomer[] = [];

export const defaultSettings: SiteSettings = {
  websiteName: "HKGoldWater",
  contactEmail: "info@hkgoldwater.com",
  contactPhone: "+213 (0) 555 123 456",
  logoDataUrl: null
};
