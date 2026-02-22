import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { WizardForm } from '../components/recommendation/WizardForm';
import { PalaRotatingScene } from '../components/recommendation/PalaRotatingScene';
import { RecommendationResult } from '../components/recommendation/RecommendationResult';
import { RecommendationService } from '../services/recommendationService';
import { NotificationService } from '../services/notificationService';
import {
  BasicFormData,
  AdvancedFormData,
  RecommendationResult as ResultType,
} from '../types/recommendation';
import { sileo } from 'sileo';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 80px 20px 40px;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  color: #1f2937;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #1f2937;
    font-weight: 800;
  }

  h1 span {
    color: #16a34a;
  }

  p {
    color: #6b7280;
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const ModeSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  border: 1px solid ${props => (props.$active ? '#16a34a' : '#e5e7eb')};
  background: ${props => (props.$active ? '#f0fdf4' : 'white')};
  color: ${props => (props.$active ? '#16a34a' : '#6b7280')};
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #16a34a;
    color: #16a34a;
    transform: translateY(-1px);
  }
`;

const AlertBox = styled.div`
  background: #f0fdf4;
  border: 1px solid #16a34a;
  padding: 1rem;
  border-radius: 12px;
  max-width: 600px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const AlertText = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #166534;
  font-weight: 500;
`;

const AlertButton = styled.button`
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: #15803d;
  }
