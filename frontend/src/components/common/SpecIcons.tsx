import React from 'react';
import styled from 'styled-components';

interface IconProps {
  size?: number;
  color?: string;
}

export const FormaIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M12 3L4 7V11C4 15.55 7.16 19.74 11.5 21C11.66 21 11.83 21 12 21C12.17 21 12.34 21 12.5 21C16.84 19.74 20 15.55 20 11V7L12 3Z'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      fill='none'
    />
  </svg>
);

export const BalanceIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M12 3V21M12 3L6 9M12 3L18 9M12 21L6 15M12 21L18 15'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <circle cx='12' cy='12' r='2' fill={color} />
  </svg>
);

export const PesoIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M12 2C12 2 8 4 8 8V12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12V8C16 4 12 2 12 2Z'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12 16V22M8 22H16'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const NucleoIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='12' cy='12' r='3' stroke={color} strokeWidth='2' />
    <circle cx='12' cy='12' r='8' stroke={color} strokeWidth='2' strokeDasharray='2 3' />
    <circle cx='12' cy='5' r='1.5' fill={color} />
    <circle cx='12' cy='19' r='1.5' fill={color} />
    <circle cx='5' cy='12' r='1.5' fill={color} />
    <circle cx='19' cy='12' r='1.5' fill={color} />
  </svg>
);

export const CarasIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect x='4' y='4' width='16' height='16' rx='2' stroke={color} strokeWidth='2' />
    <path d='M4 12H20M12 4V20' stroke={color} strokeWidth='2' strokeLinecap='round' />
    <path
      d='M7 7L11 11M17 7L13 11M7 17L11 13M17 17L13 13'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
      opacity='0.5'
    />
  </svg>
);

export const NivelIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M4 20L10 14L14 18L20 12'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M20 12V7M20 7H15M20 7L15 12'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <circle cx='10' cy='14' r='1.5' fill={color} />
    <circle cx='14' cy='18' r='1.5' fill={color} />
  </svg>
);

// Store logos - Professional designs based on real brand assets
export const PadelNuestroLogo: React.FC<IconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 200 200'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='100' cy='100' r='90' fill='#D4FF00' />
    <circle cx='75' cy='70' r='12' fill='#003D5C' />
    <circle cx='100' cy='70' r='12' fill='#003D5C' />
    <circle cx='125' cy='70' r='12' fill='#003D5C' />
    <circle cx='75' cy='100' r='12' fill='#003D5C' />
    <circle cx='100' cy='100' r='12' fill='#003D5C' />
    <circle cx='125' cy='100' r='12' fill='#003D5C' />
    <circle cx='75' cy='130' r='12' fill='#003D5C' />
    <circle cx='100' cy='130' r='12' fill='#003D5C' />
    <circle cx='125' cy='130' r='12' fill='#003D5C' />
  </svg>
);

export const PadelMarketLogo: React.FC<IconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 250 100'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <g>
      {/* Stylized padel ball icon */}
      <path
        d='M35 15 Q45 10 55 15 Q70 25 70 40 Q70 55 55 65 Q45 70 35 65 Q20 55 20 40 Q20 25 35 15Z'
        fill='#3B9FE8'
        opacity='0.9'
      />
      <path
        d='M30 30 Q35 27 40 30 L45 40 Q45 45 40 48 L30 45 Q25 42 25 37 Z'
        fill='#5BB8FF'
        opacity='0.7'
      />
      <circle cx='50' cy='30' r='3' fill='#3B9FE8' />
      <circle cx='40' cy='50' r='2.5' fill='#3B9FE8' />
      <circle cx='55' cy='45' r='2' fill='#3B9FE8' />
    </g>
    <text
      x='85'
      y='45'
      fontFamily='Arial, sans-serif'
      fontSize='28'
      fontWeight='700'
      fill='#1A1A1A'
    >
      PADEL
    </text>
    <text
      x='85'
      y='70'
      fontFamily='Arial, sans-serif'
      fontSize='28'
      fontWeight='700'
      fill='#1A1A1A'
    >
      MARKET
    </text>
  </svg>
);

export const PadelProShopLogo: React.FC<IconProps> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 220 80'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect width='220' height='80' rx='4' fill='#000000' />
    <text
      x='15'
      y='32'
      fontFamily='Arial, sans-serif'
      fontSize='20'
      fontWeight='400'
      fill='#FFFFFF'
    >
      Padel
    </text>
    <text
      x='15'
      y='58'
      fontFamily='Arial, sans-serif'
      fontSize='24'
      fontWeight='700'
      fill='#FFFFFF'
    >
      PRO<tspan fill='#FFFFFF'>Shop</tspan>
    </text>
    <path
      d='M185 25 L195 35 L210 20'
      stroke='#2563EB'
      strokeWidth='4'
      strokeLinecap='round'
      strokeLinejoin='round'
      fill='none'
    />
  </svg>
);

export const getStoreLogo = (storeName: string) => {
  const name = storeName.toLowerCase();
  if (name.includes('nuestro')) return PadelNuestroLogo;
  if (name.includes('market')) return PadelMarketLogo;
  if (name.includes('proshop') || name.includes('pro shop')) return PadelProShopLogo;
  return null;
};

// Styled components for StoreLabel
const StoreLabelContainer = styled.div<{ $variant?: 'default' | 'compact' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${props => (props.$variant === 'compact' ? '0.9rem' : '1.05rem')};
  font-weight: 700;
  color: var(--color-gray-900);
  white-space: nowrap;
  position: relative;
  padding-left: ${props => (props.$variant === 'compact' ? '0.75rem' : '1rem')};

  /* Vertical accent line */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: ${props => (props.$variant === 'compact' ? '16px' : '20px')};
    background: var(--color-primary);
    border-radius: 2px;
  }

  /* Subtle hover effect */
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-primary);
  }
`;

// StoreLabel component - Professional store display with text only
interface StoreLabelProps {
  storeName: string;
  variant?: 'default' | 'compact';
}

export const StoreLabel: React.FC<StoreLabelProps> = ({ storeName, variant = 'default' }) => {
  return <StoreLabelContainer $variant={variant}>{storeName}</StoreLabelContainer>;
};
