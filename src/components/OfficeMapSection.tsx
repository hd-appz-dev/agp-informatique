import {useCallback, useEffect, useRef, useState} from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  AlertCircle,
  Clock,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Route as RouteIcon,
} from 'lucide-react';
import {COMMUNE_PRESETS, INTERVENTION_CITIES} from '../data/services';
import {isQuotaError, type AgpPlaceData} from '../hooks/useAgpPlaceData';

interface OfficeMapSectionProps {
  place: AgpPlaceData | null;
  isLoading: boolean;
  hasApiKey: boolean;
}

// Neutral municipal center of Les Clayes-sous-Bois used only while Place details load
const LES_CLAYES_CENTER: google.maps.LatLngLiteral = {lat: 48.8211, lng: 1.9869};

interface RouteSummary {
  distanceText: string;
  durationText: string;
  originLabel: string;
}

function MapViewportController({
  target,
  routePolylineBounds,
}: {
  target: google.maps.LatLngLiteral | null;
  routePolylineBounds: google.maps.LatLngBounds | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (routePolylineBounds) {
      map.fitBounds(routePolylineBounds, {top: 48, right: 48, bottom: 48, left: 48});
      return;
    }
    if (target) {
      map.panTo(target);
      map.setZoom(15);
    }
  }, [map, target, routePolylineBounds]);

  return null;
}

