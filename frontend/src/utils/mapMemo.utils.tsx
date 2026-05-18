import { memo, useMemo } from "react";
import { Marker } from "@react-google-maps/api";
import type { MarkerItem } from "../types";
import {
  getLatLngFromItem,
  createStateLabel,
  createLabel,
  getCityOrClusterCount,
  isShopStatus,
  createClusterTitle,
  getShopCircleIcon,
} from "./map.utils";
import { MARKER_THEME } from "../config";

// state
export const StateMarkers = memo(
  ({
    markers,
    icon,
    onClick,
  }: {
    markers: MarkerItem[];
    icon: google.maps.Icon;
    onClick: (item: MarkerItem) => void;
  }) => {
    return (
      <>
        {markers.map((item, index) => {
          if (!item.latitude || !item.longitude) return null;
          const stateKey =
            item.state?.trim() ||
            item.properties?.state?.trim() ||
            `unknown-${index}`;

          return (
            <Marker
              key={`state-${stateKey}`}
              position={{
                lat: item.latitude,
                lng: item.longitude,
              }}
              icon={icon}
              label={createStateLabel(item.count || 0)}
              onClick={() => onClick(item)}
            />
          );
        })}
      </>
    );
  },
);

// city
export const CityMarkers = memo(
  ({
    markers,
    icon,
    clusterIcon,
    onClick,
    onClusterClick,
    zoom,
  }: {
    markers: MarkerItem[];
    icon: google.maps.Icon;
    clusterIcon: google.maps.Icon;
    onClick: (item: MarkerItem) => void;
    onClusterClick: (lat: number, lng: number, zoom: number) => void;
    zoom: number;
  }) => {
    return (
      <>
        {markers.map((item, index) => {
          const pos = getLatLngFromItem(item);
          if (!pos) return null;

          const isCluster = item.properties?.cluster === true;

          if (isCluster) {
            const clusterKey =
              item.properties?.cluster_id ?? item.id ?? `c-${index}`;

            return (
              <Marker
                key={`city-cluster-${clusterKey}`}
                position={pos}
                icon={clusterIcon}
                label={createLabel(item.properties?.point_count || 0)}
                options={{ optimized: false }}
                onClick={() => onClusterClick(pos.lat, pos.lng, zoom)}
              />
            );
          }

          const cityKey =
            item.properties?.id ?? `${pos.lat}-${pos.lng}-${index}`;

          return (
            <Marker
              key={`city-${cityKey}`}
              position={pos}
              icon={icon}
              label={createLabel(getCityOrClusterCount(item))}
              options={{ optimized: false }}
              onClick={() => onClick(item)}
            />
          );
        })}
      </>
    );
  },
);

// shop
export const ClusterMarkers = memo(
  ({
    markers,
    onClusterClick,
    onStoreClick,
  }: {
    markers: MarkerItem[];
    clusterIcon: google.maps.Icon;
    onClusterClick: (lat: number, lng: number) => void;
    onStoreClick: (item: MarkerItem) => void;
  }) => {
    const filteredMarkers = useMemo(() => {
      return markers.filter((item) => {
        if (item.properties?.cluster) return true;
        if (item.properties?.type === "CITY") return false;
        if (isShopStatus(item.properties?.status)) return true;
        return false;
      });
    }, [markers]);

    return (
      <>
        {filteredMarkers.map((item: MarkerItem, index: number) => {
          if (!item.geometry) return null;

          const [lng, lat] = item.geometry.coordinates as [number, number];

          const isCluster = item.properties?.cluster;

          if (isCluster) {
            const clusterCount = item.properties?.point_count || 0;

            return (
              <Marker
                key={`cluster-${item.properties?.cluster_id ?? index}`}
                position={{ lat, lng }}
                label={createLabel(clusterCount)}
                title={createClusterTitle(clusterCount)}
                options={{ optimized: false }}
                onClick={() => onClusterClick(lat, lng)}
              />
            );
          }

          const shopKey =
            item.properties?.id ??
            `${lng}-${lat}-${item.properties?.brand_name ?? index}`;

          return (
            <Marker
              key={`store-${shopKey}`}
              position={{ lat, lng }}
              icon={getShopCircleIcon(
                google.maps,
                MARKER_THEME.store,
                item.properties?.brand_name,
              )}
              options={{ optimized: false }}
              onClick={() => onStoreClick(item)}
            />
          );
        })}
      </>
    );
  },
);
