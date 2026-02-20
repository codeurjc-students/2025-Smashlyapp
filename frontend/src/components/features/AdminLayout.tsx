import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiAlertTriangle,
  FiSettings,
  FiMenu,
  FiX,
} from 'react-icons/fi';

const LayoutContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background: #f8fafc;
  padding: 1.5rem;
  gap: 1.5rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1rem;
    align-items: stretch;
  }
`;

const Sidebar = styled.aside<{ $isOpen: boolean }>`
  width: 260px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: calc(70px + 1.5rem);
  align-self: flex-start;
  z-index: 100;
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    top: 70px;
    height: calc(100vh - 70px);
    border-radius: 0;
    transform: translateX(${props => (props.$isOpen ? '0' : '-100%')});
    width: 260px;
    align-self: auto;
  }
`;

const SidebarOverlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
    opacity: ${props => (props.$isOpen ? 1 : 0)};
    pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')};
    transition: opacity 0.3s ease;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.25rem 1rem 0.75rem 1rem;
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: #f1f5f9;
  border: none;
  
  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
`;

const NavSection = styled.nav`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

const NavLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  color: ${props => (props.$active ? '#16a34a' : '#64748b')};
  background: ${props => (props.$active ? '#16a34a10' : 'transparent')};
  font-weight: ${props => (props.$active ? '600' : '500')};
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  text-decoration: none;
  margin-bottom: 0.25rem;
  white-space: nowrap;

  &:hover {
    background: ${props => (props.$active ? '#16a34a15' : '#f1f5f9')};
    color: ${props => (props.$active ? '#16a34a' : '#0f172a')};
  }

  svg {
    flex-shrink: 0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const MobileHeader = styled.div`
  display: none;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 70px;
  z-index: 50;
  margin: -1rem -1rem 1rem -1rem;
  width: calc(100% + 2rem);

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const MobileMenuButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #0f172a;
  border: none;

  &:hover {
    background: #e2e8f0;
  }
`;

const MobileTitle = styled.span`
  font-weight: 600;
  color: #0f172a;
  font-size: 1rem;
`;

const Placeholder = styled.div`
  width: 36px;
`;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: FiHome },
  { path: '/admin/rackets', label: 'Gestión Palas', icon: FiPackage },
  { path: '/admin/rackets/review', label: 'Revisión Conflictos', icon: FiAlertTriangle },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <LayoutContainer>
      <SidebarOverlay $isOpen={mobileOpen} onClick={() => setMobileOpen(false)} />
      
      <Sidebar $isOpen={mobileOpen}>
        <SidebarHeader>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Menú</span>
          <CloseButton onClick={() => setMobileOpen(false)}>
            <FiX size={18} />
          </CloseButton>
        </SidebarHeader>

        <NavSection>
          <NavLabel>Principal</NavLabel>
          {navItems.map(item => (
            <NavItem
              key={item.path}
              to={item.path}
              $active={location.pathname === item.path}
              onClick={handleNavClick}
            >
              <item.icon size={20} />
              {item.label}
            </NavItem>
          ))}

          <NavLabel style={{ marginTop: '1.5rem' }}>Sistema</NavLabel>
          <NavItem
            to="/admin/users"
            $active={location.pathname === '/admin/users'}
            onClick={handleNavClick}
          >
            <FiUsers size={20} />
            Usuarios
          </NavItem>
          <NavItem
            to="/admin/stores"
            $active={location.pathname === '/admin/stores'}
            onClick={handleNavClick}
          >
            <FiShoppingBag size={20} />
            Tiendas
          </NavItem>
          <NavItem
            to="/admin/settings"
            $active={location.pathname === '/admin/settings'}
            onClick={handleNavClick}
          >
            <FiSettings size={20} />
            Configuración
          </NavItem>
        </NavSection>
      </Sidebar>

      <MainContent>
        <MobileHeader>
          <MobileMenuButton onClick={() => setMobileOpen(true)}>
            <FiMenu size={20} />
          </MobileMenuButton>
          <MobileTitle>Smashly Admin</MobileTitle>
          <Placeholder />
        </MobileHeader>
        {children}
      </MainContent>
    </LayoutContainer>
  );
};

export default AdminLayout;
