import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Site } from '../../api/types';

export interface AssetMapPoint {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  model: string;
  siteId: string | null;
  siteName: string;
  conditionScore: number;
  equipmentType?: string;
}

interface LeafletMapProps {
  assets: AssetMapPoint[];
  sites: Site[];
  selectedAssetId?: string;
  onSelectAsset?: (assetId: string) => void;
  onNavigateToAsset?: (assetId: string) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
  highlightSiteId?: string;
  fitToAssets?: boolean;
}

interface StatusStyle {
  bg: string;
  dot: string;
}

function markerStyle(status: string): StatusStyle {
  switch (status) {
    case 'Active':
      return { bg: '#1565C0', dot: '#E3F2FD' };
    case 'Available':
      return { bg: '#2E7D32', dot: '#EBF5ED' };
    case 'Idle':
      return { bg: '#D97706', dot: '#FEF3C7' };
    case 'Overdue':
      return { bg: '#C62828', dot: '#FEE2E2' };
    default:
      return { bg: '#78756E', dot: '#F7F2E6' };
  }
}

function buildAssetIcon(status: string, isSelected: boolean): L.DivIcon {
  const { bg, dot } = markerStyle(status);
  return L.divIcon({
    className: 'custom-asset-pin',
    html: `
      <div style="
        position: relative;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: ${bg};
          color: #FFFDF7;
          border: ${isSelected ? '3px solid #F7C83E' : '2px solid #FFFDF7'};
          border-radius: 6px;
          padding: 3px 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          box-shadow: ${isSelected ? '0 0 0 3px #242424, 3px 3px 0px #242424' : '2px 2px 0px rgba(36,36,36,0.35)'};
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${dot};
            display: inline-block;
          "></span>
        </div>
      </div>
    `,
    iconSize: [44, 22],
    iconAnchor: [22, 11],
  });
}

function buildClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: 'custom-cluster-icon',
    html: `
      <div style="
        background: #242424;
        color: #F7C83E;
        border: 2px solid #F7C83E;
        border-radius: 50%;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 2px 2px 0px rgba(36,36,36,0.4);
      ">${count}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  assets,
  sites,
  selectedAssetId,
  onSelectAsset,
  onNavigateToAsset,
  height = '500px',
  center = [12.9716, 77.61],
  zoom = 11,
  highlightSiteId,
  fitToAssets = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const sitesLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRefsRef = useRef<Map<string, L.Marker>>(new Map());
  const prevSelectedRef = useRef<string>('');

  const onSelectAssetRef = useRef(onSelectAsset);
  const onNavigateToAssetRef = useRef(onNavigateToAsset);
  useEffect(() => {
    onSelectAssetRef.current = onSelectAsset;
  }, [onSelectAsset]);
  useEffect(() => {
    onNavigateToAssetRef.current = onNavigateToAsset;
  }, [onNavigateToAsset]);

  // Initialize map once.
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' },
    ).addTo(map);

    L.control
      .attribution({ position: 'bottomright', prefix: 'CAT RentalAI · Operational View' })
      .addTo(map);

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      iconCreateFunction: buildClusterIcon,
    });
    clusterGroup.addTo(map);

    const sitesGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = clusterGroup;
    sitesLayerRef.current = sitesGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      sitesLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw site hubs.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const sitesGroup = sitesLayerRef.current;
    if (!map || !sitesGroup) return;

    sitesGroup.clearLayers();

    sites.forEach((site) => {
      const isHighlighted = highlightSiteId === site.site_id;

      L.circle([site.latitude, site.longitude], {
        radius: isHighlighted ? 1200 : 750,
        color: isHighlighted ? '#F7C83E' : '#242424',
        weight: isHighlighted ? 3 : 1.5,
        dashArray: isHighlighted ? undefined : '4, 4',
        fillColor: isHighlighted ? '#F7C83E' : '#EDE7D8',
        fillOpacity: isHighlighted ? 0.25 : 0.15,
      }).addTo(sitesGroup);

      const siteIcon = L.divIcon({
        className: 'site-hub-icon',
        html: `
          <div style="
            background: ${isHighlighted ? '#242424' : '#FFFDF7'};
            color: ${isHighlighted ? '#F7C83E' : '#242424'};
            border: 1px solid #242424;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
            white-space: nowrap;
            box-shadow: 2px 2px 0px rgba(36,36,36,0.15);
          ">
            ${site.site_id}
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([site.latitude, site.longitude], { icon: siteIcon }).addTo(sitesGroup);
    });
  }, [sites, highlightSiteId]);

  // Draw asset markers.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = markersLayerRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    markerRefsRef.current = new Map();

    assets.forEach((asset) => {
      if (!asset.latitude || !asset.longitude) return;

      const isSelected = selectedAssetId === asset.id;
      const icon = buildAssetIcon(asset.status, isSelected);

      const marker = L.marker([asset.latitude, asset.longitude], { icon });

      const popupHtml = `
        <div style="min-width: 220px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #EAE5D8; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 13px; color: #242424;">${asset.id}</span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #F7F2E6; border: 1px solid rgba(36,36,36,0.15);">${asset.status}</span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #242424; margin-bottom: 2px;">${asset.model}</div>
          <div style="font-size: 11px; color: #78756E; margin-bottom: 8px;">${asset.equipmentType ?? ''}${asset.siteName ? ` · ${asset.siteName}` : ''}</div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-inspect-${asset.id}" style="
              flex: 1;
              background: #242424;
              color: #FFFDF7;
              border: none;
              padding: 5px 8px;
              font-size: 11px;
              font-weight: 600;
              border-radius: 4px;
              cursor: pointer;
            ">View Details</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-leaflet-popup' });

      marker.on('click', () => {
        onSelectAssetRef.current?.(asset.id);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${asset.id}`);
        if (btn) {
          btn.onclick = () => onNavigateToAssetRef.current?.(asset.id);
        }
      });

      clusterGroup.addLayer(marker);
      markerRefsRef.current.set(asset.id, marker);
    });
  }, [assets, selectedAssetId]);

  // Fit map to the currently visible assets (initial load + filter changes).
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !fitToAssets || assets.length === 0) return;

    const bounds: L.LatLngExpression[] = [];
    assets.forEach((asset) => {
      if (asset.latitude && asset.longitude) {
        bounds.push([asset.latitude, asset.longitude]);
      }
    });
    if (bounds.length === 0) return;

    map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
  }, [assets, fitToAssets]);

  // Pan to the selected asset when the user picks one (skip the initial
  // auto-selection so the whole fleet stays in view on load).
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const prev = prevSelectedRef.current;
    const current = selectedAssetId ?? '';
    const skipPan = prev === '' && current !== '';
    prevSelectedRef.current = current;

    if (!current || skipPan) return;

    const marker = markerRefsRef.current.get(current);
    if (marker) {
      map.panTo(marker.getLatLng(), { animate: true });
    }
  }, [selectedAssetId]);

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border border-[#242424]/20 bg-[#F7F2E6]"
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Status legend */}
      <div className="absolute bottom-3 left-3 z-[500] bg-[#FFFDF7]/95 border border-[#242424]/20 rounded-md px-2.5 py-2 shadow-sm text-[10px] font-mono space-y-1 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1565C0]" /> Active
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2E7D32]" /> Available
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Idle
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C62828]" /> Overdue
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#78756E]" /> Unknown
        </div>
      </div>
    </div>
  );
};
