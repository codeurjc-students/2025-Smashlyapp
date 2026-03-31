import React from 'react';
import { FiCompass, FiHelpCircle, FiHome, FiLayers, FiUser } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const NavShell = styled.nav`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 380;
  display: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid #d9e8dc;
  box-shadow: 0 -12px 30px rgba(17, 24, 39, 0.08);
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0));

  @media (max-width: 1024px) {
    display: block;
  }
`;

const NavRow = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  min-height: 52px;
  border-radius: 14px;
  color: ${props => (props.$active ? '#0f6e38' : '#4b5563')};
  background: ${props => (props.$active ? '#eaf8ee' : 'transparent')};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  svg {
    font-size: 1.12rem;
  }

  span {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  &:active {
    transform: scale(0.97);
  }
`;

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const homePath = isAuthenticated && user?.role?.toLowerCase() === 'player' ? '/dashboard' : '/';

  const items = [
    { to: homePath, label: 'Inicio', icon: <FiHome /> },
    { to: '/catalog', label: 'Catalogo', icon: <FiCompass /> },
    { to: '/compare', label: 'Comparar', icon: <FiLayers /> },
    { to: '/faq', label: 'FAQ', icon: <FiHelpCircle /> },
    { to: '/profile', label: 'Perfil', icon: <FiUser /> },
  ];

  return (
    <NavShell aria-label='Navegacion principal movil'>
      <NavRow>
        {items.map(item => {
          const isActive =
            location.pathname === item.to ||
            (item.to === homePath && location.pathname === '/') ||
            (item.to === '/profile' && location.pathname.startsWith('/profile'));

          return (
            <NavItem
              key={item.to}
              to={item.to}
              $active={isActive}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavItem>
          );
        })}
      </NavRow>
    </NavShell>
  );
};

export default MobileBottomNav;
