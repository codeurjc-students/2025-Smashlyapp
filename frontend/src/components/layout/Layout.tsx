import React from "react";
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

  return (
    <LayoutContainer>
      <Header />
      <SubHeader />
      <Main>{children}</Main>
      <Footer />
    </LayoutContainer>
  );
};

export default Layout;
