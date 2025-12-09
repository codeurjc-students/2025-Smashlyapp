import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, buildApiUrl, getCommonHeaders } from '../../config/api';

interface EditUpdateModalProps {
  update: any;
  onClose: () => void;
  onSave: (updatedData: any) => void;
}

const EditUpdateModal: React.FC<EditUpdateModalProps> = ({ update, onClose, onSave }) => {
  const [formData, setFormData] = useState(update.proposed_data || {});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PENDING_UPDATES.LIST}/${update.id}`),
        {
          method: 'PATCH',
          headers: getCommonHeaders(),
          body: JSON.stringify({ proposed_data: formData }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar');
      }

      const result = await response.json();
      toast.success('Actualización modificada correctamente');
      onSave(result.data);
      onClose();
    } catch (error: any) {
      console.error('Error updating:', error);
      toast.error(error.message || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  // Get changed fields from changes_summary
  const changedFields = update.changes_summary
    ? Object.keys(update.changes_summary)
    : Object.keys(formData);

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>Editar Actualización</h2>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <UpdateInfo>
            <InfoBadge type={update.action_type}>{update.action_type}</InfoBadge>
            <InfoText>
              Fuente: <strong>{update.source_scraper}</strong>
            </InfoText>
          </UpdateInfo>

          <Form onSubmit={handleSubmit}>
            <FieldsGrid>
              {changedFields.map(field => (
                <FormGroup key={field}>
                  <Label>{formatFieldName(field)}</Label>
                  {renderInput(field, formData[field], handleChange)}
                  {update.changes_summary?.[field] && (
                    <OldValue>Anterior: {formatValue(update.changes_summary[field].old)}</OldValue>
                  )}
                </FormGroup>
              ))}
            </FieldsGrid>

            <ButtonGroup>
              <CancelButton type='button' onClick={onClose} disabled={loading}>
                Cancelar
              </CancelButton>
              <SaveButton type='submit' disabled={loading}>
                <FiSave />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </SaveButton>
            </ButtonGroup>
          </Form>
        </ModalBody>
      </ModalContainer>
    </Overlay>
  );
};

// Helper functions
const formatFieldName = (field: string): string => {
  const fieldNames: Record<string, string> = {
    name: 'Nombre',
    brand: 'Marca',
    model: 'Modelo',
    padelnuestro_actual_price: 'Precio PadelNuestro',
    padelnuestro_original_price: 'Precio Original PN',
    padelnuestro_discount_percentage: 'Descuento PN (%)',
    padelmarket_actual_price: 'Precio PadelMarket',
    padelmarket_original_price: 'Precio Original PM',
    padelmarket_discount_percentage: 'Descuento PM (%)',
    on_offer: 'En Oferta',
    shape: 'Forma',
    balance: 'Balance',
    weight: 'Peso',
    thickness: 'Grosor',
    material: 'Material',
    surface: 'Superficie',
  };
  return fieldNames[field] || field;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
};

const renderInput = (field: string, value: any, onChange: (field: string, value: any) => void) => {
  // Boolean fields
  if (field === 'on_offer' || typeof value === 'boolean') {
    return (
      <Select
        value={value ? 'true' : 'false'}
        onChange={e => onChange(field, e.target.value === 'true')}
      >
        <option value='true'>Sí</option>
        <option value='false'>No</option>
      </Select>
    );
  }

  // Number fields (prices, percentages, weight, thickness)
  if (
    field.includes('price') ||
    field.includes('percentage') ||
    field === 'weight' ||
    field === 'thickness'
  ) {
    return (
      <Input
        type='number'
        step='0.01'
        value={value || ''}
        onChange={e => onChange(field, parseFloat(e.target.value) || null)}
      />
    );
  }

  // Text fields
  return <Input type='text' value={value || ''} onChange={e => onChange(field, e.target.value)} />;
};

// Styled Components
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

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #f0fdf4;

  h2 {
    margin: 0;
    color: #16a34a;
    font-size: 1.5rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #16a34a;
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(90vh - 80px);
`;

const UpdateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 8px;
`;

const InfoBadge = styled.span<{ type: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${props =>
    props.type === 'CREATE' ? '#dcfce7' : props.type === 'UPDATE' ? '#fef3c7' : '#fee2e2'};
  color: ${props =>
    props.type === 'CREATE' ? '#15803d' : props.type === 'UPDATE' ? '#92400e' : '#991b1b'};
`;

const InfoText = styled.span`
  color: #666;
  font-size: 0.875rem;

  strong {
    color: #16a34a;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #16a34a;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #16a34a;
  }
`;

const OldValue = styled.span`
  font-size: 0.75rem;
  color: #666;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f0fdf4;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  color: #666;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #16a34a;
    color: #16a34a;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default EditUpdateModal;
