export type ServiceAudience = 'particuliers' | 'professionnels' | 'tous';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  audience: ServiceAudience;
  audienceLabel: string;
  summary: string;
  deliverables: string[];
  turnaround: string;
  featured?: boolean;
  image?: {
    src: string;
    alt: string;
  };
}

export const AGP_SERVICES: ServiceItem[] = [
  {
    id: 'depannage-materiel',
    number: '01',
    title: 'Dépannage & Réparation PC / Mac',
    audience: 'particuliers',
    audienceLabel: 'Particuliers · Atelier & Domicile',
    summary:
      'Diagnostic matériel et logiciel complet sur ordinateur fixe ou portable. Remplacement de SSD, mémoire vive, batterie, écran ou alimentation pour prolonger la durée de vie de vos équipements.',
    deliverables: [
      'Diagnostic matériel approfondi sous 24h',
      'Migration système vers SSD NVMe haute vitesse',
      'Nettoyage thermique interne et remplacement pâte thermique',
      'Réinstallation propre Windows ou macOS avec pilotes',
    ],
    turnaround: '24 à 48h ouvrées',
    featured: true,
    image: {
      src: '/src/assets/images/service_hardware_repair_1795608810674.jpg',
      alt: 'Établi de réparation informatique avec ordinateur portable, SSD NVMe et outils de précision',
    },
  },
  {
    id: 'securite-desinfection',
    number: '02',
    title: 'Sécurité, Désinfection & Sauvegarde',
    audience: 'tous',
    audienceLabel: 'Particuliers & Pros · Données protégées',
    summary:
      'Éradication complète des virus, logiciels espions et publicités intrusives sans perte de vos documents personnels, accompagnée d’une stratégie de sauvegarde fiable.',
    deliverables: [
      'Suppression de malwares, rançongiciels et adwares',
      'Récupération de données sur disque ou clé USB endommagée',
      'Mise en place de sauvegardes locales et chiffrées',
      'Durcissement des mots de passe et navigateurs',
    ],
    turnaround: 'Intervention prioritaire sous 24h',
  },
  {
    id: 'internet-wifi-peripheriques',
    number: '03',
    title: 'Assistance Internet, Wi-Fi & Périphériques',
    audience: 'particuliers',
    audienceLabel: 'Domicile · Les Clayes & Yvelines',
    summary:
      'Résolution des coupures réseau, couverture Wi-Fi dans toute la maison et installation propre de vos imprimantes, scanners, NAS ou équipements de télétravail.',
    deliverables: [
      'Configuration box fibre et réseaux Wi-Fi Mesh',
      'Installation et partage d’imprimantes réseau / Wi-Fi',
      'Optimisation du poste de télétravail et visioconférence',
      'Accompagnement pédagogique à domicile sur mesure',
    ],
    turnaround: 'Sur rendez-vous à domicile',
  },
  {
    id: 'maintenance-tpe',
    number: '04',
    title: 'Maintenance & Parc Informatique TPE / PME',
    audience: 'professionnels',
    audienceLabel: 'Professionnels · Commerces & Libéraux',
    summary:
      'Infogérance de proximité pour les entreprises, cabinets médicaux, artisans et commerçants des Clayes-sous-Bois et de Saint-Quentin-en-Yvelines.',
    deliverables: [
      'Supervision et maintenance préventive du parc postes',
      'Déploiement réseau câblé, switchs et Wi-Fi professionnel',
      'Plan de reprise d’activité et sauvegarde automatique NAS',
      'Interlocuteur technique unique avec intervention rapide sur site',
    ],
    turnaround: 'Sous 4 à 24h sur site',
    featured: true,
    image: {
      src: '/src/assets/images/service_business_network_1795608810638.jpg',
      alt: 'Poste de travail professionnel à double écran et baie de brassage réseau structurée',
    },
  },
  {
    id: 'conseil-montage',
    number: '05',
    title: 'Conseil d’Achat & Assemblage sur Mesure',
    audience: 'tous',
    audienceLabel: 'Bureautique · Création · CAO',
    summary:
      'Conception de stations de travail fiables et silencieuses adaptées à votre usage réel, ou accompagnement objectif avant l’achat de matériel neuf ou reconditionné.',
    deliverables: [
      'Sélection de composants fiables au meilleur rapport durabilité/prix',
      'Montage soigné, gestion des câbles et tests de charge',
      'Transfert intégral de vos anciens comptes et logiciels',
      'Mise en service clé en main à domicile ou au bureau',
    ],
    turnaround: '3 à 5 jours ouvrés',
  },
  {
    id: 'formation-accompagnement',
    number: '06',
    title: 'Accompagnement Numérique & Prise en Main',
    audience: 'particuliers',
    audienceLabel: 'Particuliers · Pédagogie claire',
    summary:
      'Séances individuelles à votre rythme pour maîtriser votre ordinateur, sécuriser vos démarches en ligne, classer vos photos et éviter les arnaques courantes.',
    deliverables: [
      'Prise en main Windows 11, macOS ou tablette',
      'Organisation de boîte mail et classement de fichiers',
      'Prévention contre le phishing et les fraudes en ligne',
      'Support clair sans jargon technique',
    ],
    turnaround: 'Créneaux flexibles en semaine',
  },
];

export const INTERVENTION_CITIES = [
  'Les Clayes-sous-Bois',
  'Plaisir',
  'Villepreux',
  "Bois-d'Arcy",
  'Fontenay-le-Fleury',
  'Élancourt',
  'Trappes',
  'Saint-Cyr-l’École',
  'Saint-Quentin-en-Yvelines',
];

export const COMMUNE_PRESETS = [
  {label: 'Plaisir (Centre)', query: 'Plaisir, 78370, France'},
  {label: 'Villepreux', query: 'Villepreux, 78450, France'},
  {label: "Bois-d'Arcy", query: "Bois-d'Arcy, 78390, France"},
  {label: 'Élancourt', query: 'Élancourt, 78990, France'},
  {label: 'Versailles', query: 'Versailles, 78000, France'},
];
