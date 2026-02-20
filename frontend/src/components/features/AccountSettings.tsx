import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiMail,
  FiCalendar,
  FiLock,
  FiBell,
  FiLogOut,
  FiTrash2,
  FiShield,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { sileo } from 'sileo';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SectionIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
  margin: 0;
`;

const SectionContent = styled.div`
  padding: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-size: 0.9375rem;
  color: #64748b;
`;

const InfoValue = styled.div`
  font-size: 0.9375rem;
  font-weight: 500;
  color: #16a34a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled(motion.button)<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  background: ${props => props.$danger ? '#fef2f2' : '#f1f5f9'};
  color: ${props => props.$danger ? '#dc2626' : '#64748b'};

  &:hover {
    background: ${props => props.$danger ? '#dc2626' : '#e2e8f0'};
    color: ${props => props.$danger ? 'white' : '#16a34a'};
  }
`;

const DangerZone = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 1.25rem;
  margin-top: 1rem;
`;

const DangerTitle = styled.h4`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DangerText = styled.p`
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

interface AccountSettingsProps {
  user: {
    email: string;
    created_at?: string;
  };
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No disponible';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const AccountSettings: React.FC<AccountSettingsProps> = ({ user }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!window.confirm('¿Cerrar sesión?')) return;
    
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error al cerrar sesión' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    if (!window.confirm('¿REALMENTE quieres eliminar tu cuenta? Todos tus datos serán eliminados permanentemente.')) return;
    
    sileo.error({ title: 'Función no disponible', description: 'Contacta con soporte para eliminar tu cuenta' });
  };

  return (
    <Container>
      <Section>
        <SectionHeader>
          <SectionIcon color="#3b82f6">
            <FiMail size={20} />
          </SectionIcon>
          <SectionTitle>Datos de Cuenta</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <InfoRow>
            <InfoLabel>Email</InfoLabel>
            <InfoValue>
              <FiMail size={14} />
              {user.email}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Miembro desde</InfoLabel>
            <InfoValue>
              <FiCalendar size={14} />
              {formatDate(user.created_at)}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Estado</InfoLabel>
            <InfoValue>
              <FiShield size={14} style={{ color: '#16a34a' }} />
              <span style={{ color: '#16a34a' }}>Cuenta verificada</span>
            </InfoValue>
          </InfoRow>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader>
          <SectionIcon color="#f59e0b">
            <FiLock size={20} />
          </SectionIcon>
          <SectionTitle>Seguridad</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <InfoRow>
            <InfoLabel>Contraseña</InfoLabel>
            <ActionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiLock size={14} />
              Cambiar contraseña
            </ActionButton>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Autenticación</InfoLabel>
            <ActionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiShield size={14} />
              2FA activada
            </ActionButton>
          </InfoRow>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader>
          <SectionIcon color="#8b5cf6">
            <FiBell size={20} />
          </SectionIcon>
          <SectionTitle>Notificaciones</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <InfoRow>
            <InfoLabel>Notificaciones push</InfoLabel>
            <ActionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiBell size={14} />
              Configurar
            </ActionButton>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Email sobre novedades</InfoLabel>
            <ActionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiMail size={14} />
              Preferencias
            </ActionButton>
          </InfoRow>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader>
          <SectionIcon color="#ef4444">
            <FiLogOut size={20} />
          </SectionIcon>
          <SectionTitle>Sesión</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <InfoRow>
            <InfoLabel>Cerrar sesión</InfoLabel>
            <ActionButton
              onClick={handleLogout}
              disabled={isLoggingOut}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiLogOut size={14} />
              {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
            </ActionButton>
          </InfoRow>
          
          <DangerZone>
            <DangerTitle>
              <FiTrash2 size={16} />
              Zona de peligro
            </DangerTitle>
            <DangerText>
              Eliminar tu cuenta es una acción permanente. Todos tus datos, listas, 
              comparaciones y actividad serán eliminados irrevocablemente.
            </DangerText>
            <ActionButton
              $danger
              onClick={handleDeleteAccount}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiTrash2 size={14} />
              Eliminar mi cuenta
            </ActionButton>
          </DangerZone>
        </SectionContent>
      </Section>
    </Container>
  );
};

export default AccountSettings;
