import {useState} from 'react';
import {MonitorCog} from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({src, alt, className = '', fallbackTitle}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 text-slate-600 p-6 ${className}`}
      >
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-700">
          <MonitorCog className="w-6 h-6" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium text-slate-700 text-center max-w-xs">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
