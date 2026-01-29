import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  background: white;
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: auto;
    min-height: 100vh;
    flex-direction: column;
    overflow: visible;
  }
`;

const LeftPanel = styled.div<{ $bgImage?: string }>`
  flex: 1;
  background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${props => props.$bgImage || '/images/login_register_images/register_image.png'});
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
  color: white;
  position: relative;

  @media (max-width: 768px) {
    min-height: 300px;
    padding: 24px;
    display: flex;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: white;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 24px;
    width: 100%;
    overflow-y: visible;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 440px;
  margin: auto; // Centers vertically when possible, safe for scrolling
`;

const Branding = styled.div`
  img {
    height: 80px; // Adjusted to match standard logos
    width: auto;
  }
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 1.5rem;
`;

const HeroContent = styled.div`
  margin-bottom: 60px;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 20px;

  span {
    color: #ccff00; /* Neon green from image */
    display: block;
  }

  @media (max-width: 1024px) {
    font-size: 2.5rem;
  }
`;

const HeroDescription = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 500px;
  line-height: 1.6;
  margin-bottom: 30px;
`;

const TrustedSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  .avatars {
    display: flex;
    margin-right: 8px;
    
    img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid #1f2937; // Dark border to blend with dark bg? Or white? Image shows avatars.
        margin-right: -12px;
        
        &:last-child {
            margin-right: 0;
        }
    }
    
    .count-badge {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #374151;
        color: white;
        border: 2px solid #1f2937;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 600;
        z-index: 2;
    }
  }

  p {
    font-size: 0.9rem;
    opacity: 0.8;
  }
`;

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  highlightedWord?: string;
  description?: string;
  bgImage?: string;
}

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ 
  children, 
  title = "Domina la Pista", 
  highlightedWord = "con Datos",
  description = "Únete a la comunidad de pádel de más rápido crecimiento. Rastrea tu rendimiento, analiza tus golpes con IA y encuentra partidos que eleven tu juego.",
  bgImage
}) => {
  return (
    <PageContainer>
      <LeftPanel $bgImage={bgImage}>
        <Branding>
           {/* Assuming logo path, user code used /images/icons/smashly-large-icon.ico */}
           <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
            <img src="/images/icons/smashly-large-icon.ico" alt="Smashly" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
           </Link>
        </Branding>

        <div style={{ paddingBottom: '40px' }}>
          <HeroContent>
            <HeroTitle>
              {title}
              <span>{highlightedWord}</span>
            </HeroTitle>
            <HeroDescription>
              {description}
            </HeroDescription>
            <TrustedSection>
               <div className="avatars">
                  {/* Placeholders for avatars as seen in image */}
                  <div className="count-badge" style={{ marginLeft: '0' }}>+2k</div>
               </div>
              <p>Más de 2.000 jugadores activos confían en nosotros</p>
            </TrustedSection>
          </HeroContent>
        </div>
      </LeftPanel>

      <RightPanel>
        <ContentContainer>
          {children}
        </ContentContainer>
      </RightPanel>
    </PageContainer>
  );
};

export default AuthPageLayout;
