import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiActivity,
  FiList,
  FiSettings,
  FiArrowLeft,
  FiSave,
  FiActivity as FiPhys,
  FiTrendingUp,
  FiAlertCircle,
  FiCalendar,
} from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService } from '../services/userProfileService';
import { UploadService } from '../services/uploadService';
import { RacketService } from '../services/racketService';
import { sileo } from 'sileo';
import ProfileAvatar from '../components/features/ProfileAvatar';
import ActivityStats from '../components/features/ActivityStats';
import UserCollections from '../components/features/UserCollections';
import AccountSettings from '../components/features/AccountSettings';

const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
`;

const Header = styled.div`
  background: #169B47;
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.5;
  }
`;

const HeaderContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: white;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  color: white;
`;

const UserName = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.025em;
`;

const UserHandle = styled.p`
  font-size: 1rem;
  opacity: 0.7;
  margin: 0;
`;

const MainContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 2;
  margin-top: -1rem;
`;

const NavigationTabs = styled.div`
  display: flex;
  gap: 0.25rem;
  background: white;
  padding: 0.5rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
  overflow-x: auto;
`;

const NavTab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding:  1.25rem;
  border0.75rem-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 500;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: ${props => (props.$active ? '#16a34a' : 'transparent')};
  color: ${props => (props.$active ? 'white' : '#64748b')};

  &:hover {
    background: ${props => (props.$active ? '#16a34a' : '#f1f5f9')};
    color: ${props => (props.$active ? 'white' : '#16a34a')};
  }
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const FormLabel = styled.label`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const FormInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
  }

  &:disabled {
    background: #f8fafc;
    color: #64748b;
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const FormSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
  }

  &:disabled {
    background: #f8fafc;
    color: #64748b;
  }
`;

const FormTextarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  background: white;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
  }

  &:disabled {
    background: #f8fafc;
    color: #64748b;
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
`;

const FormActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
`;

const Button = styled(motion.button)<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  background: ${props => props.$primary ? '#16a34a' : '#f1f5f9'};
  color: ${props => props.$primary ? 'white' : '#64748b'};

    background: ${props => props.$primary ? '#15803d' : '#e2e8f0'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const InfoCard = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const InfoIcon = styled.div`
  color: #0369a1;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #0369a1;
  margin: 0;
  line-height: 1.5;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #64748b;
`;

type TabType = 'profile' | 'activity' | 'collections' | 'account';

interface UserProfileFormData {
  full_name: string;
  peso: string;
  altura: string;
  birthdate: string;
  game_level: string;
  limitations: string;
}

const UserProfilePage: React.FC = () => {
  const { user, userProfile, refreshUserProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [activityData, setActivityData] = useState<any>(null);

  const [formData, setFormData] = useState<UserProfileFormData>({
    full_name: '',
    peso: '',
    altura: '',
    birthdate: '',
    game_level: '',
    limitations: '',
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'activity', 'collections', 'account'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        peso: userProfile.weight?.toString() || '',
        altura: userProfile.height?.toString() || '',
        birthdate: userProfile.birthdate || '',
        game_level: userProfile.game_level || '',
        limitations: userProfile.limitations?.[0] || '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    // No redirigir mientras está cargando la sesión
    if (loading) return;
    
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate, loading]);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivity();
    }
  }, [activeTab]);

  const loadActivity = async () => {
    try {
      const response = await fetch('/api/v1/users/me/activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        
        // Cargar nombres de palas para las comparaciones
        const comparisons = data.data.recentComparisons || [];
        if (comparisons.length > 0) {
          const allRacketIds = [...new Set(comparisons.flatMap((c: any) => c.racket_ids || []))];
          const racketsCache: Record<number, any> = {};
          
          await Promise.all(
            allRacketIds.map(async (id) => {
              try {
                const racket = await RacketService.getRacketById(id as number);
                racketsCache[id as number] = racket;
              } catch {
                racketsCache[id as number] = { nombre: `Pala ${id}`, marca: '' };
              }
            })
          );
          
          // Agregar nombres a las comparaciones
          data.data.recentComparisons = comparisons.map((comp: any) => ({
            ...comp,
            racket_names: comp.racket_ids?.map((id: number) => {
              const racket = racketsCache[id];
              return racket ? `${racket.marca} ${racket.nombre}` : `Pala ${id}`;
            }).join(' vs ') || 'Comparación',
          }));
        }
        
        setActivityData(data.data);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const validation = UploadService.validateImageFile(file);
      if (!validation.isValid) {
        sileo.error({ title: 'Error', description: validation.error || 'Archivo no válido' });
        return;
      }

      const avatarUrl = await UploadService.uploadAvatar(file);
      
      await UserProfileService.updateUserProfile({
        avatar_url: avatarUrl,
      } as any);
      
      await refreshUserProfile();
      sileo.success({ title: 'Éxito', description: 'Avatar actualizado correctamente' });
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message || 'Error al subir el avatar' });
    }
  };

  const validateForm = (): boolean => {
    if (formData.peso && (isNaN(Number(formData.peso)) || Number(formData.peso) <= 0)) {
      sileo.error({ title: 'Error', description: 'El peso debe ser un número válido mayor a 0' });
      return false;
    }
    if (formData.altura && (isNaN(Number(formData.altura)) || Number(formData.altura) <= 0)) {
      sileo.error({ title: 'Error', description: 'La altura debe ser un número válido mayor a 0' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      await UserProfileService.updateUserProfile({
        full_name: formData.full_name || undefined,
        weight: formData.peso ? Number(formData.peso) : undefined,
        height: formData.altura ? Number(formData.altura) : undefined,
        birthdate: formData.birthdate || undefined,
        game_level: formData.game_level || undefined,
        limitations: formData.limitations ? [formData.limitations] : undefined,
      });
      await refreshUserProfile();
      sileo.success({ title: 'Éxito', description: 'Perfil actualizado correctamente' });
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error al actualizar el perfil' });
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  if (!user) {
    return <LoadingContainer>Cargando...</LoadingContainer>;
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <BackLink to="/">
            <FiArrowLeft size={16} />
            Volver al inicio
          </BackLink>
          <ProfileHeader>
            <ProfileAvatar
              currentAvatar={userProfile?.avatar_url}
              name={userProfile?.full_name || userProfile?.nickname || 'U'}
              size={100}
              onUpload={handleAvatarUpload}
            />
            <ProfileInfo>
              <UserName>{userProfile?.full_name || userProfile?.nickname || 'Usuario'}</UserName>
              <UserHandle>{user.email}</UserHandle>
            </ProfileInfo>
          </ProfileHeader>
        </HeaderContent>
      </Header>

      <MainContent>
        <NavigationTabs>
          <NavTab $active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>
            <FiUser size={18} /> Perfil
          </NavTab>
          <NavTab $active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
            <FiActivity size={18} /> Mi Actividad
          </NavTab>
          <NavTab $active={activeTab === 'collections'} onClick={() => setActiveTab('collections')}>
            <FiList size={18} /> Mis Colecciones
          </NavTab>
          <NavTab $active={activeTab === 'account'} onClick={() => setActiveTab('account')}>
            <FiSettings size={18} /> Cuenta
          </NavTab>
        </NavigationTabs>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ContentCard>
                <CardContent>
                  <InfoCard>
                    <InfoIcon><FiAlertCircle size={18} /></InfoIcon>
                    <InfoText>
                      Completa tu perfil para recibir recomendaciones personalizadas de palas de pádel.
                    </InfoText>
                  </InfoCard>

                  <form onSubmit={handleSubmit}>
                    <FormSection>
                      <SectionTitle><FiUser size={18} /> Información Personal</SectionTitle>
                      <FormGrid>
                        <FormGroup>
                          <FormLabel htmlFor="full_name">Nombre completo</FormLabel>
                          <FormInput
                            id="full_name"
                            name="full_name"
                            type="text"
                            placeholder="Tu nombre"
                            value={formData.full_name}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                        <FormGroup>
                          <FormLabel htmlFor="birthdate">
                            <FiCalendar size={14} /> Fecha de nacimiento
                          </FormLabel>
                          <FormInput
                            id="birthdate"
                            name="birthdate"
                            type="date"
                            value={formData.birthdate}
                            onChange={handleInputChange}
                          />
                          {formData.birthdate && (
                            <HelperText>Edad: {calculateAge(formData.birthdate)} años</HelperText>
                          )}
                        </FormGroup>
                      </FormGrid>
                    </FormSection>

                    <FormSection>
                      <SectionTitle><FiPhys size={18} /> Características Físicas</SectionTitle>
                      <FormGrid>
                        <FormGroup>
                          <FormLabel htmlFor="peso">Peso (kg)</FormLabel>
                          <FormInput
                            id="peso"
                            name="peso"
                            type="number"
                            placeholder="70"
                            min="20"
                            max="200"
                            step="0.1"
                            value={formData.peso}
                            onChange={handleInputChange}
                          />
                          <HelperText>Nos ayuda a recomendar el peso ideal de la pala</HelperText>
                        </FormGroup>
                        <FormGroup>
                          <FormLabel htmlFor="altura">Altura (cm)</FormLabel>
                          <FormInput
                            id="altura"
                            name="altura"
                            type="number"
                            placeholder="175"
                            min="120"
                            max="250"
                            value={formData.altura}
                            onChange={handleInputChange}
                          />
                          <HelperText>Influye en el balance recomendado</HelperText>
                        </FormGroup>
                      </FormGrid>
                    </FormSection>

                    <FormSection>
                      <SectionTitle><FiTrendingUp size={18} /> Nivel de Juego</SectionTitle>
                      <FormGroup>
                        <FormLabel htmlFor="game_level">Tu nivel</FormLabel>
                        <FormSelect
                          id="game_level"
                          name="game_level"
                          value={formData.game_level}
                          onChange={handleInputChange}
                        >
                          <option value="">Selecciona tu nivel</option>
                          <option value="principiante">Principiante (1.0 - 2.5)</option>
                          <option value="intermedio">Intermedio (3.0 - 4.5)</option>
                          <option value="avanzado">Avanzado (5.0 - 6.5)</option>
                          <option value="profesional">Profesional (7.0+)</option>
                        </FormSelect>
                        <HelperText>Basado en el sistema de clasificación Playtomic</HelperText>
                      </FormGroup>
                    </FormSection>

                    <FormSection>
                      <SectionTitle><FiAlertCircle size={18} /> Limitaciones</SectionTitle>
                      <FormGroup>
                        <FormLabel htmlFor="limitations">Condiciones especiales</FormLabel>
                        <FormTextarea
                          id="limitations"
                          name="limitations"
                          placeholder="Ej: Problemas de codo, muñeca, espalda..."
                          value={formData.limitations}
                          onChange={handleInputChange}
                        />
                        <HelperText>Información opcional que nos ayuda a hacer mejores recomendaciones</HelperText>
                      </FormGroup>
                    </FormSection>

                    <FormActions>
                      <Button
                        type="submit"
                        $primary
                        disabled={saving}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiSave size={18} />
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                    </FormActions>
                  </form>
                </CardContent>
              </ContentCard>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ContentCard>
                <CardContent>
                  <ActivityStats
                    stats={activityData?.stats || { reviewsCount: 0, listsCount: 0, comparisonsCount: 0 }}
                    recentReviews={activityData?.recentReviews || []}
                    recentLists={activityData?.recentLists || []}
                    recentComparisons={activityData?.recentComparisons || []}
                  />
                </CardContent>
              </ContentCard>
            </motion.div>
          )}

          {activeTab === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <UserCollections />
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <AccountSettings user={{ email: user.email, created_at: userProfile?.created_at }} />
            </motion.div>
          )}
        </AnimatePresence>
      </MainContent>
    </Container>
  );
};

export default UserProfilePage;
