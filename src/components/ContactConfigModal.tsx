import {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle2, RotateCcw, Save, X} from 'lucide-react';
import {
  clearStoredContactConfig,
  ENV_DEFAULT_CONTACT_EMAIL,
  isSafeHttpsUrl,
  isValidEmail,
  type ContactConfig,
  type ContactDeliveryMode,
} from '../config/contactConfig';

interface ContactConfigModalProps {
  isOpen: boolean;
  config: ContactConfig;
  onClose: () => void;
  onSave: (nextConfig: ContactConfig) => void;
}

export function ContactConfigModal({
  isOpen,
  config,
  onClose,
  onSave,
}: ContactConfigModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(config.recipientEmail);
  const [deliveryMode, setDeliveryMode] = useState<ContactDeliveryMode>(config.deliveryMode);
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl);
  const [error, setError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(config.recipientEmail);
      setDeliveryMode(config.deliveryMode);
      setWebhookUrl(config.webhookUrl);
      setError(null);
      setSavedFeedback(false);
    }
  }, [isOpen, config]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = recipientEmail.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError('Veuillez saisir une adresse e-mail de réception valide.');
      return;
    }

    const trimmedWebhook = webhookUrl.trim();
    if (deliveryMode === 'webhook' && !isSafeHttpsUrl(trimmedWebhook)) {
      setError('Veuillez saisir une URL HTTPS valide pour votre service de formulaire / webhook.');
      return;
    }

    onSave({
      recipientEmail: trimmedEmail,
      deliveryMode,
      webhookUrl: trimmedWebhook,
    });
    setSavedFeedback(true);
    setTimeout(() => {
      onClose();
    }, 650);
  };

  const handleReset = () => {
    const reset = clearStoredContactConfig();
    setRecipientEmail(reset.recipientEmail);
    setDeliveryMode(reset.deliveryMode);
    setWebhookUrl(reset.webhookUrl);
    setError(null);
    onSave(reset);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-config-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 id="contact-config-title" className="font-display text-lg font-bold text-slate-900">
            Configuration de l’e-mail du formulaire
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre de configuration"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSave} noValidate className="p-6 space-y-5">
          <div>
            <label
              htmlFor="config-recipient-email"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Adresse e-mail de réception
            </label>
            <input
              id="config-recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => {
                setRecipientEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="contact@agp-informatique.fr"
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Les demandes envoyées depuis le formulaire seront adressées à cette boîte mail.
            </p>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Mode de transmission
            </span>
            <div className="space-y-2">
              {(
                [
                  {
                    id: 'mailto',
                    title: 'Messagerie du visiteur (mailto:)',
                    desc: 'Ouvre le client mail avec votre adresse pré-remplie. Zéro configuration externe.',
                  },
                  {
                    id: 'formsubmit',
                    title: 'Envoi direct automatique (FormSubmit)',
                    desc: 'Transmet directement le formulaire par e-mail via HTTPS sans quitter la page.',
                  },
                  {
                    id: 'webhook',
                    title: 'Endpoint personnalisé (Formspree / Webhook HTTPS)',
                    desc: 'Envoie les données en JSON vers votre URL Formspree, Make, n8n ou fonction Cloudflare.',
                  },
                ] as const
              ).map((mode) => {
                const active = deliveryMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDeliveryMode(mode.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      active
                        ? 'bg-slate-50 border-blue-700 ring-1 ring-blue-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900">{mode.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{mode.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {deliveryMode === 'webhook' && (
            <div>
              <label
                htmlFor="config-webhook-url"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                URL du service de formulaire (HTTPS)
              </label>
              <input
                id="config-webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://formspree.io/f/votre-id"
                className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
              />
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Déploiement Cloudflare :</span>{' '}
            définissez la variable d’environnement{' '}
            <code className="font-mono text-slate-800">VITE_CONTACT_EMAIL</code> dans Cloudflare
            Pages pour que cette adresse soit active par défaut pour tous vos visiteurs.
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {savedFeedback && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Adresse e-mail enregistrée.</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {ENV_DEFAULT_CONTACT_EMAIL ? 'Revenir à la valeur Cloudflare' : 'Réinitialiser'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
