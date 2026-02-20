import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminLayout from '../components/features/AdminLayout';
import {
  FiTag,
  FiGrid,
  FiSettings,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiGlobe,
  FiMail,
  FiSave,
  FiPackage,
} from 'react-icons/fi';
import { sileo } from 'sileo';
import { AdminService, Brand, Category } from '../services/adminService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const HeaderInfo = styled.div``;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #64748b;
  margin-top: 0.375rem;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.375rem;
  background: white;
  padding: 0.375rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: ${props => (props.$active ? '#0f172a' : 'transparent')};
  color: ${props => (props.$active ? 'white' : '#64748b')};

  &:hover {
    background: ${props => (props.$active ? '#0f172a' : '#f1f5f9')};
    color: ${props => (props.$active ? 'white' : '#0f172a')};
  }

  svg {
    flex-shrink: 0;
    font-size: 1rem;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.0625rem;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.625rem;

  svg {
    color: #0f172a;
  }
`;

const HeaderStats = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const HeaderStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderStatValue = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
`;

const HeaderStatLabel = styled.span`
  font-size: 0.8125rem;
  color: #64748b;
`;

const AddButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #334155;
  }

  svg {
    font-size: 0.875rem;
  }
`;

const CardContent = styled.div`
  padding: 1rem 1.5rem 1.5rem;
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ListItem = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: white;
    border-color: #e2e8f0;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ItemAvatar = styled.div<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 600;
`;

const ItemDetails = styled.div``;

const ItemName = styled.div`
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9375rem;
`;

const ItemMeta = styled.div`
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 0.125rem;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled(motion.button)<{ $variant?: 'danger' }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$variant === 'danger' ? '#fef2f2' : '#f1f5f9'};
  color: ${props => props.$variant === 'danger' ? '#dc2626' : '#64748b'};

  &:hover {
    background: ${props => props.$variant === 'danger' ? '#dc2626' : '#0f172a'};
    color: ${props => props.$variant === 'danger' ? 'white' : 'white'};
  }
`;

const FormPanel = styled(motion.div)`
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;

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
`;

const FormInput = styled.input`
  padding: 0.625rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #0f172a;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 0.625rem;
  justify-content: flex-end;
