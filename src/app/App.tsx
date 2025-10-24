import React from 'react';
import { useAppStore } from '../store';
import { AppLayout, ErrorScreen } from '../components';

export const App: React.FC = () => {
  const phase = useAppStore(state => state.phase);

  // Use unified AppLayout for all phases except error
  if (phase === 'error') {
    return <ErrorScreen />;
  }

  return <AppLayout />;
};