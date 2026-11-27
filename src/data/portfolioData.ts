export type ProjectCategory =
  | 'all'
  | 'book-covers'
  | 'posters'
  | 'branding'
  | 'print-merch';

export interface PortfolioProject {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<ProjectCategory, 'all'>;
  categoryLabel: string;
  year: string;
  medium: string;
  description: string;
  image: string;
  thumbnail?: string;
  pdfUrl?: string;
  pages?: string[];
  featured?: boolean;
}

export const DESIGNER_PROFILE = {
  name: 'Biniyam Tilahun',
  role: 'Graphic Designer',
  location: 'Bahir Dar, Ethiopia',
  phoneDisplay: '09-92-947-669',
  phoneTel: '+251992947669',
  email: 'biniyamtilahun575@gmail.com',
  avatar: '/assets/aistudio/photo_2026-11-13_01-14-30_b735544e.jpg',
  telegramUrl: 'https://t.me/Benja9294',
  telegramHandle: '@Benja9294',
  tiktokUrl: 'https://www.tiktok.com/@bini35492',
  tiktokHandle: '@bini35492',
  groupName: 'Negen Digital',
  groupRole: 'Group Leader at Negen Digital',
  groupUrl: 'https://negen-digital.vercel.app/',
  bio: 'Graphic designer based in Bahir Dar, Ethiopia, and Group Leader at Negen Digital, specializing in editorial book covers, brand identities, campaign posters, business stationery, and custom corporate merchandise.',
};

