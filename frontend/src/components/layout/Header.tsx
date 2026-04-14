import React, { useState, useRef, useEffect } from 'react';
import { FiMenu, FiSearch, FiX, FiUser, FiLogOut, FiHome, FiGrid, FiBarChart2, FiHelpCircle, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import GlobalSearch from '../features/GlobalSearch';
import { NotificationBell } from '../notifications/NotificationBell';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #169f4d 0%, #15743a 100%);
  padding: 0;
  box-shadow: 0 10px 32px rgba(21, 116, 58, 0.2);
  position: sticky;
  top: 0;
  z-index: 350;
  padding-top: env(safe-area-inset-top, 0);
  will-change: transform;
  transform: translateZ(0); /* Force layer decomposition for smoother scroll */
`;

const HeaderContent = styled.div`
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 80px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  width: 100%;

  @media (max-width: 1600px) {
    padding: 0 clamp(20px, 3vw, 60px);
  }

  @media (max-width: 1200px) {
    padding: 0 clamp(20px, 2vw, 40px);
  }

  @media (max-width: 768px) {
    padding: 0 16px;
    min-height: 68px;
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
  min-width: 44px;
  min-height: 44px;
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
// Mobile Menu Dropdown with High Performance Optimization
const MobileMenuDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98); /* Slightly more opaque for better performance during animation */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  @media (hover: none) and (pointer: coarse) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: white;
  }
  border-radius: 0 0 24px 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;
  max-height: min(85vh, 720px);
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-top: none;
  will-change: clip-path, opacity; /* Hardware acceleration hint */
  transform-origin: top;
`;

// Mobile Search Container
const MobileSearchContainer = styled.div<{ $isOpen: boolean }>`
  padding: 1.25rem 1rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  transition: all 0.3s ease;
  overflow: visible;
  position: relative;
  z-index: 101;

  @media (min-width: 1025px) {
    display: none;
  }
`;

// Navigation Section in Mobile Menu
const MobileNavSection = styled(motion.div)`
  padding: 1.25rem 1rem;
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  }
`;

const MobileNavTitle = styled.h4`
  font-size: 0.75rem;
  font-weight: 700;
  color: #9ca3af;
  margin: 0 0 1rem 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1.2px;
`;

const NavLink = styled(Link)<{ $isActive: boolean; $isMobile?: boolean }>`
  color: ${props => (props.$isMobile ? '#374151' : 'white')};
  text-decoration: none;
  font-weight: 600;
  padding: ${props => (props.$isMobile ? '12px 16px' : '8px 16px')};
  border-radius: ${props => (props.$isMobile ? '12px' : '8px')};
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${props =>
    props.$isActive && !props.$isMobile ? 'rgba(255, 255, 255, 0.15)' : 'transparent'};
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  border: ${props => (props.$isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.3)')};
  margin-bottom: ${props => (props.$isMobile ? '4px' : '0')};

  ${props =>
    props.$isMobile &&
    `
    background: ${props.$isActive ? 'rgba(22, 163, 74, 0.08)' : 'transparent'};
    color: ${props.$isActive ? '#16a34a' : '#374151'};
    
    svg {
      color: ${props.$isActive ? '#16a34a' : '#6b7280'};
      font-size: 1.25rem;
      transition: color 0.2s ease;
    }
  `}

  &:hover {
    background: ${props => (props.$isMobile ? '#f9fafb' : 'rgba(255, 255, 255, 0.1)')};
    color: ${props => (props.$isMobile ? '#16a34a' : 'white')};
    text-decoration: none;
    transform: ${props => (props.$isMobile ? 'translateX(4px)' : 'none')};
    
    svg {
      color: #16a34a;
    }
  }

  &:active {
    transform: scale(0.98) ${props => (props.$isMobile ? 'translateX(4px)' : 'none')};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
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
  $variant?: 'primary' | 'secondary';
  $isMobile?: boolean;
}>`
  padding: ${props => (props.$isMobile ? '14px 16px' : '8px 20px')};
  border-radius: ${props => (props.$isMobile ? '14px' : '8px')};
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 1rem;
  font-family: inherit;
  width: ${props => (props.$isMobile ? '100%' : 'auto')};

  ${props => {
    if (props.$isMobile) {
      return props.$variant === 'primary'
        ? `
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
          color: white;
        }
      `
        : `
        background: white;
        color: #374151;
        border: 2px solid #e5e7eb;
        
        &:hover {
          background: #f9fafb;
          border-color: #16a34a;
          color: #16a34a;
        }
      `;
    } else {
      return props.$variant === 'primary'
        ? `
        background: white;
        color: #16a34a;
        
        &:hover {
          background: #f0f0f0;
          color: #15803d;
        }
      `
        : `
        background: transparent;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `;
    }
  }}

  &:active {
    transform: scale(0.98);
  }
`;

