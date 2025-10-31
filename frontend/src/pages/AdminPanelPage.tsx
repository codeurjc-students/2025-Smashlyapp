import React, { useState } from "react";
import styled from "styled-components";
import { FiPackage, FiShoppingBag, FiUsers, FiBarChart2 } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "../components/features/AdminDashboard";
import RacketRequestsManager from "../components/features/RacketRequestsManager";
import StoreRequestsManager from "../components/features/StoreRequestsManager";
import UsersManager from "../components/features/UsersManager";

const PageContainer = styled.div`
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  display: flex;
`;

const Sidebar = styled.div`
  width: 250px;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  padding: 2rem 0;
  
  @media (max-width: 768px) {
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    padding: 1rem;
    z-index: 100;
    display: flex;
    justify-content: space-around;
  }
`;

const SidebarTitle = styled.h2`
  padding: 0 1.5rem;
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  color: #16a34a;
  font-weight: 700;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MenuItem = styled.button<{ active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: ${(props) => (props.active ? "#f0fdf4" : "transparent")};
  border: none;
  border-left: 3px solid ${(props) => (props.active ? "#16a34a" : "transparent")};
  color: ${(props) => (props.active ? "#16a34a" : "#666")};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;

  &:hover {
    background: #f0fdf4;
    color: #16a34a;
  }

  svg {
    font-size: 1.25rem;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
    border-left: none;
    border-top: 3px solid ${(props) => (props.active ? "#16a34a" : "transparent")};
    
    svg {
      font-size: 1.5rem;
    }
  }
`;

const MenuText = styled.span`
  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: 5rem;
  }
`;

const Header = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const HeaderTitle = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #16a34a;
  font-weight: 700;
`;

const HeaderSubtitle = styled.p`
  margin: 0;
  color: #666;
  font-size: 1rem;
`;

type MenuSection = 'dashboard' | 'rackets' | 'stores' | 'users';

const AdminPanelPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<MenuSection>('dashboard');

  // Mostrar loading mientras se verifica el usuario
  if (loading) {
    return (
      <PageContainer style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div>Cargando...</div>
      </PageContainer>
    );
  }

  // Redirigir si no es admin
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'rackets':
        return <RacketRequestsManager />;
      case 'stores':
        return <StoreRequestsManager />;
      case 'users':
        return <UsersManager />;
      default:
        return <AdminDashboard />;
    }
  };

  const getHeaderInfo = () => {
    switch (activeSection) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Métricas y estadísticas del sistema'
        };
      case 'rackets':
        return {
          title: 'Solicitudes de Palas',
          subtitle: 'Gestiona las solicitudes de nuevas palas'
        };
      case 'stores':
        return {
          title: 'Solicitudes de Tiendas',
          subtitle: 'Gestiona las solicitudes de registro de tiendas'
        };
      case 'users':
        return {
          title: 'Gestión de Usuarios',
          subtitle: 'Administra los usuarios del sistema'
        };
      default:
        return {
          title: 'Panel de Administración',
          subtitle: 'Bienvenido al panel de administración'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <PageContainer>
      <Sidebar>
        <SidebarTitle>Admin Panel</SidebarTitle>
        <MenuItem
          active={activeSection === 'dashboard'}
          onClick={() => setActiveSection('dashboard')}
        >
          <FiBarChart2 />
          <MenuText>Dashboard</MenuText>
        </MenuItem>
        <MenuItem
          active={activeSection === 'rackets'}
          onClick={() => setActiveSection('rackets')}
        >
          <FiPackage />
          <MenuText>Solicitudes Palas</MenuText>
        </MenuItem>
        <MenuItem
          active={activeSection === 'stores'}
          onClick={() => setActiveSection('stores')}
        >
          <FiShoppingBag />
          <MenuText>Solicitudes Tiendas</MenuText>
        </MenuItem>
        <MenuItem
          active={activeSection === 'users'}
          onClick={() => setActiveSection('users')}
        >
          <FiUsers />
          <MenuText>Usuarios</MenuText>
        </MenuItem>
      </Sidebar>
      <ContentArea>
        <Header>
          <HeaderTitle>{headerInfo.title}</HeaderTitle>
          <HeaderSubtitle>{headerInfo.subtitle}</HeaderSubtitle>
        </Header>
        {renderContent()}
      </ContentArea>
    </PageContainer>
  );
};

export default AdminPanelPage;
