import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
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
}

function markerColor(status: string): { bg: string; indicator: string } {
  switch (status) {
    case 'Active':
      return { bg: '#242424', indicator: '#1565C0' };
    case 'Available':
      return { bg: '#2E7D32', indicator: '#2E7D32' };
    case 'Idle':
      return { bg: '#D97706', indicator: '#D97706' };
    case 'Overdue':
      return { bg: '#C62828', indicator: '#C62828' };
    default:
      return { bg: '#55534E', indicator: '#78756E' };
  }
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const sitesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
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
        .attribution({ position: 'bottomright', prefix: 'SMART RENTAL Telemetry Grid' })
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const sitesGroup = L.layerGroup().addTo(map);

      markersLayerRef.current = markersGroup;
      sitesLayerRef.current = sitesGroup;
      mapInstanceRef.current = map;
    }
  }, [center, zoom]);

  // Update Markers and Sites
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const sitesGroup = sitesLayerRef.current;

    if (!map || !markersGroup || !sitesGroup) return;

    markersGroup.clearLayers();
    sitesGroup.clearLayers();

    // 1. Draw Site Hubs
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
            transform: translate(-50%, -120%);
          ">
            ${site.site_id}
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([site.latitude, site.longitude], { icon: siteIcon }).addTo(sitesGroup);
    });

    // 2. Draw Asset Markers
    const bounds: L.LatLngExpression[] = [];

    assets.forEach((asset) => {
      if (!asset.latitude || !asset.longitude) return;
      bounds.push([asset.latitude, asset.longitude]);

      const isSelected = selectedAssetId === asset.id;
      const { bg: markerBg, indicator: statusIndicator } = markerColor(asset.status);

      const customIcon = L.divIcon({
        className: `custom-asset-pin ${isSelected ? 'selected-pin' : ''}`,
        html: `
          <div style="
            position: relative;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              background: ${markerBg};
              color: #FFFDF7;
              border: ${isSelected ? '3px solid #F7C83E' : '2px solid #FFFDF7'};
              border-radius: 6px;
              padding: 3px 6px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              font-weight: 700;
              box-shadow: ${isSelected ? '0 0 0 3px #242424, 3px 3px 0px #242424' : '2px 2px 0px rgba(36,36,36,0.3)'};
              display: flex;
              align-items: center;
              gap: 4px;
              transition: all 0.15s ease;
            ">
              <span style="
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: ${statusIndicator};
                display: inline-block;
              "></span>
              ${asset.id}
            </div>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const marker = L.marker([asset.latitude, asset.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="min-width: 220px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #EAE5D8; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 13px; color: #242424;">${asset.id}</span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #F7F2E6; border: 1px solid rgba(36,36,36,0.15);">${asset.status}</span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #242424; margin-bottom: 4px;">${asset.model}</div>
          <div style="font-size: 11px; color: #78756E; margin-bottom: 8px;">${asset.siteName} (${asset.siteId ?? 'Unassigned'})</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #F7F2E6; padding: 6px; border-radius: 4px; font-size: 11px; margin-bottom: 10px; border: 1px solid rgba(36,36,36,0.1);">
            <div><span style="color: #78756E;">Condition:</span> <strong>${asset.conditionScore.toFixed(1)}</strong></div>
          </div>
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
            ">View Telemetry</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-leaflet-popup' });

      marker.on('click', () => {
        if (onSelectAsset) {
          onSelectAsset(asset.id);
        }
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${asset.id}`);
        if (btn && onNavigateToAsset) {
          btn.onclick = () => onNavigateToAsset(asset.id);
        }
      });

      marker.addTo(markersGroup);
    });

    if (selectedAssetId) {
      const selected = assets.find((a) => a.id === selectedAssetId);
      if (selected && selected.latitude && selected.longitude) {
        map.panTo([selected.latitude, selected.longitude], { animate: true });
      }
    }
  }, [assets, sites, selectedAssetId, highlightSiteId, onSelectAsset, onNavigateToAsset]);

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border border-[#242424]/20 bg-[#F7F2E6]"
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
