import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type TaskType = 'comparison' | 'recommendation';
export type TaskStatus = 'running' | 'completed' | 'error';

export interface BackgroundTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  progress?: number;
  result?: any;
  error?: string;
  metadata?: {
    racketNames?: string[];
    formData?: any;
  };
  originPage?: string; // Page where the task was initiated
  startedAt: Date;
  completedAt?: Date;
}

interface BackgroundTasksContextType {
  tasks: BackgroundTask[];
  activeTask: BackgroundTask | null;
  addTask: (type: TaskType, metadata?: BackgroundTask['metadata'], originPage?: string) => string;
  updateTaskProgress: (taskId: string, progress: number) => void;
  completeTask: (taskId: string, result: any) => void;
  failTask: (taskId: string, error: string) => void;
  dismissTask: (taskId: string) => void;
  clearTasks: () => void;
}

const BackgroundTasksContext = createContext<BackgroundTasksContextType | undefined>(undefined);

export const useBackgroundTasks = () => {
  const context = useContext(BackgroundTasksContext);
  if (!context) {
    throw new Error('useBackgroundTasks must be used within BackgroundTasksProvider');
  }
  return context;
};

interface BackgroundTasksProviderProps {
  children: ReactNode;
}

export const BackgroundTasksProvider: React.FC<BackgroundTasksProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);

  const addTask = useCallback(
    (type: TaskType, metadata?: BackgroundTask['metadata'], originPage?: string): string => {
      const taskId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newTask: BackgroundTask = {
        id: taskId,
        type,
        status: 'running',
        progress: 0,
        metadata,
        originPage,
        startedAt: new Date(),
      };
      setTasks(prev => [...prev, newTask]);
      return taskId;
    },
    []
  );

  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, progress } : task)));
  }, []);

  const completeTask = useCallback((taskId: string, result: any) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed' as TaskStatus,
              result,
              completedAt: new Date(),
              progress: 100,
            }
          : task
      )
    );
  }, []);

  const failTask = useCallback((taskId: string, error: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'error' as TaskStatus, error, completedAt: new Date() }
          : task
      )
    );
  }, []);

  const dismissTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  const activeTask = tasks.find(task => task.status === 'running') || null;

  const value: BackgroundTasksContextType = {
    tasks,
    activeTask,
    addTask,
    updateTaskProgress,
    completeTask,
    failTask,
    dismissTask,
    clearTasks,
  };

  return (
    <BackgroundTasksContext.Provider value={value}>{children}</BackgroundTasksContext.Provider>
  );
};
