import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DEFAULT_GAME_CONFIG } from '@core/constants/config.defaults';
import type { GameConfig } from '@core/types/config.types';
import type { GameState } from '@core/types/game.types';

import { hasSavedGame, loadGame, deleteSave, saveConfig, loadConfig } from './src/storage/gameStorage';
import StartScreen from './src/screens/StartScreen';
import GameScreen from './src/screens/GameScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import ConfigScreen from './src/screens/ConfigScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [hasSave, setHasSave] = useState(false);
  const [savedData, setSavedData] = useState<unknown>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [gameOverStats, setGameOverStats] = useState({ dayCount: 1, coins: 0 });

  useEffect(() => {
    Promise.all([hasSavedGame(), loadConfig()]).then(([has, cfg]) => {
      setHasSave(has);
      setGameConfig(cfg);
    });
  }, []);

  const handleNewGame = useCallback(async () => {
    await deleteSave();
    setSavedData(null);
    setGameState('playing');
  }, []);

  const handleContinue = useCallback(async () => {
    const state = await loadGame();
    if (state) {
      setSavedData(state);
      setGameState('playing');
    }
  }, []);

  const handleGameOver = useCallback((dayCount: number, coins: number) => {
    setGameOverStats({ dayCount, coins });
    setGameState('gameover');
  }, []);

  const handleRestart = useCallback(async () => {
    await deleteSave();
    setSavedData(null);
    setHasSave(false);
    setGameState('start');
  }, []);

  const handleSaveConfig = useCallback(async (cfg: GameConfig) => {
    setGameConfig(cfg);
    await saveConfig(cfg);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      {gameState === 'start' && (
        <StartScreen
          hasSave={hasSave}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onConfig={() => setShowConfig(true)}
        />
      )}
      {gameState === 'playing' && (
        <GameScreen
          gameConfig={gameConfig}
          savedData={savedData}
          onGameOver={handleGameOver}
        />
      )}
      {gameState === 'gameover' && (
        <GameOverScreen
          dayCount={gameOverStats.dayCount}
          coins={gameOverStats.coins}
          onRestart={handleRestart}
        />
      )}
      <ConfigScreen
        visible={showConfig}
        config={gameConfig}
        onSave={handleSaveConfig}
        onClose={() => setShowConfig(false)}
      />
    </>
  );
}
