import type { ApiResponse, MarkerItem } from "../types";
// utility-only module (no JSX). React and Marker are not imported here.

// Generic function

// Select the zoom tiers
export const tierFromZoom = (z: number): ApiResponse["type"] => {
  const zi = Math.floor(Number(z));
  if (zi <= 8) return "STATE";
  if (zi < 12) return "CITY";
  return "SHOP";
};

// Zoom sent to API
export const zoomForRequest = (z: number): number => {
  return Math.floor(Number(z));
};

// GeoJSON Point uses [lng, lat]
export const getLatLngFromItem = (
  item: MarkerItem,
): { lat: number; lng: number } | null => {
  const coords = item.geometry?.coordinates;
  if (
    coords &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number" &&
    !Number.isNaN(coords[0]) &&
    !Number.isNaN(coords[1])
  ) {
    const [lng, lat] = coords;
    return { lat, lng };
  }

  if (
    item.latitude != null &&
    item.longitude != null &&
    typeof item.latitude === "number" &&
    typeof item.longitude === "number"
  ) {
    return { lat: item.latitude, lng: item.longitude };
  }

  return null;
};

// get count for city or cluster items
export const getCityOrClusterCount = (item: MarkerItem): number => {
  if (item.properties?.cluster) {
    return item.properties.point_count ?? 0;
  }
  return item.properties?.count ?? item.count ?? 0;
};

export const getStateDisplayName = (item: MarkerItem, index = 0): string => {
  const rawState = item.state ?? item.properties?.state ?? "";
  const trimmed = rawState.trim();

  if (trimmed) return trimmed;

  const fallback = item.count ?? item.properties?.count ?? 0;
  return fallback > 0 ? `Unknown State ${index + 1}` : `Unknown State`;
};

// Determine if a shop is active based on its status
export const isShopStatus = (status: string | undefined): boolean => {
  if (!status) return false;

  const normalized = status.trim().toLowerCase();
  return normalized === "active" || normalized === "shop";
};

// icons

export const iconCache = new globalThis.Map<string, google.maps.Icon>();

// Custom count marker icon with dynamic fill color and size
export const createCountMarkerIcon = (
  maps: typeof google.maps,
  fill: string,
  size: number,
): google.maps.Icon => {
  const key = `${fill}-${size}`;

  if (iconCache.has(key)) {
    return iconCache.get(key)!;
  }

  const half = size / 2;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle
      cx="${half}"
      cy="${half}"
      r="${half - 2}"
      fill="${fill}"
      stroke="white"
      stroke-width="2"
    />
  </svg>
  `;

  const icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(size, size),
    anchor: new maps.Point(half, half),
    labelOrigin: new maps.Point(half, half),
  };

  iconCache.set(key, icon);

  return icon;
};

// Shop cluster icon
export const createShopClusterIcon = (
  maps: typeof google.maps,
): google.maps.Icon => {
  const key = "shop-cluster-multi";

  if (iconCache.has(key)) {
    return iconCache.get(key)!;
  }

  const size = 52;
  const half = size / 2;
  const mainRadius = 18;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="shopClusterFill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
      <filter id="shopClusterShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <circle cx="16" cy="16" r="6" fill="#fde68a" opacity="0.98"/>
    <circle cx="36" cy="16" r="6" fill="#f59e0b" opacity="0.98"/>
    <circle cx="26" cy="32" r="7" fill="#d97706" opacity="0.98"/>
    <circle cx="${half}" cy="${half}" r="${mainRadius}" fill="url(#shopClusterFill)" stroke="#ffffff" stroke-width="2.5" filter="url(#shopClusterShadow)"/>
    <circle cx="${half}" cy="${half}" r="7.5" fill="#ffffff" opacity="0.22"/>
  </svg>
  `;

  const icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(size, size),
    anchor: new maps.Point(half, half),
  };

  iconCache.set(key, icon);
  return icon;
};

export const getShopCircleIcon = (
  maps: typeof google.maps,
  fill: string,
  brandName: string | undefined,
): google.maps.Icon => {
  const display = truncateShopLabel(brandName ?? "", 13);
  const cacheKey = `shop-circle-${fill}-${display}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const size = 58;
  const half = size / 2;
  const r = half - 4;
  const fontSize =
    display.length > 10
      ? 8
      : display.length > 7
        ? 9
        : display.length > 5
          ? 10
          : 11;
  const safe = escapeXml(display);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="scFill-${encodeURIComponent(display)}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4ade80"/>
        <stop offset="55%" stop-color="${fill}"/>
        <stop offset="100%" stop-color="#14532d"/>
      </linearGradient>
      <filter id="scSh-${encodeURIComponent(display)}" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <circle cx="${half}" cy="${half}" r="${r + 2.5}" fill="${fill}" opacity="0.18"/>
    <circle cx="${half}" cy="${half}" r="${r}" fill="url(#scFill-${encodeURIComponent(display)})" stroke="#ffffff" stroke-width="2.5" filter="url(#scSh-${encodeURIComponent(display)})"/>
    <text x="${half}" y="${half + fontSize * 0.32}" text-anchor="middle" font-family="system-ui,-apple-system,BlinkMacSystemFont,sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">${safe}</text>
  </svg>
  `;

  const icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(size, size),
    anchor: new maps.Point(half, half),
  };

  iconCache.set(cacheKey, icon);
  return icon;
};

// label helpers

// Utility functions for map labels and cluster titles
export const createLabel = (count: number): google.maps.MarkerLabel => {
  return {
    text: String(count),
    color: "#fff",
    fontWeight: "700",
    fontSize: "12px",
  };
};

// Create a title for clusters
export const createClusterTitle = (count: number): string => {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  return n === 1 ? "1 shop in this cluster" : `${n} shops in this cluster`;
};

// State layer: 1000+ as 1k, 2k, 3.5k, 12.3k
const formatStateCount = (count: number): string => {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n < 1000) return String(n);
  const k = n / 1000;
  const rounded = Math.round(k * 10) / 10;
  if (Number.isInteger(rounded)) return `${rounded}k`;
  return `${rounded}k`;
};

// Create a label for state markers, using the formatted count
export const createStateLabel = (count: number): google.maps.MarkerLabel => {
  const text = formatStateCount(count);
  const fontSize = text.length > 3 ? "11px" : "12px";
  return {
    text,
    color: "#fff",
    fontWeight: "700",
    fontSize,
  };
};

export const truncateShopLabel = (name: string, max = 22): string => {
  const t = name.trim();
  if (!t) return "Shop";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
};

export const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};
