import React from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AdminLayout from "../components/features/AdminLayout";
import StoreRequestsManager from "../components/features/StoreRequestsManager";

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const PageSubtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const AdminStoresPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingContainer>
        <div>Cargando...</div>
      </LoadingContainer>
    );
  }

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AdminLayout>
      <PageHeader>
        <PageTitle>Gestión de Tiendas</PageTitle>
        <PageSubtitle>Administra las solicitudes y tiendas asociadas</PageSubtitle>
      </PageHeader>
      <StoreRequestsManager />
    </AdminLayout>
  );
};

export default AdminStoresPage;
