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
    
    case 'editing':
      return <AppLayout />; // Show editing interface
    
    case 'designing':
      return <LoadingScreen />; // Show loading while generating design
    
    case 'active':
      return <AppLayout />; // Show final interface with design
    
    case 'error':
      return <ErrorScreen />;
    
    default:
      return <WelcomeScreen />;
  }
};