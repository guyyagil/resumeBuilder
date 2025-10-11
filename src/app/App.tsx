import React from 'react';
import { useAppStore } from '../store';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { ErrorScreen } from '../shared/components/feedback/ErrorScreen';

export const App: React.FC = () => {
  const phase = useAppStore(state => state.phase);

  // Use unified AppLayout for all phases except error
  if (phase === 'error') {
    return <ErrorScreen />;
  }

  return <AppLayout />;
};