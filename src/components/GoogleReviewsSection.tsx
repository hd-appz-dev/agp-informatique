import {useMemo, useState} from 'react';
import {AlertCircle, ExternalLink, RefreshCw, Star} from 'lucide-react';
import type {AgpPlaceData, AgpReview} from '../hooks/useAgpPlaceData';

interface GoogleReviewsSectionProps {
  place: AgpPlaceData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  hasApiKey: boolean;
}

type ReviewSort = 'relevance' | 'recent';

function ReviewAvatar({name, photoUri}: {name: string; photoUri: string | null}) {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  if (photoUri && !imgFailed) {
    return (
      <img
        src={photoUri}
        alt={`Photo de profil de ${name}`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0"
    >
      {initials || 'G'}
    </div>
  );
}

function StarRow({rating}: {rating: number}) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note de ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function GoogleReviewsSection({
  place,
  isLoading,
  error,
  onRetry,
  hasApiKey,
}: GoogleReviewsSectionProps) {
  const [sortOrder, setSortOrder] = useState<ReviewSort>('relevance');

  const displayedReviews: AgpReview[] = useMemo(() => {
    const fiveStarOnly = (place?.reviews ?? []).filter((r) => r.rating >= 5);
    if (sortOrder === 'recent') {
      return [...fiveStarOnly].sort((a, b) => (b.publishTimeMs ?? 0) - (a.publishTimeMs ?? 0));
    }
    return fiveStarOnly;
  }, [place, sortOrder]);

  const formattedRating =
    place?.rating !== null && place?.rating !== undefined
      ? place.rating.toFixed(1).replace('.', ',')
      : null;

  return (
    <section id="avis-google" className="py-16 lg:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-slate-200">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-slate-500 mb-2">
              Retours clients · Synchronisés via Google Places
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
              Avis Google vérifiés de nos clients aux Clayes-sous-Bois
            </h2>
          </div>

          {/* Live aggregate score + Google Maps action */}
          <div className="flex flex-wrap items-center gap-6">
            {isLoading ? (
              <div className="h-12 w-48 bg-slate-100 animate-pulse rounded-lg" />
            ) : formattedRating ? (
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                  {formattedRating}
                </span>
                <div>
                  <StarRow rating={place?.rating ?? 5} />
                  <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    Basé sur {place?.userRatingCount ?? 0} avis Google
                  </p>
                </div>
              </div>
            ) : null}

            {(place?.reviewsUri || place?.googleMapsUri) && (
              <a
                href={place.reviewsUri || place.googleMapsUri || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700"
              >
                <span>Voir sur Google</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {/* Sort bar (strictly 5-star reviews) */}
        {!isLoading && !error && displayedReviews.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-medium text-slate-600">
                Avis clients 5 étoiles uniquement
              </span>
              <div
                role="tablist"
                aria-label="Trier les avis 5 étoiles"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                {(
                  [
                    {id: 'relevance', label: 'Pertinence'},
                    {id: 'recent', label: 'Plus récents'},
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={sortOrder === tab.id}
                    onClick={() => setSortOrder(tab.id)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 ${
                      sortOrder === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {place?.writeAReviewUri && (
              <a
                href={place.writeAReviewUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                Laisser un avis Google
              </a>
            )}
          </div>
        )}

        {/* States: Loading / Error / No API Key / Empty / Reviews Grid */}
        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-slate-200 rounded" />
                  <div className="h-3.5 w-5/6 bg-slate-200 rounded" />
                  <div className="h-3.5 w-2/3 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasApiKey ? (
          <div className="mt-8 p-8 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Configuration Google Maps en attente
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  La clé Google Maps Platform n’est pas encore disponible dans l’environnement pour
                  charger les avis Google en direct.
                </p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="mt-8 p-8 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Chargement des avis indisponible
                </h3>
                <p className="mt-1 text-sm text-slate-600">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Réessayer</span>
            </button>
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="mt-8 p-8 rounded-xl border border-slate-200 bg-slate-50 text-center">
            <p className="text-sm text-slate-600">
              Aucun avis Google 5 étoiles n’est disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedReviews.map((review) => (
              <article
                key={review.id}
                className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <ReviewAvatar name={review.authorName} photoUri={review.authorPhotoUri} />
                      <div className="min-w-0">
                        {review.authorProfileUri ? (
                          <a
                            href={review.authorProfileUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-slate-900 hover:text-blue-700 truncate block"
                          >
                            {review.authorName}
                          </a>
                        ) : (
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {review.authorName}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 mt-0.5">
                          {review.relativeTime || 'Avis Google'}
                        </div>
                      </div>
                    </div>

                    <StarRow rating={review.rating} />
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-700">
                    {review.text
                      ? `« ${review.text} »`
                      : 'Client ayant attribué une note sans commentaire écrit.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Publié sur Google</span>
                  {review.googleMapsUri && (
                    <a
                      href={review.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-blue-700"
                    >
                      <span>Original</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Google attribution line */}
        {!isLoading && place && (
          <p className="mt-6 text-xs text-slate-500">
            Données et avis clients fournis dynamiquement via Google Maps Platform (Places API).
          </p>
        )}
      </div>
    </section>
  );
}
