import React from 'react';
import { useAppStore } from './store/useAppStore';
import { WelcomeForm } from './components/Welcome/WelcomeForm';
import { MainLayout } from './components/Layout/MainLayout';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ErrorScreen } from './components/ErrorScreen';

export const App: React.FC = () => {
  const phase = useAppStore(state => state.phase);
  
  switch (phase) {
    case 'welcome':
      return <WelcomeForm />;
    
    case 'processing':
      return <ProcessingScreen />;
    
    case 'active':
      return <MainLayout />;
    
    case 'error':
      return <ErrorScreen />;
    
    default:
      return <WelcomeForm />;
  }
};