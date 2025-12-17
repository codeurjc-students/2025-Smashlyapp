import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BasicFormData } from '../../types/recommendation';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);
`;

const SectionTitle = styled.h3`
  color: #16a34a;
  font-size: 1.1rem;
  margin: 1.5rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0fdf4;

  &:first-of-type {
    margin-top: 0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Tooltip = styled.span`
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 400;
  font-style: italic;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  background: white;
  transition: all 0.2s;

  &:hover {
    border-color: #16a34a;
    background: #f0fdf4;
  }

  input:checked + & {
    border-color: #16a34a;
    background: #f0fdf4;
  }
`;

const RadioInput = styled.input`
  cursor: pointer;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #1f2937;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #1f2937;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 0.75rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: ${props => (props.$primary ? '#16a34a' : '#f3f4f6')};
  color: ${props => (props.$primary ? 'white' : '#4b5563')};
  transition: all 0.2s;
  font-size: 1rem;

  &:hover {
    background: ${props => (props.$primary ? '#15803d' : '#e5e7eb')};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

interface Props {
  initialData?: Partial<BasicFormData>;
  onSubmit: (data: BasicFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const BasicForm: React.FC<Props> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<BasicFormData>({
    level: '',
    frequency: '',
    injuries: '',
    budget: 0,
    current_racket: '',
    gender: undefined,
    physical_condition: undefined,
    touch_preference: undefined,
    aesthetic_preference: undefined,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <SectionTitle>📊 Perfil de Juego</SectionTitle>

        <FormGroup>
          <Label>Nivel de juego</Label>
          <Select name='level' value={formData.level} onChange={handleChange} required>
            <option value=''>Selecciona tu nivel</option>
            <option value='principiante'>Principiante</option>
            <option value='intermedio'>Intermedio</option>
            <option value='avanzado'>Avanzado</option>
            <option value='profesional'>Profesional</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Frecuencia de juego</Label>
          <Select name='frequency' value={formData.frequency} onChange={handleChange} required>
            <option value=''>Selecciona frecuencia</option>
            <option value='1'>1 vez por semana o menos</option>
            <option value='2-3'>2-3 veces por semana</option>
            <option value='4+'>4 o más veces por semana</option>
          </Select>
        </FormGroup>

        <SectionTitle>🛡️ Perfil Biomecánico</SectionTitle>

        <FormGroup>
          <Label>
            ¿Has tenido lesiones anteriormente?
            <Tooltip>(Priorizaremos palas que protejan tu salud)</Tooltip>
          </Label>
          <Select name='injuries' value={formData.injuries} onChange={handleChange} required>
            <option value=''>Selecciona una opción</option>
            <option value='no'>No</option>
            <option value='codo'>Sí, codo (epicondilitis)</option>
            <option value='hombro'>Sí, hombro</option>
            <option value='muneca'>Sí, muñeca</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Género</Label>
          <RadioGroup>
            <RadioLabel>
              <RadioInput
                type='radio'
                name='gender'
                value='masculino'
                checked={formData.gender === 'masculino'}
                onChange={e => handleRadioChange('gender', e.target.value)}
              />
              Masculino
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type='radio'
                name='gender'
                value='femenino'
                checked={formData.gender === 'femenino'}
                onChange={e => handleRadioChange('gender', e.target.value)}
              />
              Femenino
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        <FormGroup>
          <Label>Condición física</Label>
          <RadioGroup>
            <RadioLabel>
              <RadioInput
                type='radio'
                name='physical_condition'
                value='asiduo'
                checked={formData.physical_condition === 'asiduo'}
                onChange={e => handleRadioChange('physical_condition', e.target.value)}
              />
              Asiduo al deporte
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type='radio'
                name='physical_condition'
                value='ocasional'
                checked={formData.physical_condition === 'ocasional'}
                onChange={e => handleRadioChange('physical_condition', e.target.value)}
              />
              Ocasional
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        <SectionTitle>⚙️ Preferencias</SectionTitle>

        <FormGroup>
          <Label>Presupuesto máximo (€)</Label>
          <Input
            type='number'
            name='budget'
            value={formData.budget}
            onChange={handleChange}
            placeholder='Ej: 150'
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>
            Tacto preferido
            <Tooltip>(Sensación de golpeo)</Tooltip>
          </Label>
          <Select
            name='touch_preference'
            value={formData.touch_preference || ''}
            onChange={handleChange}
          >
            <option value=''>Sin preferencia</option>
            <option value='duro'>Duro (más control, menos salida de bola)</option>
            <option value='medio'>Medio (equilibrio)</option>
            <option value='blando'>Blando (más salida de bola y confort)</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Pala actual (Opcional)</Label>
          <Input
            type='text'
            name='current_racket'
            value={formData.current_racket}
            onChange={handleChange}
            placeholder='Ej: Bullpadel Vertex 03'
          />
        </FormGroup>

        <ButtonGroup>
          {onCancel && (
            <Button type='button' onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type='submit' $primary disabled={isLoading}>
            {isLoading ? 'Analizando...' : 'Buscar mi pala ideal'}
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};
