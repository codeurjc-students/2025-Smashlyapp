import React, { useState } from "react";
import { FiMenu, FiSearch, FiX, FiUser } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../contexts/AuthContext";
import GlobalSearch from "../features/GlobalSearch";

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  padding: 0;
  box-shadow: 0 2px 20px rgba(22, 163, 74, 0.15);
  top: 0;
  z-index: 100;
  position: relative;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;

  img {
    height: 75px;
    width: auto;
    transition: transform 0.2s ease;
  }

  &:hover {
    text-decoration: none;

    img {
      transform: scale(1.05);
    }
  }
`;

// Central Search Container (Desktop)
const CentralSearchContainer = styled.div`
  flex: 1;
  max-width: 500px;
  margin: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1024px) {
    max-width: 400px;
    margin: 0 1.5rem;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

// Mobile Elements Container
const MobileElements = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

// Search Toggle Button for Mobile
const MobileSearchButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
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
  transform: translateY(${(props) => (props.isOpen ? "0" : "-10px")});
  opacity: ${(props) => (props.isOpen ? "1" : "0")};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transition: all 0.3s ease;
  z-index: 50;
`;

// Mobile Search Container
const MobileSearchContainer = styled.div<{ isOpen: boolean }>`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  transform: translateY(${(props) => (props.isOpen ? "0" : "-10px")});
  opacity: ${(props) => (props.isOpen ? "1" : "0")};
  transition: all 0.3s ease 0.1s;

  @media (min-width: 769px) {
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
  color: ${(props) => (props.isMobile ? "#374151" : "white")};
  text-decoration: none;
  font-weight: 500;
  padding: ${(props) => (props.isMobile ? "12px 0" : "8px 16px")};
  border-radius: ${(props) => (props.isMobile ? "0" : "8px")};
  transition: all 0.2s ease;
  background: ${(props) =>
    props.isActive && !props.isMobile
      ? "rgba(255, 255, 255, 0.15)"
      : "transparent"};
  display: block;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.3);

  ${(props) =>
    props.isMobile &&
    `
    border-left: 3px solid ${props.isActive ? "#16a34a" : "transparent"};
    padding-left: 16px;
    margin-left: -1rem;
  `}

  &:hover {
    background: ${(props) =>
      props.isMobile ? "#f9fafb" : "rgba(255, 255, 255, 0.1)"};
    color: ${(props) => (props.isMobile ? "#16a34a" : "white")};
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

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const AuthButton = styled(Link)<{
  variant?: "primary" | "secondary";
  isMobile?: boolean;
}>`
  padding: ${(props) => (props.isMobile ? "12px 16px" : "8px 20px")};
  border-radius: ${(props) => (props.isMobile ? "12px" : "8px")};
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  text-align: center;
  display: block;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.3);

  ${(props) => {
    if (props.isMobile) {
      return props.variant === "primary"
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
      return props.variant === "primary"
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

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();

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
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/" onClick={closeAllMenus}>
          <img src="/images/icons/smashly-large-icon.ico" alt="Smashly" />
        </Logo>

        {/* Central Search Bar (Desktop) */}
        <CentralSearchContainer>
          <GlobalSearch onSearchToggle={() => {}} isInHeader={true} />
        </CentralSearchContainer>

        <AuthButtons>
          {userProfile ? (
            <>
              <NavLink to="/profile" isActive={isActive("/profile")}>
                <FiUser style={{ marginRight: "8px" }} />
                {userProfile.nickname || userProfile.email}
              </NavLink>
              <AuthButton
                as="button"
                variant="secondary"
                onClick={async () => {
                  await signOut();
                  closeAllMenus();
                }}
              >
                Cerrar sesión
              </AuthButton>
            </>
          ) : (
            <>
              <AuthButton
                to="/login"
                variant="secondary"
                onClick={closeAllMenus}
              >
                Iniciar sesión
              </AuthButton>
              <AuthButton
                to="/register"
                variant="primary"
                onClick={closeAllMenus}
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
            <GlobalSearch
              onSearchToggle={setIsMobileSearchOpen}
              isInHeader={true}
            />
          </MobileSearchContainer>

          {/* Navigation Section */}
          {isMenuOpen && (
            <>
              <MobileNavSection>
                <MobileNavTitle>Navegación</MobileNavTitle>
                <NavLink
                  to="/"
                  isActive={isActive("/")}
                  isMobile
                  onClick={closeAllMenus}
                >
                  Inicio
                </NavLink>
                <NavLink
                  to="/catalog"
                  isActive={isActive("/catalog")}
                  isMobile
                  onClick={closeAllMenus}
                >
                  Catálogo de Palas
                </NavLink>
                <NavLink
                  to="/rackets"
                  isActive={isActive("/rackets")}
                  isMobile
                  onClick={closeAllMenus}
                >
                  Comparar palas
                </NavLink>
                <NavLink
                  to="/faq"
                  isActive={isActive("/faq")}
                  isMobile
                  onClick={closeAllMenus}
                >
                  FAQ
                </NavLink>
              </MobileNavSection>

              {/* Auth Section for Mobile */}
              <MobileNavSection>
                <MobileNavTitle>Cuenta</MobileNavTitle>
                {userProfile ? (
                  <>
                    <NavLink
                      to="/profile"
                      isActive={isActive("/profile")}
                      isMobile
                      onClick={closeAllMenus}
                    >
                      <FiUser style={{ marginRight: "8px" }} />
                      {userProfile.nickname || userProfile.email}
                    </NavLink>
                    <AuthButton
                      as="button"
                      variant="secondary"
                      isMobile
                      onClick={async () => {
                        await signOut();
                        closeAllMenus();
                      }}
                      style={{ cursor: "pointer", marginTop: "0.5rem" }}
                    >
                      Cerrar sesión
                    </AuthButton>
                  </>
                ) : (
                  <>
                    <AuthButton
                      to="/login"
                      variant="secondary"
                      isMobile
                      onClick={closeAllMenus}
                    >
                      Iniciar sesión
                    </AuthButton>
                    <AuthButton
                      to="/register"
                      variant="primary"
                      isMobile
                      onClick={closeAllMenus}
                      style={{ marginTop: "0.5rem" }}
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
