import React, { useState, useRef, useEffect } from 'react';
import { FiMenu, FiSearch, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import GlobalSearch from '../features/GlobalSearch';
import { NotificationBell } from '../notifications/NotificationBell';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  padding: 0;
  box-shadow: 0 2px 20px rgba(22, 163, 74, 0.15);
  top: 0;
  z-index: 100;
  position: relative;
`;

const HeaderContent = styled.div`
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 80px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
  width: 100%;
  
  @media (max-width: 1600px) {
    padding: 0 clamp(20px, 3vw, 60px);
  }
  
  @media (max-width: 1200px) {
    padding: 0 clamp(20px, 2vw, 40px);
  }
  
  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;

  img {
    height: 75px;
    width: auto;
    transition: transform 0.2s ease;

    @media (max-width: 768px) {
      height: 50px;
    }

    @media (max-width: 480px) {
      height: 40px;
    }
  }

  &:hover {
    text-decoration: none;

    img {
      transform: scale(1.05);
    }
  }
`;

const CentralSearchContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 500px;
  width: 100%;

  @media (max-width: 1024px) {
    display: none;
  }
`;

// Mobile Elements Container
const MobileElements = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

// Search Toggle Button for Mobile
const MobileSearchButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 480px) {
    padding: 8px;
    font-size: 1.1rem;
  }
`;

// Mobile Menu Dropdown
const MobileMenuDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(${props => (props.isOpen ? '0' : '-10px')});
  opacity: ${props => (props.isOpen ? '1' : '0')};
  visibility: ${props => (props.isOpen ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
  z-index: 50;
`;

// Mobile Search Container
const MobileSearchContainer = styled.div<{ isOpen: boolean }>`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  transform: translateY(${props => (props.isOpen ? '0' : '-10px')});
  opacity: ${props => (props.isOpen ? '1' : '0')};
  transition: all 0.3s ease 0.1s;

  @media (min-width: 1025px) {
    display: none;
  }
`;

// Navigation Section in Mobile Menu
const MobileNavSection = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const MobileNavTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NavLink = styled(Link)<{ isActive: boolean; isMobile?: boolean }>`
  color: ${props => (props.isMobile ? '#374151' : 'white')};
  text-decoration: none;
  font-weight: 500;
  padding: ${props => (props.isMobile ? '12px 0' : '8px 16px')};
  border-radius: ${props => (props.isMobile ? '0' : '8px')};
  transition: all 0.2s ease;
  background: ${props =>
    props.isActive && !props.isMobile ? 'rgba(255, 255, 255, 0.15)' : 'transparent'};
  display: block;
  position: relative;
  border: ${props => (props.isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.3)')};

  ${props =>
    props.isMobile &&
    `
    border-left: 3px solid ${props.isActive ? '#16a34a' : 'transparent'};
    padding-left: 16px;
    margin-left: -1rem;
  `}

  &:hover {
    background: ${props => (props.isMobile ? '#f9fafb' : 'rgba(255, 255, 255, 0.1)')};
    color: ${props => (props.isMobile ? '#16a34a' : 'white')};
    text-decoration: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 480px) {
    font-size: 1.3rem;
    padding: 6px;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const AuthButton = styled.button<{
  variant?: 'primary' | 'secondary';
  isMobile?: boolean;
}>`
  padding: ${props => (props.isMobile ? '12px 16px' : '8px 20px')};
  border-radius: ${props => (props.isMobile ? '12px' : '8px')};
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  text-align: center;
  display: block;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 1rem; // Ensure font size consistency
  font-family: inherit; // Inherit font


  ${props => {
    if (props.isMobile) {
      return props.variant === 'primary'
        ? `
        background: #16a34a;
        color: white;
        
        &:hover {
          background: #15803d;
          color: white;
          text-decoration: none;
        }
      `
        : `
        background: transparent;
        color: #374151;
        border: 2px solid #e5e7eb;
        
        &:hover {
          background: #f9fafb;
          border-color: #16a34a;
          color: #16a34a;
          text-decoration: none;
        }
      `;
    } else {
      return props.variant === 'primary'
        ? `
        background: white;
        color: #16a34a;
        
        &:hover {
          background: #f0f0f0;
          color: #15803d;
          text-decoration: none;
        }
      `
        : `
        background: transparent;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          text-decoration: none;
        }
      `;
    }
  }}
`;

const LogoutButton = styled.button<{
  variant?: 'primary' | 'secondary';
  isMobile?: boolean;
}>`
  padding: ${props => (props.isMobile ? '12px 16px' : '8px 20px')};
  border-radius: ${props => (props.isMobile ? '12px' : '8px')};
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  text-align: center;
  display: block;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: white;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    text-decoration: none;
  }

  ${props =>
    props.isMobile &&
    `
    background: transparent;
    color: #374151;
    border: 2px solid #e5e7eb;
    
    &:hover {
      background: #f9fafb;
      border-color: #16a34a;
      color: #16a34a;
      text-decoration: none;
    }
  `}
`;

// User Avatar Menu Styles
const UserMenuContainer = styled.div`
  position: relative;
`;

const AvatarButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  background: white;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    color: #16a34a;
    font-size: 20px;
  }
`;

const UserDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  opacity: ${props => (props.isOpen ? '1' : '0')};
  visibility: ${props => (props.isOpen ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.isOpen ? '0' : '-10px')});
  transition: all 0.2s ease;
  z-index: 1000;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: #f3f4f6;
  }

  &:first-child {
    border-radius: 12px 12px 0 0;
  }

  &:last-child {
    border-radius: 0 0 12px 12px;
  }

  svg {
    font-size: 18px;
    color: #16a34a;
  }

  &:last-child svg {
    color: #dc2626;
  }
