import React from "react";
import { FiHeart, FiMail } from "react-icons/fi";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { Link } from "react-router-dom";
import styled from "styled-components";

const FooterContainer = styled.footer`
  background: #1f2937;
  color: white;
  padding: 4rem 0 2rem;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  img {
    height: 40px;
    width: auto;
  }

  span {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
  }
`;

const FooterDescription = styled.p`
  color: #9ca3af;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;

  @media (max-width: 600px) {
    font-size: 0.875rem;
  }
`;

const FooterTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FooterLink = styled(Link)`
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  padding: 4px 0;

  &:hover {
    color: #16a34a;
    text-decoration: none;
    padding-left: 4px;
  }

  @media (max-width: 600px) {
    font-size: 0.875rem;
  }
`;

const FooterExternalLink = styled.a`
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  padding: 4px 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: #16a34a;
    text-decoration: none;
    padding-left: 4px;
  }

  @media (max-width: 600px) {
    font-size: 0.875rem;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;

  a {
    color: #9ca3af;
    font-size: 1.25rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);

    &:hover {
      color: white;
      background: #16a34a;
      transform: translateY(-2px);
    }
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid #374151;
  padding-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: #9ca3af;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterGrid>
          <FooterColumn>
            <FooterLogo>
              <img
                src="https://lrdgyfmkkboyhoycrnov.supabase.co/storage/v1/object/sign/images/smashly-large-icon.ico?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jY2NkNjhmMi03NDg2LTQzNGUtYjE0ZC1mYmE0YzJkM2RiNzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvc21hc2hseS1sYXJnZS1pY29uLmljbyIsImlhdCI6MTc3MTU3OTQ4NCwiZXhwIjoxODAzMTE1NDg0fQ.gccmibb2sAt_EekW0HRgQEBFfsKKwc_3GoO75SVqbJc"
                alt="Smashly"
              />
              <span>Smashly</span>
            </FooterLogo>
            <FooterDescription>
              La plataforma definitiva para encontrar tu pala de pádel perfecta.
              Compara, decide y mejora tu juego.
            </FooterDescription>
            <SocialLinks>
              <a
                href="https://www.instagram.com/smashly.app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.tiktok.com/@smashlyapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <FaTiktok />
              </a>
              <a href="mailto:hello@smashly.app" aria-label="Email">
                <FiMail />
              </a>
            </SocialLinks>
          </FooterColumn>

          <FooterColumn>
            <FooterTitle>Explorar</FooterTitle>
            <FooterLink to="/catalog">Catálogo de Palas</FooterLink>
            <FooterLink to="/compare">Comparar Palas</FooterLink>
            <FooterLink to="/rackets">Encontrar Mi Pala</FooterLink>
            <FooterLink to="/best-racket">Mejor Pala 2025</FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterTitle>Cuenta</FooterTitle>
            <FooterLink to="/login">Iniciar Sesión</FooterLink>
            <FooterLink to="/register">Registrarse</FooterLink>
            <FooterLink to="/profile">Mi Perfil</FooterLink>
            <FooterLink to="/dashboard">Mi Dashboard</FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterTitle>Soporte</FooterTitle>
            <FooterLink to="/faq">Preguntas Frecuentes</FooterLink>
            <FooterExternalLink
              href="mailto:hello@smashly.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiMail />
              Contactar
            </FooterExternalLink>
            <FooterLink to="/privacy">Política de Privacidad</FooterLink>
            <FooterLink to="/terms">Términos de Uso</FooterLink>
          </FooterColumn>
        </FooterGrid>

        <FooterBottom>
          <Copyright>
            © 2025 Smashly. Hecho con <FiHeart color="#ef4444" /> para los
            amantes del pádel.
          </Copyright>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;