export const CATEGORY_FILTERS: { id: ProjectCategory; label: string }[] = [
  { id: 'all', label: 'All Works' },
  { id: 'book-covers', label: 'Book Covers' },
  { id: 'posters', label: 'Posters' },
  { id: 'branding', label: 'Logos & Identity' },
  { id: 'print-merch', label: 'Print & Merch' },
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'eternal-summits',
    title: 'Eternal Summits',
    subtitle: 'A Journey Through The Night',
    category: 'book-covers',
    categoryLabel: 'Book Cover',
    year: '2026',
    medium: 'Full Wrap Print Jacket',
    description:
      'Atmospheric dark-slate wrap cover pairing gold botanical accents, layered mountain silhouettes, and structured serif typography across front, spine, and back.',
    image: '/assets/aistudio/book_cover_Enternal_summits_1_52876ddb.png',
    thumbnail: '/assets/thumbs/book_cover_Enternal_summits_1_52876ddb.webp',
    featured: true,
  },
  {
    id: 'wude-brand-presentation',
    title: 'WUDE Coffee — Brand Presentation',
    subtitle: '14-Page Brand Identity Deck',
    category: 'branding',
    categoryLabel: 'Brand Deck PDF',
    year: '2026',
    medium: 'PDF Presentation · 14 Pages',
    description:
      'Complete brand guidelines deck for Wude Coffee in Bahir Dar—covering the Kaldi origin story, logo construction, creamy yellow & roasted espresso palette, Playfair & Montserrat type system, Ethiopian geometric pattern, signage, and social rollouts.',
    image: '/assets/previews/wude/page-01.webp',
    thumbnail: '/assets/previews/wude/page-01.webp',
    pdfUrl: '/assets/aistudio/Wede_brand_presentations_2ce3f2e9.pdf',
    pages: [
      '/assets/previews/wude/page-01.webp',
      '/assets/previews/wude/page-02.webp',
      '/assets/previews/wude/page-03.webp',
      '/assets/previews/wude/page-04.webp',
      '/assets/previews/wude/page-05.webp',
      '/assets/previews/wude/page-06.webp',
      '/assets/previews/wude/page-07.webp',
      '/assets/previews/wude/page-08.webp',
      '/assets/previews/wude/page-09.webp',
      '/assets/previews/wude/page-10.webp',
      '/assets/previews/wude/page-11.webp',
      '/assets/previews/wude/page-12.webp',
      '/assets/previews/wude/page-13.webp',
      '/assets/previews/wude/page-14.webp',
    ],
    featured: true,
  },
  {
    id: 'negen-creatives-card',
    title: 'Negen Creatives — Business Card Front',
    subtitle: 'Studio Identity & Print Front',
    category: 'print-merch',
    categoryLabel: 'Business Card PDF',
    year: '2026',
    medium: 'PDF Print Artwork',
    description:
      'Bold studio business card front pairing an angular lightning-crest monogram in deep charcoal against signature high-contrast electric yellow.',
    image: '/assets/previews/negen-card-front.webp',
    thumbnail: '/assets/previews/negen-card-front.webp',
    pdfUrl: '/assets/aistudio/negen_businesscard_front_f36b4c5f.pdf',
    pages: ['/assets/previews/negen-card-front.webp'],
    featured: true,
  },
  {
    id: 'wude-coffee-brand',
    title: 'WUDE Coffee',
    subtitle: 'Full Brand Lockup & Emblem',
    category: 'branding',
    categoryLabel: 'Brand Identity',
    year: '2026',
    medium: 'Vector Brand System',
    description:
      'Ethiopian coffee identity combining a geometric lion-and-coffee-bean mark with custom angular display lettering in warm roasted espresso and gold tones.',
    image: '/assets/aistudio/Logo_wede_ad7070ae.png',
    thumbnail: '/assets/thumbs/Logo_wede_ad7070ae.webp',
    featured: true,
  },
  {
    id: 'amhara-bank-clock',
    title: 'Amhara Bank Ge’ez Wall Clock',
    subtitle: 'Custom Corporate Timepiece',
    category: 'print-merch',
    categoryLabel: 'Custom Merch',
    year: '2025',
    medium: 'Custom Dial & Print Production',
    description:
      'Branded wall clock face featuring traditional Ge’ez numerals framed in clean white brackets around the signature blue and gold Amhara Bank emblem.',
    image: '/assets/aistudio/IMG_20251204_192153_984_ee5f02c0.jpg',
    thumbnail: '/assets/thumbs/IMG_20251204_192153_984_ee5f02c0.webp',
    featured: true,
  },
  {
    id: 'the-quiet-path',
    title: 'The Quiet Path',
    subtitle: 'A Journey Inward',
    category: 'book-covers',
    categoryLabel: 'Book Cover',
    year: '2026',
    medium: 'Full Wrap Print Jacket',
    description:
      'Warm daylight editorial cover balancing clean sunlit photography with calm earth-tone back cover typography and barcode layout.',
    image: '/assets/aistudio/book_cover_the_quite_path_1_9807cfcf.jpg',
    thumbnail: '/assets/thumbs/book_cover_the_quite_path_1_9807cfcf.webp',
  },
  {
    id: 'yefikir-guzo',
    title: 'የፍቅር ጉዞ (Journey of Love)',
    subtitle: 'Amharic Literary Edition',
    category: 'book-covers',
    categoryLabel: 'Book Cover',
    year: '2026',
    medium: 'Double-Exposure Cover Design',
    description:
      'Double-exposure sunset composition blending silhouetted profiles over an ocean horizon with expressive Ge’ez script typography.',
    image: '/assets/aistudio/book_cover________1_125034f2.jpg',
    thumbnail: '/assets/thumbs/book_cover________1_125034f2.webp',
  },
  {
    id: 'bdu-graduation-poster',
    title: 'BDU Class of 2025/26',
    subtitle: 'Bahir Dar University Celebration',
    category: 'posters',
    categoryLabel: 'Event Poster',
    year: '2026',
    medium: 'Digital & Large-Format Print',
    description:
      'Commemorative graduation poster designed for Bahir Dar University students with layered photo compositing and bold collegiate typography.',
    image: '/assets/aistudio/Poster_3a1c6c60.jpg',
    thumbnail: '/assets/thumbs/Poster_3a1c6c60.webp',
  },
  {
    id: 'the-power-of-the-people',
    title: 'The Power of the People',
    subtitle: 'Together We Rise, Together We Change',
    category: 'book-covers',
    categoryLabel: 'Book Cover',
    year: '2026',
    medium: 'Textured Foil Concept',
    description:
      'Symbolic gold-on-navy textured book wrap illustrating collective unity rising from individual silhouettes.',
    image: '/assets/aistudio/book_cover_The_power_of_the_people_3_1fdaad74.jpg',
    thumbnail: '/assets/thumbs/book_cover_The_power_of_the_people_3_1fdaad74.webp',
  },
  {
    id: 'keadmas-bashager',
    title: 'ከአድማስ ባሻገር (Beyond the Horizon)',
    subtitle: 'Amharic Philosophical Novel',
    category: 'book-covers',
    categoryLabel: 'Book Cover',
    year: '2026',
    medium: 'Full Wrap Print Jacket',
    description:
      'Golden sunrise mountain vista paired with high-contrast Ge’ez display lettering and a clean obsidian back cover.',
    image: '/assets/aistudio/book_cover___________1_d844e233.jpg',
    thumbnail: '/assets/thumbs/book_cover___________1_d844e233.webp',
  },
  {
    id: 'birana-records-front',
    title: 'Birana Records — Front',
    subtitle: 'Music And Creative Production',
    category: 'print-merch',
    categoryLabel: 'Business Card',
    year: '2026',
    medium: 'Print Stationery',
    description:
      'High-contrast black and gold geometric corner card featuring a textured monogram B and script studio wordmark.',
    image: '/assets/aistudio/Bussiness_card_1_fc31b315.jpg',
    thumbnail: '/assets/thumbs/Bussiness_card_1_fc31b315.webp',
  },
  {
    id: 'birana-records-back',
    title: 'Birana Records — Back & QR',
    subtitle: 'Contact & Digital Scan Side',
    category: 'print-merch',
    categoryLabel: 'Business Card',
    year: '2026',
    medium: 'Print Stationery',
    description:
      'Reverse business card layout integrating a high-contrast QR code alongside crisp contact typography.',
    image: '/assets/aistudio/Bussiness_card_2_718f48ce.jpg',
    thumbnail: '/assets/thumbs/Bussiness_card_2_718f48ce.webp',
  },
  {
    id: 'yemaytayew-sikay',
    title: 'የማይታየው ስቃይ (The Unseen Pain)',
    subtitle: 'Child Protection Advocacy Poster',
    category: 'posters',
    categoryLabel: 'Social Poster',
    year: '2026',
    medium: 'Advocacy Print Poster',
    description:
      'High-impact editorial silhouette poster highlighting child welfare and protection using layered red-and-charcoal visual metaphor.',
    image: '/assets/aistudio/poster_poletical_2ac97def.jpg',
    thumbnail: '/assets/thumbs/poster_poletical_2ac97def.webp',
  },
  {
    id: 'hazron-apparel',
    title: 'HAZRON Quality Apparel',
    subtitle: 'Tailoring & Garment Identity',
    category: 'branding',
    categoryLabel: 'Brand Identity',
    year: '2026',
    medium: 'Vector Illustration & Logo',
    description:
      'Clean vector trouser line-art with needle-and-thread detail paired with bold geometric sans-serif branding.',
    image: '/assets/aistudio/Logo_HAZRON_1666b636.png',
    thumbnail: '/assets/thumbs/Logo_HAZRON_1666b636.webp',
  },
  {
    id: 'berhan-bank-clock',
    title: 'Berhan Bank Wall Clock',
    subtitle: 'Corporate Branded Timepiece',
    category: 'print-merch',
    categoryLabel: 'Custom Merch',
    year: '2026',
    medium: 'Custom Dial Fabrication',
    description:
      'Precision-aligned clock dial built in Berhan Bank’s signature yellow and cobalt palette with bilingual Amharic-English logotype.',
    image: '/assets/aistudio/IMG_20260311_150039_391_ff7c0883.jpg',
    thumbnail: '/assets/thumbs/IMG_20260311_150039_391_ff7c0883.webp',
  },
  {
    id: 'tibebn-felega',
    title: 'ጥበብን ፍለጋ (In Search of Wisdom)',
    subtitle: 'Amharic Reflective Book Cover',
    category: 'book-covers',
    categoryLabel: 'Book Cover',
    year: '2026',
    medium: 'Minimalist Vector Wrap',
    description:
      'Graphic light-beam illustration illuminating an amber horizon, crafted for clean print readability.',
    image: '/assets/aistudio/book_cover_________1_758cccf9.jpg',
    thumbnail: '/assets/thumbs/book_cover_________1_758cccf9.webp',
  },
  {
    id: 'johnnie-walker-poster',
    title: 'Johnnie Walker Black Label',
    subtitle: 'Commercial Beverage Poster',
    category: 'posters',
    categoryLabel: 'Commercial Poster',
    year: '2026',
    medium: 'Photo Manipulation & Layout',
    description:
      'Product-focused beverage poster featuring shallow depth-of-field background framing, splash retouching, and outlined display type.',
    image: '/assets/aistudio/Poster_Social_1_17cbea18.jpg',
    thumbnail: '/assets/thumbs/Poster_Social_1_17cbea18.webp',
  },
  {
    id: 'berna-realstate',
    title: 'Berna Realstate',
    subtitle: 'Property Advisory Business Card',
    category: 'print-merch',
    categoryLabel: 'Business Card',
    year: '2026',
    medium: 'Print Stationery',
    description:
      'Luxury black-and-gold house-key visual centerpiece paired with vertical icon navigation for WhatsApp, location, web, and email.',
    image: '/assets/aistudio/Buissnes_card_12fc1d79.jpg',
    thumbnail: '/assets/thumbs/Buissnes_card_12fc1d79.webp',
  },
  {
    id: 'nexus-hands',
    title: 'Nexus Hands',
    subtitle: 'Collaborative Pictorial Mark',
    category: 'branding',
    categoryLabel: 'Logo Design',
    year: '2026',
    medium: 'Vector Pictorial Emblem',
    description:
      'Two stylized hands meeting at a spark point in cobalt blue and vibrant orange, symbolizing partnership and connection.',
    image: '/assets/aistudio/Logo_pictorial2_7dc9a987.png',
    thumbnail: '/assets/thumbs/Logo_pictorial2_7dc9a987.webp',
  },
  {
    id: 'yetiyit-dagnenet',
    title: 'የጥይት ዳኝነት (Justice & Power)',
    subtitle: 'Amharic Editorial Book Cover',
    category: 'book-covers',
    categoryLabel: 'Book Cover',
    year: '2026',
    medium: 'Illustrative Book Wrap',
    description:
      'Symbolic scales-of-justice illustration examining conflict and fairness, set with bold extruded Amharic title lettering.',
    image: '/assets/aistudio/book_cover___________1_c9faa7a2.jpg',
    thumbnail: '/assets/thumbs/book_cover___________1_c9faa7a2.webp',
  },
  {
    id: 'green-party-poster',
    title: 'ምረጡ — Green Party Campaign',
    subtitle: 'Dr. Nigusu Bangida Poster',
    category: 'posters',
    categoryLabel: 'Campaign Poster',
    year: '2026',
    medium: 'Political Print Poster',
    description:
      'Curved wave composition in emerald green and golden yellow with textured plaster backdrop and outlined Amharic campaign headlines.',
    image: '/assets/aistudio/Poster_Political_1_3b5b79d3.jpg',
    thumbnail: '/assets/thumbs/Poster_Political_1_3b5b79d3.webp',
  },
  {
    id: 'self-growth-logo',
    title: 'Self Growth',
    subtitle: 'Personal Development Emblem',
    category: 'branding',
    categoryLabel: 'Logo Design',
    year: '2026',
    medium: 'Vector Brand Mark',
    description:
      'Organic cradling hand supporting a rising figure and sprouting leaves, representing personal wellness and upward growth.',
    image: '/assets/aistudio/Logo_self_d1a22078.png',
    thumbnail: '/assets/thumbs/Logo_self_d1a22078.webp',
  },
  {
    id: 'wude-coffee-emblem',
    title: 'WUDE Coffee — Circular Badge',
    subtitle: 'Packaging & Cup Stamp Mark',
    category: 'branding',
    categoryLabel: 'Brand Mark',
    year: '2026',
    medium: 'Circular Seal Vector',
    description:
      'Standalone circular emblem variation adapted for coffee packaging seals, stickers, and social avatars.',
    image: '/assets/aistudio/logo_5c4b9a88.jpg',
    thumbnail: '/assets/thumbs/logo_5c4b9a88.webp',
  },
  {
    id: 'lets-stand-together',
    title: 'Let’s Stand Together',
    subtitle: 'Editorial Political Poster',
    category: 'posters',
    categoryLabel: 'Campaign Poster',
    year: '2026',
    medium: 'Digital Poster Layout',
    description:
      'Structured campaign layout pairing subject cutout, curved directional ribbons, and clear three-point typographic callout.',
    image: '/assets/aistudio/Poster_Political_2_34a4779a.jpg',
    thumbnail: '/assets/thumbs/Poster_Political_2_34a4779a.webp',
  },
  {
    id: 'naturaface-logo',
    title: 'Naturaface — Botanical Brand Logo',
    subtitle: 'Natural Skincare Emblem & Wordmark',
    category: 'branding',
    categoryLabel: 'Logo Design',
    year: '2026',
    medium: 'Vector Emblem & Textured Wordmark',
    description:
      'Organic avocado-inspired character emblem paired with leaf-textured Naturaface script typography crafted for a natural botanical skincare brand.',
    image: '/assets/aistudio/image_b54768ed.png',
  },
  {
    id: 'naturaface-contact-poster',
    title: 'Naturaface — Brand Contact Poster',
    subtitle: 'Promotional Skincare Banner',
    category: 'posters',
    categoryLabel: 'Brand Poster',
    year: '2026',
    medium: 'Digital Promotional Layout',
    description:
      'Botanical green wave promotional poster featuring the Naturaface emblem, textured logo header, and clean client contact details.',
    image: '/assets/aistudio/image_a29d6d38.png',
  },
  {
    id: 'naturaface-trifold-poster',
    title: 'Naturaface — Skincare Brochure Poster',
    subtitle: '50% Special Offer & Botanical Story',
    category: 'posters',
    categoryLabel: 'Promotional Poster',
    year: '2026',
    medium: 'Tri-Fold Print & Campaign Layout',
    description:
      'Three-panel botanical skincare campaign poster highlighting natural avocado and aloe vera ingredients with a 50% special offer callout.',
    image: '/assets/aistudio/image_b95821da.png',
  },
  {
    id: 'naturaface-apparel-merch',
    title: 'Naturaface — Branded T-Shirt Collection',
    subtitle: 'White & Black Apparel Mockups',
    category: 'print-merch',
    categoryLabel: 'Apparel & Merch',
    year: '2026',
    medium: 'Custom T-Shirt Print Production',
    description:
      'Custom cotton apparel merchandise showcasing the full-color Naturaface botanical emblem across white and black crew-neck t-shirts.',
    image: '/assets/aistudio/image_e572ff5f.png',
  },
];

