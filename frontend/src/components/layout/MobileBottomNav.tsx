import React, { useState } from 'react';
import { FiCompass, FiHelpCircle, FiHome, FiLayers, FiUser, FiX, FiLogIn } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';

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

const navItemStyles = `
  min-height: 52px;
  border-radius: 14px;
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
  cursor: pointer;
  border: none;
  background: transparent;

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

const NavItemLink = styled(Link)<{ $active: boolean }>`
  ${navItemStyles}
  color: ${props => (props.$active ? '#0f6e38' : '#4b5563')};
  background: ${props => (props.$active ? '#eaf8ee' : 'transparent')};
`;

const NavItemButton = styled.button<{ $active: boolean }>`
  ${navItemStyles}
  color: ${props => (props.$active ? '#0f6e38' : '#4b5563')};
  background: ${props => (props.$active ? '#eaf8ee' : 'transparent')};
`;

const PopupOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
`;

const PopupCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const PopupTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PopupText = styled.p`
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 1.25rem;
`;

const PopupButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PrimaryButton = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.875rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;

  &:hover {
    background: #15803d;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.875rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;

  &:hover {
    color: #6b7280;
  }
`;

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, userProfile } = useAuth();
  const { openLogin } = useAuthModal();
  const [showPopup, setShowPopup] = useState<'none' | 'login' | 'onboarding' | null>(null);

  const homePath = isAuthenticated && user?.role?.toLowerCase() === 'player' ? '/dashboard' : '/';

  const hasCompleteProfile = userProfile && userProfile.game_level && userProfile.game_level !== '';

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      setShowPopup('login');
    } else if (!hasCompleteProfile) {
      setShowPopup('onboarding');
    } else {
      navigate('/profile');
    }
  };

  const handleLogin = () => {
    setShowPopup(null);
    openLogin();
  };

  const handleClosePopup = () => {
    setShowPopup(null);
  };

  const handleGoToOnboarding = () => {
    setShowPopup(null);
    navigate('/onboarding');
  };

  const items = [
    { to: homePath, label: 'Inicio', icon: <FiHome /> },
    { to: '/catalog', label: 'Catalogo', icon: <FiCompass /> },
    { to: '/compare', label: 'Comparar', icon: <FiLayers /> },
    { to: '/faq', label: 'FAQ', icon: <FiHelpCircle /> },
    { to: '/profile', label: 'Perfil', icon: <FiUser />, onClick: handleProfileClick },
  ];

  return (
    <>
      <NavShell aria-label='Navegacion principal movil'>
        <NavRow>
          {items.map(item => {
            const isActive =
              location.pathname === item.to ||
              (item.to === homePath && location.pathname === '/') ||
              (item.to === '/profile' && location.pathname.startsWith('/profile'));

            if (item.onClick) {
              return (
                <NavItemButton
                  key={item.to}
                  onClick={item.onClick}
                  $active={isActive}
                  type='button'
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavItemButton>
              );
            }

            return (
              <NavItemLink
                key={item.to}
                to={item.to}
                $active={isActive}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavItemLink>
            );
          })}
        </NavRow>
      </NavShell>

      <AnimatePresence>
        {showPopup === 'login' && (
          <PopupOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClosePopup}
          >
            <PopupCard
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <CloseButton onClick={handleClosePopup}>
                <FiX size={20} />
              </CloseButton>
              <PopupTitle>
                <FiUser size={22} />
                Inicia sesión
              </PopupTitle>
              <PopupText>
                Para acceder a tu perfil y personalizar tus recomendaciones, necesitas iniciar sesión.
              </PopupText>
              <PopupButtons>
                <PrimaryButton onClick={handleLogin}>
                  <FiLogIn size={18} />
                  Iniciar sesión
                </PrimaryButton>
                <SecondaryButton onClick={handleClosePopup}>
                  Ahora no
                </SecondaryButton>
              </PopupButtons>
            </PopupCard>
          </PopupOverlay>
        )}

        {showPopup === 'onboarding' && (
          <PopupOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClosePopup}
          >
            <PopupCard
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <CloseButton onClick={handleClosePopup}>
                <FiX size={20} />
              </CloseButton>
              <PopupTitle>
                <FiUser size={22} />
                Completa tu perfil
              </PopupTitle>
              <PopupText>
                Para ver tu perfil personalizado, primero complétalo con tu nivel de juego y preferencias.
              </PopupText>
              <PopupButtons>
                <PrimaryButton onClick={handleGoToOnboarding}>
                  <FiLogIn size={18} />
                  Completar perfil
                </PrimaryButton>
                <SecondaryButton onClick={handleClosePopup}>
                  Ahora no
                </SecondaryButton>
              </PopupButtons>
            </PopupCard>
          </PopupOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
