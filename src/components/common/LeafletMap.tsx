import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Asset, SiteInfo } from '../../data/initialFleetData';

interface LeafletMapProps {
  assets: Asset[];
  sites: Record<string, SiteInfo>;
  selectedAssetId?: string;
  onSelectAsset?: (assetId: string) => void;
  onNavigateToAsset?: (assetId: string) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
  highlightSiteId?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  assets,
  sites,
  selectedAssetId,
  onSelectAsset,
  onNavigateToAsset,
  height = '500px',
  center = [12.9716, 77.61],
  zoom = 12,
  highlightSiteId
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
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false
      });

      // Warm minimalist light tiles (CartoDB Positron / Voyager)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright', prefix: 'SMART RENTAL Telemetry Grid' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const sitesGroup = L.layerGroup().addTo(map);

      markersLayerRef.current = markersGroup;
      sitesLayerRef.current = sitesGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount handled gracefully
    };
  }, []);

  // Update Markers and Sites
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const sitesGroup = sitesLayerRef.current;

    if (!map || !markersGroup || !sitesGroup) return;

    markersGroup.clearLayers();
    sitesGroup.clearLayers();

    // 1. Draw Site Hubs
    Object.values(sites).forEach((site) => {
      const isHighlighted = highlightSiteId === site.id;

      // Site circle
      const circle = L.circle([site.lat, site.lng], {
        radius: isHighlighted ? 1200 : 750,
        color: isHighlighted ? '#F7C83E' : '#242424',
        weight: isHighlighted ? 3 : 1.5,
        dashArray: isHighlighted ? undefined : '4, 4',
        fillColor: isHighlighted ? '#F7C83E' : '#EDE7D8',
        fillOpacity: isHighlighted ? 0.25 : 0.15
      });

      // Site Label Marker
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
            ${site.id} · ${site.name.split(' ')[0]}
          </div>
        `,
        iconSize: [0, 0]
      });

      const siteMarker = L.marker([site.lat, site.lng], { icon: siteIcon });
      circle.addTo(sitesGroup);
      siteMarker.addTo(sitesGroup);
    });

    // 2. Draw Asset Markers
    const bounds: L.LatLngExpression[] = [];

    assets.forEach((asset) => {
      if (!asset.latitude || !asset.longitude) return;
      bounds.push([asset.latitude, asset.longitude]);

      const isSelected = selectedAssetId === asset.id;
      const isDemoAnomaly = asset.id === 'EQX1007';
      const isDemoRebalance = asset.id === 'EQX1004';

      let markerBg = '#242424';
      let markerBorder = '#FFFDF7';
      let statusIndicator = '#2E7D32';

      if (asset.status === 'Rented') {
        markerBg = '#242424';
        statusIndicator = '#1565C0';
      } else if (asset.status === 'Available') {
        markerBg = '#2E7D32';
        statusIndicator = '#2E7D32';
      } else if (asset.status === 'Maintenance') {
        markerBg = '#D97706';
        statusIndicator = '#D97706';
      } else if (asset.status === 'Overdue') {
        markerBg = '#C62828';
        statusIndicator = '#C62828';
      }

      if (isDemoAnomaly) {
        markerBg = '#C62828';
        markerBorder = '#F7C83E';
      } else if (isDemoRebalance) {
        markerBorder = '#F7C83E';
      }

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
              border: ${isSelected ? '3px solid #F7C83E' : `2px solid ${markerBorder}`};
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
                background: ${isDemoAnomaly ? '#F7C83E' : statusIndicator};
                display: inline-block;
              "></span>
              ${asset.id}
            </div>
            ${isDemoAnomaly ? `
              <span style="
                position: absolute;
                top: -8px;
                right: -8px;
                background: #F7C83E;
                color: #242424;
                font-size: 9px;
                font-weight: 900;
                border-radius: 50%;
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #242424;
              ">!</span>
            ` : ''}
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

      const marker = L.marker([asset.latitude, asset.longitude], { icon: customIcon });

      // Build popup content
      const popupHtml = `
        <div style="min-width: 220px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #EAE5D8; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 13px; color: #242424;">${asset.id}</span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #F7F2E6; border: 1px solid rgba(36,36,36,0.15);">${asset.status}</span>
          </div>
          
          <div style="font-size: 12px; font-weight: 600; color: #242424; margin-bottom: 4px;">${asset.modelName}</div>
          <div style="font-size: 11px; color: #78756E; margin-bottom: 8px;">${asset.siteName} (${asset.siteId})</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #F7F2E6; padding: 6px; border-radius: 4px; font-size: 11px; margin-bottom: 10px; border: 1px solid rgba(36,36,36,0.1);">
            <div><span style="color: #78756E;">Util:</span> <strong>${asset.utilization}%</strong></div>
            <div><span style="color: #78756E;">Idle:</span> <strong>${asset.idleHoursPerDay}h/d</strong></div>
            <div><span style="color: #78756E;">Op:</span> <strong>${asset.operatorId || 'Unassigned'}</strong></div>
            <div><span style="color: #78756E;">Fuel:</span> <strong>${asset.fuelLevelPct}%</strong></div>
          </div>

          ${isDemoAnomaly ? `
            <div style="background: #FEE2E2; border: 1px solid #C62828; color: #C62828; padding: 4px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-bottom: 8px;">
              ⚠️ AI Alert: 12.0h Idle / 0% Util Anomaly
            </div>
          ` : ''}

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

    // If specific asset selected, pan smoothly
    if (selectedAssetId) {
      const selected = assets.find((a) => a.id === selectedAssetId);
      if (selected && selected.latitude && selected.longitude) {
        map.panTo([selected.latitude, selected.longitude], { animate: true });
      }
    }
  }, [assets, sites, selectedAssetId, highlightSiteId, onSelectAsset, onNavigateToAsset]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-[#242424]/20 bg-[#F7F2E6]" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