export interface CertificateItem {
  id: string;
  issuer: string;
  district: string;
  title: string;
  amharicTitle: string;
  dateLabel: string;
  referenceNo: string;
  signatory: string;
  description: string;
  image: string;
}

export const DESIGNER_CERTIFICATES: CertificateItem[] = [
  {
    id: 'cert-amhara-bank',
    issuer: 'Amhara Bank S.C.',
    district: 'Bahir Dar District',
    title: 'Work Confirmation & Recognition Certificate',
    amharicTitle: 'የስራ ማረጋገጫ እና የምስክር ወረቀት',
    dateLabel: '15/03/2019 E.C.',
    referenceNo: 'Ref: አባ/ባዳዲ/ፈአ/4050/19',
    signatory: 'Fentahun Abere — Operations Manager',
    description:
      'Official work confirmation and recognition awarded while studying 3rd Year Graphic Design at Bahir Dar University (Selam Campus), honoring the custom 3D Ge’ez numeral & Amhara Bank wall clock created for Bahir Dar District.',
    image: '/assets/aistudio/image_556773a9.png',
  },
  {
    id: 'cert-berhan-bank',
    issuer: 'Berhan Bank',
    district: 'Bahir Dar City Main District',
    title: 'Work Confirmation & Recommendation Certificate',
    amharicTitle: 'የስራ ማረጋገጫ እና የምስክር ወረቀት',
    dateLabel: '11/03/2019 E.C.',
    referenceNo: 'Official District Seal',
    signatory: 'Yohannes Tesfaye — Bahir Dar Cluster Manager',
    description:
      'Official recommendation and completion certificate confirming creative excellence, visual aesthetic quality, and professional delivery of the custom 3D wall clock designed for Berhan Bank Bahir Dar City Main District.',
    image: '/assets/aistudio/photo_2026-11-21_23-11-59_dfbef8f6.jpg',
  },
];

