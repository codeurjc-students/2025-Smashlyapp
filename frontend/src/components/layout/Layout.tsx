import React from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import FloatingComparisonPanel from "../features/FloatingComparisonPanel";
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

  // Solo mostrar el panel de comparación en la página de comparador de palas
  const showComparisonPanel = location.pathname === "/compare-rackets";

  return (
    <LayoutContainer>
      <Header />
      <SubHeader />
      <Main>{children}</Main>
      <Footer />
      {showComparisonPanel && <FloatingComparisonPanel />}
    </LayoutContainer>
  );
};

export default Layout;
