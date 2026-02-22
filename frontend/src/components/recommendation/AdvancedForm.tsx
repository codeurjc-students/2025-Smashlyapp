import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdvancedFormData } from '../../types/recommendation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PriceRangeSlider } from './PriceRangeSlider';

const FormContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(22, 163, 74, 0.1);
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #16a34a;
  margin: 2rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0fdf4;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:first-child {
    margin-top: 0;
  }
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
  font-size: 0.9rem;
`;

const Tooltip = styled.span`
  display: inline-block;
  margin-left: 0.5rem;
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 400;
  font-style: italic;
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

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const RadioLabel = styled.label<{ $checked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 2px solid ${props => (props.$checked ? '#16a34a' : '#e5e7eb')};
  background: ${props => (props.$checked ? '#f0fdf4' : 'white')};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => (props.$checked ? '#15803d' : '#4b5563')};

  &:hover {
    border-color: #16a34a;
    background: #f0fdf4;
  }

  input[type='radio'] {
    display: none;
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

const PriorityContainer = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px dashed #e5e7eb;
`;

const PriorityInstructions = styled.p`
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const PriorityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PriorityItem = styled.div<{ $isDragging?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => (props.$isDragging ? '#f0fdf4' : 'white')};
  border: 2px solid ${props => (props.$isDragging ? '#16a34a' : '#e5e7eb')};
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s;
  box-shadow: ${props =>
    props.$isDragging ? '0 4px 12px rgba(22, 163, 74, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'};

  &:active {
    cursor: grabbing;
  }

  &:hover {
    border-color: #16a34a;
    transform: translateY(-1px);
  }
`;

const PriorityNumber = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
`;

const PriorityLabel = styled.div`
  flex: 1;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
`;

const DragHandle = styled.div`
  color: #9ca3af;
  font-size: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 2px;

  &::before,
  &::after {
    content: '⋮';
    line-height: 0.5;
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
  initialData?: Partial<AdvancedFormData>;
  onSubmit: (data: AdvancedFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const DEFAULT_PRIORITIES: Array<
  'potencia' | 'control' | 'manejabilidad' | 'salida_de_bola' | 'punto_dulce'
> = ['potencia', 'control', 'manejabilidad', 'salida_de_bola', 'punto_dulce'];

const PRIORITY_LABELS = {
  potencia: 'Potencia',
  control: 'Control',
  manejabilidad: 'Manejabilidad',
  salida_de_bola: 'Salida de Bola',
  punto_dulce: 'Punto Dulce',
};

// Sortable Item Component
interface SortableItemProps {
  id: string;
  index: number;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <PriorityItem
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      {...attributes}
      {...listeners}
    >
      <PriorityNumber>{index + 1}</PriorityNumber>
      <PriorityLabel>{PRIORITY_LABELS[id as keyof typeof PRIORITY_LABELS]}</PriorityLabel>
      <DragHandle />
    </PriorityItem>
  );
};

export const AdvancedForm: React.FC<Props> = ({ initialData, onSubmit, onCancel, isLoading }) => {
const [formData, setFormData] = useState<AdvancedFormData>({
    level: '',
    frequency: '',
    injuries: '',
    budget: { min: 30, max: 300 },
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
    // Strategic fields
    gender: undefined,
    physical_condition: undefined,
    touch_preference: undefined,
    aesthetic_preference: undefined,
    characteristic_priorities: DEFAULT_PRIORITIES,
  });

  const [priorities, setPriorities] = useState(DEFAULT_PRIORITIES);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      if (initialData.characteristic_priorities) {
        setPriorities(initialData.characteristic_priorities);
      }
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBudgetChange = (value: { min: number; max: number }) => {
    setFormData(prev => ({ ...prev, budget: value }));
  };

  const handleGoalChange = (goal: string) => {
    setFormData(prev => {
      const goals = prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal];
      return { ...prev, goals };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPriorities(items => {
        const oldIndex = items.indexOf(active.id as (typeof items)[0]);
        const newIndex = items.indexOf(over.id as (typeof items)[0]);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        setFormData(prev => ({ ...prev, characteristic_priorities: newOrder }));
        return newOrder;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormGrid>
          {/* PERFIL DE JUEGO */}
          <FullWidth>
            <SectionTitle>📊 Perfil de Juego</SectionTitle>
          </FullWidth>

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

          <FormGroup>
            <Label>Estilo de juego</Label>
            <Select name='style' value={formData.style} onChange={handleChange} required>
              <option value=''>Selecciona estilo</option>
              <option value='control'>Control (Defensivo)</option>
              <option value='potencia'>Potencia (Ofensivo)</option>
              <option value='equilibrado'>Equilibrado (Polivalente)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Años jugando al pádel</Label>
            <Input
              type='number'
              name='years_playing'
              value={formData.years_playing}
              onChange={handleChange}
              placeholder='Ej: 2'
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Posición en pista</Label>
            <Select name='position' value={formData.position} onChange={handleChange} required>
              <option value=''>Selecciona posición</option>
              <option value='reves'>Revés</option>
              <option value='drive'>Drive (Derecha)</option>
              <option value='ambos'>Indiferente / Ambos</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Golpe más fuerte</Label>
            <Input
              type='text'
              name='best_shot'
              value={formData.best_shot}
              onChange={handleChange}
              placeholder='Ej: Remate, Bandeja...'
            />
          </FormGroup>

          <FormGroup>
            <Label>Golpe más débil</Label>
            <Input
              type='text'
              name='weakest_shot'
              value={formData.weakest_shot}
              onChange={handleChange}
              placeholder='Ej: Globo, Volea...'
            />
          </FormGroup>

          <FormGroup>
            <Label>Pala actual</Label>
            <Input
              type='text'
              name='current_racket'
              value={formData.current_racket}
              onChange={handleChange}
              placeholder='Ej: Nox AT10'
            />
          </FormGroup>

          {/* PERFIL BIOMECÁNICO */}
          <FullWidth>
            <SectionTitle>🛡️ Perfil Biomecánico</SectionTitle>
          </FullWidth>

          <FormGroup>
            <Label>¿Has tenido lesiones?</Label>
            <Select name='injuries' value={formData.injuries} onChange={handleChange} required>
              <option value=''>Selecciona una opción</option>
              <option value='no'>No</option>
              <option value='codo'>Sí, codo (epicondilitis)</option>
              <option value='hombro'>Sí, hombro</option>
              <option value='muneca'>Sí, muñeca</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>
              Género
              <Tooltip>(afecta al peso recomendado)</Tooltip>
            </Label>
            <RadioGroup>
              <RadioLabel $checked={formData.gender === 'masculino'}>
                <input
                  type='radio'
                  name='gender'
                  value='masculino'
                  checked={formData.gender === 'masculino'}
                  onChange={handleChange}
                />
                Masculino
              </RadioLabel>
              <RadioLabel $checked={formData.gender === 'femenino'}>
                <input
                  type='radio'
                  name='gender'
                  value='femenino'
                  checked={formData.gender === 'femenino'}
                  onChange={handleChange}
                />
                Femenino
              </RadioLabel>
            </RadioGroup>
          </FormGroup>

          <FormGroup>
            <Label>
              Condición física
              <Tooltip>(frecuencia de ejercicio)</Tooltip>
            </Label>
            <RadioGroup>
              <RadioLabel $checked={formData.physical_condition === 'asiduo'}>
                <input
                  type='radio'
                  name='physical_condition'
                  value='asiduo'
                  checked={formData.physical_condition === 'asiduo'}
                  onChange={handleChange}
                />
                Asiduo
              </RadioLabel>
              <RadioLabel $checked={formData.physical_condition === 'ocasional'}>
                <input
                  type='radio'
                  name='physical_condition'
                  value='ocasional'
                  checked={formData.physical_condition === 'ocasional'}
                  onChange={handleChange}
                />
                Ocasional
              </RadioLabel>
            </RadioGroup>
          </FormGroup>

          {/* PREFERENCIAS TÉCNICAS */}
          <FullWidth>
            <SectionTitle>⚙️ Preferencias Técnicas</SectionTitle>
          </FullWidth>

          <FormGroup>
            <Label>Presupuesto (€)</Label>
            <PriceRangeSlider
              min={30}
              max={700}
              step={10}
              value={formData.budget}
              onChange={handleBudgetChange}
            />
          </FormGroup>

          <FormGroup>
            <Label>
              Preferencia de tacto
              <Tooltip>(dureza de la pala)</Tooltip>
            </Label>
            <Select
              name='touch_preference'
              value={formData.touch_preference || ''}
              onChange={handleChange}
            >
              <option value=''>No tengo preferencia</option>
              <option value='blando'>Blando (más confort)</option>
              <option value='medio'>Medio (equilibrado)</option>
              <option value='duro'>Duro (más potencia)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Peso preferido</Label>
            <Select
              name='weight_preference'
              value={formData.weight_preference}
              onChange={handleChange}
            >
              <option value='no_se'>No sé</option>
              <option value='ligera'>Ligera (&lt;360g)</option>
              <option value='media'>Media (360-375g)</option>
              <option value='pesada'>Pesada (&gt;375g)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Balance preferido</Label>
            <Select
              name='balance_preference'
              value={formData.balance_preference}
              onChange={handleChange}
            >
              <option value='no_se'>No sé</option>
              <option value='bajo'>Bajo (Manejable)</option>
              <option value='medio'>Medio (Equilibrado)</option>
              <option value='alto'>Alto (Potencia)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Forma preferida</Label>
            <Select
              name='shape_preference'
              value={formData.shape_preference}
              onChange={handleChange}
            >
              <option value='no_se'>No sé</option>
              <option value='redonda'>Redonda</option>
              <option value='lagrima'>Lágrima</option>
              <option value='diamante'>Diamante</option>
            </Select>
          </FormGroup>

          {/* PRIORIZACIÓN DE CARACTERÍSTICAS (EXCLUSIVO AVANZADO) */}
          <FullWidth>
            <SectionTitle>🎯 Priorización de Características (Avanzado)</SectionTitle>
            <PriorityContainer>
              <PriorityInstructions>
                <strong>Arrastra y ordena</strong> las características según tu prioridad. La
                primera será la más importante para tu recomendación.
              </PriorityInstructions>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={priorities} strategy={verticalListSortingStrategy}>
                  <PriorityList>
                    {priorities.map((priority, index) => (
                      <SortableItem key={priority} id={priority} index={index} />
                    ))}
                  </PriorityList>
                </SortableContext>
              </DndContext>
            </PriorityContainer>
          </FullWidth>

          {/* EXPERIENCIA CON PALA ACTUAL */}
          <FullWidth>
            <SectionTitle>💭 Experiencia con tu Pala Actual</SectionTitle>
          </FullWidth>

          <FullWidth>
            <FormGroup>
              <Label>¿Qué te GUSTA de tu pala actual?</Label>
              <TextArea
                name='likes_current_racket'
                value={formData.likes_current_racket}
                onChange={handleChange}
                placeholder='Ej: Tiene mucho control, es muy manejable...'
              />
            </FormGroup>
          </FullWidth>

          <FullWidth>
            <FormGroup>
              <Label>¿Qué te DISGUSTA o cambiarías?</Label>
              <TextArea
                name='dislikes_current_racket'
                value={formData.dislikes_current_racket}
                onChange={handleChange}
                placeholder='Ej: Le falta potencia, me vibra mucho...'
              />
            </FormGroup>
          </FullWidth>

          {/* OBJETIVOS */}
          <FullWidth>
            <SectionTitle>🎯 Objetivos con la Nueva Pala</SectionTitle>
            <FormGroup>
              <CheckboxGroup>
                {[
                  'Más potencia',
                  'Más control',
                  'Menos lesiones',
                  'Mejorar técnica',
                  'Subir de nivel',
                  'Durabilidad',
                ].map(goal => (
                  <CheckboxLabel key={goal}>
                    <input
                      type='checkbox'
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
              <Button type='button' onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
            <Button type='submit' $primary disabled={isLoading}>
              {isLoading ? 'Analizando...' : 'Obtener análisis detallado'}
            </Button>
          </ButtonGroup>
        </FormGrid>
      </form>
    </FormContainer>
  );
};