export interface GroupMember {
  id: string;
  name: string;
  role: string;
  location: string;
  tagline?: string;
  bio: string;
  image: string;
  isWhiteBackdrop?: boolean;
}

export const GROUP_MEMBERS: GroupMember[] = [
  {
    id: 'member-biniyam',
    name: 'Biniyam Tilahun',
    role: 'Group Leader · Graphic Designer',
    location: 'Bahir Dar, Ethiopia',
    bio: 'Leads creative direction, editorial book covers, corporate branding, and print production at Negen Digital.',
    image: '/assets/aistudio/photo_2026-11-13_01-14-30_b735544e.jpg',
    isWhiteBackdrop: false,
  },
  {
    id: 'member-bezawit',
    name: 'Bezawit',
    role: 'Graphic Designer · Negen Digital',
    location: 'Bahir Dar, Ethiopia',
    tagline: 'Stop Existing and Start Living',
    bio: 'Graphic Designer working together with Biniyam Tilahun in the Negen Digital creative group on visual branding, typography art, and collaborative design projects.',
    image: '/assets/aistudio/image_ca5c6aa0.png',
    isWhiteBackdrop: true,
  },
];

const OFFLINE_CONTACT_STORAGE_KEY = 'biniyam_tilahun_offline_contact_v1';

