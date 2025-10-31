import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import styled from "styled-components";
import {
  FiEdit2,
  FiMail,
  FiUser,
  FiCalendar,
  FiActivity,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { MyListsSection } from "../components/features/MyListsSection";
import { EditProfileModal } from "../components/features/EditProfileModal";
import { UserReviews } from "../components/features/UserReviews";
import { UserProfileService } from "../services/userProfileService";
import toast from "react-hot-toast";

const PageContainer = styled.div`
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 2rem 1rem;
`;

const ContentWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(22, 163, 74, 0.1);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
`;

const ProfileContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 768px) {
    align-items: center;
  }
`;

const UserName = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const UserEmail = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const EditButton = styled.button`
  background: white;
  color: #16a34a;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
  align-self: flex-end;

  &:hover {
    background: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    position: relative;
    top: 0;
    right: 0;
    margin-top: 1rem;
    width: 100%;
    justify-content: center;
    align-self: center;
  }
`;

const DetailsSection = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(22, 163, 74, 0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #15803d;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const DetailCard = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 1.5rem;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;

  &:hover {
    border-color: #16a34a;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(22, 163, 74, 0.1);
  }
`;

const DetailLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #15803d;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
`;

const EmptyStateText = styled.p`
  font-size: 1.125rem;
  margin: 0 0 1.5rem 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  font-weight: bold;
  border: 5px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
`;

const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, loading, refreshUserProfile } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  // Redirigir a los administradores al panel de admin
  if (!loading && userProfile && userProfile.role?.toLowerCase() === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async (updates: any) => {
    try {
      await UserProfileService.updateUserProfile(updates);
      await refreshUserProfile();
      toast.success("Perfil actualizado exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el perfil");
      throw error;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (!userProfile) {
    return (
      <PageContainer>
        <ContentWrapper>
          <DetailsSection>
            <EmptyState>
              <EmptyStateIcon>
                <FiAlertCircle />
              </EmptyStateIcon>
              <EmptyStateText>
                No se encontró el perfil de usuario
              </EmptyStateText>
              <EditButton onClick={() => navigate("/login")}>
                Iniciar sesión
              </EditButton>
            </EmptyState>
          </DetailsSection>
        </ContentWrapper>
      </PageContainer>
    );
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.split(" ");
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : "U";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No especificado";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getNivelJuegoLabel = (nivel?: string) => {
    if (!nivel) return "No especificado";
    const niveles: { [key: string]: string } = {
      principiante: "Principiante",
      intermedio: "Intermedio",
      avanzado: "Avanzado",
      profesional: "Profesional",
    };
    return niveles[nivel] || nivel;
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <ProfileHeader>
          <ProfileContent>
            <EditButton onClick={handleEditProfile}>
              <FiEdit2 />
              Editar Perfil
            </EditButton>

            <AvatarSection>
              <Avatar>
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.nickname || "Usuario"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  getInitials(userProfile.full_name, userProfile.email)
                )}
              </Avatar>

              <UserInfo>
                <UserName>
                  {userProfile.full_name || userProfile.nickname || "Usuario"}
                </UserName>
                <UserEmail>
                  <FiMail />
                  {userProfile.email}
                </UserEmail>
              </UserInfo>
            </AvatarSection>
          </ProfileContent>
        </ProfileHeader>

        <DetailsSection>
          <SectionTitle>
            <FiUser />
            Información Personal
          </SectionTitle>
          <DetailGrid>
            <DetailCard>
              <DetailLabel>
                <FiUser />
                Nickname
              </DetailLabel>
              <DetailValue>
                {userProfile.nickname || "No especificado"}
              </DetailValue>
            </DetailCard>

            <DetailCard>
              <DetailLabel>
                <FiCalendar />
                Fecha de Nacimiento
              </DetailLabel>
              <DetailValue>{formatDate(userProfile.birthdate)}</DetailValue>
            </DetailCard>

            <DetailCard>
              <DetailLabel>
                <FiActivity />
                Peso
              </DetailLabel>
              <DetailValue>
                {userProfile.weight
                  ? `${userProfile.weight} kg`
                  : "No especificado"}
              </DetailValue>
            </DetailCard>

            <DetailCard>
              <DetailLabel>
                <FiActivity />
                Altura
              </DetailLabel>
              <DetailValue>
                {userProfile.height
                  ? `${userProfile.height} cm`
                  : "No especificado"}
              </DetailValue>
            </DetailCard>
          </DetailGrid>
        </DetailsSection>

        <DetailsSection>
          <SectionTitle>
            <FiTrendingUp />
            Información de Juego
          </SectionTitle>
          <DetailGrid>
            <DetailCard>
              <DetailLabel>
                <FiTrendingUp />
                Nivel de Juego
              </DetailLabel>
              <DetailValue>
                {getNivelJuegoLabel(userProfile.game_level)}
              </DetailValue>
            </DetailCard>

            <DetailCard>
              <DetailLabel>
                <FiAlertCircle />
                Limitaciones
              </DetailLabel>
              <DetailValue>
                {userProfile.limitations && userProfile.limitations.length > 0
                  ? userProfile.limitations.join(", ")
                  : "Ninguna especificada"}
              </DetailValue>
            </DetailCard>
          </DetailGrid>
        </DetailsSection>

        {/* Sección de Mis Listas */}
        <MyListsSection />

        <DetailsSection>
          <SectionTitle>
            <FiCalendar />
            Información de Cuenta
          </SectionTitle>
          <DetailGrid>
            <DetailCard>
              <DetailLabel>
                <FiCalendar />
                Miembro desde
              </DetailLabel>
              <DetailValue>{formatDate(userProfile.created_at)}</DetailValue>
            </DetailCard>

            <DetailCard>
              <DetailLabel>
                <FiCalendar />
                Última actualización
              </DetailLabel>
              <DetailValue>{formatDate(userProfile.updated_at)}</DetailValue>
            </DetailCard>
          </DetailGrid>
        </DetailsSection>

        {/* Sección de Reviews del usuario */}
        {userProfile?.id && <UserReviews userId={userProfile.id} />}
      </ContentWrapper>

      {/* Modal para editar perfil */}
      {userProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          userProfile={userProfile}
          onSave={handleSaveProfile}
        />
      )}
    </PageContainer>
  );
};

export default UserPage;
