import {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle2, Copy, Mail, Phone, Send, Settings2} from 'lucide-react';
import {
  isSafeHttpsUrl,
  isValidEmail,
  type ContactConfig,
} from '../config/contactConfig';
import {AGP_SERVICES, INTERVENTION_CITIES, type ServiceItem} from '../data/services';
import type {AgpPlaceData} from '../hooks/useAgpPlaceData';

interface ContactSectionProps {
  selectedService: ServiceItem | null;
  place: AgpPlaceData | null;
  contactConfig: ContactConfig;
  onOpenConfig: () => void;
}

type ClientProfile = 'particulier' | 'professionnel';
type InterventionMode = 'atelier' | 'domicile';
type UrgencyLevel = 'standard' | 'urgent';

interface FormValues {
  profile: ClientProfile;
  mode: InterventionMode;
  urgency: UrgencyLevel;
  serviceId: string;
  city: string;
  name: string;
  phone: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

export function ContactSection({
  selectedService,
  place,
  contactConfig,
  onOpenConfig,
}: ContactSectionProps) {
  const [values, setValues] = useState<FormValues>({
    profile: 'particulier',
    mode: 'domicile',
    urgency: 'standard',
    serviceId: AGP_SERVICES[0].id,
    city: 'Les Clayes-sous-Bois',
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentAutomatically, setSentAutomatically] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedService) {
      setValues((prev) => ({
        ...prev,
        serviceId: selectedService.id,
        profile: selectedService.audience === 'professionnels' ? 'professionnel' : prev.profile,
      }));
      setSubmittedRef(null);
    }
  }, [selectedService]);

  const validate = (form: FormValues): FormErrors => {
    const nextErrors: FormErrors = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = 'Veuillez saisir votre nom ou raison sociale.';
    }

    const digitsOnly = form.phone.replace(/[\s.-]/g, '');
    if (!/^(\+33|0)[1-9](\d{8})$/.test(digitsOnly)) {
      nextErrors.phone = 'Indiquez un numéro de téléphone français valide (ex : 06 12 34 56 78).';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Indiquez une adresse e-mail valide pour recevoir votre réponse.';
    }

    if (form.message.trim().length < 10) {
      nextErrors.message =
        'Décrivez brièvement votre besoin ou la panne constatée (minimum 10 caractères).';
    }

    return nextErrors;
  };

  const activeServiceTitle =
    AGP_SERVICES.find((s) => s.id === values.serviceId)?.title || 'Intervention informatique';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const refCode = `AGP-${new Date().getFullYear().toString().slice(-2)}${String(
      Math.floor(1000 + Math.random() * 9000)
    )}`;

    const hasValidRecipient = isValidEmail(contactConfig.recipientEmail);

    if (contactConfig.deliveryMode === 'formsubmit' && hasValidRecipient) {
      setIsSending(true);
      try {
        const res = await fetch(
          `https://formsubmit.co/ajax/${encodeURIComponent(contactConfig.recipientEmail)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              reference: refCode,
              profil: values.profile === 'professionnel' ? 'Professionnel' : 'Particulier',
              service: activeServiceTitle,
              modalite: `${values.mode === 'atelier' ? 'Atelier' : 'À domicile / Sur site'} (${values.city})`,
              urgence: values.urgency === 'urgent' ? 'Urgent (sous 24h)' : 'Standard (24–48h)',
              nom: values.name.trim(),
              telephone: values.phone.trim(),
              email: values.email.trim(),
              message: values.message.trim(),
              _subject: `Demande AGP Informatique - ${activeServiceTitle} (${refCode})`,
              _replyto: values.email.trim(),
              _template: 'table',
            }),
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        setSentAutomatically(true);
        setSubmittedRef(refCode);
      } catch {
        setSendError(
          `L’envoi automatique vers ${contactConfig.recipientEmail} a échoué. Vous pouvez néanmoins envoyer la demande via votre messagerie ci-dessous.`
        );
        setSentAutomatically(false);
        setSubmittedRef(refCode);
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (contactConfig.deliveryMode === 'webhook' && isSafeHttpsUrl(contactConfig.webhookUrl)) {
      setIsSending(true);
      try {
        const res = await fetch(contactConfig.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            recipientEmail: contactConfig.recipientEmail,
            reference: refCode,
            profile: values.profile,
            service: activeServiceTitle,
            mode: values.mode,
            city: values.city,
            urgency: values.urgency,
            name: values.name.trim(),
            phone: values.phone.trim(),
            email: values.email.trim(),
            message: values.message.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        setSentAutomatically(true);
        setSubmittedRef(refCode);
      } catch {
        setSendError(
          "L’envoi vers le service configuré n’a pas abouti. Vous pouvez utiliser l’envoi par messagerie ou copier le récapitulatif ci-dessous."
        );
        setSentAutomatically(false);
        setSubmittedRef(refCode);
      } finally {
        setIsSending(false);
      }
      return;
    }

    setSentAutomatically(false);
    setSubmittedRef(refCode);
  };

  const buildSummaryText = () =>
    [
      `Demande AGP Informatique (${submittedRef ?? 'Brouillon'})`,
      `Profil : ${values.profile === 'professionnel' ? 'Professionnel' : 'Particulier'}`,
      `Service : ${activeServiceTitle}`,
      `Modalité : ${values.mode === 'atelier' ? 'Dépôt en atelier' : 'À domicile / Sur site'} (${values.city})`,
      `Délai souhaité : ${values.urgency === 'urgent' ? 'Urgent (sous 24h)' : 'Standard (24–48h)'}`,
      `Contact : ${values.name} · ${values.phone} · ${values.email}`,
      `Description : ${values.message}`,
    ].join('\n');

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="contact" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left column: Process & Direct Contact */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">
                Prise en charge · Les Clayes-sous-Bois
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                Décrivez votre besoin pour un diagnostic rapide
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Que votre ordinateur soit ralenti, bloqué par un virus ou que votre réseau
                d’entreprise nécessite une refonte, nous vous répondons avec une estimation claire.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6 space-y-5">
              <div>
                <div className="text-xs font-mono text-slate-500 tabular-nums">01.</div>
                <div className="font-display font-bold text-slate-900 mt-0.5">
                  Analyse de votre demande
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Qualification immédiate du matériel, des symptômes et du lieu d’intervention.
                </p>
              </div>
              <div>
                <div className="text-xs font-mono text-slate-500 tabular-nums">02.</div>
                <div className="font-display font-bold text-slate-900 mt-0.5">
                  Créneau confirmé &amp; devis transparent
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Proposition d’un rendez-vous en atelier ou à domicile sans frais cachés.
                </p>
              </div>
              <div>
                <div className="text-xs font-mono text-slate-500 tabular-nums">03.</div>
                <div className="font-display font-bold text-slate-900 mt-0.5">
                  Intervention &amp; vérification complète
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Tests de stabilité, sécurisation des données et explications claires à la remise.
                </p>
              </div>
            </div>

            {(place?.nationalPhoneNumber || place?.formattedAddress) && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-sm">
                <div className="font-display font-bold text-slate-900">Ligne directe</div>
                {place?.nationalPhoneNumber && (
                  <a
                    href={`tel:${place.nationalPhoneNumber.replace(/\s+/g, '')}`}
                    className="flex items-center gap-2.5 font-mono font-medium text-blue-700 hover:text-blue-800 tabular-nums"
                  >
                    <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{place.nationalPhoneNumber}</span>
                  </a>
                )}
                {place?.formattedAddress && (
                  <p className="text-xs text-slate-600">{place.formattedAddress}</p>
                )}
              </div>
            )}
          </div>

          {/* Right column: Interactive Contact & Diagnostic Form */}
          <div className="lg:col-span-7 bg-[#F8F9FA] border border-slate-200 rounded-xl p-6 sm:p-8">
            {submittedRef ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-mono text-slate-500 tabular-nums">
                      Référence : {submittedRef}
                    </p>
                    <h3 className="font-display text-2xl font-bold text-slate-900 mt-1">
                      {sentAutomatically
                        ? 'Demande transmise par e-mail'
                        : 'Demande d’intervention préparée'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Merci {values.name}.{' '}
                      {sentAutomatically && isValidEmail(contactConfig.recipientEmail) ? (
                        <>
                          Votre demande pour{' '}
                          <span className="font-semibold text-slate-900">{activeServiceTitle}</span>{' '}
                          ({values.city}) a bien été envoyée à{' '}
                          <span className="font-mono text-slate-900">
                            {contactConfig.recipientEmail}
                          </span>
                          .
                        </>
                      ) : (
                        <>
                          Votre récapitulatif pour{' '}
                          <span className="font-semibold text-slate-900">{activeServiceTitle}</span>{' '}
                          ({values.city}) est prêt.{' '}
                          {isValidEmail(contactConfig.recipientEmail)
                            ? `Cliquez ci-dessous pour l’envoyer à ${contactConfig.recipientEmail}.`
                            : 'Configurez votre adresse e-mail de réception ou copiez le récapitulatif ci-dessous.'}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {sendError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{sendError}</span>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed">
                  {buildSummaryText()}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`mailto:${
                      isValidEmail(contactConfig.recipientEmail)
                        ? encodeURIComponent(contactConfig.recipientEmail)
                        : ''
                    }?subject=${encodeURIComponent(
                      `Demande AGP Informatique - ${activeServiceTitle} (${submittedRef})`
                    )}&body=${encodeURIComponent(buildSummaryText())}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {isValidEmail(contactConfig.recipientEmail)
                        ? `Envoyer à ${contactConfig.recipientEmail}`
                        : 'Ouvrir dans ma messagerie'}
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copied ? 'Récapitulatif copié' : 'Copier le récapitulatif'}</span>
                  </button>

                  {place?.nationalPhoneNumber && (
                    <a
                      href={`tel:${place.nationalPhoneNumber.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors tabular-nums"
                    >
                      <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Appeler le {place.nationalPhoneNumber}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRef(null);
                      setSendError(null);
                      setSentAutomatically(false);
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4 ml-auto"
                  >
                    Modifier la demande
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Interactive Segmented Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-2">
                      Vous êtes
                    </span>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-lg">
                      {(
                        [
                          {id: 'particulier', label: 'Particulier'},
                          {id: 'professionnel', label: 'Professionnel'},
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setValues((prev) => ({...prev, profile: opt.id}))}
                          className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                            values.profile === opt.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-2">
                      Mode d’intervention
                    </span>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-lg">
                      {(
                        [
                          {id: 'domicile', label: 'À domicile / Site'},
                          {id: 'atelier', label: 'En atelier'},
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setValues((prev) => ({...prev, mode: opt.id}))}
                          className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                            values.mode === opt.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Service & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-service"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Prestation concernée
                    </label>
                    <select
                      id="contact-service"
                      value={values.serviceId}
                      onChange={(e) => setValues((prev) => ({...prev, serviceId: e.target.value}))}
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                    >
                      {AGP_SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.number}. {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-city"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Commune
                    </label>
                    <select
                      id="contact-city"
                      value={values.city}
                      onChange={(e) => setValues((prev) => ({...prev, city: e.target.value}))}
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                    >
                      {INTERVENTION_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                      <option value="Autre commune (Yvelines)">Autre commune (Yvelines)</option>
                    </select>
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    Degré d’urgence
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          id: 'standard',
                          title: 'Standard (24 à 48h)',
                          sub: 'Maintenance, lenteurs, installation',
                        },
                        {
                          id: 'urgent',
                          title: 'Urgent (Sous 24h)',
                          sub: 'Panne bloquante ou poste pro',
                        },
                      ] as const
                    ).map((u) => {
                      const active = values.urgency === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setValues((prev) => ({...prev, urgency: u.id}))}
                          className={`text-left p-3 rounded-lg border transition-colors ${
                            active
                              ? 'bg-white border-blue-700 ring-1 ring-blue-700'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-semibold text-slate-900">{u.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{u.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Identity & Contact Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Nom complet ou société
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={values.name}
                      onChange={(e) => {
                        setValues((prev) => ({...prev, name: e.target.value}));
                        if (errors.name) setErrors((prev) => ({...prev, name: undefined}));
                      }}
                      placeholder="Ex : Marc Lefèvre"
                      aria-invalid={Boolean(errors.name)}
                      className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none ${
                        errors.name
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-200 focus:border-blue-700'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Téléphone
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={values.phone}
                      onChange={(e) => {
                        setValues((prev) => ({...prev, phone: e.target.value}));
                        if (errors.phone) setErrors((prev) => ({...prev, phone: undefined}));
                      }}
                      placeholder="06 12 34 56 78"
                      aria-invalid={Boolean(errors.phone)}
                      className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg tabular-nums focus:outline-none ${
                        errors.phone
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-200 focus:border-blue-700'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Adresse e-mail
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={values.email}
                    onChange={(e) => {
                      setValues((prev) => ({...prev, email: e.target.value}));
                      if (errors.email) setErrors((prev) => ({...prev, email: undefined}));
                    }}
                    placeholder="nom@exemple.fr"
                    aria-invalid={Boolean(errors.email)}
                    className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none ${
                      errors.email
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-200 focus:border-blue-700'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Description du problème ou matériel concerné
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={values.message}
                    onChange={(e) => {
                      setValues((prev) => ({...prev, message: e.target.value}));
                      if (errors.message) setErrors((prev) => ({...prev, message: undefined}));
                    }}
                    placeholder="Ex : PC portable Windows lent au démarrage, besoin d'un passage sur SSD ou diagnostic..."
                    aria-invalid={Boolean(errors.message)}
                    className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none ${
                      errors.message
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-200 focus:border-blue-700'
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.message}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      Devis gratuit avant toute intervention matérielle.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>
                        Destinataire :{' '}
                        <span className="font-mono text-slate-800">
                          {isValidEmail(contactConfig.recipientEmail)
                            ? contactConfig.recipientEmail
                            : 'Non configuré'}
                        </span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={onOpenConfig}
                        className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-2"
                      >
                        <Settings2 className="w-3 h-3" aria-hidden="true" />
                        <span>
                          {isValidEmail(contactConfig.recipientEmail)
                            ? 'Modifier'
                            : 'Configurer l’e-mail'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>{isSending ? 'Envoi en cours...' : 'Valider ma demande'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
