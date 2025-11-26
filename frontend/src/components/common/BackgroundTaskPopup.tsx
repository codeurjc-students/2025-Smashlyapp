import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMinimize2, FiCpu, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useBackgroundTasks, TaskType, BackgroundTask } from '../../contexts/BackgroundTasksContext';

const PopupContainer = styled(motion.div)<{ $minimized: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: ${props => props.$minimized ? '80px' : '500px'};
  height: ${props => props.$minimized ? '80px' : 'auto'};
  background: white;
  border-radius: ${props => props.$minimized ? '50%' : '20px'};
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: ${props => props.$minimized ? 'visible' : 'hidden'};
  border: ${props => props.$minimized ? 'none' : '2px solid #e5e7eb'};
  cursor: ${props => props.$minimized ? 'pointer' : 'default'};
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
`;

const CircularProgress = styled.svg<{ $status: string }>`
  position: absolute;
  top: -4px;
  left: -4px;
  width: 88px;
  height: 88px;
  transform: rotate(-90deg);
  filter: drop-shadow(0 0 8px rgba(22, 163, 74, 0.3));
  
  circle {
    fill: none;
    stroke-width: 4;
    stroke-linecap: round;
  }
  
  .background {
    stroke: rgba(229, 231, 235, 0.3);
  }
  
  .progress {
    stroke: ${props => 
      props.$status === 'completed' ? '#16a34a' :
      props.$status === 'error' ? '#dc2626' :
      'url(#animatedGradient)'
    };
    stroke-dasharray: 251.2;
    stroke-dashoffset: 251.2;
    transition: stroke-dashoffset 0.5s ease;
  }
`;

const MinimizedContent = styled.div<{ $status: string }>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => 
    props.$status === 'completed' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' :
    props.$status === 'error' ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' :
    '#f3f4f6'
  };
  border-radius: 50%;
  color: ${props => props.$status === 'running' ? '#6b7280' : 'white'};
  position: relative;
  z-index: 1;
  border: ${props => props.$status === 'running' ? '3px solid #16a34a' : 'none'};
`;

const MinimizedIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: -2px;
`;

const MinimizedLabel = styled.div`
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  margin-top: 4px;
  letter-spacing: 0.3px;
`;

const CompletionBadge = styled(motion.div)`
  position: absolute;
  top: -5px;
  right: -5px;
  width: 24px;
  height: 24px;
  background: #16a34a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4);
  border: 2px solid white;
`;

const Header = styled.div<{ $minimized: boolean; $status: string }>`
  display: ${props => props.$minimized ? 'none' : 'flex'};
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${props => 
    props.$status === 'completed' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' :
    props.$status === 'error' ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' :
    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  };
  color: white;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

const Subtitle = styled.p<{ $minimized: boolean }>`
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.9;
  display: ${props => props.$minimized ? 'none' : 'block'};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Content = styled(motion.div)`
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
`;

const ProgressSection = styled.div`
  margin-bottom: 20px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
  border-radius: 4px;
`;

const ProgressText = styled.p`
  font-size: 0.9rem;
  color: #6b7280;
  margin: 8px 0 0 0;
`;

const ResultSection = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
`;

const ResultTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ViewResultButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(22, 163, 74, 0.3);
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #991b1b;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskItem = styled.div`
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px;
  border-left: 4px solid #16a34a;
`;

const TaskInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TaskName = styled.p`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
`;

const TaskStatus = styled.span<{ $status: string }>`
  font-size: 0.8rem;
  color: ${props => 
    props.$status === 'completed' ? '#16a34a' :
    props.$status === 'error' ? '#dc2626' :
    '#3b82f6'
  };
  font-weight: 600;
`;

const SpinnerIcon = styled(motion.div)`
  display: inline-block;
`;

const getTaskTitle = (type: TaskType): string => {
  switch (type) {
    case 'comparison':
      return 'Comparando Palas';
    case 'recommendation':
      return 'Buscando Recomendación';
    default:
      return 'Procesando';
  }
};

const getTaskSubtitle = (task: BackgroundTask): string => {
  if (task.status === 'completed') {
    return 'Tarea completada';
  }
  if (task.status === 'error') {
    return 'Error en la tarea';
  }
  if (task.type === 'comparison' && task.metadata?.racketNames) {
    return `Comparando ${task.metadata.racketNames.length} palas`;
  }
  return 'Procesando...';
};

export const BackgroundTaskPopup: React.FC = () => {
  const { tasks, activeTask, dismissTask } = useBackgroundTasks();
  const [minimized, setMinimized] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Mostrar popup cuando hay una tarea activa
  useEffect(() => {
    if (activeTask) {
      setShowPopup(true);
      setMinimized(true);
    } else {
      setShowPopup(false);
    }
  }, [activeTask]);

  // Efecto de pulso cuando está minimizado y hay una tarea completada
  useEffect(() => {
    if (minimized && activeTask?.status === 'completed') {
      const interval = setInterval(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [minimized, activeTask]);

  // Mostrar popup solo si hay tareas
  const visibleTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

  if (!visibleTask || !showPopup) {
    return null;
  }

  const handleClose = () => {
    if (visibleTask.status !== 'running') {
      dismissTask(visibleTask.id);
    }
  };

  const handleToggleMinimize = () => {
    setMinimized(!minimized);
  };

  const handleViewResult = () => {
    // La lógica de navegación se manejará desde las páginas
    dismissTask(visibleTask.id);
  };

  const getStatusIcon = () => {
    if (visibleTask.status === 'completed') {
      return <FiCheckCircle size={20} />;
    }
    if (visibleTask.status === 'error') {
      return <FiAlertCircle size={20} />;
    }
    return (
      <SpinnerIcon
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <FiCpu size={20} />
      </SpinnerIcon>
    );
  };

  const getTaskIcon = () => {
    return <FiCpu size={28} />;
  };

  const getTaskLabel = () => {
    if (visibleTask.type === 'comparison') {
      return 'Comparar';
    }
    return 'Recomendar';
  };

  const circumference = 2 * Math.PI * 40; // radio = 40
  const progressOffset = circumference - (circumference * (visibleTask.progress || 0)) / 100;

  return (
    <AnimatePresence>
      <PopupContainer
        $minimized={minimized}
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: pulse ? 1.1 : 1,
        }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={minimized ? handleToggleMinimize : undefined}
      >
        {minimized ? (
          <>
            {/* SVG de progreso circular */}
            {visibleTask.status === 'running' && (
              <CircularProgress $status={visibleTask.status}>
                <defs>
                  <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#16a34a">
                      <animate
                        attributeName="stop-color"
                        values="#16a34a; #22c55e; #4ade80; #22c55e; #16a34a"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </stop>
                    <stop offset="50%" stopColor="#22c55e">
                      <animate
                        attributeName="stop-color"
                        values="#22c55e; #4ade80; #16a34a; #4ade80; #22c55e"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </stop>
                    <stop offset="100%" stopColor="#4ade80">
                      <animate
                        attributeName="stop-color"
                        values="#4ade80; #16a34a; #22c55e; #16a34a; #4ade80"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </stop>
                  </linearGradient>
                </defs>
                <circle className="background" cx="44" cy="44" r="40" />
                <motion.circle
                  className="progress"
                  cx="44"
                  cy="44"
                  r="40"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ 
                    strokeDashoffset: progressOffset
                  }}
                  transition={{ 
                    strokeDashoffset: { duration: 0.5 }
                  }}
                  style={{ 
                    strokeDasharray: circumference,
                    strokeDashoffset: progressOffset
                  }}
                />
              </CircularProgress>
            )}

            {/* Contenido del círculo minimizado */}
            <MinimizedContent $status={visibleTask.status}>
              <MinimizedIcon
                animate={visibleTask.status === 'running' ? { 
                  rotate: 360
                } : visibleTask.status === 'completed' ? {
                  scale: [1, 1.2, 1]
                } : {}}
                transition={visibleTask.status === 'running' ? { 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: 'linear' 
                } : {
                  duration: 0.5
                }}
              >
                {getTaskIcon()}
              </MinimizedIcon>
              <MinimizedLabel>{getTaskLabel()}</MinimizedLabel>
            </MinimizedContent>

            {/* Badge de completado */}
            {visibleTask.status === 'completed' && (
              <CompletionBadge
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <FiCheckCircle size={14} />
              </CompletionBadge>
            )}
          </>
        ) : (
          <>
            <Header
              $minimized={minimized}
              $status={visibleTask.status}
            >
              <HeaderLeft>
                {getStatusIcon()}
                <HeaderTitle>
                  <Title>{getTaskTitle(visibleTask.type)}</Title>
                  <Subtitle $minimized={minimized}>{getTaskSubtitle(visibleTask)}</Subtitle>
                </HeaderTitle>
              </HeaderLeft>
              <HeaderActions>
                <IconButton onClick={handleToggleMinimize}>
                  <FiMinimize2 size={16} />
                </IconButton>
                {visibleTask.status !== 'running' && (
                  <IconButton onClick={handleClose}>
                    <FiX size={16} />
                  </IconButton>
                )}
              </HeaderActions>
            </Header>

            <Content>
              {visibleTask.status === 'running' && (
                <ProgressSection>
                  <ProgressBar>
                    <ProgressFill
                      initial={{ width: '0%' }}
                      animate={{ width: `${visibleTask.progress || 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </ProgressBar>
                  <ProgressText>
                    {visibleTask.progress || 0}% completado
                  </ProgressText>
                </ProgressSection>
              )}

              {visibleTask.status === 'completed' && (
                <ResultSection>
                  <ResultTitle>
                    <FiCheckCircle color="#16a34a" />
                    ¡Análisis Completado!
                  </ResultTitle>
                  <ViewResultButton onClick={handleViewResult}>
                    Ver Resultado
                  </ViewResultButton>
                </ResultSection>
              )}

              {visibleTask.status === 'error' && (
                <ErrorMessage>
                  <FiAlertCircle />
                  {visibleTask.error || 'Ha ocurrido un error durante el procesamiento'}
                </ErrorMessage>
              )}

              {/* Mostrar tareas anteriores si las hay */}
              {tasks.length > 1 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '12px' }}>
                    Tareas Recientes
                  </h4>
                  <TaskList>
                    {tasks.slice(0, -1).reverse().slice(0, 3).map((task: BackgroundTask) => (
                      <TaskItem key={task.id}>
                        <TaskInfo>
                          <TaskName>{getTaskTitle(task.type)}</TaskName>
                          <TaskStatus $status={task.status}>
                            {task.status === 'completed' ? 'Completada' :
                             task.status === 'error' ? 'Error' :
                             'En proceso'}
                          </TaskStatus>
                        </TaskInfo>
                      </TaskItem>
                    ))}
                  </TaskList>
                </div>
              )}
            </Content>
          </>
        )}
      </PopupContainer>
    </AnimatePresence>
  );
};
