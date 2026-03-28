import React from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import Footer from "./Footer";
import Header from "./Header";
import SubHeader from "./SubHeader";

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
`;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <LayoutContainer>
      {/* Skip-to-content: visible only on keyboard focus (WCAG 2.1 AA - criterion 2.4.1) */}
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>
      {!isAuthPage && <Header />}
      {!isAuthPage && <SubHeader />}
      <Main id="main-content">{children}</Main>
      {!isAuthPage && <Footer />}
    </LayoutContainer>
  );
};

export default Layout;
