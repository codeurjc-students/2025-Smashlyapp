import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  FiCheck,
  FiLoader,
  FiTrendingUp,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import styled from "styled-components";
import { useComparison } from "../../contexts/ComparisonContext";
import { Racket, RacketComparison } from "../../types/racket";
// import { compareRackets } from "../../utils/gemini";

const FloatingPanel = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 2px solid #16a34a;
  z-index: 40;
  max-width: 350px;
  width: calc(100vw - 4rem);

  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
    width: auto;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const RacketsList = styled.div`
  margin-bottom: 1rem;
`;

const RacketItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const RacketImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 6px;
  background: white;
`;

const RacketInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RacketName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RacketBrand = styled.div`
  font-size: 0.75rem;
  color: #16a34a;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;

  &:hover {
    background: #fee2e2;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ClearButton = styled.button`
  flex: 1;
  background: none;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #9ca3af;
    background: #f9fafb;
  }
`;

const CompareButton = styled.button<{ disabled: boolean }>`
  flex: 2;
  background: ${(props) => (props.disabled ? "#9ca3af" : "#16a34a")};
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: ${(props) => (props.disabled ? "#9ca3af" : "#059669")};
  }
`;

const Counter = styled.div`
  background: #16a34a;
  color: white;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 24px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;

  &:hover {
    background: #f3f4f6;
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const AnalysisSection = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AnalysisTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AnalysisText = styled.p`
  color: #4b5563;
  line-height: 1.7;
  font-size: 1rem;
`;

const RacketAnalysisCard = styled.div`
  background: #f9fafb;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
`;

const RacketAnalysisHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const RacketAnalysisImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 8px;
  background: white;
  padding: 0.25rem;
`;

const RacketAnalysisInfo = styled.div`
  flex: 1;
`;

const RacketAnalysisName = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const RacketAnalysisBrand = styled.div`
  font-size: 0.875rem;
  color: #16a34a;
  font-weight: 500;
`;

const AnalysisDetail = styled.div`
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailTitle = styled.h5`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DetailText = styled.p`
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.875rem;
`;

const ProsConsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProsSection = styled.div`
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
`;

const ConsSection = styled.div`
  background: #fef2f2;
  border-radius: 8px;
  padding: 1rem;
`;

const ProsConsTitle = styled.h6`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #374151;
`;

const ProsConsItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const LoadingIcon = styled(FiLoader)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ProsConsText = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
`;

interface FloatingComparisonPanelProps {
  onClose?: () => void;
}

const FloatingComparisonPanel: React.FC<FloatingComparisonPanelProps> = ({
  onClose,
}) => {
  const { rackets, count, removeRacket, clearComparison } = useComparison();

  // Estados para la comparación con IA
  const [isComparing, setIsComparing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResults, setComparisonResults] =
    useState<RacketComparison | null>(null);

  // Handle comparison with AI
  const handleCompare = async () => {
    if (count < 2) {
      toast.error("Selecciona al menos 2 palas para comparar");
      return;
    }

    try {
      setIsComparing(true);
      // const results = await compareRackets(rackets);
      // setComparisonResults(results);
      setShowComparison(true);
    } catch (error: any) {
      console.error("Error comparing rackets:", error);
      toast.error(
        error.message || "Error al comparar las palas. Inténtalo de nuevo."
      );
    } finally {
      setIsComparing(false);
    }
  };

  // Close comparison modal
  const closeComparison = () => {
    setShowComparison(false);
    setComparisonResults(null);
  };

  const handleClose = () => {
    clearComparison();
    onClose?.();
  };

  if (count === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <FloatingPanel
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
      >
        <Header>
          <Title>
            Comparación <Counter>{count}</Counter>
          </Title>
          <CloseButton onClick={handleClose}>
            <FiX size={18} />
          </CloseButton>
        </Header>

        <RacketsList>
          {rackets.map((racket: Racket) => (
            <RacketItem key={racket.nombre}>
              <RacketImage
                // src={racket.imagen}
                alt={racket.nombre}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=80&h=80&fit=crop";
                }}
              />
              <RacketInfo>
                <RacketName>{racket.modelo}</RacketName>
                <RacketBrand>{racket.marca}</RacketBrand>
              </RacketInfo>
              <RemoveButton onClick={() => removeRacket(racket.nombre)}>
                <FiX size={16} />
              </RemoveButton>
            </RacketItem>
          ))}
        </RacketsList>

        <ButtonsContainer>
          <ClearButton onClick={clearComparison}>Limpiar</ClearButton>
          <CompareButton
            disabled={count < 2 || isComparing}
            onClick={handleCompare}
          >
            {isComparing ? (
              <>
                <LoadingIcon />
                Comparando...
              </>
            ) : (
              <>
                <FiZap size={16} />
                Comparar con IA
              </>
            )}
          </CompareButton>
        </ButtonsContainer>
      </FloatingPanel>

      {/* Comparison Results Modal */}
      <AnimatePresence>
        {showComparison && comparisonResults && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeComparison}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>Análisis Comparativo con IA</ModalTitle>
                <ModalCloseButton onClick={closeComparison}>
                  <FiX size={24} />
                </ModalCloseButton>
              </ModalHeader>

              <ModalBody>
                {/* General Analysis */}
                <AnalysisSection>
                  <AnalysisTitle>
                    <FiTrendingUp />
                    Análisis General
                  </AnalysisTitle>
                  <AnalysisText>
                    {comparisonResults.generalAnalysis}
                  </AnalysisText>
                </AnalysisSection>

                {/* Individual Racket Analysis */}
                {comparisonResults.racketAnalysis.map(
                  (analysis: any, index: number) => (
                    <RacketAnalysisCard key={index}>
                      <RacketAnalysisHeader>
                        <RacketAnalysisImage
                          // src={rackets[index]?.imagen}
                          alt={analysis.name}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=120&h=120&fit=crop";
                          }}
                        />
                        <RacketAnalysisInfo>
                          <RacketAnalysisName>
                            {analysis.name}
                          </RacketAnalysisName>
                          <RacketAnalysisBrand>
                            {rackets[index]?.marca}
                          </RacketAnalysisBrand>
                        </RacketAnalysisInfo>
                      </RacketAnalysisHeader>

                      <AnalysisDetail>
                        <DetailTitle>Características Clave</DetailTitle>
                        <DetailText>{analysis.keyAttributes}</DetailText>
                      </AnalysisDetail>

                      <AnalysisDetail>
                        <DetailTitle>Recomendado Para</DetailTitle>
                        <DetailText>{analysis.recommendedFor}</DetailText>
                      </AnalysisDetail>

                      <AnalysisDetail>
                        <DetailTitle>Por Qué Esta Pala</DetailTitle>
                        <DetailText>{analysis.whyThisRacket}</DetailText>
                      </AnalysisDetail>

                      <ProsConsContainer>
                        <ProsSection>
                          <ProsConsTitle>✅ Pros</ProsConsTitle>
                          {analysis.pros.map(
                            (pro: string, proIndex: number) => (
                              <ProsConsItem key={proIndex}>
                                <FiCheck
                                  size={16}
                                  style={{ color: "#16a34a", marginTop: "2px" }}
                                />
                                <ProsConsText>{pro}</ProsConsText>
                              </ProsConsItem>
                            )
                          )}
                        </ProsSection>

                        <ConsSection>
                          <ProsConsTitle>⚠️ Consideraciones</ProsConsTitle>
                          {analysis.cons.map(
                            (con: string, conIndex: number) => (
                              <ProsConsItem key={conIndex}>
                                <FiX
                                  size={16}
                                  style={{ color: "#ef4444", marginTop: "2px" }}
                                />
                                <ProsConsText>{con}</ProsConsText>
                              </ProsConsItem>
                            )
                          )}
                        </ConsSection>
                      </ProsConsContainer>
                    </RacketAnalysisCard>
                  )
                )}

                {/* Final Recommendation */}
                <AnalysisSection>
                  <AnalysisTitle>
                    <FiUsers />
                    Recomendación Final
                  </AnalysisTitle>
                  <AnalysisText>
                    {/* {comparisonResults.finalRecommendation} */}
                  </AnalysisText>
                </AnalysisSection>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default FloatingComparisonPanel;
