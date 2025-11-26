import React from 'react';
import { FiBook, FiCompass, FiHome, FiLayers } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const SubHeaderContainer = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

  top: 70px; /* Height of main header */
  z-index: 90;
  backdrop-filter: blur(8px);
`;

const SubHeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;

  @media (max-width: 768px) {
    display: none; /* Hide on mobile since navigation is in mobile menu */
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavItem = styled(Link)<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => (props.isActive ? '#16a34a' : '#6b7280')};
  text-decoration: none;
  font-weight: ${props => (props.isActive ? '600' : '500')};
  font-size: 0.875rem;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    color: #16a34a;
    background: #f8fdf8;
    text-decoration: none;
  }

  ${props =>
    props.isActive &&
    `
    background: #f0f9f0;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -7px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: #16a34a;
      border-radius: 1px;
    }
  `}
`;

const NavIcon = styled.div`
  font-size: 0.95rem;
  display: flex;
  align-items: center;
`;

const NavText = styled.span`
  white-space: nowrap;
  font-size: 0.875rem;
`;

const SubHeader: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Determine home path based on user authentication
  const homePath = isAuthenticated && user?.role?.toLowerCase() === 'player' ? '/dashboard' : '/';

  const navigationItems = [
    {
      to: homePath,
      icon: <FiHome />,
      text: 'Inicio',
      isActive: isActive(homePath) || (homePath === '/dashboard' && isActive('/')),
    },
    {
      to: '/catalog',
      icon: <FiCompass />,
      text: 'Catálogo de Palas',
      isActive: isActive('/catalog'),
    },
    {
      to: '/compare',
      icon: <FiLayers />,
      text: 'Comparar Palas',
      isActive: isActive('/compare'),
    },
    {
      to: '/faq',
      icon: <FiBook />,
      text: 'FAQ',
      isActive: isActive('/faq'),
    },
  ];

  return (
    <SubHeaderContainer>
      <SubHeaderContent>
        <Navigation>
          {navigationItems.map(item => (
            <NavItem key={item.to} to={item.to} isActive={item.isActive}>
              <NavIcon>{item.icon}</NavIcon>
              <NavText>{item.text}</NavText>
            </NavItem>
          ))}
        </Navigation>
      </SubHeaderContent>
    </SubHeaderContainer>
  );
};

export default SubHeader;
