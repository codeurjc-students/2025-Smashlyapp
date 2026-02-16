import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSave, FiAlertCircle } from 'react-icons/fi';
import { Racket } from '@/types/racket';
import { RacketService } from '@/services/racketService';

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
`;

const ModalContainer = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;

  &:hover {
    color: #1f2937;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #16a34a;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: none;

  ${props =>
    props.variant === 'primary'
      ? `
    background: #16a34a;
    color: white;
    &:hover { background: #15803d; }
    &:disabled { background: #86efac; cursor: not-allowed; }
  `
      : `
    background: #f3f4f6;
    color: #4b5563;
    &:hover { background: #e5e7eb; }
  `}
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
  background: #fef2f2;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
`;

interface EditRacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  racket: Racket;
  onUpdate: (updatedRacket: Racket) => void;
}

type EditCategory = 'general' | 'characteristics' | 'description' | 'prices';

export const EditRacketModal: React.FC<EditRacketModalProps> = ({
  isOpen,
  onClose,
  racket,
  onUpdate,
}) => {
  const [category, setCategory] = useState<EditCategory>('general');
  const [formData, setFormData] = useState<Partial<Racket>>(racket);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof Racket, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!racket.id) return;

    try {
      setLoading(true);
      setError(null);
      const updated = await RacketService.updateRacket(racket.id, formData);
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      console.error('Error updating racket:', err);
      setError(err.message || 'Error al actualizar la pala');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalContainer
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>

          <Title>Editar Pala</Title>
          <Subtitle>Modifica los detalles de {racket.modelo}</Subtitle>

          {error && (
            <ErrorMessage>
              <FiAlertCircle /> {error}
            </ErrorMessage>
          )}

          <FormGroup style={{ marginBottom: '1.5rem' }}>
            <Label>Categoría de edición</Label>
            <Select value={category} onChange={e => setCategory(e.target.value as EditCategory)}>
              <option value='general'>Información General</option>
              <option value='characteristics'>Características Técnicas</option>
              <option value='description'>Descripción</option>
              <option value='prices'>Precios y Enlaces</option>
            </Select>
          </FormGroup>

          <Form onSubmit={handleSubmit}>
            {category === 'general' && (
              <>
                <FormGroup>
                  <Label>Marca</Label>
                  <Input
                    type='text'
                    value={formData.marca || ''}
                    onChange={e => handleInputChange('marca', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Modelo</Label>
                  <Input
                    type='text'
                    value={formData.modelo || ''}
                    onChange={e => handleInputChange('modelo', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Imagen URL</Label>
                  <Input
                    type='text'
                    value={formData.imagenes?.[0] || ''}
                    onChange={e => {
                      const newImages = [...(formData.imagenes || [])];
                      newImages[0] = e.target.value;
                      handleInputChange('imagenes', newImages);
                    }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>
                    <input
                      type='checkbox'
                      checked={formData.en_oferta || false}
                      onChange={e => handleInputChange('en_oferta', e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    En Oferta
                  </Label>
                </FormGroup>
              </>
            )}

            {category === 'characteristics' && (
              <>
                <FormGroup>
                  <Label>Forma</Label>
                  <Input
                    type='text'
                    value={formData.caracteristicas_forma || ''}
                    onChange={e => handleInputChange('caracteristicas_forma', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Balance</Label>
                  <Input
                    type='text'
                    value={formData.caracteristicas_balance || ''}
                    onChange={e => handleInputChange('caracteristicas_balance', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Dureza</Label>
                  <Input
                    type='text'
                    value={formData.caracteristicas_dureza || ''}
                    onChange={e => handleInputChange('caracteristicas_dureza', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Nivel de Juego</Label>
                  <Input
                    type='text'
                    value={formData.caracteristicas_nivel_de_juego || ''}
                    onChange={e =>
                      handleInputChange('caracteristicas_nivel_de_juego', e.target.value)
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Caras (Material)</Label>
                  <Input
                    type='text'
                    value={formData.caracteristicas_cara || ''}
                    onChange={e => handleInputChange('caracteristicas_cara', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Núcleo (Goma)</Label>
                  <Input
                    type='text'
                    value={formData.caracteristicas_nucleo || ''}
                    onChange={e => handleInputChange('caracteristicas_nucleo', e.target.value)}
                  />
                </FormGroup>
              </>
            )}

            {category === 'description' && (
              <FormGroup>
                <Label>Descripción detallada</Label>
                <Textarea
                  value={formData.descripcion || ''}
                  onChange={e => handleInputChange('descripcion', e.target.value)}
                  rows={10}
                />
              </FormGroup>
            )}

            {category === 'prices' && (
              <>
                <h4 style={{ margin: '0 0 0.5rem', color: '#16a34a' }}>Padel Nuestro</h4>
                <FormGroup>
                  <Label>Precio Actual</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={formData.padelnuestro_precio_actual || ''}
                    onChange={e =>
                      handleInputChange('padelnuestro_precio_actual', parseFloat(e.target.value))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Enlace</Label>
                  <Input
                    type='text'
                    value={formData.padelnuestro_enlace || ''}
                    onChange={e => handleInputChange('padelnuestro_enlace', e.target.value)}
                  />
                </FormGroup>

                <h4 style={{ margin: '1rem 0 0.5rem', color: '#16a34a' }}>Padel Market</h4>
                <FormGroup>
                  <Label>Precio Actual</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={formData.padelmarket_precio_actual || ''}
                    onChange={e =>
                      handleInputChange('padelmarket_precio_actual', parseFloat(e.target.value))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Enlace</Label>
                  <Input
                    type='text'
                    value={formData.padelmarket_enlace || ''}
                    onChange={e => handleInputChange('padelmarket_enlace', e.target.value)}
                  />
                </FormGroup>
              </>
            )}

            <ButtonGroup>
              <Button type='button' variant='secondary' onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type='submit' variant='primary' disabled={loading}>
                {loading ? (
                  'Guardando...'
                ) : (
                  <>
                    <FiSave /> Guardar Cambios
                  </>
                )}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContainer>
      </Overlay>
    </AnimatePresence>
  );
};
