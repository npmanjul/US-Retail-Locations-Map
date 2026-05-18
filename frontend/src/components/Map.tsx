import { GoogleMap, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiResponse, DataResponse, MarkerItem } from "../types";
import {
  getLatLngFromItem,
  tierFromZoom,
  zoomForRequest,
  createCountMarkerIcon,
  createShopClusterIcon,
  iconCache,
  getCityOrClusterCount,
  getStateDisplayName,
} from "../utils/map.utils";
import {
  StateMarkers,
  CityMarkers,
  ClusterMarkers,
} from "../utils/mapMemo.utils";
import { MARKER_THEME } from "../config";
import { apiClient } from "../services/axiosClient";

const DEFAULT_ZOOM = 4;

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795,
};

const containerStyle = {
  width: "100%",
  height: "100vh",
};

// debounce utility
const debounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

export const MapView = () => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const lastRequestRef = useRef("");
  const fetchGenerationRef = useRef(0);
  const [markers, setMarkers] = useState<MarkerItem[]>([]);
  const [mapType, setMapType] = useState<DataResponse["type"]>("STATE");
  const [selectedStore, setSelectedStore] = useState<MarkerItem | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const fetchViewportData = useCallback(async () => {
    if (!mapRef.current) return;

    const bounds = mapRef.current.getBounds();

    if (!bounds) return;

    const north = bounds.getNorthEast().lat();
    const east = bounds.getNorthEast().lng();

    const south = bounds.getSouthWest().lat();
    const west = bounds.getSouthWest().lng();

    const currentZoom = mapRef.current.getZoom() || DEFAULT_ZOOM;
    const zoomInt = zoomForRequest(currentZoom);

    const requestKey = `${north}-${south}-${east}-${west}-${zoomInt}`;

    if (lastRequestRef.current === requestKey) {
      return;
    }

    lastRequestRef.current = requestKey;

    const generation = ++fetchGenerationRef.current;

    try {
      const result = await apiClient.get<ApiResponse>("/map/viewport", {
        north,
        south,
        east,
        west,
        zoom: zoomInt,
      });

      if (generation !== fetchGenerationRef.current) {
        return;
      }

      const zNow = zoomForRequest(mapRef.current?.getZoom() ?? currentZoom);

      if (result.data.type !== tierFromZoom(zNow)) {
        return;
      }

      setMapType(result.data.type);
      setMarkers(result.data.data || []);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const debouncedFetch = useMemo(() => {
    return debounce(fetchViewportData, 300);
  }, [fetchViewportData]);

  const mapOptions = useMemo(
    () => ({
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      clickableIcons: false,
    }),
    [],
  );

  const icons = useMemo(() => {
    if (!isLoaded) return null;
    return {
      state: createCountMarkerIcon(google.maps, MARKER_THEME.state, 44),
      city: createCountMarkerIcon(google.maps, MARKER_THEME.city, 42),
      cluster: createCountMarkerIcon(google.maps, MARKER_THEME.cluster, 42),
      shopCluster: createShopClusterIcon(google.maps),
    };
  }, [isLoaded]);

  const handleZoomChanged = useCallback(() => {
    if (!mapRef.current) return;

    const currentZoom = mapRef.current.getZoom() || DEFAULT_ZOOM;
    setZoom(currentZoom);

    const newTier = tierFromZoom(zoomForRequest(currentZoom));

    if (newTier !== mapType) {
      setMarkers([]);
      setSelectedStore(null);
      lastRequestRef.current = "";
      setMapType(newTier);
    }

    debouncedFetch();
  }, [mapType, debouncedFetch]);

  useEffect(() => {
    return () => {
      iconCache.clear();
    };
  }, []);

  if (!isLoaded || !icons) {
    return (
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        Loading Map...
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={DEFAULT_ZOOM}
      options={mapOptions}
      onLoad={(map) => {
        mapRef.current = map;
        fetchViewportData();
      }}
      onIdle={() => {
        debouncedFetch();
      }}
      onZoomChanged={handleZoomChanged}
    >
      {/* STATE LAYER - Only render when mapType is STATE */}
      {mapType === "STATE" && markers.length > 0 && (
        <StateMarkers
          markers={markers}
          icon={icons.state}
          onClick={(item) => {
            setSelectedStore(item);

            mapRef.current?.panTo({
              lat: item.latitude!,
              lng: item.longitude!,
            });

            mapRef.current?.setZoom(9);
          }}
        />
      )}

      {/* CITY LAYER - Only render when mapType is CITY */}
      {mapType === "CITY" && markers.length > 0 && (
        <CityMarkers
          markers={markers}
          icon={icons.city}
          clusterIcon={icons.cluster}
          zoom={zoom}
          onClick={(item) => {
            setSelectedStore(item);

            const pos = getLatLngFromItem(item);
            if (pos) {
              mapRef.current?.panTo(pos);
            }

            mapRef.current?.setZoom(12);
          }}
          onClusterClick={(lat: number, lng: number) => {
            mapRef.current?.panTo({ lat, lng });
            mapRef.current?.setZoom(
              Math.min((mapRef.current.getZoom() || 0) + 2, 20),
            );
          }}
        />
      )}

      {/* SHOP LAYER - Only render when mapType is SHOP */}
      {mapType === "SHOP" && markers.length > 0 && (
        <ClusterMarkers
          markers={markers}
          clusterIcon={icons.shopCluster}
          onClusterClick={(lat: number, lng: number) => {
            mapRef.current?.panTo({ lat, lng });

            const z = mapRef.current?.getZoom() ?? zoom;
            mapRef.current?.setZoom(Math.min(z + 2, 20));
          }}
          onStoreClick={(item: MarkerItem) => {
            setSelectedStore(item);
          }}
        />
      )}

      {/* =========================================================
         INFO WINDOW
      ========================================================= */}

      {selectedStore && (
        <InfoWindow
          position={{
            lat:
              selectedStore.latitude ??
              selectedStore.geometry?.coordinates[1] ??
              defaultCenter.lat,

            lng:
              selectedStore.longitude ??
              selectedStore.geometry?.coordinates[0] ??
              defaultCenter.lng,
          }}
          onCloseClick={() => setSelectedStore(null)}
        >
          <div
            style={{
              minWidth: 260,
              fontFamily:
                "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(15,23,42,0.15)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 14px",
                color: "#fff",
                background:
                  mapType === "STATE"
                    ? MARKER_THEME.state
                    : mapType === "CITY"
                      ? MARKER_THEME.city
                      : MARKER_THEME.store,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>
                {mapType === "SHOP"
                  ? (selectedStore.brand_name ??
                    selectedStore.properties?.brand_name ??
                    "Shop")
                  : mapType === "CITY"
                    ? (selectedStore.properties?.city ??
                      selectedStore.city ??
                      "City")
                    : getStateDisplayName(selectedStore)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.92 }}>
                {mapType === "STATE" &&
                  `Total stores: ${(selectedStore.count ?? 0).toLocaleString()}`}
                {mapType === "CITY" &&
                  `Stores in city: ${getCityOrClusterCount(selectedStore)}`}
                {mapType === "SHOP" &&
                  (selectedStore.properties?.city ?? selectedStore.city)}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: 12, background: "#fff", color: "#0f172a" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#374151" }}>Status</div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 9999,
                      background:
                        (
                          selectedStore.status ??
                          selectedStore.properties?.status ??
                          ""
                        ).toLowerCase() === "active"
                          ? "#10b981"
                          : "#6b7280",
                      color: "#fff",
                      padding: "4px 8px",
                    }}
                  >
                    {selectedStore.status ??
                      selectedStore.properties?.status ??
                      "Unknown"}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>
                <strong>City:</strong>{" "}
                {selectedStore.properties?.city ?? selectedStore.city ?? "—"}
              </div>

              <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>
                <strong>State:</strong>{" "}
                {selectedStore.properties?.state ?? selectedStore.state ?? "—"}
              </div>

              <div style={{ fontSize: 12, color: "#64748b" }}>
                <strong>Coordinates:</strong>{" "}
                {(
                  (selectedStore.latitude ??
                    selectedStore.geometry?.coordinates?.[1]) ||
                  defaultCenter.lat
                ).toFixed(4)}
                ,{" "}
                {(
                  (selectedStore.longitude ??
                    selectedStore.geometry?.coordinates?.[0]) ||
                  defaultCenter.lng
                ).toFixed(4)}
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};