`;

const Button = styled(motion.button)<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props =>
    props.$variant === 'primary'
      ? `
    background: #0f172a;
    color: white;
    &:hover { background: #334155; }
  `
      : `
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
    &:hover { background: #f8fafc; color: #0f172a; }
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1.5rem;
  color: #94a3b8;
`;

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #f1f5f9;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
`;

const SettingsGrid = styled.div`
  display: grid;
  gap: 1rem;
  max-width: 560px;
`;

const SettingsCard = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
`;

const SettingsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SettingsIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SettingsInfo = styled.div`
  flex: 1;
`;

const SettingsLabel = styled.label`
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.25rem;
`;

const SettingsInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #0f172a;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
  }
`;

const SaveButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.5rem;

  &:hover {
    background: #334155;
  }
`;

const Badge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: ${props => props.color}15;
  color: ${props => props.color};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #64748b;
`;

type TabType = 'brands' | 'categories' | 'general';

const SettingsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('brands');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const [generalSettings, setGeneralSettings] = useState({
    appName: 'Smashly',
    contactEmail: 'admin@smashly.com',
    seoDescription: 'La mejor guía de palas de pádel',
    websiteUrl: 'https://smashly.app',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [brandsData, categoriesData] = await Promise.all([
        AdminService.getBrands(),
        AdminService.getCategories(),
      ]);
      setBrands(brandsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading settings data:', error);
      sileo.error({ title: 'Error', description: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) {
      sileo.error({ title: 'Error', description: 'El nombre de la marca es obligatorio' });
      return;
    }
    const newBrand: Brand = {
      name: newBrandName,
      country: newBrandCountry || 'España',
      racketCount: 0,
    };
    setBrands([...brands, newBrand]);
    setNewBrandName('');
    setNewBrandCountry('');
    setIsAdding(false);
    sileo.success({ title: 'Éxito', description: 'Marca añadida correctamente' });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      sileo.error({ title: 'Error', description: 'El nombre de la categoría es obligatorio' });
      return;
    }
    const newCategory: Category = {
      name: newCategoryName,
      description: newCategoryDesc || 'Sin descripción',
      racketCount: 0,
    };
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setIsAdding(false);
    sileo.success({ title: 'Éxito', description: 'Categoría añadida correctamente' });
  };

  const handleDeleteBrand = (name: string) => {
    if (!window.confirm('¿Eliminar esta marca?')) return;
    setBrands(brands.filter(b => b.name !== name));
    sileo.success({ title: 'Éxito', description: 'Marca eliminada' });
  };

  const handleDeleteCategory = (name: string) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    setCategories(categories.filter(c => c.name !== name));
    sileo.success({ title: 'Éxito', description: 'Categoría eliminada' });
  };

  const handleSaveGeneral = () => {
    sileo.success({ title: 'Éxito', description: 'Configuración guardada' });
  };

  if (loading) {
    return <LoadingContainer>Cargando...</LoadingContainer>;
  }

  const totalRackets = brands.reduce((acc, b) => acc + b.racketCount, 0);

  return (
    <Container>
      <HeaderSection>
        <HeaderInfo>
          <Title>Configuración</Title>
          <Subtitle>Gestiona marcas, categorías y opciones del sistema</Subtitle>
        </HeaderInfo>
        <TabsContainer>
          <Tab $active={activeTab === 'brands'} onClick={() => { setActiveTab('brands'); setIsAdding(false); }}>
            <FiTag /> Marcas
          </Tab>
          <Tab $active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setIsAdding(false); }}>
            <FiGrid /> Categorías
          </Tab>
          <Tab $active={activeTab === 'general'} onClick={() => { setActiveTab('general'); setIsAdding(false); }}>
            <FiSettings /> General
          </Tab>
        </TabsContainer>
      </HeaderSection>

      <MainContent>
        <AnimatePresence mode="wait">
          {activeTab === 'brands' && (
            <motion.div
              key="brands"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ContentCard>
                <CardHeader>
                  <CardTitle>
                    <FiTag /> Gestión de Marcas
                  </CardTitle>
                  <HeaderStats>
                    <HeaderStat>
                      <HeaderStatValue>{brands.length}</HeaderStatValue>
                      <HeaderStatLabel>marcas</HeaderStatLabel>
                    </HeaderStat>
                    <HeaderStat>
                      <HeaderStatValue>{totalRackets}</HeaderStatValue>
                      <HeaderStatLabel>palas</HeaderStatLabel>
                    </HeaderStat>
                  </HeaderStats>
                  <AddButton
                    onClick={() => setIsAdding(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus /> Nueva
                  </AddButton>
                </CardHeader>
                <CardContent>
                  <AnimatePresence>
                    {isAdding && (
                      <FormPanel
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <FormGrid>
                          <FormGroup>
                            <FormLabel>Nombre de la marca</FormLabel>
                            <FormInput
                              placeholder="Ej: Babolat"
                              value={newBrandName}
                              onChange={e => setNewBrandName(e.target.value)}
                            />
                          </FormGroup>
                          <FormGroup>
                            <FormLabel>País de origen</FormLabel>
                            <FormInput
                              placeholder="Ej: Francia"
                              value={newBrandCountry}
                              onChange={e => setNewBrandCountry(e.target.value)}
                            />
                          </FormGroup>
                        </FormGrid>
                        <FormActions>
                          <Button onClick={() => setIsAdding(false)}>Cancelar</Button>
                          <Button $variant="primary" onClick={handleAddBrand}>
                            <FiCheck /> Guardar
                          </Button>
                        </FormActions>
                      </FormPanel>
                    )}
                  </AnimatePresence>
                  <ListContainer>
                    {brands.length === 0 ? (
                      <EmptyState>
                        <EmptyIcon><FiTag /></EmptyIcon>
                        <p>No hay marcas registradas</p>
                      </EmptyState>
                    ) : (
                      brands.map((brand) => (
                        <ListItem
                          key={brand.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <ItemInfo>
                            <ItemAvatar color="#8b5cf6">{brand.name.charAt(0)}</ItemAvatar>
                            <ItemDetails>
                              <ItemName>{brand.name}</ItemName>
                              <ItemMeta>
                                {brand.country}
                                <Badge color="#8b5cf6"><FiPackage size={10} /> {brand.racketCount}</Badge>
                              </ItemMeta>
                            </ItemDetails>
                          </ItemInfo>
                          <ItemActions>
                            <IconButton
                              $variant="danger"
                              onClick={() => handleDeleteBrand(brand.name)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiTrash2 size={16} />
                            </IconButton>
                          </ItemActions>
                        </ListItem>
                      ))
                    )}
                  </ListContainer>
                </CardContent>
              </ContentCard>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ContentCard>
                <CardHeader>
                  <CardTitle>
                    <FiGrid /> Gestión de Categorías
                  </CardTitle>
                  <HeaderStats>
                    <HeaderStat>
                      <HeaderStatValue>{categories.length}</HeaderStatValue>
                      <HeaderStatLabel>categorías</HeaderStatLabel>
                    </HeaderStat>
                  </HeaderStats>
                  <AddButton
                    onClick={() => setIsAdding(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus /> Nueva
                  </AddButton>
                </CardHeader>
                <CardContent>
                  <AnimatePresence>
                    {isAdding && (
                      <FormPanel
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <FormGrid>
                          <FormGroup>
                            <FormLabel>Nombre de la categoría</FormLabel>
                            <FormInput
                              placeholder="Ej: Redonda"
                              value={newCategoryName}
                              onChange={e => setNewCategoryName(e.target.value)}
                            />
                          </FormGroup>
                          <FormGroup>
                            <FormLabel>Descripción</FormLabel>
                            <FormInput
                              placeholder="Breve descripción"
                              value={newCategoryDesc}
                              onChange={e => setNewCategoryDesc(e.target.value)}
                            />
                          </FormGroup>
                        </FormGrid>
                        <FormActions>
                          <Button onClick={() => setIsAdding(false)}>Cancelar</Button>
                          <Button $variant="primary" onClick={handleAddCategory}>
                            <FiCheck /> Guardar
                          </Button>
                        </FormActions>
                      </FormPanel>
                    )}
                  </AnimatePresence>
                  <ListContainer>
                    {categories.length === 0 ? (
                      <EmptyState>
                        <EmptyIcon><FiGrid /></EmptyIcon>
                        <p>No hay categorías registradas</p>
                      </EmptyState>
                    ) : (
                      categories.map((category) => (
                        <ListItem
                          key={category.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <ItemInfo>
                            <ItemAvatar color="#16a34a">{category.name.charAt(0)}</ItemAvatar>
                            <ItemDetails>
                              <ItemName>{category.name}</ItemName>
                              <ItemMeta>{category.description}</ItemMeta>
                            </ItemDetails>
                          </ItemInfo>
                          <ItemActions>
                            <IconButton
                              $variant="danger"
                              onClick={() => handleDeleteCategory(category.name)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiTrash2 size={16} />
                            </IconButton>
                          </ItemActions>
                        </ListItem>
                      ))
                    )}
                  </ListContainer>
                </CardContent>
              </ContentCard>
            </motion.div>
          )}

          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ContentCard>
                <CardHeader>
                  <CardTitle>
                    <FiSettings /> Configuración General
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SettingsGrid>
                    <SettingsCard>
                      <SettingsRow>
                        <SettingsIcon color="#0f172a"><FiTag /></SettingsIcon>
                        <SettingsInfo style={{ flex: 1 }}>
                          <SettingsLabel>Nombre de la Aplicación</SettingsLabel>
                          <SettingsInput
                            value={generalSettings.appName}
                            onChange={e => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
                          />
                        </SettingsInfo>
                      </SettingsRow>
                    </SettingsCard>

                    <SettingsCard>
                      <SettingsRow>
                        <SettingsIcon color="#3b82f6"><FiMail /></SettingsIcon>
                        <SettingsInfo style={{ flex: 1 }}>
                          <SettingsLabel>Email de Contacto</SettingsLabel>
                          <SettingsInput
                            type="email"
                            value={generalSettings.contactEmail}
                            onChange={e => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                          />
                        </SettingsInfo>
                      </SettingsRow>
                    </SettingsCard>

                    <SettingsCard>
                      <SettingsRow>
                        <SettingsIcon color="#06b6d4"><FiGlobe /></SettingsIcon>
                        <SettingsInfo style={{ flex: 1 }}>
                          <SettingsLabel>URL del Sitio Web</SettingsLabel>
                          <SettingsInput
                            value={generalSettings.websiteUrl}
                            onChange={e => setGeneralSettings({ ...generalSettings, websiteUrl: e.target.value })}
                          />
                        </SettingsInfo>
                      </SettingsRow>
                    </SettingsCard>
                  </SettingsGrid>

                  <SaveButton
                    onClick={handleSaveGeneral}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <FiSave /> Guardar Cambios
                  </SaveButton>
                </CardContent>
              </ContentCard>
            </motion.div>
          )}
        </AnimatePresence>
      </MainContent>
    </Container>
  );
};

const AdminSettingsPageWithLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingContainer>Cargando...</LoadingContainer>;
  }

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AdminLayout>
      <SettingsContent />
    </AdminLayout>
  );
};

export default AdminSettingsPageWithLayout;
