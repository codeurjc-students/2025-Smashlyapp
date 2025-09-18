import { motion } from "framer-motion";
import React, { useState } from "react";
import {
    FiDollarSign,
    FiTrendingUp,
    FiUser,
    FiZap,
    FiSettings,
} from "react-icons/fi";
import styled from "styled-components";

// Interfaz personalizada para el formulario de pala
interface RacketFormData {
  gameLevel: string;
  playingStyle: string;
  weight: string;
  height: string;
  budget: string;
  preferredShape: string;
  // Campos avanzados
  age: string;
  gender: string;
  physicalCondition: string;
  injuries: string;
  position: string;
  mostUsedShot: string;
  frequency: string;
  playingSurface: string;
  preferredWeight: string;
  preferredBalance: string;
  frameMaterial: string;
  faceMaterial: string;
  rubberType: string;
  durabilityVsPerformance: string;
  favoriteBrand: string;
  availability: string;
  colorPreference: string;
}

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem 0;
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 3rem 0;
  max-width: 800px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;

  .highlight {
    color: #16a34a;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FormContainer = styled(motion.div)`
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(22, 163, 74, 0.1);
  border: 1px solid rgba(22, 163, 74, 0.1);

  @media (max-width: 768px) {
    margin: 0 1rem;
    padding: 1.5rem;
  }
`;

const FormToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 2rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.active ? "white" : "transparent")};
  color: ${(props) => (props.active ? "#16a34a" : "#6b7280")};
  box-shadow: ${(props) => (props.active ? "0 2px 8px rgba(0,0,0,0.1)" : "none")};

  &:hover {
    color: ${(props) => (props.active ? "#16a34a" : "#374151")};
  }
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SectionDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RadioOption = styled.label<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid ${(props) => (props.selected ? "#16a34a" : "#e5e7eb")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.selected ? "#f0f9ff" : "white")};

  &:hover {
    border-color: #16a34a;
    background: #f0f9ff;
  }
`;

const RadioCircle = styled.div<{ selected: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${(props) => (props.selected ? "#16a34a" : "#d1d5db")};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  ${(props) =>
    props.selected &&
    `
    &::after {
      content: '';
      width: 8px;
      height: 8px;
      background: #16a34a;
      border-radius: 50%;
    }
  `}
`;

const RadioText = styled.span<{ selected: boolean }>`
  font-weight: ${(props) => (props.selected ? "600" : "400")};
  color: ${(props) => (props.selected ? "#16a34a" : "#374151")};
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InputContainer = styled.div`
  flex: 1;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  font-style: italic;
`;

const SubmitButton = styled(motion.button)<{ disabled: boolean }>`
  width: 100%;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: ${(props) => (props.disabled ? "none" : "translateY(-2px)")};
    box-shadow: ${(props) =>
      props.disabled ? "none" : "0 10px 30px rgba(22, 163, 74, 0.3)"};
  }
`;


const BestRacketPage: React.FC = () => {
  const [isAdvancedForm, setIsAdvancedForm] = useState(false);

  const [formData, setFormData] = useState<RacketFormData>({
    gameLevel: "",
    playingStyle: "",
    weight: "",
    height: "",
    budget: "",
    preferredShape: "",
    // Campos avanzados
    age: "",
    gender: "",
    physicalCondition: "",
    injuries: "",
    position: "",
    mostUsedShot: "",
    frequency: "",
    playingSurface: "",
    preferredWeight: "",
    preferredBalance: "",
    frameMaterial: "",
    faceMaterial: "",
    rubberType: "",
    durabilityVsPerformance: "",
    favoriteBrand: "",
    availability: "",
    colorPreference: "",
  });

  // Función para actualizar los valores del formulario
  const updateFormData = (field: keyof RacketFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Container>
      <HeroSection>
        <Title>
          Encuentra tu <span className="highlight">Pala Ideal</span>
        </Title>
        <Subtitle>
          Nuestro asistente con IA analiza tu perfil y te recomienda las 3
          mejores palas personalizadas para tu estilo de juego
        </Subtitle>
      </HeroSection>

      <FormContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Form Toggle */}
        <FormToggle>
          <ToggleButton
            active={!isAdvancedForm}
            onClick={() => setIsAdvancedForm(false)}
          >
            📋 Básico
          </ToggleButton>
          <ToggleButton
            active={isAdvancedForm}
            onClick={() => setIsAdvancedForm(true)}
          >
            ⚙️ Avanzado
          </ToggleButton>
        </FormToggle>

        {!isAdvancedForm ? (
          /* FORMULARIO BÁSICO */
          <>
            {/* Game Level Section */}
            <FormSection>
              <SectionTitle>
                <FiUser /> ¿Cuál es tu nivel de juego?
              </SectionTitle>
              <RadioGroup>
                {["Principiante", "Intermedio", "Avanzado", "Profesional"].map((level) => (
                  <RadioOption
                    key={level}
                    selected={formData.gameLevel === level}
                    onClick={() => updateFormData("gameLevel", level)}
                  >
                    <RadioCircle selected={formData.gameLevel === level} />
                    <RadioText selected={formData.gameLevel === level}>
                      {level}
                    </RadioText>
                  </RadioOption>
                ))}
              </RadioGroup>
            </FormSection>

            {/* Playing Style Section */}
            <FormSection>
              <SectionTitle>
                <FiTrendingUp /> ¿Cuál es tu estilo de juego?
              </SectionTitle>
              <RadioGroup>
                {["Control", "Potencia", "Polivalente"].map((style) => (
                  <RadioOption
                    key={style}
                    selected={formData.playingStyle === style}
                    onClick={() => updateFormData("playingStyle", style)}
                  >
                    <RadioCircle selected={formData.playingStyle === style} />
                    <RadioText selected={formData.playingStyle === style}>
                      {style}
                    </RadioText>
                  </RadioOption>
                ))}
              </RadioGroup>
            </FormSection>

            {/* Physical Characteristics */}
            <FormSection>
              <SectionTitle>
                <FiZap /> Características físicas
              </SectionTitle>
              <SectionDescription>
                Estas medidas nos ayudan a recomendarte el peso y balance adecuado
              </SectionDescription>
              <InputGroup>
                <InputContainer>
                  <Label>Peso corporal (kg)</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 75"
                    value={formData.weight}
                    onChange={(e) => updateFormData("weight", e.target.value)}
                  />
                </InputContainer>
                <InputContainer>
                  <Label>Altura (cm)</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 180"
                    value={formData.height}
                    onChange={(e) => updateFormData("height", e.target.value)}
                  />
                </InputContainer>
              </InputGroup>
            </FormSection>

            {/* Budget Section */}
            <FormSection>
              <SectionTitle>
                <FiDollarSign /> Presupuesto máximo (€)
              </SectionTitle>
              <Input
                type="number"
                placeholder="Ej: 200"
                value={formData.budget}
                onChange={(e) => updateFormData("budget", e.target.value)}
              />
              <HelperText>
                Te mostraremos 3 opciones dentro de tu rango de precio
              </HelperText>
            </FormSection>
          </>
        ) : (
          /* FORMULARIO AVANZADO */
          <>
            {/* 1. Perfil del jugador */}
            <FormSection>
              <SectionTitle>
                <FiUser /> 1. Perfil del jugador
              </SectionTitle>
              
              {/* Nivel de juego */}
              <InputContainer>
                <Label>Nivel de juego</Label>
                <RadioGroup>
                  {["Principiante", "Intermedio", "Avanzado", "Profesional"].map((level) => (
                    <RadioOption
                      key={level}
                      selected={formData.gameLevel === level}
                    >
                      <RadioCircle selected={formData.gameLevel === level} />
                      <RadioText selected={formData.gameLevel === level}>
                        {level}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Edad */}
              <InputContainer>
                <Label>Edad</Label>
                <Input
                  type="number"
                  placeholder="Ej: 30"
                  value={formData.age}
                />
              </InputContainer>

              {/* Sexo */}
              <InputContainer>
                <Label>Sexo</Label>
                <RadioGroup>
                  {["Hombre", "Mujer", "Prefiero no decirlo"].map((gender) => (
                    <RadioOption
                      key={gender}
                      selected={formData.gender === gender}
                    >
                      <RadioCircle selected={formData.gender === gender} />
                      <RadioText selected={formData.gender === gender}>
                        {gender}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Condición física */}
              <InputContainer>
                <Label>Condición física</Label>
                <RadioGroup>
                  {["Débil", "Normal", "Fuerte"].map((condition) => (
                    <RadioOption
                      key={condition}
                      selected={formData.physicalCondition === condition}
                    >
                      <RadioCircle selected={formData.physicalCondition === condition} />
                      <RadioText selected={formData.physicalCondition === condition}>
                        {condition}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Altura y peso */}
              <InputGroup>
                <InputContainer>
                  <Label>Altura (cm) - Opcional</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 180"
                    value={formData.height}
                  />
                </InputContainer>
                <InputContainer>
                  <Label>Peso (kg) - Opcional</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 75"
                    value={formData.weight}
                  />
                </InputContainer>
              </InputGroup>

              {/* Lesiones */}
              <InputContainer>
                <Label>Lesiones previas o molestias</Label>
                <RadioGroup>
                  {["Ninguna", "Epicondilitis (codo)", "Muñeca", "Hombro", "Otra"].map((injury) => (
                    <RadioOption
                      key={injury}
                      selected={formData.injuries === injury}
                    >
                      <RadioCircle selected={formData.injuries === injury} />
                      <RadioText selected={formData.injuries === injury}>
                        {injury}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>
            </FormSection>

            {/* 2. Estilo de juego y preferencias */}
            <FormSection>
              <SectionTitle>
                <FiTrendingUp /> 2. Estilo de juego y preferencias
              </SectionTitle>

              {/* Estilo principal */}
              <InputContainer>
                <Label>Estilo principal</Label>
                <RadioGroup>
                  {["Control", "Potencia", "Polivalente"].map((style) => (
                    <RadioOption
                      key={style}
                      selected={formData.playingStyle === style}
                    >
                      <RadioCircle selected={formData.playingStyle === style} />
                      <RadioText selected={formData.playingStyle === style}>
                        {style}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Posición habitual */}
              <InputContainer>
                <Label>Posición habitual</Label>
                <RadioGroup>
                  {["Drive (lado derecho)", "Revés (lado izquierdo)"].map((position) => (
                    <RadioOption
                      key={position}
                      selected={formData.position === position}
                    >
                      <RadioCircle selected={formData.position === position} />
                      <RadioText selected={formData.position === position}>
                        {position}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Tipo de golpe más usado */}
              <InputContainer>
                <Label>Tipo de golpe más usado</Label>
                <RadioGroup>
                  {["Globo", "Smash", "Volea", "Bandeja", "Salida de pared"].map((shot) => (
                    <RadioOption
                      key={shot}
                      selected={formData.mostUsedShot === shot}
                    >
                      <RadioCircle selected={formData.mostUsedShot === shot} />
                      <RadioText selected={formData.mostUsedShot === shot}>
                        {shot}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Frecuencia de juego */}
              <InputContainer>
                <Label>Frecuencia de juego</Label>
                <RadioGroup>
                  {["Ocasional (1 vez por semana)", "Regular (2–3 veces)", "Intensivo (4+ veces)"].map((freq) => (
                    <RadioOption
                      key={freq}
                      selected={formData.frequency === freq}
                    >
                      <RadioCircle selected={formData.frequency === freq} />
                      <RadioText selected={formData.frequency === freq}>
                        {freq}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Superficie habitual */}
              <InputContainer>
                <Label>Superficie habitual de juego</Label>
                <RadioGroup>
                  {["Indoor", "Outdoor"].map((surface) => (
                    <RadioOption
                      key={surface}
                      selected={formData.playingSurface === surface}
                    >
                      <RadioCircle selected={formData.playingSurface === surface} />
                      <RadioText selected={formData.playingSurface === surface}>
                        {surface}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>
            </FormSection>

            {/* 3. Preferencias de pala */}
            <FormSection>
              <SectionTitle>
                <FiSettings /> 3. Preferencias de pala
              </SectionTitle>

              {/* Forma preferida */}
              <InputContainer>
                <Label>Forma preferida</Label>
                <RadioGroup>
                  {["Redonda", "Lágrima", "Diamante", "Indiferente"].map((shape) => (
                    <RadioOption
                      key={shape}
                      selected={formData.preferredShape === shape}
                    >
                      <RadioCircle selected={formData.preferredShape === shape} />
                      <RadioText selected={formData.preferredShape === shape}>
                        {shape}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Peso ideal */}
              <InputContainer>
                <Label>Peso ideal</Label>
                <RadioGroup>
                  {["Ligera (-360g)", "Media (360–370g)", "Pesada (370g+)", "Indiferente"].map((weight) => (
                    <RadioOption
                      key={weight}
                      selected={formData.preferredWeight === weight}
                    >
                      <RadioCircle selected={formData.preferredWeight === weight} />
                      <RadioText selected={formData.preferredWeight === weight}>
                        {weight}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Balance preferido */}
              <InputContainer>
                <Label>Balance preferido</Label>
                <RadioGroup>
                  {["Bajo (más control)", "Medio (equilibrado)", "Alto (más potencia)"].map((balance) => (
                    <RadioOption
                      key={balance}
                      selected={formData.preferredBalance === balance}
                    >
                      <RadioCircle selected={formData.preferredBalance === balance} />
                      <RadioText selected={formData.preferredBalance === balance}>
                        {balance}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Material del marco */}
              <InputContainer>
                <Label>Material del marco</Label>
                <RadioGroup>
                  {["Carbono", "Fibra de vidrio", "Indiferente"].map((material) => (
                    <RadioOption
                      key={material}
                      selected={formData.frameMaterial === material}
                    >
                      <RadioCircle selected={formData.frameMaterial === material} />
                      <RadioText selected={formData.frameMaterial === material}>
                        {material}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Material de las caras */}
              <InputContainer>
                <Label>Material de las caras</Label>
                <RadioGroup>
                  {["Carbono", "Carbono + aluminio", "Fibra de vidrio", "Indiferente"].map((material) => (
                    <RadioOption
                      key={material}
                      selected={formData.faceMaterial === material}
                    >
                      <RadioCircle selected={formData.faceMaterial === material} />
                      <RadioText selected={formData.faceMaterial === material}>
                        {material}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Tipo de goma */}
              <InputContainer>
                <Label>Tipo de goma</Label>
                <RadioGroup>
                  {["EVA blanda (más salida y confort)", "EVA dura (más control y potencia)", "FOAM (máxima salida de bola)", "Indiferente"].map((rubber) => (
                    <RadioOption
                      key={rubber}
                      selected={formData.rubberType === rubber}
                    >
                      <RadioCircle selected={formData.rubberType === rubber} />
                      <RadioText selected={formData.rubberType === rubber}>
                        {rubber}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Durabilidad vs rendimiento */}
              <InputContainer>
                <Label>Durabilidad vs rendimiento</Label>
                <RadioGroup>
                  {["Prefiero durabilidad", "Prefiero máximo rendimiento aunque dure menos"].map((preference) => (
                    <RadioOption
                      key={preference}
                      selected={formData.durabilityVsPerformance === preference}
                    >
                      <RadioCircle selected={formData.durabilityVsPerformance === preference} />
                      <RadioText selected={formData.durabilityVsPerformance === preference}>
                        {preference}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>
            </FormSection>

            {/* 4. Factores externos */}
            <FormSection>
              <SectionTitle>
                <FiDollarSign /> 4. Factores externos
              </SectionTitle>

              {/* Presupuesto */}
              <InputContainer>
                <Label>Presupuesto aproximado (€)</Label>
                <Input
                  type="number"
                  placeholder="Ej: 200"
                  value={formData.budget}
                />
              </InputContainer>

              {/* Marca favorita */}
              <InputContainer>
                <Label>Marca favorita (opcional)</Label>
                <Input
                  type="text"
                  placeholder="Ej: Adidas, Wilson, Head..."
                  value={formData.favoriteBrand}
                />
              </InputContainer>

              {/* Disponibilidad */}
              <InputContainer>
                <Label>Disponibilidad</Label>
                <RadioGroup>
                  {["Online", "Presencial", "Indiferente"].map((availability) => (
                    <RadioOption
                      key={availability}
                      selected={formData.availability === availability}
                    >
                      <RadioCircle selected={formData.availability === availability} />
                      <RadioText selected={formData.availability === availability}>
                        {availability}
                      </RadioText>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </InputContainer>

              {/* Color preferido */}
              <InputContainer>
                <Label>Color o diseño preferido (opcional)</Label>
                <Input
                  type="text"
                  placeholder="Ej: Negro, Azul, Colores vivos..."
                  value={formData.colorPreference}
                />
              </InputContainer>
            </FormSection>
          </>
        )}

        <SubmitButton
          disabled={false}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            console.log('Datos del formulario:', formData);
            // Aquí iría la lógica para procesar el formulario
          }}
        >
          🚀 Encontrar mi pala ideal
        </SubmitButton>
      </FormContainer>
    </Container>
  );
};

export default BestRacketPage;
