import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiZap, FiTarget, FiActivity, FiShield, FiWind, FiSmile, FiPackage } from "react-icons/fi";
import { 
  ImprovementAspect, 
  ASPECT_LABELS, 
  ASPECT_DESCRIPTIONS,
  UpgradeRecommendationResult
} from "../../types/upgradeRecommendation";

interface UpgradeRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: UpgradeRecommendationResult) => void;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.75); /* Oscurecido para compensar falta de blur */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
`;

const Modal = styled(motion.div)`
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  will-change: transform, opacity;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
    &:hover {
      background: #94a3b8;
    }
  }
`;

const Header = styled.div`
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  span {
    color: #16a34a;
  }
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
`;

const CloseButton = styled.button`
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
`;

const Content = styled.div`
  padding: 2rem;
`;

const Section = styled.div`
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionLabel = styled.label`
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 1rem;
`;

const AspectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
`;

const AspectCard = styled.div<{ $selected: boolean }>`
  padding: 1rem;
  border-radius: 16px;
  border: 2px solid ${props => props.$selected ? '#16a34a' : '#f1f5f9'};
  background: ${props => props.$selected ? '#f0fdf4' : 'white'};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  &:hover {
    border-color: ${props => props.$selected ? '#16a34a' : '#cbd5e1'};
    transform: translateY(-2px);
  }

  will-change: transform, border-color, background-color;
`;

const IconWrapper = styled.div<{ $selected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${props => props.$selected ? '#16a34a' : '#f8fafc'};
  color: ${props => props.$selected ? 'white' : '#64748b'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const AspectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const AspectName = styled.span<{ $selected: boolean }>`
  font-weight: 700;
  font-size: 0.9375rem;
  color: ${props => props.$selected ? '#166534' : '#1e293b'};
`;

const AspectDesc = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.4;
`;

const SliderContainer = styled.div`
  padding: 0.5rem;
`;

const SliderValue = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #1e293b;

  .value {
    color: #16a34a;
    font-size: 1.125rem;
  }
`;

const StyledSlider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 8px;
  background: none;
  border-radius: 10px;
  outline: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  margin: 0;
  z-index: 2;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 26px;
    height: 26px;
    background: #ffffff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 3px solid #16a34a;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: auto;
    position: relative;
    z-index: 5;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 0 15px rgba(22, 163, 74, 0.4);
    }
  }

  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: #ffffff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 3px solid #16a34a;
    pointer-events: auto;
  }
`;

const SliderWrapper = styled.div`
  position: relative;
  height: 48px;
  margin: 1rem 0;
  display: flex;
  align-items: center;
`;

