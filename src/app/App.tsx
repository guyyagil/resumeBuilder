import React from 'react';
import { useAppStore } from '../store';
import { WelcomeScreen } from '../features/welcome/components/WelcomeScreen';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { LoadingScreen } from '../shared/components/feedback/LoadingScreen';
import { ErrorScreen } from '../shared/components/feedback/ErrorScreen';

export const App: React.FC = () => {
  const phase = useAppStore(state => state.phase);
  
  switch (phase) {
    case 'welcome':
      return <WelcomeScreen />;
    
    case 'processing':
      return <LoadingScreen />;
    
    case 'active':
      return <AppLayout />;
    
    case 'error':
      return <ErrorScreen />;
    
    default:
      return <WelcomeScreen />;
  }
};