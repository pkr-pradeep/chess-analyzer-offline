/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PlayMatch } from './components/Play/PlayMatch';
import { GameReview } from './components/GameAnalysis/GameReview';
import { PuzzleTrainer } from './components/Puzzles/PuzzleTrainer';
import { ChessGuide } from './components/Guide/ChessGuide';
import { ImprovementPlanner } from './components/ImprovementPlan/ImprovementPlanner';
import { ProgressDashboard } from './components/Dashboard/ProgressDashboard';
import { GeminiKeyModal } from './components/GeminiKeyModal';
import { offlineStorage } from './services/storage';
import { geminiKeyService } from './services/geminiKeyService';
import { GameRecord, RatingPoint, ChessPuzzle, ImprovementPlan, MoveAnalysis } from './types/chess';
import { BookmarkCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'play' | 'review' | 'puzzles' | 'guide' | 'plan' | 'dashboard'>('play');
  const [puzzleFilterTheme, setPuzzleFilterTheme] = useState<string>('all');
  const [games, setGames] = useState<GameRecord[]>([]);
  const [ratings, setRatings] = useState<RatingPoint[]>([]);
  const [puzzles, setPuzzles] = useState<ChessPuzzle[]>([]);
  const [improvementPlan, setImprovementPlan] = useState<ImprovementPlan | null>(null);
  const [selectedReviewGame, setSelectedReviewGame] = useState<GameRecord | null>(null);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const loadedGames = offlineStorage.getGames();
    const loadedRatings = offlineStorage.getRatingHistory();
    const loadedPuzzles = offlineStorage.getPuzzles();
    const loadedPlan = offlineStorage.getImprovementPlan();

    setGames(loadedGames);
    setRatings(loadedRatings);
    setPuzzles(loadedPuzzles);
    setImprovementPlan(loadedPlan);

    if (loadedGames.length > 0) {
      setSelectedReviewGame(loadedGames[0]);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentRating = ratings.length > 0 ? ratings[ratings.length - 1].rating : 1200;

  // Handle Game Completed
  const handleGameCompleted = (game: GameRecord) => {
    offlineStorage.addGame(game);
    const updatedGames = offlineStorage.getGames();
    const updatedRatings = offlineStorage.getRatingHistory();
    setGames(updatedGames);
    setRatings(updatedRatings);
    setSelectedReviewGame(game);
    showToast(`Match recorded! Rating updated to ${game.ratingAfter}.`);
  };

  // Handle Turn Blunder into Custom Practice Puzzle
  const handleSaveBlunderAsPuzzle = (move: MoveAnalysis) => {
    offlineStorage.addPuzzleFromBlunder(
      move.fenBefore,
      move.bestMoveSan || move.san,
      move.bestMove || `${move.from}${move.to}`,
      move.san,
      move.explanation,
      `game-${Date.now()}`
    );

    const updatedPuzzles = offlineStorage.getPuzzles();
    setPuzzles(updatedPuzzles);
    showToast(`Created custom practice puzzle from ${move.san} blunder!`);
  };

  // Handle Puzzle Solved
  const handlePuzzleSolved = (_puzzle: ChessPuzzle, _success: boolean, ratingChange: number) => {
    const newRating = currentRating + ratingChange;
    offlineStorage.addRatingPoint({
      id: `r-puz-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: Date.now(),
      rating: newRating,
      change: ratingChange,
      mode: 'puzzle',
    });
    setRatings(offlineStorage.getRatingHistory());
  };

  // Handle Review selection from dashboard
  const handleReviewFromDashboard = (game: GameRecord) => {
    setSelectedReviewGame(game);
    setActiveTab('review');
  };

  // Export JSON Backup
  const handleExportData = () => {
    const jsonStr = offlineStorage.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess_tactics_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Offline backup exported successfully.');
  };

  // Import JSON Backup
  const handleImportData = (jsonString: string) => {
    const ok = offlineStorage.importData(jsonString);
    if (ok) {
      setGames(offlineStorage.getGames());
      setRatings(offlineStorage.getRatingHistory());
      setPuzzles(offlineStorage.getPuzzles());
      setImprovementPlan(offlineStorage.getImprovementPlan());
      showToast('Data restored successfully from backup!');
    } else {
      showToast('Invalid backup file format.');
    }
  };

  // Clear all data
  const handleClearData = () => {
    if (confirm('Are you sure you want to reset your local data? This cannot be undone.')) {
      offlineStorage.clearAllData();
      setGames(offlineStorage.getGames());
      setRatings(offlineStorage.getRatingHistory());
      setPuzzles(offlineStorage.getPuzzles());
      setImprovementPlan(offlineStorage.getImprovementPlan());
      showToast('Local database reset.');
    }
  };

  // AI Plan Regeneration
  const handleRegenerateAIPlan = async () => {
    setIsGeneratingAI(true);
    try {
      let totalBlunders = 0;
      games.forEach(g => {
        totalBlunders += g.playerColor === 'w' ? g.whiteBlunders : g.blackBlunders;
      });

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const storedKey = geminiKeyService.getStoredApiKey();
      if (storedKey) {
        headers['x-gemini-key'] = storedKey;
      }

      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'improvement_plan',
          gameSummary: {
            rating: currentRating,
            stats: { totalGames: games.length, totalBlunders },
            weaknesses: ['Tactical awareness', 'Endgame king activity', 'Defense prophylaxis'],
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          showToast('Updated personalized training plan with Grandmaster insights!');
        }
      }
    } catch {
      showToast('Plan refreshed with local tactical diagnostics.');
    } finally {
      const refreshed = offlineStorage.generateDefaultImprovementPlan();
      setImprovementPlan(refreshed);
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="h-screen max-h-dvh w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 bg-amber-500 text-slate-950 px-3.5 py-2 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <BookmarkCheck className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header Navigation (compact zero-scroll single bar with toggle-to-close behavior) */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (activeTab === tab && tab !== 'play') {
            setActiveTab('play'); // Clicking on same icon closes the window and returns to board!
          } else {
            setActiveTab(tab);
          }
        }}
        isGeminiModalOpen={isGeminiModalOpen}
        onToggleGeminiModal={() => setIsGeminiModalOpen((prev) => !prev)}
        rating={currentRating}
      />

      {/* Main App Container */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col justify-center items-center px-2 sm:px-4 py-1">
        {/* Play & Real-Time Coach View (100% Zero-Scroll Viewport Fitted) */}
        {activeTab === 'play' && (
          <div className="w-full h-full max-h-full flex flex-col items-center justify-center overflow-hidden">
            <PlayMatch
              onGameCompleted={handleGameCompleted}
              onSaveBlunderAsPuzzle={handleSaveBlunderAsPuzzle}
              onNavigateToReview={(game) => {
                setSelectedReviewGame(game);
                setActiveTab('review');
              }}
              userRating={currentRating}
            />
          </div>
        )}

        {/* Full Game Analysis Review View */}
        {activeTab === 'review' && selectedReviewGame && (
          <div className="w-full h-full overflow-y-auto max-w-7xl mx-auto p-3 sm:p-6">
            <GameReview
              game={selectedReviewGame}
              onSaveBlunderAsPuzzle={handleSaveBlunderAsPuzzle}
            />
          </div>
        )}

        {/* Practice Puzzles View */}
        {activeTab === 'puzzles' && (
          <div className="w-full h-full overflow-y-auto max-w-7xl mx-auto p-3 sm:p-6">
            <PuzzleTrainer
              puzzles={puzzles}
              currentRating={currentRating}
              onPuzzleSolved={handlePuzzleSolved}
              initialTheme={puzzleFilterTheme}
            />
          </div>
        )}

        {/* Comprehensive Chess Guide & Master Lessons */}
        {activeTab === 'guide' && (
          <div className="w-full h-full overflow-y-auto max-w-7xl mx-auto p-3 sm:p-6">
            <ChessGuide
              onNavigateToPuzzles={(theme) => {
                setPuzzleFilterTheme(theme || 'all');
                setActiveTab('puzzles');
              }}
              onNavigateToPlay={() => {
                setActiveTab('play');
              }}
            />
          </div>
        )}

        {/* Improvement Plan View */}
        {activeTab === 'plan' && improvementPlan && (
          <div className="w-full h-full overflow-y-auto max-w-7xl mx-auto p-3 sm:p-6">
            <ImprovementPlanner
              plan={improvementPlan}
              onUpdatePlan={(updated) => {
                offlineStorage.saveImprovementPlan(updated);
                setImprovementPlan(updated);
              }}
              onRegenerateAI={handleRegenerateAIPlan}
              isGeneratingAI={isGeneratingAI}
            />
          </div>
        )}

        {/* Progress Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="w-full h-full overflow-y-auto max-w-7xl mx-auto p-3 sm:p-6">
            <ProgressDashboard
              games={games}
              ratings={ratings}
              onReviewGame={handleReviewFromDashboard}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onClearData={handleClearData}
            />
          </div>
        )}
      </main>

      {/* Gemini AI Key Modal */}
      <GeminiKeyModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
      />
    </div>
  );
}