export function persistContactOffline(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        OFFLINE_CONTACT_STORAGE_KEY,
        JSON.stringify({
          ...DESIGNER_PROFILE,
          savedAt: new Date().toISOString(),
        })
      );
    }
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function generateVCardString(): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Tilahun;Biniyam;;;',
    `FN:${DESIGNER_PROFILE.name}`,
    `ORG:${DESIGNER_PROFILE.groupName}`,
    `TITLE:${DESIGNER_PROFILE.role} · ${DESIGNER_PROFILE.groupRole}`,
    `TEL;TYPE=CELL,VOICE:${DESIGNER_PROFILE.phoneTel}`,
    `TEL;TYPE=WORK,VOICE:${DESIGNER_PROFILE.phoneDisplay}`,
    `EMAIL;TYPE=INTERNET:${DESIGNER_PROFILE.email}`,
    `ADR;TYPE=WORK:;;Bahir Dar;;;Ethiopia`,
    `URL;TYPE=Group:${DESIGNER_PROFILE.groupUrl}`,
    `URL;TYPE=Telegram:${DESIGNER_PROFILE.telegramUrl}`,
    `URL;TYPE=TikTok:${DESIGNER_PROFILE.tiktokUrl}`,
    `NOTE:Graphic Designer & ${DESIGNER_PROFILE.groupRole} (${DESIGNER_PROFILE.groupUrl}) in Bahir Dar, Ethiopia. Telegram: ${DESIGNER_PROFILE.telegramHandle} | TikTok: ${DESIGNER_PROFILE.tiktokHandle}`,
    'END:VCARD',
  ].join('\r\n');
}

export function downloadVCard(): void {
  persistContactOffline();
  const vcard = generateVCardString();
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Biniyam_Tilahun_Graphic_Designer.vcf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