function OfficeMarkerWithWindow({place}: {place: AgpPlaceData}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(true);

  if (!place.location) return null;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        title={place.displayName}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Pin background="#1d4ed8" borderColor="#1e3a8a" glyphColor="#ffffff" scale={1.15} />
      </AdvancedMarker>

      {open && marker && (
        <InfoWindow anchor={marker} maxWidth={280} onCloseClick={() => setOpen(false)}>
          <div className="p-1 text-slate-900 space-y-1.5">
            <div className="font-display font-bold text-sm">{place.displayName}</div>
            {place.formattedAddress && (
              <p className="text-xs text-slate-600 leading-snug">{place.formattedAddress}</p>
            )}
            {place.nationalPhoneNumber && (
              <p className="text-xs font-mono text-slate-800 tabular-nums">
                {place.nationalPhoneNumber}
              </p>
            )}
            {(place.directionsUri || place.googleMapsUri) && (
              <a
                href={place.directionsUri || place.googleMapsUri || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline pt-1"
              >
                <span>Ouvrir dans Google Maps</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function RouteOverlayController({
  destination,
  originInput,
  originCoords,
  requestSeq,
  onRouteComputed,
  onRouteError,
  onComputingChange,
}: {
  destination: google.maps.LatLngLiteral | null;
  originInput: string;
  originCoords: google.maps.LatLngLiteral | null;
  requestSeq: number;
  onRouteComputed: (summary: RouteSummary, bounds: google.maps.LatLngBounds | null) => void;
  onRouteError: (msg: string) => void;
  onComputingChange: (loading: boolean) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (requestSeq === 0) return;
    if (!map || !routesLib || !destination) return;
    if (!originCoords && !originInput.trim()) return;

    let cancelled = false;

    async function runCompute() {
      onComputingChange(true);
      onRouteError('');

      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];

      try {
        const originValue: google.maps.LatLngLiteral | string = originCoords
          ? originCoords
          : originInput.trim();

        const response = await routesLib!.Route.computeRoutes({
          origin: originValue,
          destination: destination!,
          travelMode: 'DRIVING',
          fields: ['distanceMeters', 'durationMillis', 'path', 'localizedValues', 'viewport'],
          language: 'fr',
          region: 'FR',
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        });

        if (cancelled) return;

        const route = response.routes?.[0];
        if (!route) {
          onRouteError('Aucun itinéraire trouvé depuis ce point de départ.');
          return;
        }

        const lines = route.createPolylines({
          polylineOptions: {
            strokeColor: '#1d4ed8',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          },
        });
        lines.forEach((line) => line.setMap(map));
        polylinesRef.current = lines;

        const distanceText =
          route.localizedValues?.distance ||
          (route.distanceMeters ? `${(route.distanceMeters / 1000).toFixed(1)} km` : '—');
        const durationText =
          route.localizedValues?.duration ||
          (route.durationMillis ? `${Math.round(route.durationMillis / 60000)} min` : '—');

        onRouteComputed(
          {
            distanceText,
            durationText,
            originLabel: originCoords ? 'Votre position actuelle' : originInput.trim(),
          },
          route.viewport ?? null
        );
      } catch (err) {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteError(
          "Impossible de calculer l'itinéraire depuis cette adresse. Vérifiez la saisie ou ouvrez Google Maps."
        );
      } finally {
        if (!cancelled) {
          onComputingChange(false);
        }
      }
    }

    void runCompute();

    return () => {
      cancelled = true;
    };
  }, [
    requestSeq,
    map,
    routesLib,
    destination,
    originInput,
    originCoords,
    onRouteComputed,
    onRouteError,
    onComputingChange,
  ]);

  return null;
}

export function OfficeMapSection({place, isLoading, hasApiKey}: OfficeMapSectionProps) {
  const [originInput, setOriginInput] = useState('');
  const [originCoords, setOriginCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [routeReqSeq, setRouteReqSeq] = useState(0);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeBounds, setRouteBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [routeError, setRouteError] = useState('');
  const [isComputingRoute, setIsComputingRoute] = useState(false);

  const handleRouteComputed = useCallback(
    (summary: RouteSummary, bounds: google.maps.LatLngBounds | null) => {
      setRouteSummary(summary);
      setRouteBounds(bounds);
    },
    []
  );

  const handleSubmitRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originInput.trim()) {
      setRouteError('Indiquez une ville ou une adresse de départ.');
      return;
    }
    setOriginCoords(null);
    setRouteReqSeq((prev) => prev + 1);
  };

  const handlePresetClick = (presetQuery: string) => {
    setOriginCoords(null);
    setOriginInput(presetQuery);
    setRouteReqSeq((prev) => prev + 1);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setRouteError('La géolocalisation n’est pas supportée par votre navigateur.');
      return;
    }
    setRouteError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginCoords({lat: pos.coords.latitude, lng: pos.coords.longitude});
        setOriginInput('Ma position actuelle');
        setRouteReqSeq((prev) => prev + 1);
      },
      () => {
        setRouteError('Accès à la position refusé. Saisissez votre commune de départ.');
      },
      {enableHighAccuracy: false, timeout: 8000}
    );
  };

  const mapCenter = place?.location ?? LES_CLAYES_CENTER;

  return (
    <section id="bureaux" className="py-16 lg:py-24 bg-[#F8F9FA] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl pb-10">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Localisation &amp; Accès · Les Clayes-sous-Bois (78340)
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
            Nos bureaux et atelier aux Clayes-sous-Bois
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Consultez notre emplacement exact, nos horaires d’ouverture en direct et calculez votre
            temps de trajet jusqu’à nos bureaux.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left details + route planner panel */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {place?.displayName || 'AGP Informatique'}
                </h3>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-1" aria-hidden="true" />
                    {isLoading ? (
                      <div className="h-4 w-56 bg-slate-100 animate-pulse rounded" />
                    ) : (
                      <span>
                        {place?.formattedAddress ||
                          'Les Clayes-sous-Bois, 78340 (adresse chargée via Google Places)'}
                      </span>
                    )}
                  </div>

                  {place?.nationalPhoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                      <a
                        href={`tel:${place.nationalPhoneNumber.replace(/\s+/g, '')}`}
                        className="font-mono font-medium text-slate-900 hover:text-blue-700 tabular-nums"
                      >
                        {place.nationalPhoneNumber}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Opening Hours */}
              <div className="pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-3">
                  <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>Horaires d’ouverture (Google)</span>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-3.5 w-full bg-slate-100 animate-pulse rounded" />
                    <div className="h-3.5 w-5/6 bg-slate-100 animate-pulse rounded" />
                  </div>
                ) : place && place.openingHoursWeekdays.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-600 tabular-nums">
                    {place.openingHoursWeekdays.map((line) => (
                      <li key={line} className="capitalize">
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">
                    Horaires communiqués lors de la prise de rendez-vous ou via la fiche Google Maps.
                  </p>
                )}
              </div>

              {/* Interactive Route Calculator */}
              {hasApiKey && place?.location && (
                <div className="pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-3">
                    <RouteIcon className="w-4 h-4 text-blue-700" aria-hidden="true" />
                    <span>Calculer votre itinéraire en voiture</span>
                  </div>

                  <form onSubmit={handleSubmitRoute} className="flex gap-2">
                    <label htmlFor="route-origin" className="sr-only">
                      Adresse ou commune de départ
                    </label>
                    <input
                      id="route-origin"
                      type="text"
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                      placeholder="Ex : Plaisir, Villepreux..."
                      className="flex-1 min-w-0 px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      title="Utiliser ma position actuelle"
                      aria-label="Utiliser ma position actuelle"
                      className="px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700"
                    >
                      <LocateFixed className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="submit"
                      disabled={isComputingRoute}
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {isComputingRoute ? 'Calcul...' : 'Tracer'}
                    </button>
                  </form>

                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>Départ rapide :</span>
                    {COMMUNE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePresetClick(preset.query)}
                        className="text-slate-700 hover:text-blue-700 underline underline-offset-2"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {routeError && (
                    <div
                      role="alert"
                      className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{routeError}</span>
                    </div>
                  )}

                  {routeSummary && !routeError && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                      <div className="min-w-0">
                        <div className="text-slate-500 truncate">
                          Depuis {routeSummary.originLabel}
                        </div>
                        <div className="mt-0.5 font-semibold text-slate-900 tabular-nums">
                          {routeSummary.durationText} · {routeSummary.distanceText}
                        </div>
                      </div>
                      {(place.directionsUri || place.googleMapsUri) && (
                        <a
                          href={place.directionsUri || place.googleMapsUri || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
                        >
                          <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>GPS</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Intervention area list (unboxed text, zero pills) */}
            <div className="pt-5 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-900 mb-1.5">
                Communes d’intervention à domicile &amp; sur site
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                {INTERVENTION_CITIES.join(' · ')}
              </p>
            </div>
          </div>

          {/* Right interactive Google Map */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative w-full h-[420px] lg:h-full min-h-[460px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {hasApiKey ? (
                <GoogleMap
                  defaultCenter={mapCenter}
                  defaultZoom={place?.location ? 15 : 13}
                  mapId="DEMO_MAP_ID"
                  gestureHandling="cooperative"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  className="w-full h-full"
                >
                  <MapViewportController
                    target={place?.location ?? null}
                    routePolylineBounds={routeBounds}
                  />

                  {place && <OfficeMarkerWithWindow place={place} />}

                  <RouteOverlayController
                    destination={place?.location ?? null}
                    originInput={originInput}
                    originCoords={originCoords}
                    requestSeq={routeReqSeq}
                    onRouteComputed={handleRouteComputed}
                    onRouteError={setRouteError}
                    onComputingChange={setIsComputingRoute}
                  />
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-slate-600">
                  <MapPin className="w-8 h-8 text-slate-400 mb-3" aria-hidden="true" />
                  <p className="font-display font-semibold text-slate-900">
                    Carte Google Maps en attente de configuration
                  </p>
                  <p className="mt-1 text-sm max-w-md">
                    Activez la clé Google Maps Platform pour afficher la localisation interactive
                    d’AGP Informatique aux Clayes-sous-Bois.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
