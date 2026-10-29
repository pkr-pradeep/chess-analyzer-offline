import React, { useRef } from 'react';
import { GameRecord, RatingPoint } from '../../types/chess';
import { 
  Trophy, 
  TrendingUp, 
  CheckCircle, 
  ShieldAlert, 
  Download, 
  Upload, 
  Lock, 
  BarChart2, 
  Play, 
  Eye, 
  Award,
  Zap,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Area, 
  AreaChart 
} from 'recharts';

interface ProgressDashboardProps {
  games: GameRecord[];
  ratings: RatingPoint[];
  onReviewGame: (game: GameRecord) => void;
  onExportData: () => void;
  onImportData: (jsonString: string) => void;
  onClearData: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  games,
  ratings,
  onReviewGame,
  onExportData,
  onImportData,
  onClearData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute stats
  const currentRating = ratings.length > 0 ? ratings[ratings.length - 1].rating : 1200;
  const initialRating = ratings.length > 0 ? ratings[0].rating : 1200;
  const netRatingChange = currentRating - initialRating;

  const totalGames = games.length;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalAccuracy = 0;
  let totalBlunders = 0;

  games.forEach((g) => {
    const isPlayerWhite = g.playerColor === 'w';
    if (g.result === '1-0') {
      if (isPlayerWhite) wins++; else losses++;
    } else if (g.result === '0-1') {
      if (isPlayerWhite) losses++; else wins++;
    } else if (g.result === '1/2-1/2') {
      draws++;
    }

    const acc = isPlayerWhite ? g.whiteAccuracy : g.blackAccuracy;
    totalAccuracy += acc;
    totalBlunders += isPlayerWhite ? g.whiteBlunders : g.blackBlunders;
  });

  const avgAccuracy = totalGames > 0 ? Math.round(totalAccuracy / totalGames) : 82;
  const avgBlundersPerGame = totalGames > 0 ? (totalBlunders / totalGames).toFixed(1) : '1.2';
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  // Data for rating chart
  const ratingChartData = ratings.map((r, i) => ({
    date: r.date || `G${i + 1}`,
    rating: r.rating,
    accuracy: r.accuracy || 80,
  }));

  // Data for accuracy by game
  const accuracyChartData = [...games].reverse().slice(-8).map((g, i) => ({
    match: `Game ${i + 1}`,
    accuracy: g.playerColor === 'w' ? g.whiteAccuracy : g.blackAccuracy,
    blunders: g.playerColor === 'w' ? g.whiteBlunders : g.blackBlunders,
  }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="progress-dashboard-root" className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rating */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Current Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100">{currentRating}</span>
            <span className={`text-xs font-semibold ${netRatingChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netRatingChange >= 0 ? `+${netRatingChange}` : netRatingChange} overall
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Based on matches and tactical drills</p>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Win Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100">{winRate}%</span>
            <span className="text-xs text-slate-400">
              {wins}W / {losses}L / {draws}D
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{totalGames} logged matches</p>
        </div>

        {/* Avg Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Mean Accuracy</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100">{avgAccuracy}%</span>
            <span className="text-xs text-emerald-400 font-semibold">Solid Club Level</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Calculated via centipawn precision</p>
        </div>

        {/* Blunder Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Blunder Rate</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100">{avgBlundersPerGame}</span>
            <span className="text-xs text-emerald-400 font-semibold">↓ Decreasing</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Average blunders per game</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Progression LineChart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Rating Progression Over Time
            </h3>
            <span className="text-xs text-slate-500">Historical Trend</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis domain={['dataMin - 30', 'dataMax + 30']} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#F59E0B', stroke: '#0F172A', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Game Accuracy BarChart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Match Accuracy Percentage (%)
            </h3>
            <span className="text-xs text-slate-500">Recent Games</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="match" stroke="#64748B" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="accuracy" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Match History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-100">
            Recent Match Analysis & Replay
          </h3>
          <span className="text-xs text-slate-500">Click to step through full move analysis</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Matchup</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Your Accuracy</th>
                <th className="py-2.5 px-3">Blunders</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {games.map((g) => {
                const isWhite = g.playerColor === 'w';
                const accuracy = isWhite ? g.whiteAccuracy : g.blackAccuracy;
                const blunders = isWhite ? g.whiteBlunders : g.blackBlunders;
                const isWin = (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite);
                const isDraw = g.result === '1/2-1/2';

                return (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{g.date}</td>
                    <td className="py-3 px-3 text-slate-200 font-sans font-medium">
                      {g.whitePlayer} <span className="text-slate-500">vs</span> {g.blackPlayer}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isWin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isDraw ? 'bg-slate-800 text-slate-300' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {g.result}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-bold">{accuracy}%</td>
                    <td className="py-3 px-3">
                      <span className={blunders > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {blunders}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onReviewGame(g)}
                        className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg font-sans font-semibold flex items-center gap-1.5 ml-auto transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Analyze
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Privacy & Offline Data Vault */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Privacy-First Architecture & Data Ownership
                <span className="text-[10px] font-normal bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                  Zero Server Tracking
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                All your game records, tactical blunders, puzzle ratings, and improvement plans are persisted locally on your device in browser storage. Nothing is sold or tracked. You have full export and backup control at any time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Import Backup
            </button>
            <button
              onClick={onExportData}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={onClearData}
              className="text-xs text-slate-500 hover:text-rose-400 p-2 rounded-xl transition-colors"
              title="Reset local storage"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
