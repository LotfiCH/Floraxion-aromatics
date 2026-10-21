import React from 'react';

interface BotanicalIllustrationProps {
  tag: string;
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
  aspectRatio?: 'square' | 'wide' | 'portrait';
  presentation?: 'default' | 'cart-thumbnail';
}

export const BotanicalIllustration: React.FC<BotanicalIllustrationProps> = ({
  tag,
  imageUrl,
  imageAlt,
  className = '',
  aspectRatio = 'square',
  presentation = 'default',
}) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const getTheme = () => {
    switch (tag) {
      case 'rosemary':
        return {
          bg: 'from-[#EFECE4] to-[#E3DFD3]',
          accent: '#244A3B',
          accentLight: '#829477',
          amberLiquid: '#B87333',
        };
      case 'lavender':
        return {
          bg: 'from-[#EDECE8] to-[#DDDCD4]',
          accent: '#4A4259',
          accentLight: '#8B849C',
          amberLiquid: '#B87333',
        };
      case 'eucalyptus':
        return {
          bg: 'from-[#EBECE6] to-[#D9DDD3]',
          accent: '#2D4E41',
          accentLight: '#759082',
          amberLiquid: '#C2843B',
        };
      case 'cedarwood':
        return {
          bg: 'from-[#EFECE2] to-[#DFD9CD]',
          accent: '#543D2B',
          accentLight: '#947B65',
          amberLiquid: '#8C531B',
        };
      case 'immortelle':
        return {
          bg: 'from-[#F5F2E6] to-[#E6DEC6]',
          accent: '#917228',
          accentLight: '#D4AF37',
          amberLiquid: '#D99826',
        };
      case 'carrier_oil':
        return {
          bg: 'from-[#F4F1E8] to-[#E5DFC9]',
          accent: '#7A6038',
          accentLight: '#B89758',
          amberLiquid: '#E0A838',
        };
      case 'prickly_pear':
        return {
          bg: 'from-[#EFEFE6] to-[#DDDDCB]',
          accent: '#3E5C3D',
          accentLight: '#7F9E7D',
          amberLiquid: '#B5A838',
        };
      case 'rose_water':
        return {
          bg: 'from-[#F7F0ED] to-[#E9DDD8]',
          accent: '#8A4F5B',
          accentLight: '#C7909A',
          amberLiquid: '#F2C6CE',
        };
      case 'orange_blossom':
        return {
          bg: 'from-[#F7F3E9] to-[#E8E1CE]',
          accent: '#7A5E2E',
          accentLight: '#C9A35D',
          amberLiquid: '#F5DCB0',
        };
      case 'olive_oil':
        return {
          bg: 'from-[#F5F4E8] to-[#E5E3CD]',
          accent: '#556B2F',
          accentLight: '#8F9754',
          amberLiquid: '#D4AF37',
        };
      case 'olive_rosemary':
        return {
          bg: 'from-[#F3F4EB] to-[#DFE2D0]',
          accent: '#3E5C38',
          accentLight: '#7E9B66',
          amberLiquid: '#CCA028',
        };
      case 'olive_thyme':
        return {
          bg: 'from-[#F5F2E8] to-[#E5DFCC]',
          accent: '#5E5232',
          accentLight: '#9E8D56',
          amberLiquid: '#CFA32B',
        };
      case 'olive_lemon':
        return {
          bg: 'from-[#F7F6EA] to-[#E9E6C9]',
          accent: '#6E7029',
          accentLight: '#B5B84B',
          amberLiquid: '#E2B82E',
        };
      case 'olive_chili':
        return {
          bg: 'from-[#F7EFEA] to-[#EBD9CE]',
          accent: '#8C3B2B',
          accentLight: '#C2654D',
          amberLiquid: '#D66A2C',
        };
      case 'olive_garlic':
        return {
          bg: 'from-[#F6F3EB] to-[#E7E0D1]',
          accent: '#544636',
          accentLight: '#8C7761',
          amberLiquid: '#CBA43D',
        };
      case 'olive_basil':
        return {
          bg: 'from-[#F1F5EB] to-[#DDE7D0]',
          accent: '#325838',
          accentLight: '#65966E',
          amberLiquid: '#C2AC30',
        };
      default:
        return {
          bg: 'from-[#EFECE5] to-[#DFDAD0]',
          accent: '#244A3B',
          accentLight: '#829477',
          amberLiquid: '#B87333',
        };
    }
  };

  const theme = getTheme();

  const ratioClass =
    aspectRatio === 'wide'
      ? 'aspect-[16/9]'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : 'aspect-square';
  const artworkPadding = presentation === 'cart-thumbnail' ? 'p-2' : 'p-6';

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${theme.bg} flex items-center justify-center ${artworkPadding} select-none ${ratioClass} ${className}`}
    >
      {/* Studio lighting radial vignette */}
      <div className="absolute inset-0 bg-radial from-white/30 via-transparent to-black/10 pointer-events-none" />

      {/* Custom image or SVG Botanical Artwork */}
      {imageUrl && !imageError ? (
        <div className="relative z-10 w-full h-full max-h-full max-w-full flex items-center justify-center p-2">
          <img
            src={imageUrl}
            alt={imageAlt || tag}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain rounded-xs drop-shadow-md transition-transform duration-500 hover:scale-105"
          />
        </div>
      ) : (
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full max-h-[94%] max-w-[94%] drop-shadow-md transition-transform duration-500 hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={imageAlt || tag}
        >
        {/* Soft shadow under the apothecary vessel */}
        <ellipse cx="120" cy="205" rx="42" ry="7" fill="rgba(0,0,0,0.12)" />

        {/* Conditional rendering based on product type */}
        {tag === 'rose_water' || tag === 'orange_blossom' ? (
          // Hydrolat Mist Spray Bottle
          <g>
            {/* Clear glass bottle body */}
            <rect x="92" y="85" width="56" height="115" rx="10" fill="url(#hydrolatGlass)" stroke="#D0CBC0" strokeWidth="1.5" />
            {/* Water volume */}
            <rect x="94" y="105" width="52" height="92" rx="8" fill={theme.amberLiquid} fillOpacity="0.35" />
            {/* Internal dip tube */}
            <line x1="120" y1="75" x2="117" y2="195" stroke="#B0AAA0" strokeWidth="2" strokeDasharray="3 3" />
            {/* Minimalist apothecary label */}
            <rect x="100" y="115" width="40" height="65" rx="2" fill="#FFFFFF" stroke="#E5E0D5" strokeWidth="1" />
            <text x="120" y="132" fill="#244A3B" fontSize="6" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">FLORAXION</text>
            <line x1="106" y1="137" x2="134" y2="137" stroke="#244A3B" strokeWidth="0.5" />
            <text x="120" y="146" fill="#6D746E" fontSize="4.5" textAnchor="middle">HYDROLAT</text>
            <text x="120" y="156" fill="#292D29" fontSize="4" fontStyle="italic" textAnchor="middle">Pur & Naturel</text>
            <text x="120" y="168" fill="#829477" fontSize="5" textAnchor="middle">200 ML</text>
            {/* Spray collar and pump */}
            <rect x="108" y="70" width="24" height="15" rx="2" fill="#3A3835" />
            <rect x="114" y="52" width="12" height="18" rx="2" fill="#3A3835" />
            <path d="M126 58 H134 V64 H126 Z" fill="#292D29" />
            {/* Delicate floral sprig behind or adjacent */}
            <path d="M68 180 C75 140 90 100 80 60" stroke={theme.accentLight} strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="78" cy="70" rx="6" ry="3" transform="rotate(-30 78 70)" fill={theme.accentLight} fillOpacity="0.6" />
            <ellipse cx="85" cy="110" rx="8" ry="4" transform="rotate(20 85 110)" fill={theme.accentLight} fillOpacity="0.6" />
          </g>
        ) : tag === 'carrier_oil' || tag === 'prickly_pear' ? (
          // Carrier Vegetable Oil Flask
          <g>
            {/* Heavy Glass Pipette Bottle */}
            <rect x="88" y="80" width="64" height="120" rx="14" fill="#FFFFFF" fillOpacity="0.4" stroke="#C8C2B5" strokeWidth="1.5" />
            {/* Rich Golden Virgin Oil */}
            <rect x="91" y="98" width="58" height="98" rx="10" fill={theme.amberLiquid} fillOpacity="0.75" />
            <path d="M91 100 Q120 95 149 100 V190 Q120 195 91 190 Z" fill="white" fillOpacity="0.1" />
            {/* Pipette Tube */}
            <line x1="120" y1="45" x2="120" y2="185" stroke="#E5DEC9" strokeWidth="2.5" />
            {/* Pipette Tip */}
            <polygon points="118,185 122,185 120,192" fill="#E5DEC9" />
            {/* Apothecary Paper Label */}
            <rect x="96" y="112" width="48" height="68" rx="2" fill="#FDFBF7" stroke="#DDD6C8" strokeWidth="0.8" />
            <text x="120" y="128" fill="#244A3B" fontSize="6.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">FLORAXION</text>
            <text x="120" y="137" fill="#829477" fontSize="4.5" textAnchor="middle" letterSpacing="0.5">TERROIR D’ALGÉRIE</text>
            <line x1="104" y1="141" x2="136" y2="141" stroke="#829477" strokeWidth="0.5" />
            <text x="120" y="152" fill="#292D29" fontSize="4.5" fontStyle="italic" textAnchor="middle">Huile Vierge</text>
            <text x="120" y="161" fill="#6D746E" fontSize="4" textAnchor="middle">1ère Pression à Froid</text>
            <text x="120" y="172" fill="#244A3B" fontSize="5" fontWeight="600" textAnchor="middle">50 ML</text>
            {/* Metallic collar and rubber teat */}
            <rect x="105" y="65" width="30" height="15" rx="2" fill="#2A2A28" />
            <path d="M112 65 C112 48 128 48 128 65 Z" fill="#4A4947" />
            {/* Botanical Leaf accent */}
            <path d="M165 190 C175 160 160 120 150 90" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="160" cy="130" rx="10" ry="5" transform="rotate(-35 160 130)" fill={theme.accent} fillOpacity="0.7" />
          </g>
        ) : (
          // Classic Amber Essential Oil Dropper Bottle
          <g>
            {/* Rich Amber Glass Bottle */}
            <rect x="90" y="78" width="60" height="122" rx="12" fill="#5E3114" stroke="#42210C" strokeWidth="1.5" />
            {/* Inner Amber Depth Gradient */}
            <rect x="93" y="82" width="54" height="114" rx="9" fill="url(#amberDepth)" />
            {/* Glass reflection highlight on the shoulder and edge */}
            <path d="M96 85 C96 85 99 185 99 185" stroke="white" strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" />
            {/* Premium Matte Paper Label */}
            <rect x="96" y="105" width="48" height="72" rx="2" fill="#FAF8F2" stroke="#E3DDD1" strokeWidth="1" />
            <text x="120" y="122" fill="#244A3B" fontSize="6.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">FLORAXION</text>
            <text x="120" y="130" fill="#829477" fontSize="4" textAnchor="middle" letterSpacing="0.4">HUILE ESSENTIELLE</text>
            <line x1="104" y1="134" x2="136" y2="134" stroke="#244A3B" strokeWidth="0.5" />
            <text x="120" y="145" fill="#292D29" fontSize="4.2" fontWeight="600" textAnchor="middle">100% PURE</text>
            <text x="120" y="154" fill="#6D746E" fontSize="3.8" fontStyle="italic" textAnchor="middle">Chémotypée</text>
            <text x="120" y="167" fill="#244A3B" fontSize="5.5" fontWeight="bold" textAnchor="middle">10 ML</text>
            {/* Matte Black Ribbed Screw Dropper Cap */}
            <rect x="104" y="52" width="32" height="26" rx="2" fill="#242321" />
            <line x1="108" y1="55" x2="108" y2="75" stroke="#3D3C38" strokeWidth="1" />
            <line x1="113" y1="55" x2="113" y2="75" stroke="#3D3C38" strokeWidth="1" />
            <line x1="120" y1="55" x2="120" y2="75" stroke="#3D3C38" strokeWidth="1" />
            <line x1="127" y1="55" x2="127" y2="75" stroke="#3D3C38" strokeWidth="1" />
            <line x1="132" y1="55" x2="132" y2="75" stroke="#3D3C38" strokeWidth="1" />
            {/* Delicate Botanical Sprig */}
            <path d="M60 195 C68 150 78 110 65 75" stroke={theme.accentLight} strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="64" cy="130" rx="7" ry="3.5" transform="rotate(-40 64 130)" fill={theme.accentLight} fillOpacity="0.75" />
            <ellipse cx="73" cy="100" rx="7" ry="3.5" transform="rotate(30 73 100)" fill={theme.accentLight} fillOpacity="0.75" />
            <ellipse cx="65" cy="80" rx="6" ry="3" transform="rotate(-15 65 80)" fill={theme.accentLight} fillOpacity="0.75" />
          </g>
        )}

        {/* Gradients */}
        <defs>
          <linearGradient id="amberDepth" x1="93" y1="82" x2="147" y2="196" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8C4A1F" />
            <stop offset="0.6" stopColor="#5E3114" />
            <stop offset="1" stopColor="#361A0A" />
          </linearGradient>
          <linearGradient id="hydrolatGlass" x1="92" y1="85" x2="148" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="0.5" stopColor="#F5F3ED" stopOpacity="0.4" />
            <stop offset="1" stopColor="#E2DED5" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
      )}

    </div>
  );
};
