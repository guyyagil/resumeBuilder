import Layout from './components/Layout'
import WelcomeForm from './components/WelcomeForm'
import { useAppStore } from './store/useAppStore'

function App() {
  const { currentScreen } = useAppStore();

  if (currentScreen === 'welcome') {
    return <WelcomeForm />;
  }

  return <Layout userBasicInfo={null} />;
}

export default App