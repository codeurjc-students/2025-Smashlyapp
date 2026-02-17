import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUserCheck,
  FiArrowRight,
  FiX,
  FiActivity,
  FiCalendar,
  FiTrendingUp,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';
import { UserProfileService } from '../../services/userProfileService';
import { sileo } from 'sileo';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
`;

const Modal = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  position: relative;
  border: 1px solid rgba(22, 163, 74, 0.1);
  max-height: 90vh;
  overflow-y: auto;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #16a34a;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.1);
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem;
  line-height: 1.2;
  text-align: center;
`;

const Description = styled.p`
  color: #4b5563;
  font-size: 1.125rem;
  line-height: 1.6;
  margin: 0 0 2rem;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`;

const PrimaryButton = styled.button`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: #6b7280;
  border: 2px solid transparent;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #374151;
    background: #f9fafb;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f3f4f6;
    color: #4b5563;
  }
`;

// Form Styles
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 80px;
  width: 100%;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const HelperText = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const OnboardingPromptModal: React.FC<OnboardingPromptModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'prompt' | 'form'>('prompt');
  const [loading, setLoading] = useState(false);
  const { refreshUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    birthdate: '',
    game_level: '',
    limitations: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates = {
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        birthdate: formData.birthdate || undefined,
        game_level: formData.game_level || undefined,
        limitations: formData.limitations ? [formData.limitations] : undefined,
      };

      await UserProfileService.updateUserProfile(updates);
      await refreshUserProfile();
      sileo.success({ title: 'Éxito', description: '¡Perfil completado con éxito!' });
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      sileo.error({
        title: 'Error',
        description: 'Error al guardar los datos. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Modal
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <CloseButton onClick={onClose}>
              <FiX size={24} />
            </CloseButton>

            {step === 'prompt' ? (
              <>
                <IconContainer>
                  <FiUserCheck size={40} />
                </IconContainer>

                <Title>¡Bienvenido a Smashly!</Title>

                <Description>
                  Para ofrecerte las mejores recomendaciones y comparaciones personalizadas, te
                  sugerimos completar tu perfil deportivo ahora. Solo te tomará un minuto.
                </Description>

                <ButtonGroup>
                  <PrimaryButton onClick={() => setStep('form')}>
                    Completar mi perfil ahora
                    <FiArrowRight />
                  </PrimaryButton>
                  <SecondaryButton onClick={onClose}>Quizás más tarde</SecondaryButton>
                </ButtonGroup>
              </>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Title style={{ textAlign: 'left', fontSize: '1.5rem' }}>Completa tu Perfil</Title>

                <FormGrid>
                  <FormGroup>
                    <Label htmlFor='weight'>
                      <FiActivity /> Peso (kg)
                    </Label>
                    <Input
                      id='weight'
                      name='weight'
                      type='number'
                      placeholder='Ej: 75'
                      value={formData.weight}
                      onChange={handleInputChange}
                      min='20'
                      max='200'
                      step='0.1'
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor='height'>
                      <FiActivity /> Altura (cm)
                    </Label>
                    <Input
                      id='height'
                      name='height'
                      type='number'
                      placeholder='Ej: 180'
                      value={formData.height}
                      onChange={handleInputChange}
                      min='100'
                      max='250'
                    />
                  </FormGroup>
                </FormGrid>

                <FormGroup>
                  <Label htmlFor='birthdate'>
                    <FiCalendar /> Fecha de Nacimiento
                  </Label>
                  <Input
                    id='birthdate'
                    name='birthdate'
                    type='date'
                    value={formData.birthdate}
                    onChange={handleInputChange}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor='game_level'>
                    <FiTrendingUp /> Nivel de Juego
                  </Label>
                  <Select
                    id='game_level'
                    name='game_level'
                    value={formData.game_level}
                    onChange={handleInputChange}
                  >
                    <option value=''>Selecciona tu nivel</option>
                    <option value='Principiante'>Principiante (1.0 - 2.5)</option>
                    <option value='Intermedio'>Intermedio (3.0 - 4.5)</option>
                    <option value='Avanzado'>Avanzado (5.0 - 6.5)</option>
                    <option value='Profesional'>Profesional (7.0+)</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor='limitations'>
                    <FiAlertCircle /> Limitaciones o Lesiones
                  </Label>
                  <TextArea
                    id='limitations'
                    name='limitations'
                    placeholder='Describe si tienes alguna lesión (codo, rodilla...) o preferencia específica.'
                    value={formData.limitations}
                    onChange={handleInputChange}
                  />
                  <HelperText>Opcional</HelperText>
                </FormGroup>

                <ButtonGroup style={{ marginTop: '1rem' }}>
                  <PrimaryButton type='submit' disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar y Continuar'}
                    {!loading && <FiCheck />}
                  </PrimaryButton>
                  <SecondaryButton type='button' onClick={onClose}>
                    Omitir por ahora
                  </SecondaryButton>
                </ButtonGroup>
              </Form>
            )}
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default OnboardingPromptModal;
