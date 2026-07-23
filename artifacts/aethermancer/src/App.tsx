import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import MainMenuPage from './pages/MainMenuPage';
import LobbyPage from './pages/LobbyPage';
import OptionsPage from './pages/OptionsPage';
import GamePage from './pages/GamePage';
import AchievementsPage from './pages/AchievementsPage';
import MultiplayerRoomsPage from './pages/MultiplayerRoomsPage';
import PreDraftPage from './pages/PreDraftPage';

import { LobbyProvider } from './context/LobbyContext';
import { GameProvider } from './context/GameContext';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainMenuPage} />
      <Route path="/lobby" component={LobbyPage} />
      <Route path="/multiplayer" component={MultiplayerRoomsPage} />
      <Route path="/options" component={OptionsPage} />
      <Route path="/pre-draft" component={PreDraftPage} />
      <Route path="/game" component={GamePage} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LobbyProvider>
          <GameProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
          </GameProvider>
        </LobbyProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
