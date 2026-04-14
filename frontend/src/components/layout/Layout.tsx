import React from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Footer from './Footer';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import SubHeader from './SubHeader';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContainer = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  padding-bottom: 0;

  @media (max-width: 1024px) {
    padding-bottom: calc(78px + env(safe-area-inset-bottom, 0));
  }
`;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <LayoutContainer>
      {/* Skip-to-content: visible only on keyboard focus (WCAG 2.1 AA - criterion 2.4.1) */}
      <a href='#main-content' className='skip-to-content'>
        Saltar al contenido principal
      </a>
      {!isAuthPage && <Header />}
      {!isAuthPage && <SubHeader />}
      <Main id='main-content'>{children}</Main>
      {!isAuthPage && <MobileBottomNav />}
      {!isAuthPage && <Footer />}
    </LayoutContainer>
  );
};

export default Layout;
