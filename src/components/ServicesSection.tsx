import {useState} from 'react';
import {ArrowUpRight, Check} from 'lucide-react';
import {AGP_SERVICES, type ServiceAudience, type ServiceItem} from '../data/services';
import {ResilientImage} from './ResilientImage';

interface ServicesSectionProps {
  onSelectService: (service: ServiceItem) => void;
}

const FILTER_TABS: {id: ServiceAudience; label: string}[] = [
  {id: 'tous', label: 'Tous les services'},
  {id: 'particuliers', label: 'Particuliers'},
  {id: 'professionnels', label: 'Professionnels'},
];

export function ServicesSection({onSelectService}: ServicesSectionProps) {
  const [audienceFilter, setAudienceFilter] = useState<ServiceAudience>('tous');

  const visibleServices = AGP_SERVICES.filter((service) => {
    if (audienceFilter === 'tous') return true;
    return service.audience === audienceFilter || service.audience === 'tous';
  });

  return (
    <section id="services" className="py-16 lg:py-24 bg-[#F8F9FA] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-slate-200">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-slate-500 mb-2">
              Prestations informatiques · Atelier &amp; Déplacement
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
              Des interventions concrètes, expliquées et chiffrées avant action
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filtrer les services par public"
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start lg:self-auto"
          >
            {FILTER_TABS.map((tab) => {
              const active = audienceFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setAudienceFilter(tab.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleServices.map((service) => {
            const isWide = service.featured && audienceFilter === 'tous';

            return (
              <article
                key={service.id}
                className={`bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between ${
                  isWide ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div className={`flex flex-col ${isWide ? 'lg:grid lg:grid-cols-12 h-full' : 'h-full'}`}>
                  {service.image && isWide && (
                    <div className="lg:col-span-5 bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200 min-h-[220px]">
                      <ResilientImage
                        src={service.image.src}
                        alt={service.image.alt}
                        fallbackTitle={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div
                    className={`p-6 sm:p-7 flex flex-col justify-between flex-1 ${
                      isWide ? 'lg:col-span-7' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-slate-700 tabular-nums">{service.number}.</span>
                        <span aria-hidden="true">·</span>
                        <span>{service.audienceLabel}</span>
                      </div>

                      <h3 className="mt-2 font-display text-xl font-bold text-slate-900">
                        {service.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {service.summary}
                      </p>

                      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                        {service.deliverables.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <Check
                              className="w-4 h-4 text-blue-700 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500 tabular-nums">
                        Délai indicatif : {service.turnaround}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectService(service)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 rounded"
                      >
                        <span>Demander</span>
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