`;

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { userProfile, signOut } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Close mobile search when opening menu
    if (!isMenuOpen) {
      setIsMobileSearchOpen(false);
    }
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    // Close menu when opening mobile search
    if (!isMobileSearchOpen) {
      setIsMenuOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsUserMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to='/' onClick={closeAllMenus}>
          <img src='https://lrdgyfmkkboyhoycrnov.supabase.co/storage/v1/object/sign/images/smashly-large-icon.ico?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jY2NkNjhmMi03NDg2LTQzNGUtYjE0ZC1mYmE0YzJkM2RiNzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvc21hc2hseS1sYXJnZS1pY29uLmljbyIsImlhdCI6MTc3MTU3OTQ4NCwiZXhwIjoxODAzMTE1NDg0fQ.gccmibb2sAt_EekW0HRgQEBFfsKKwc_3GoO75SVqbJc' alt='Smashly' />
        </Logo>

        {/* Central Search Bar (Desktop) */}
        <CentralSearchContainer>
          <GlobalSearch onSearchToggle={() => {}} isInHeader={true} />
        </CentralSearchContainer>

        <AuthButtons>
          {userProfile ? (
            <UserMenuContainer ref={userMenuRef} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NotificationBell />
              <AvatarButton onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt='Avatar' />
                ) : (
                  <FiUser />
                )}
              </AvatarButton>
              <UserDropdown isOpen={isUserMenuOpen}>
                <DropdownItem
                  onClick={() => {
                    navigate('/profile');
                    setIsUserMenuOpen(false);
                  }}
                >
                  <FiUser />
                  Mi cuenta
                </DropdownItem>
                <DropdownItem
                  onClick={async () => {
                    await signOut();
                    setIsUserMenuOpen(false);
                    navigate('/');
                  }}
                >
                  <FiLogOut />
                  Cerrar sesión
                </DropdownItem>
              </UserDropdown>
            </UserMenuContainer>
          ) : (
            <>
              <AuthButton
                onClick={openLogin}
                variant='secondary'
              >
                Iniciar sesión
              </AuthButton>
              <AuthButton
                onClick={openRegister}
                variant='primary'
              >
                Registrarse
              </AuthButton>
            </>
          )}
        </AuthButtons>

        {/* Mobile Elements */}
        <MobileElements>
          <MobileSearchButton onClick={toggleMobileSearch}>
            <FiSearch />
          </MobileSearchButton>
          <MobileMenuButton onClick={toggleMenu}>
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </MobileMenuButton>
        </MobileElements>

        {/* Mobile Menu Dropdown */}
        <MobileMenuDropdown isOpen={isMenuOpen || isMobileSearchOpen}>
          {/* Mobile Search Section */}
          <MobileSearchContainer isOpen={isMobileSearchOpen}>
            <GlobalSearch onSearchToggle={setIsMobileSearchOpen} isInHeader={true} />
          </MobileSearchContainer>

          {/* Navigation Section */}
          {isMenuOpen && (
            <>
              <MobileNavSection>
                <MobileNavTitle>Navegación</MobileNavTitle>
                <NavLink to='/' isActive={isActive('/')} isMobile onClick={closeAllMenus}>
                  Inicio
                </NavLink>
                <NavLink
                  to='/catalog'
                  isActive={isActive('/catalog')}
                  isMobile
                  onClick={closeAllMenus}
                >
                  Catálogo de Palas
                </NavLink>
                <NavLink
                  to='/rackets'
                  isActive={isActive('/rackets')}
                  isMobile
                  onClick={closeAllMenus}
                >
                  Comparar palas
                </NavLink>
                <NavLink to='/faq' isActive={isActive('/faq')} isMobile onClick={closeAllMenus}>
                  FAQ
                </NavLink>
              </MobileNavSection>

              {/* Auth Section for Mobile */}
              <MobileNavSection>
                <MobileNavTitle>Cuenta</MobileNavTitle>
                {userProfile ? (
                  <>
                    <NavLink
                      to='/profile'
                      isActive={isActive('/profile')}
                      isMobile
                      onClick={closeAllMenus}
                    >
                      <FiUser style={{ marginRight: '8px' }} />
                      Mi cuenta
                    </NavLink>
                    <LogoutButton
                      variant='secondary'
                      isMobile
                      onClick={async () => {
                        await signOut();
                        closeAllMenus();
                        navigate('/');
                      }}
                      style={{ cursor: 'pointer', marginTop: '0.5rem' }}
                    >
                      <FiLogOut style={{ marginRight: '8px' }} />
                      Cerrar sesión
                    </LogoutButton>
                  </>
                ) : (
                  <>
                    <AuthButton
                      variant='secondary'
                      isMobile
                      onClick={() => {
                        closeAllMenus();
                        openLogin();
                      }}
                    >
                      Iniciar sesión
                    </AuthButton>
                    <AuthButton
                      variant='primary'
                      isMobile
                      onClick={() => {
                        closeAllMenus();
                        openRegister();
                      }}
                      style={{ marginTop: '0.5rem' }}
                    >
                      Registrarse
                    </AuthButton>
                  </>
                )}
              </MobileNavSection>
            </>
          )}
        </MobileMenuDropdown>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
