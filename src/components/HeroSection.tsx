import {ArrowRight, Phone, Star} from 'lucide-react';
import type {AgpPlaceData} from '../hooks/useAgpPlaceData';
import {ResilientImage} from './ResilientImage';

interface HeroSectionProps {
  place: AgpPlaceData | null;
  isPlaceLoading: boolean;
}

export function HeroSection({place, isPlaceLoading}: HeroSectionProps) {
  const formattedRating =
    place?.rating !== null && place?.rating !== undefined
      ? place.rating.toFixed(1).replace('.', ',')
      : null;

  return (
    <section id="accueil" className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left column: Value proposition */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-4 flex flex-wrap items-center gap-2">
                <span>Les Clayes-sous-Bois</span>
                <span aria-hidden="true">·</span>
                <span>Yvelines (78)</span>
                <span aria-hidden="true">·</span>
                <span>Particuliers &amp; TPE</span>
              </p>

              <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-bold tracking-tight text-slate-900 text-balance max-w-2xl">
                Dépannage et maintenance informatique de proximité
              </h1>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">
                AGP Informatique intervient à domicile, sur site professionnel ou en atelier aux
                Clayes-sous-Bois pour réparer vos ordinateurs, sécuriser vos données et fiabiliser
                votre réseau sans jargon technique.
              </p>
            </div>

            <div className="mt-8 pt-4 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <span>Planifier un diagnostic</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              {place?.nationalPhoneNumber ? (
                <a
                  href={`tel:${place.nationalPhoneNumber.replace(/\s+/g, '')}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <Phone className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  <span>{place.nationalPhoneNumber}</span>
                </a>
              ) : (
                <a
                  href="#bureaux"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <span>Localiser nos bureaux</span>
                </a>
              )}
            </div>
          </div>

          {/* Right column: Architectural atelier visual */}
          <div className="lg:col-span-6">
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <ResilientImage
                src="/src/assets/images/hero_it_workshop_1795608810749.jpg"
                alt="Atelier informatique moderne d'AGP Informatique avec poste de diagnostic et outils de réparation"
                fallbackTitle="Atelier de diagnostic et réparation AGP Informatique"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-width 4-column structured proof strip */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="text-xs font-medium text-slate-500">Satisfaction Google en direct</div>
            {isPlaceLoading ? (
              <div className="mt-2 h-8 w-36 bg-slate-100 animate-pulse rounded" />
            ) : formattedRating ? (
              <a
                href="#avis-google"
                className="mt-1.5 inline-flex items-center gap-2 group focus-visible:outline-2 focus-visible:outline-blue-700 rounded"
              >
                <span className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                  {formattedRating} / 5
                </span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {place?.userRatingCount !== null && place?.userRatingCount !== undefined && (
                  <span className="text-sm text-slate-500 tabular-nums group-hover:text-slate-900 transition-colors">
                    ({place.userRatingCount} avis)
                  </span>
                )}
              </a>
            ) : (
              <a
                href="#avis-google"
                className="mt-1.5 block font-display text-xl font-bold text-slate-900 hover:text-blue-700 transition-colors"
              >
                Avis clients vérifiés
              </a>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500">Délai de prise en charge</div>
            <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
              24 à 48h
            </div>
            <div className="mt-0.5 text-sm text-slate-600">Diagnostic clair avant réparation</div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500">Secteur d’intervention</div>
            <div className="mt-1.5 font-display text-2xl font-bold text-slate-900">
              Yvelines (78)
            </div>
            <div className="mt-0.5 text-sm text-slate-600">
              Les Clayes, Plaisir, Villepreux, SQY
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500">Modalités d’accueil</div>
            <div className="mt-1.5 font-display text-2xl font-bold text-slate-900">
              Atelier &amp; Sur site
            </div>
            <div className="mt-0.5 text-sm text-slate-600">
              Particuliers, artisans et PME locales
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