const LogoutButton = styled.button<{
  $variant?: 'primary' | 'secondary';
  $isMobile?: boolean;
}>`
  padding: ${props => (props.$isMobile ? '14px 16px' : '8px 20px')};
  border-radius: ${props => (props.$isMobile ? '14px' : '8px')};
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
    props.$isMobile &&
    `
    background: white;
    color: #374151;
    border: 2px solid #e5e7eb;
    width: 100%;
    
    &:hover {
      background: #f9fafb;
      border-color: #16a34a;
      color: #16a34a;
      text-decoration: none;
    }
  `}

  &:active {
    transform: scale(0.98);
  }
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

const UserDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  opacity: ${props => (props.$isOpen ? '1' : '0')};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.$isOpen ? '0' : '-10px')});
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
          <img src='/images/icons/smashly-large-icon.ico' alt='Smashly' />
        </Logo>

        {/* Central Search Bar (Desktop) */}
        <CentralSearchContainer>
          <GlobalSearch onSearchToggle={() => {}} isInHeader={true} isMobileContext={false} />
        </CentralSearchContainer>

        <AuthButtons>
          {userProfile ? (
            <UserMenuContainer
              ref={userMenuRef}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <NotificationBell />
              <AvatarButton onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt='Avatar' />
                ) : (
                  <FiUser />
                )}
              </AvatarButton>
              <UserDropdown $isOpen={isUserMenuOpen}>
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
              <AuthButton onClick={openLogin} $variant='secondary'>
                Iniciar sesión
              </AuthButton>
              <AuthButton onClick={openRegister} $variant='primary'>
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

        <AnimatePresence>
          {(isMenuOpen || isMobileSearchOpen) && (
            <MobileMenuDropdown
              initial={{ opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' }}
              animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
              exit={{ opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Mobile Search Section */}
              <MobileSearchContainer $isOpen={isMobileSearchOpen}>
                <GlobalSearch
                  onSearchToggle={setIsMobileSearchOpen}
                  isInHeader={true}
                  isMobileContext={true}
                />
              </MobileSearchContainer>

              {/* Navigation Section */}
              {isMenuOpen && (
                <motion.div
                  initial='hidden'
                  animate='visible'
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.03, // Reduced stagger duration for better mobile perf
                      },
                    },
                  }}
                >
                  <MobileNavSection
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <MobileNavTitle>Navegación</MobileNavTitle>
                    <NavLink to='/' $isActive={isActive('/')} $isMobile onClick={closeAllMenus}>
                      <FiHome />
                      Inicio
                    </NavLink>
                    <NavLink
                      to='/catalog'
                      $isActive={isActive('/catalog')}
                      $isMobile
                      onClick={closeAllMenus}
                    >
                      <FiGrid />
                      Catálogo de Palas
                    </NavLink>
                    <NavLink
                      to='/compare'
                      $isActive={isActive('/compare')}
                      $isMobile
                      onClick={closeAllMenus}
                    >
                      <FiBarChart2 />
                      Comparar palas
                    </NavLink>
                    <NavLink
                      to='/faq'
                      $isActive={isActive('/faq')}
                      $isMobile
                      onClick={closeAllMenus}
                    >
                      <FiHelpCircle />
                      FAQ
                    </NavLink>
                  </MobileNavSection>

                  {/* Auth Section for Mobile */}
                  <MobileNavSection
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <MobileNavTitle>Cuenta</MobileNavTitle>
                    {userProfile ? (
                      <>
                        <NavLink
                          to='/profile'
                          $isActive={isActive('/profile')}
                          $isMobile
                          onClick={closeAllMenus}
                        >
                          <FiUser />
                          Mi cuenta
                        </NavLink>
                        <LogoutButton
                          $variant='secondary'
                          $isMobile
                          onClick={async () => {
                            await signOut();
                            closeAllMenus();
                            navigate('/');
                          }}
                          style={{ cursor: 'pointer', marginTop: '0.75rem', width: '100%' }}
                        >
                          <FiLogOut style={{ marginRight: '8px' }} />
                          Cerrar sesión
                        </LogoutButton>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <AuthButton
                          $variant='secondary'
                          $isMobile
                          onClick={() => {
                            closeAllMenus();
                            openLogin();
                          }}
                        >
                          <FiLogIn />
                          Iniciar sesión
                        </AuthButton>
                        <AuthButton
                          $variant='primary'
                          $isMobile
                          onClick={() => {
                            closeAllMenus();
                            openRegister();
                          }}
                        >
                          <FiUserPlus />
                          Registrarse
                        </AuthButton>
                      </div>
                    )}
                  </MobileNavSection>
                </motion.div>
              )}
            </MobileMenuDropdown>
          )}
        </AnimatePresence>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
