import {useCallback, useEffect, useState} from 'react';
import {useMapsLibrary} from '@vis.gl/react-google-maps';

export interface AgpReview {
  id: string;
  authorName: string;
  authorPhotoUri: string | null;
  authorProfileUri: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  publishTimeMs: number | null;
  googleMapsUri: string | null;
}

export interface AgpPlaceData {
  id: string;
  displayName: string;
  formattedAddress: string | null;
  location: google.maps.LatLngLiteral | null;
  rating: number | null;
  userRatingCount: number | null;
  reviews: AgpReview[];
  openingHoursWeekdays: string[];
  nationalPhoneNumber: string | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  writeAReviewUri: string | null;
  reviewsUri: string | null;
  directionsUri: string | null;
}

export interface UseAgpPlaceResult {
  place: AgpPlaceData | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const SEARCH_QUERY = 'AGP Informatique Les Clayes-sous-Bois';

export function isQuotaError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : JSON.stringify(err ?? '');
  const upper = message.toUpperCase();
  return (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('OVER_QUERY_LIMIT') ||
    upper.includes('QUOTA') ||
    upper.includes('429')
  );
}

export function useAgpPlaceData(hasApiKey: boolean): UseAgpPlaceResult {
  const placesLib = useMapsLibrary('places');
  const [place, setPlace] = useState<AgpPlaceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(hasApiKey);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const reload = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!hasApiKey) {
      setIsLoading(false);
      return;
    }
    if (!placesLib) {
      return;
    }

    let cancelled = false;

    async function fetchAgpPlace() {
      setIsLoading(true);
      setError(null);

      try {
        const request: google.maps.places.SearchByTextRequest = {
          textQuery: SEARCH_QUERY,
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'reviews',
            'regularOpeningHours',
            'nationalPhoneNumber',
            'websiteURI',
            'googleMapsURI',
            'googleMapsLinks',
          ],
          language: 'fr',
          region: 'FR',
          maxResultCount: 1,
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        };

        const response = await placesLib!.Place.searchByText(request);
        if (cancelled) return;

        const firstPlace = response.places?.[0];
        if (!firstPlace) {
          setPlace(null);
          setError("La fiche Google d'AGP Informatique n'a pas pu être localisée pour le moment.");
          return;
        }

        const loc = firstPlace.location
          ? {lat: firstPlace.location.lat(), lng: firstPlace.location.lng()}
          : null;

        const mappedReviews: AgpReview[] = (firstPlace.reviews ?? []).map((rev, idx) => ({
          id: `${firstPlace.id}-review-${idx}`,
          authorName: rev.authorAttribution?.displayName || 'Client Google',
          authorPhotoUri: rev.authorAttribution?.photoURI ?? null,
          authorProfileUri: rev.authorAttribution?.uri ?? null,
          rating: typeof rev.rating === 'number' ? rev.rating : 5,
          text: rev.text || rev.originalText || '',
          relativeTime: rev.relativePublishTimeDescription || '',
          publishTimeMs: rev.publishTime ? rev.publishTime.getTime() : null,
          googleMapsUri: rev.googleMapsURI ?? null,
        }));

        setPlace({
          id: firstPlace.id,
          displayName: firstPlace.displayName || 'AGP Informatique',
          formattedAddress: firstPlace.formattedAddress ?? null,
          location: loc,
          rating: typeof firstPlace.rating === 'number' ? firstPlace.rating : null,
          userRatingCount:
            typeof firstPlace.userRatingCount === 'number' ? firstPlace.userRatingCount : null,
          reviews: mappedReviews,
          openingHoursWeekdays: firstPlace.regularOpeningHours?.weekdayDescriptions ?? [],
          nationalPhoneNumber: firstPlace.nationalPhoneNumber ?? null,
          websiteUri: firstPlace.websiteURI ?? null,
          googleMapsUri: firstPlace.googleMapsURI ?? null,
          writeAReviewUri: firstPlace.googleMapsLinks?.writeAReviewURI ?? null,
          reviewsUri: firstPlace.googleMapsLinks?.reviewsURI ?? null,
          directionsUri: firstPlace.googleMapsLinks?.directionsURI ?? null,
        });
      } catch (err) {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setError(
          'Impossible de récupérer les avis et coordonnées Google en direct. Vous pouvez réessayer dans un instant.'
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchAgpPlace();

    return () => {
      cancelled = true;
    };
  }, [hasApiKey, placesLib, reloadToken]);

  return {place, isLoading, error, reload};
}
