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
      {!isAuthPage && <Header />}
      {!isAuthPage && <SubHeader />}
      <Main>{children}</Main>
      {!isAuthPage && <Footer />}
    </LayoutContainer>
  );
};

export default Layout;
