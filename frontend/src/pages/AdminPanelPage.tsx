import React from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "../components/features/AdminDashboard";

const PageContainer = styled.div`
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  padding: 2.5rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(22, 163, 74, 0.1);
  color: white;
`;

const HeaderTitle = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeaderSubtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const AdminPanelPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Mostrar loading mientras se verifica el usuario
  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>
          <div>Cargando...</div>
        </LoadingContainer>
      </PageContainer>
    );
  }

  // Redirigir si no es admin
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <Header>
          <HeaderTitle>Panel de Administración 👨‍💼</HeaderTitle>
          <HeaderSubtitle>Bienvenido, {user.full_name || 'Administrador'}</HeaderSubtitle>
        </Header>
        <AdminDashboard />
      </ContentWrapper>
    </PageContainer>
  );
};

export default AdminPanelPage;