`;

export const BestRacketPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [step, setStep] = useState<'form' | 'loading' | 'completing' | 'result'>('form');
  const [formType, setFormType] = useState<'basic' | 'advanced'>('basic');
  const [result, setResult] = useState<ResultType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // State for form data persistence
  const [basicData, setBasicData] = useState<Partial<BasicFormData>>({});
  const [advancedData, setAdvancedData] = useState<Partial<AdvancedFormData>>({});

  // State for last recommendation reuse
  const [lastRecommendation, setLastRecommendation] = useState<any>(null);
  const [showReusePrompt, setShowReusePrompt] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const savedRecommendation = sessionStorage.getItem('smashly_last_recommendation');
    if (savedRecommendation) {
      try {
        const parsed = JSON.parse(savedRecommendation);
        if (parsed.result) {
          setResult(parsed.result);
          setStep('result');
          setFormType(parsed.formType || 'basic');
          sessionStorage.removeItem('smashly_last_recommendation');
          setStateRestored(true);
          return;
        }
      } catch (error) {
        console.error('Error loading saved recommendation:', error);
      }
    }

    const savedState = sessionStorage.getItem('bestRacketPageState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setStep(parsed.step || 'form');
        setFormType(parsed.formType || 'basic');
        setResult(parsed.result || null);
        setBasicData(parsed.basicData || {});
        setAdvancedData(parsed.advancedData || {});
        setStateRestored(true);
      } catch (error) {
        console.error('Error restoring state:', error);
        setStateRestored(true);
      }
    } else {
      setStateRestored(true);
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (!stateRestored) return; // Don't save until we've restored

    const stateToSave = {
      step,
      formType,
      result,
      basicData,
      advancedData,
    };
    sessionStorage.setItem('bestRacketPageState', JSON.stringify(stateToSave));
  }, [step, formType, result, basicData, advancedData, stateRestored]);

  useEffect(() => {
    // Only set defaults if state wasn't restored
    if (!stateRestored) return;

    // If user is logged in and we don't have a saved state, default to advanced
    const savedState = sessionStorage.getItem('bestRacketPageState');
    if (user && !savedState) {
      setFormType('advanced');
      checkLastRecommendation();
    }
  }, [user, stateRestored]);

  const checkLastRecommendation = async () => {
    try {
      const last = await RecommendationService.getLast();
      if (last) {
        setLastRecommendation(last);
        setShowReusePrompt(true);
      }
    } catch (error) {
      console.error('Error checking last recommendation:', error);
    }
  };

  const handleReuseData = () => {
    if (!lastRecommendation) return;

    const { form_type, form_data } = lastRecommendation;

    if (form_type === 'basic') {
      setBasicData(form_data);
      setFormType('basic');
    } else {
      setAdvancedData(form_data);
      setFormType('advanced');
    }

    setShowReusePrompt(false);
    sileo.success({ title: 'Éxito', description: 'Datos cargados correctamente' });
  };

  const handleBasicSubmit = async (data: BasicFormData) => {
    setBasicData(data);
    setStep('loading');

    try {
      const res = await RecommendationService.generate('basic', data);

      setResult(res);
      setStep('completing');

      sessionStorage.setItem('smashly_last_recommendation', JSON.stringify({
        result: res,
        formType: 'basic',
        timestamp: Date.now()
      }));

      setTimeout(async () => {
        const notification = await NotificationService.createNotification(
          'recommendation_complete',
          'Recomendación lista',
          'Tu recomendación básica está lista. ¡Descúbrela!',
          { formType: 'basic' }
        );
        
        if (notification) {
          addNotification(notification);
        }
        
        sileo.success({ 
          title: '¡Recomendación lista!', 
          description: 'Tu recomendación está lista. ¡Descúbrela!'
        });
        
        setStep('result');
      }, 2500);
    } catch (error) {
      console.error(error);
      sileo.error({ title: 'Error', description: 'Error al generar la recomendación' });
      setStep('form');
    }
  };

  const handleAdvancedSubmit = async (data: AdvancedFormData) => {
    setAdvancedData(data);
    setStep('loading');

    try {
      const res = await RecommendationService.generate('advanced', data);

      setResult(res);
      setStep('completing');

      sessionStorage.setItem('smashly_last_recommendation', JSON.stringify({
        result: res,
        formType: 'advanced',
        timestamp: Date.now()
      }));

      setTimeout(async () => {
        const notification = await NotificationService.createNotification(
          'recommendation_complete',
          'Recomendación lista',
          'Tu recomendación avanzada está lista. ¡Descúbrela!',
          { formType: 'advanced' }
        );
        
        if (notification) {
          addNotification(notification);
        }
        
        sileo.success({ 
          title: '¡Recomendación lista!', 
          description: 'Tu recomendación está lista. ¡Descúbrela!'
        });
        
        setStep('result');
      }, 2500);
    } catch (error) {
      console.error(error);
      sileo.error({ title: 'Error', description: 'Error al generar la recomendación' });
      setStep('form');
    }
  };

  const handleSave = async () => {
    if (!user || !result) return;

    setIsSaving(true);
    try {
      const dataToSave = formType === 'basic' ? basicData : advancedData;
      // Need to cast because state is Partial but service expects full (validated by form)
      await RecommendationService.save(formType, dataToSave as any, result);
      sileo.success({ title: 'Éxito', description: 'Recomendación guardada en tu perfil' });
    } catch (error) {
      console.error(error);
      sileo.error({ title: 'Error', description: 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setResult(null);
    setBasicData({});
    setAdvancedData({});
    // Clear sessionStorage when explicitly resetting
    sessionStorage.removeItem('bestRacketPageState');
    sessionStorage.removeItem('smashly_last_recommendation');
  };

  return (
    <PageContainer>
      {step !== 'result' && step !== 'completing' && (
        <HeroSection>
          <h1>Encuentra tu Pala Ideal</h1>
          <p>
            {step === 'loading'
              ? 'Analizando tu perfil con IA...'
              : 'Responde unas preguntas y nuestra IA analizará tu perfil para recomendarte las mejores opciones.'}
          </p>
        </HeroSection>
      )}

      {step === 'form' && (
        <>
          {showReusePrompt && (
            <AlertBox>
              <AlertText>
                Hemos encontrado una recomendación anterior del{' '}
                {new Date(lastRecommendation.created_at).toLocaleDateString()}. ¿Quieres reutilizar
                esos datos?
              </AlertText>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <AlertButton
                  onClick={() => setShowReusePrompt(false)}
                  style={{ background: 'transparent', border: '1px solid white' }}
                >
                  No, empezar de cero
                </AlertButton>
                <AlertButton onClick={handleReuseData}>Sí, cargar datos</AlertButton>
              </div>
            </AlertBox>
          )}

          <ModeSelector>
            <ModeButton $active={formType === 'basic'} onClick={() => setFormType('basic')}>
              Básico
            </ModeButton>
            <ModeButton
              $active={formType === 'advanced'}
              onClick={() => {
                if (!user) {
                  sileo.show({
                    title: 'Cargando',
                    description: 'Inicia sesión para acceder al modo avanzado',
                  });
                  return;
                }
                setFormType('advanced');
              }}
            >
              Avanzado {user ? '' : '🔒'}
            </ModeButton>
          </ModeSelector>

          {formType === 'basic' ? (
            <WizardForm mode="basic" onSubmit={(data) => handleBasicSubmit(data as BasicFormData)} isLoading={false} />
          ) : (
            <WizardForm mode="advanced" onSubmit={(data) => handleAdvancedSubmit(data as AdvancedFormData)} isLoading={false} />
          )}
        </>
      )}

      {step === 'loading' && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <PalaRotatingScene isComplete={false} />
        </div>
      )}

      {step === 'completing' && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <PalaRotatingScene isComplete={true} />
          <h2 style={{ marginTop: '2rem', color: '#16a34a' }}>¡Análisis completado!</h2>
        </div>
      )}

      {step === 'result' && result && (
        <RecommendationResult
          result={result}
          onReset={handleReset}
          onSave={handleSave}
          canSave={!!user}
          isSaving={isSaving}
        />
      )}
    </PageContainer>
  );
};
