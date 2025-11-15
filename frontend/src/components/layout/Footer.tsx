import React from "react";
import { FiHeart, FiMail } from "react-icons/fi";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import styled from "styled-components";

const FooterContainer = styled.footer`
  background: #1f2937;
  color: white;
  padding: 3rem 0 1rem;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const FooterBottom = styled.div`
  border-top: 1px solid #374151;
  padding-top: 1rem;
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
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;

  a {
    color: #9ca3af;
    font-size: 1.25rem;
    transition: color 0.2s ease;

    &:hover {
      color: #16a34a;
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
