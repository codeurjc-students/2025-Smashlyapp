import React from "react";
import { FiHeart, FiMail } from "react-icons/fi";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import styled from "styled-components";

const FooterContainer = styled.footer`
  background: #1f2937;
  color: white;
  padding: 3rem 0 1.5rem;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 40px);
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
    gap: 1.25rem;
  }
`;

const Copyright = styled.p`
  color: #9ca3af;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;

  a {
    color: #9ca3af;
    font-size: 1.25rem;
    transition: all 0.2s ease;
    padding: 8px;
    border-radius: 8px;

    &:hover {
      color: #16a34a;
      background: rgba(255, 255, 255, 0.05);
    }
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
    
    a {
      font-size: 1.1rem;
      padding: 6px;
    }
  }
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterBottom>
          <Copyright>
            © 2025 Smashly. Hecho con <FiHeart color="#ef4444" /> para los
            amantes del pádel.
          </Copyright>

          <SocialLinks>
            <a
              href="https://www.instagram.com/smashly.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.tiktok.com/@smashlyapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTiktok />
            </a>
            <a href="mailto:hello@smashly.app">
              <FiMail />
            </a>
          </SocialLinks>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;