import React, { useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useAuthModal } from '../../contexts/AuthModalContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import {
  FormTitle,
  FormSubtitle,
  TabContainer,
  Tab
} from './AuthStyles';

// Optimized Overlay: Removed generic backdrop-filter for performance, 
// used simple rgba. If blur is needed, use a separate static pseudo-element 
// or ensure it's not animating constantly.
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  // blurred background can be expensive during animation
  // backdrop-filter: blur(4px); 
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  will-change: opacity;
`;

const ModalContainer = styled(motion.div)`
  background: white;
  width: 100%;
  max-width: 1000px;
  height: 85vh;
  max-height: 800px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  will-change: transform, opacity;

  @media (max-width: 768px) {
    height: auto;
    max-height: 90vh;
    overflow-y: auto;
    flex-direction: column;
  }
`;

const LeftPanel = styled.div<{ $bgImage: string }>`
  flex: 1;
  background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${props => props.$bgImage});
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
  color: white;
  transition: background-image 0.3s ease-in-out; // Smooth transition between images
  will-change: background-image;

  @media (max-width: 768px) {
    display: none; 
  }
`;

const RightPanel = styled.div`
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  svg {
    stroke: #666;
  }
`;

const Branding = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 1.5rem;
  
  img {
    height: 60px;
    width: auto;
  }
`;

const HeroTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 20px;

  span {
    color: #ccff00;
    display: block;
  }
`;

const HeroDescription = styled.p`
  font-size: 1rem;
  opacity: 0.9;
  line-height: 1.6;
`;

// Preload images content
const LOGIN_IMAGE = "https://lrdgyfmkkboyhoycrnov.supabase.co/storage/v1/object/sign/images/login_image.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jY2NkNjhmMi03NDg2LTQzNGUtYjE0ZC1mYmE0YzJkM2RiNzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvbG9naW5faW1hZ2UucG5nIiwiaWF0IjoxNzcxNTc5NjcyLCJleHAiOjE4MDMxMTU2NzJ9.9NpKzdw9rO8edv-6lPdKTsvdYSRN6e9LR51eB6NfmjQ";
const REGISTER_IMAGE = "https://lrdgyfmkkboyhoycrnov.supabase.co/storage/v1/object/sign/images/register_image.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jY2NkNjhmMi03NDg2LTQzNGUtYjE0ZC1mYmE0YzJkM2RiNzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvcmVnaXN0ZXJfaW1hZ2UuanBnIiwiaWF0IjoxNzcxNTc5Njk3LCJleHAiOjE4MDMxMTU2OTd9.i3zj8yOi70CpqKHcWj2c2k0yA8cevX7G58z-shmwbtw";

const AuthModal: React.FC = () => {
  const { isOpen, view, closeModal, openLogin, openRegister } = useAuthModal();

  // Preload images on mount
  useEffect(() => {
    const img1 = new Image();
    img1.src = LOGIN_IMAGE;
    const img2 = new Image();
    img2.src = REGISTER_IMAGE;
  }, []);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const bgImage = view === 'login' ? LOGIN_IMAGE : REGISTER_IMAGE;

  // Memoize static content to prevent unnecessary re-renders of the left panel structure
  const leftPanelContent = useMemo(() => (
    <>
      <Branding>
        <img src="https://lrdgyfmkkboyhoycrnov.supabase.co/storage/v1/object/sign/images/smashly-large-icon.ico?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jY2NkNjhmMi03NDg2LTQzNGUtYjE0ZC1mYmE0YzJkM2RiNzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvc21hc2hseS1sYXJnZS1pY29uLmljbyIsImlhdCI6MTc3MTU3OTQ4NCwiZXhwIjoxODAzMTE1NDg0fQ.gccmibb2sAt_EekW0HRgQEBFfsKKwc_3GoO75SVqbJc" alt="Smashly" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </Branding>
      <div>
        <HeroTitle>
          {view === 'login' ? 'Domina la Pista' : 'Únete a la'}
          <span>{view === 'login' ? 'con Datos' : 'Comunidad'}</span>
        </HeroTitle>
        <HeroDescription>
          {view === 'login' 
            ? "Únete a la comunidad de pádel de más rápido crecimiento. Rastrea tu rendimiento, analiza tus golpes con IA y encuentra partidos que eleven tu juego."
            : "Crea tu cuenta hoy y lleva tu juego de pádel al siguiente nivel."
          }
        </HeroDescription>
      </div>
    </>
  ), [view]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} // Faster transition
          onClick={closeModal}
        >
          <ModalContainer
            initial={{ scale: 0.95, opacity: 0 }} // Less movement
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.8 }} // Snappier spring
            onClick={(e) => e.stopPropagation()}
          >
            <LeftPanel $bgImage={bgImage}>
               {leftPanelContent}
            </LeftPanel>

            <RightPanel>
              <CloseButton onClick={closeModal}>
                <FiX size={20} />
              </CloseButton>

              <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
                <FormTitle>{view === 'login' ? 'Bienvenido de nuevo' : 'Crear Cuenta'}</FormTitle>
                <FormSubtitle>
                  {view === 'login' 
                    ? 'Introduce tus datos para acceder a tu panel.' 
                    : 'Rellena tus datos para comenzar.'
                  }
                </FormSubtitle>

                <TabContainer>
                  <Tab as="button" to="" $active={view === 'login'} onClick={openLogin}>Iniciar Sesión</Tab>
                  <Tab as="button" to="" $active={view === 'register'} onClick={openRegister}>Registrarse</Tab>
                </TabContainer>

                {view === 'login' ? (
                  <LoginForm onSuccess={closeModal} onRegisterClick={openRegister} />
                ) : (
                  <RegisterForm onSuccess={closeModal} onLoginClick={openLogin} />
                )}
              </div>
            </RightPanel>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default React.memo(AuthModal);

