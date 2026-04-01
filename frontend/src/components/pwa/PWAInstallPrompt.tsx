import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiShare, FiPlusSquare } from 'react-icons/fi';

const PromptContainer = styled(motion.div)`
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  z-index: 9999;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;

  @media (min-width: 640px) {
    bottom: 30px;
    right: 30px;
    left: auto;
    width: 360px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: #16a34a;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #4b5563;
  }
`;

const Content = styled.p`
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
`;

const ActionButton = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: #15803d;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const IOSInstructions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f9fafb;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #4b5563;

  .step {
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      color: #111827;
      font-size: 1.1rem;
    }
  }
`;

// Types for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 2. Identify platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    
    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');

    // 3. Listen for Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Only show if not dismissed recently
      const dismissedUntil = localStorage.getItem('pwa-prompt-dismissed-until');
      if (!dismissedUntil || new Date().getTime() > parseInt(dismissedUntil)) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 4. For iOS, show after a short delay since there's no event
    if (isIOS) {
      const dismissedUntil = localStorage.getItem('pwa-prompt-dismissed-until');
      if (!dismissedUntil || new Date().getTime() > parseInt(dismissedUntil)) {
        const timer = setTimeout(() => setIsVisible(true), 10000); // Wait 10s to not be annoying
        return () => clearTimeout(timer);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setIsVisible(false);
    // Hide for 7 days
    const nextWeek = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa-prompt-dismissed-until', nextWeek.toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <PromptContainer
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <Header>
            <Title>
              <FiDownload /> Instalar Smashly
            </Title>
            <CloseButton onClick={dismissPrompt}>
              <FiX size={20} />
            </CloseButton>
          </Header>

          <Content>
            ¡Consigue la mejor experiencia! Instala nuestra app para acceder rápidamente a tus
            palas favoritas y comparar precios en segundos.
          </Content>

          {platform === 'ios' ? (
            <IOSInstructions>
              <div className='step'>
                1. Toca el botón <strong>Compartir</strong> <FiShare /> en la barra inferior.
              </div>
              <div className='step'>
                2. Selecciona <strong>Añadir a la pantalla de inicio</strong> <FiPlusSquare />.
              </div>
            </IOSInstructions>
          ) : (
            <ActionButton onClick={handleInstall}>
              Instalar App
            </ActionButton>
          )}
        </PromptContainer>
      )}
    </AnimatePresence>
  );
};
