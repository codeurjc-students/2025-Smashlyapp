import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FiX, FiSave, FiUser, FiCalendar, FiActivity } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile } from "../../services/userProfileService";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
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
  overflow-y: auto;
`;

const Modal = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin: 2rem 0;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;

    &:hover {
      background: #9ca3af;
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 8px;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #16a34a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) =>
    props.variant === "primary"
      ? `
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: white;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
    }
    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }
  `
      : `
    background: #f3f4f6;
    color: #374151;
    &:hover {
      background: #e5e7eb;
    }
  `}
`;

const HelperText = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: -0.25rem;
`;

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    nickname: "",
    full_name: "",
    weight: "",
    height: "",
    birthdate: "",
    game_level: "",
    limitations: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        nickname: userProfile.nickname || "",
        full_name: userProfile.full_name || "",
        weight: userProfile.weight?.toString() || "",
        height: userProfile.height?.toString() || "",
        birthdate: userProfile.birthdate || "",
        game_level: userProfile.game_level || "",
        limitations: userProfile.limitations?.[0] || "", // Tomar el primer elemento del array
      });
    }
  }, [isOpen, userProfile]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const updates: any = {
        nickname: formData.nickname.trim(),
        full_name: formData.full_name.trim() || undefined,
        game_level: formData.game_level || undefined,
      };

      // Convertir limitations de string a array si tiene contenido
      if (formData.limitations.trim()) {
        updates.limitations = [formData.limitations.trim()];
      }

      // Solo incluir peso y altura si tienen valores
      if (formData.weight) {
        updates.weight = parseFloat(formData.weight);
      }
      if (formData.height) {
        updates.height = parseFloat(formData.height);
      }
      if (formData.birthdate) {
        updates.birthdate = formData.birthdate;
      }

      await onSave(updates);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <Modal
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>
                <FiUser />
                Editar Perfil
              </Title>
              <CloseButton onClick={handleClose} disabled={isSubmitting}>
                <FiX size={24} />
              </CloseButton>
            </Header>

            <Form onSubmit={handleSubmit}>
              <FormSection>
                <SectionTitle>
                  <FiUser />
                  Información Personal
                </SectionTitle>

                <FormGroup>
                  <Label htmlFor="nickname">Nickname *</Label>
                  <Input
                    id="nickname"
                    type="text"
                    name="nickname"
                    placeholder="Tu nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    maxLength={50}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    type="text"
                    name="full_name"
                    placeholder="Tu nombre completo"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={100}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="birthdate">
                    <FiCalendar />
                    Fecha de Nacimiento
                  </Label>
                  <Input
                    id="birthdate"
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </FormGroup>

                <InputGroup>
                  <FormGroup>
                    <Label htmlFor="weight">
                      <FiActivity />
                      Peso (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      name="weight"
                      placeholder="70"
                      value={formData.weight}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      min="30"
                      max="200"
                      step="0.1"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="height">
                      <FiActivity />
                      Altura (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      name="height"
                      placeholder="175"
                      value={formData.height}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      min="100"
                      max="250"
                      step="1"
                    />
                  </FormGroup>
                </InputGroup>
              </FormSection>

              <FormSection>
                <SectionTitle>
                  <FiActivity />
                  Información de Juego
                </SectionTitle>

                <FormGroup>
                  <Label htmlFor="game_level">Nivel de Juego</Label>
                  <Select
                    id="game_level"
                    name="game_level"
                    value={formData.game_level}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecciona tu nivel</option>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                    <option value="profesional">Profesional</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="limitations">Limitaciones o Lesiones</Label>
                  <TextArea
                    id="limitations"
                    name="limitations"
                    placeholder="Describe cualquier limitación física o lesión que debamos tener en cuenta..."
                    value={formData.limitations}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                  <HelperText>
                    Esta información nos ayuda a recomendarte las palas más
                    adecuadas
                  </HelperText>
                </FormGroup>
              </FormSection>

              <ButtonGroup>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!formData.nickname.trim() || isSubmitting}
                >
                  <FiSave size={20} />
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </ButtonGroup>
            </Form>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};
