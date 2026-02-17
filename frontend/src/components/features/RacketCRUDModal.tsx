import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { sileo } from 'sileo';

const Overlay = styled.div`
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

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #16a34a;
  font-weight: 700;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: #f3f4f6;
    color: #333;
  }

  svg {
    font-size: 1.5rem;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  ${props =>
    props.variant === 'primary'
      ? `
    background: #16a34a;
    color: white;

    &:hover {
      background: #15803d;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
    }
  `
      : `
    background: #f3f4f6;
    color: #666;

    &:hover {
      background: #e5e7eb;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface Racket {
  id: number;
  nombre: string;
  marca: string;
  precio_actual: number;
  forma?: string;
  balance?: string;
  peso?: number;
  nucleo?: string;
  superficie?: string;
  perfil?: number;
  longitud?: number;
  descripcion?: string;
}

interface RacketCRUDModalProps {
  racket: Racket | null;
  onClose: () => void;
  onSave: (racket: Racket) => Promise<void>;
}

const RacketCRUDModal: React.FC<RacketCRUDModalProps> = ({ racket, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Racket>>({
    nombre: '',
    marca: '',
    precio_actual: 0,
    forma: '',
    balance: '',
    peso: 0,
    nucleo: '',
    superficie: '',
    perfil: 0,
    longitud: 0,
    descripcion: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (racket) {
      setFormData(racket);
    }
  }, [racket]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'precio_actual' || name === 'peso' || name === 'perfil' || name === 'longitud'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre || !formData.marca || !formData.precio_actual) {
      sileo.error({ title: 'Error', description: 'Por favor, completa los campos obligatorios' });
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: racket?.id || Date.now(),
        nombre: formData.nombre || '',
        marca: formData.marca || '',
        precio_actual: formData.precio_actual || 0,
        forma: formData.forma,
        balance: formData.balance,
        peso: formData.peso,
        nucleo: formData.nucleo,
        superficie: formData.superficie,
        perfil: formData.perfil,
        longitud: formData.longitud,
      });
    } catch (error) {
      console.error('Error saving racket:', error);
      // El error ya se muestra en el padre (handleSaveRacket)
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{racket ? 'Editar Pala' : 'Nueva Pala'}</ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>
                Nombre <span style={{ color: '#dc2626' }}>*</span>
              </Label>
              <Input
                type='text'
                name='nombre'
                value={formData.nombre}
                onChange={handleChange}
                placeholder='Ej: Vertex 03'
                required
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>
                  Marca <span style={{ color: '#dc2626' }}>*</span>
                </Label>
                <Input
                  type='text'
                  name='marca'
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder='Ej: Bullpadel'
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  Precio (€) <span style={{ color: '#dc2626' }}>*</span>
                </Label>
                <Input
                  type='number'
                  name='precio_actual'
                  value={formData.precio_actual}
                  onChange={handleChange}
                  placeholder='299.99'
                  step='0.01'
                  min='0'
                  required
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Forma</Label>
                <Select name='forma' value={formData.forma} onChange={handleChange}>
                  <option value=''>Seleccionar...</option>
                  <option value='Redonda'>Redonda</option>
                  <option value='Lágrima'>Lágrima</option>
                  <option value='Diamante'>Diamante</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Balance</Label>
                <Select name='balance' value={formData.balance} onChange={handleChange}>
                  <option value=''>Seleccionar...</option>
                  <option value='Bajo'>Bajo</option>
                  <option value='Medio'>Medio</option>
                  <option value='Alto'>Alto</option>
                </Select>
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Peso (g)</Label>
                <Input
                  type='number'
                  name='peso'
                  value={formData.peso || ''}
                  onChange={handleChange}
                  placeholder='365'
                  min='0'
                />
              </FormGroup>

              <FormGroup>
                <Label>Perfil (mm)</Label>
                <Input
                  type='number'
                  name='perfil'
                  value={formData.perfil || ''}
                  onChange={handleChange}
                  placeholder='38'
                  step='0.1'
                  min='0'
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Núcleo</Label>
                <Input
                  type='text'
                  name='nucleo'
                  value={formData.nucleo || ''}
                  onChange={handleChange}
                  placeholder='Ej: MultiEVA'
                />
              </FormGroup>

              <FormGroup>
                <Label>Superficie</Label>
                <Input
                  type='text'
                  name='superficie'
                  value={formData.superficie || ''}
                  onChange={handleChange}
                  placeholder='Ej: Carbono 3K'
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Descripción</Label>
              <TextArea
                name='descripcion'
                value={formData.descripcion || ''}
                onChange={handleChange}
                placeholder='Descripción detallada de la pala...'
              />
            </FormGroup>
          </Form>
        </ModalBody>

        <ModalFooter>
          <Button type='button' variant='secondary' onClick={onClose}>
            Cancelar
          </Button>
          <Button type='button' variant='primary' onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : racket ? 'Actualizar' : 'Crear'}
          </Button>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

export default RacketCRUDModal;
