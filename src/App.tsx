import {useCallback, useEffect, useState} from 'react';
import {APIProvider} from '@vis.gl/react-google-maps';
import {ContactSection} from './components/ContactSection';
import {Footer} from './components/Footer';
import {GoogleReviewsSection} from './components/GoogleReviewsSection';
import {HeroSection} from './components/HeroSection';
import {Navbar} from './components/Navbar';
import {OfficeMapSection} from './components/OfficeMapSection';
import {ServicesSection} from './components/ServicesSection';
import type {ServiceItem} from './data/services';
import {useAgpPlaceData} from './hooks/useAgpPlaceData';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

function QuotaBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
    </div>
  );
}

function AgpPageContent({hasApiKey}: {hasApiKey: boolean}) {
  const {place, isLoading, error, reload} = useAgpPlaceData(hasApiKey);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const handleSelectService = useCallback((service: ServiceItem) => {
    setSelectedService(service);
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({behavior: 'smooth'});
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900">
      <Navbar />

      <main className="flex-1">
        <HeroSection place={place} isPlaceLoading={isLoading} />

        <ServicesSection onSelectService={handleSelectService} />

        <GoogleReviewsSection
          place={place}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          hasApiKey={hasApiKey}
        />

        <OfficeMapSection place={place} isLoading={isLoading} hasApiKey={hasApiKey} />

        <ContactSection selectedService={selectedService} place={place} />
      </main>

      <Footer place={place} />
    </div>
  );
}

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  const hasApiKey = Boolean(GOOGLE_MAPS_API_KEY);

  return (
    <>
      {quotaExceeded && <QuotaBanner />}
      {hasApiKey ? (
        <APIProvider
          apiKey={GOOGLE_MAPS_API_KEY}
          language="fr"
          region="FR"
          libraries={['places', 'marker', 'routes']}
        >
          <AgpPageContent hasApiKey={true} />
        </APIProvider>
      ) : (
        <AgpPageContent hasApiKey={false} />
      )}
    </>
  );
}
