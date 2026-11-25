import type {AgpPlaceData} from '../hooks/useAgpPlaceData';

interface FooterProps {
  place: AgpPlaceData | null;
  onOpenContactConfig: () => void;
}

export function Footer({place, onOpenContactConfig}: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
          <div className="md:col-span-5 space-y-3">
            <div className="font-display text-lg font-bold text-white tracking-tight">
              {place?.displayName || 'AGP Informatique'}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Dépannage, maintenance et assistance informatique de proximité pour particuliers et
              professionnels aux Clayes-sous-Bois et dans les Yvelines.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5 text-sm">
            <div className="font-semibold text-white">Navigation</div>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#avis-google" className="hover:text-white transition-colors">
                  Avis Google
                </a>
              </li>
              <li>
                <a href="#bureaux" className="hover:text-white transition-colors">
                  Nos bureaux
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Demander un devis
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5 text-sm">
            <div className="font-semibold text-white">Coordonnées</div>
            <p className="text-slate-400">
              {place?.formattedAddress || 'Les Clayes-sous-Bois, 78340 · Yvelines'}
            </p>
            {place?.nationalPhoneNumber && (
              <p className="font-mono text-slate-300 tabular-nums">
                <a
                  href={`tel:${place.nationalPhoneNumber.replace(/\s+/g, '')}`}
                  className="hover:text-white transition-colors"
                >
                  {place.nationalPhoneNumber}
                </a>
              </p>
            )}
            {place?.googleMapsUri && (
              <p>
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
                >
                  Fiche établissement Google Maps
                </a>
              </p>
            )}
            <p className="pt-1">
              <button
                type="button"
                onClick={onOpenContactConfig}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
              >
                Configurer l’e-mail du formulaire
              </button>
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AGP Informatique · Les Clayes-sous-Bois (78)</p>
          <p>
            Cartographie et avis clients intégrés avec Google Maps Platform (soumis aux Conditions
            d’utilisation Google Maps).
          </p>
        </div>
      </div>
    </footer>
  );
}
