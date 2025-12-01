import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdvancedFormData } from '../../types/recommendation';

const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 600;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #1f2937;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #4b5563;
  font-size: 0.9rem;
  font-weight: 500;

  input {
    accent-color: #16a34a;
    width: 16px;
    height: 16px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  grid-column: 1 / -1;
`;

const Button = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 0.75rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.$primary ? '#16a34a' : '#f3f4f6'};
  color: ${props => props.$primary ? 'white' : '#4b5563'};
  transition: all 0.2s;
  font-size: 1rem;

  &:hover {
    background: ${props => props.$primary ? '#15803d' : '#e5e7eb'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

interface Props {
  initialData?: Partial<AdvancedFormData>;
  onSubmit: (data: AdvancedFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const AdvancedForm: React.FC<Props> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<AdvancedFormData>({
    level: '',
    frequency: '',
    injuries: '',
    budget: '',
    current_racket: '',
    style: '',
    years_playing: '',
    position: '',
    best_shot: '',
    weakest_shot: '',
    weight_preference: '',
    balance_preference: '',
    shape_preference: '',
    likes_current_racket: '',
    dislikes_current_racket: '',
    goals: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoalChange = (goal: string) => {
    setFormData(prev => {
      const goals = prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal];
      return { ...prev, goals };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormGrid>
          {/* Basic Info */}
          <FormGroup>
            <Label>Nivel de juego</Label>
            <Select name="level" value={formData.level} onChange={handleChange} required>
              <option value="">Selecciona tu nivel</option>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="profesional">Profesional</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Frecuencia de juego</Label>
            <Select name="frequency" value={formData.frequency} onChange={handleChange} required>
              <option value="">Selecciona frecuencia</option>
              <option value="1">1 vez por semana o menos</option>
              <option value="2-3">2-3 veces por semana</option>
              <option value="4+">4 o más veces por semana</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>¿Has tenido lesiones?</Label>
            <Select name="injuries" value={formData.injuries} onChange={handleChange} required>
              <option value="">Selecciona una opción</option>
              <option value="no">No</option>
              <option value="codo">Sí, codo (epicondilitis)</option>
              <option value="hombro">Sí, hombro</option>
              <option value="muneca">Sí, muñeca</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Presupuesto máximo (€)</Label>
            <Input 
              type="number" 
              name="budget" 
              value={formData.budget} 
              onChange={handleChange} 
              placeholder="Ej: 200"
              required
            />
          </FormGroup>

          {/* Advanced Info */}
          <FormGroup>
            <Label>Estilo de juego</Label>
            <Select name="style" value={formData.style} onChange={handleChange} required>
              <option value="">Selecciona estilo</option>
              <option value="control">Control (Defensivo)</option>
              <option value="potencia">Potencia (Ofensivo)</option>
              <option value="equilibrado">Equilibrado (Polivalente)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Años jugando al pádel</Label>
            <Input 
              type="number" 
              name="years_playing" 
              value={formData.years_playing} 
              onChange={handleChange} 
              placeholder="Ej: 2"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Posición en pista</Label>
            <Select name="position" value={formData.position} onChange={handleChange} required>
              <option value="">Selecciona posición</option>
              <option value="reves">Revés</option>
              <option value="drive">Drive (Derecha)</option>
              <option value="ambos">Indiferente / Ambos</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Golpe más fuerte</Label>
            <Input 
              type="text" 
              name="best_shot" 
              value={formData.best_shot} 
              onChange={handleChange} 
              placeholder="Ej: Remate, Bandeja..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Golpe más débil</Label>
            <Input 
              type="text" 
              name="weakest_shot" 
              value={formData.weakest_shot} 
              onChange={handleChange} 
              placeholder="Ej: Globo, Volea..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Pala actual</Label>
            <Input 
              type="text" 
              name="current_racket" 
              value={formData.current_racket} 
              onChange={handleChange} 
              placeholder="Ej: Nox AT10"
            />
          </FormGroup>

          {/* Preferences */}
          <FormGroup>
            <Label>Peso preferido</Label>
            <Select name="weight_preference" value={formData.weight_preference} onChange={handleChange}>
              <option value="no_se">No sé</option>
              <option value="ligera">Ligera (&lt;360g)</option>
              <option value="media">Media (360-375g)</option>
              <option value="pesada">Pesada (&gt;375g)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Balance preferido</Label>
            <Select name="balance_preference" value={formData.balance_preference} onChange={handleChange}>
              <option value="no_se">No sé</option>
              <option value="bajo">Bajo (Manejable)</option>
              <option value="medio">Medio (Equilibrado)</option>
              <option value="alto">Alto (Potencia)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Forma preferida</Label>
            <Select name="shape_preference" value={formData.shape_preference} onChange={handleChange}>
              <option value="no_se">No sé</option>
              <option value="redonda">Redonda</option>
              <option value="lagrima">Lágrima</option>
              <option value="diamante">Diamante</option>
            </Select>
          </FormGroup>

          {/* Text Areas */}
          <FullWidth>
            <FormGroup>
              <Label>¿Qué te GUSTA de tu pala actual?</Label>
              <TextArea 
                name="likes_current_racket" 
                value={formData.likes_current_racket} 
                onChange={handleChange} 
                placeholder="Ej: Tiene mucho control, es muy manejable..."
              />
            </FormGroup>
          </FullWidth>

          <FullWidth>
            <FormGroup>
              <Label>¿Qué te DISGUSTA o cambiarías?</Label>
              <TextArea 
                name="dislikes_current_racket" 
                value={formData.dislikes_current_racket} 
                onChange={handleChange} 
                placeholder="Ej: Le falta potencia, me vibra mucho..."
              />
            </FormGroup>
          </FullWidth>

          {/* Goals */}
          <FullWidth>
            <FormGroup>
              <Label>Objetivos con la nueva pala</Label>
              <CheckboxGroup>
                {['Más potencia', 'Más control', 'Menos lesiones', 'Mejorar técnica', 'Subir de nivel', 'Durabilidad'].map(goal => (
                  <CheckboxLabel key={goal}>
                    <input 
                      type="checkbox" 
                      checked={formData.goals.includes(goal)}
                      onChange={() => handleGoalChange(goal)}
                    />
                    {goal}
                  </CheckboxLabel>
                ))}
              </CheckboxGroup>
            </FormGroup>
          </FullWidth>

          <ButtonGroup>
            {onCancel && (
              <Button type="button" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" $primary disabled={isLoading}>
              {isLoading ? 'Analizando...' : 'Obtener análisis detallado'}
            </Button>
          </ButtonGroup>
        </FormGrid>
      </form>
    </FormContainer>
  );
};