const SliderTrack = styled.div<{ $start: number; $end: number }>`
  position: absolute;
  height: 8px;
  width: 100%;
  background: ${props => `linear-gradient(to right, #e2e8f0 ${props.$start}%, #16a34a ${props.$start}%, #16a34a ${props.$end}%, #e2e8f0 ${props.$end}%)`};
  border-radius: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
`;
const RangeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: -0.5rem;
  padding: 0 0.25rem;
  
  span {
    font-size: 0.75rem;
    font-weight: 600;
    color: #94a3b8;
  }
`;

const Footer = styled.div`
  padding: 1.5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f8fafc;
`;

const ActionButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  background: ${props => props.disabled ? '#e2e8f0' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'};
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: ${props => props.disabled ? 'none' : '0 10px 15px -3px rgba(22, 163, 74, 0.2)'};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px -5px rgba(22, 163, 74, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const ErrorMsg = styled.p`
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
`;

const SuccessView = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 1.5rem;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px -5px rgba(22, 163, 74, 0.2);
`;

const ASPECT_ICONS: Record<ImprovementAspect, React.ReactNode> = {
  potencia: <FiZap size={20} />,
  control: <FiTarget size={20} />,
  manejabilidad: <FiActivity size={20} />,
  punto_dulce: <FiWind size={20} />,
  salida_de_bola: <FiCheck size={20} />,
  confort: <FiSmile size={20} />,
  durabilidad: <FiShield size={20} />,
};

const AspectItem = React.memo(({ aspect, isSelected, onClick }: any) => {
  return (
    <AspectCard
      $selected={isSelected}
      onClick={() => onClick(aspect)}
    >
      <IconWrapper $selected={isSelected}>
        {ASPECT_ICONS[aspect as ImprovementAspect]}
      </IconWrapper>
      <AspectInfo>
        <AspectName $selected={isSelected}>
          {ASPECT_LABELS[aspect as ImprovementAspect]}
        </AspectName>
        <AspectDesc>
          {ASPECT_DESCRIPTIONS[aspect as ImprovementAspect]}
        </AspectDesc>
      </AspectInfo>
    </AspectCard>
  );
});

export const UpgradeRecommendationModal: React.FC<UpgradeRecommendationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedAspects, setSelectedAspects] = useState<ImprovementAspect[]>([]);
  const [budgetMin, setBudgetMin] = useState<number>(50);
  const [budgetMax, setBudgetMax] = useState<number>(350);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAspect = (aspect: ImprovementAspect) => {
    if (selectedAspects.includes(aspect)) {
      setSelectedAspects(prev => prev.filter(a => a !== aspect));
    } else {
      if (selectedAspects.length < 5) {
        setSelectedAspects(prev => [...prev, aspect]);
      }
    }
  };

  const handleGenerate = async () => {
    if (selectedAspects.length === 0) return;

    setLoading(true);
    setError(null);

    // Simulamos un breve retraso para el análisis antes de mostrar el aviso
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Modal
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <Header>
              <TitleContainer>
                <Title>
                  <FiPackage />
                  Upgrade de <span>Pala</span>
                </Title>
                <Subtitle>Dinos qué quieres mejorar y nuestra IA buscará tu siguiente nivel.</Subtitle>
              </TitleContainer>
              <CloseButton onClick={onClose}>
                <FiX size={20} />
              </CloseButton>
            </Header>

            <Content>
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <Section>
                      <SectionLabel>¿Qué quieres mejorar? (Máx. 5)</SectionLabel>
                      <AspectGrid>
                        {(Object.keys(ASPECT_LABELS) as ImprovementAspect[]).map(aspect => (
                          <AspectItem
                            key={aspect}
                            aspect={aspect}
                            isSelected={selectedAspects.includes(aspect)}
                            onClick={toggleAspect}
                          />
                        ))}
                      </AspectGrid>
                    </Section>

                    <Section>
                      <SectionLabel>Presupuesto</SectionLabel>
                      <SliderContainer>
                        <SliderValue>
                          <span>Tu rango ideal:</span>
                          <span className="value">
                            {budgetMin}€ - {budgetMax === 500 ? "Sin límite" : `${budgetMax}€`}
                          </span>
                        </SliderValue>
                        
                        <SliderWrapper>
                          <SliderTrack 
                            $start={((budgetMin - 20) / (500 - 20)) * 100} 
                            $end={((budgetMax - 20) / (500 - 20)) * 100} 
                          />
                          <StyledSlider
                            type="range"
                            min="20"
                            max="500"
                            step="10"
                            value={budgetMin}
                            onChange={e => {
                              const val = Math.min(parseInt(e.target.value), budgetMax - 10);
                              setBudgetMin(val);
                            }}
                            style={{ zIndex: budgetMin > (500 * 0.5) ? 4 : 3 }}
                          />
                          <StyledSlider
                            type="range"
                            min="20"
                            max="500"
                            step="10"
                            value={budgetMax}
                            onChange={e => {
                              const val = Math.max(parseInt(e.target.value), budgetMin + 10);
                              setBudgetMax(val);
                            }}
                            style={{ zIndex: budgetMax < (500 * 0.5) ? 4 : 3 }}
                          />
                        </SliderWrapper>

                        <RangeLabels>
                          <span>20€</span>
                          <span>500€ / Sin límite</span>
                        </RangeLabels>
                      </SliderContainer>
                    </Section>

                    <Footer style={{ margin: '0 -2rem -2rem', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                      {error && <ErrorMsg>{error}</ErrorMsg>}
                      <ActionButton
                        disabled={selectedAspects.length === 0 || loading}
                        onClick={handleGenerate}
                      >
                        {loading ? (
                          "Analizando mercado..."
                        ) : (
                          <>
                            <FiZap />
                            Buscar mi próxima pala
                          </>
                        )}
                      </ActionButton>
                      <Subtitle style={{ textAlign: "center" }}>
                        Compararemos tu equipo actual con cientos de modelos.
                      </Subtitle>
                    </Footer>
                  </motion.div>
                ) : (
                  <SuccessView
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <SuccessIcon>
                      <FiCheck size={40} />
                    </SuccessIcon>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <Title style={{ justifyContent: 'center' }}>¡Solicitud Recibida!</Title>
                      <Subtitle>
                        Hemos guardado tus preferencias para el próximo análisis.
                      </Subtitle>
                    </div>
                    <div style={{ 
                      padding: '1.25rem', 
                      background: '#f8fafc', 
                      borderRadius: '16px', 
                      border: '1px solid #f1f5f9',
                      marginTop: '1rem'
                    }}>
                      <p style={{ margin: 0, color: '#1e293b', fontWeight: 600, fontSize: '0.9375rem' }}>
                        🚀 Próximamente estará lista
                      </p>
                      <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                        Estamos terminando de entrenar a nuestra IA para ofrecerte las mejores comparativas personalizadas. ¡Te avisaremos en cuanto tus recomendaciones estén disponibles!
                      </p>
                    </div>
                    <ActionButton onClick={onClose} style={{ marginTop: '1rem' }}>
                      Entendido
                    </ActionButton>
                  </SuccessView>
                )}
              </AnimatePresence>
            </Content>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};
