import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Crown, Trophy, Palette } from 'lucide-react';

const MultiplayerWordSearch = () => {
  // Game state
  const [gameState, setGameState] = useState({
    grid: [],
    words: [],
    foundWords: new Map(), // word -> {userId, color, timestamp}
    players: new Map(), // userId -> {name, color, isLeader}
    gameId: null,
    isLoading: true
  });

  // User state
  const [user, setUser] = useState({
    id: null,
    name: '',
    color: '#ff4757',
    isAuthenticated: false
  });

  // Canvas state
  const canvasRef = useRef(null);
  const [canvasState, setCanvasState] = useState({
    scrollX: 0,
    scrollY: 0,
    cellSize: 25,
    isDrawing: false,
    startCell: null,
    currentPath: []
  });

  // Team management
  const [teamState, setTeamState] = useState({
    showTeamModal: false,
    teamCode: '',
    isCreatingTeam: false
  });

  // Mock API calls (replace with actual backend endpoints)
  const api = {
    // Authentication
    login: async (name) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { id: userId, name, color: user.color };
    },

    // Game management
    createGame: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const gameId = `game_${Date.now()}`;
      const mockGrid = generateMockGrid();
      const mockWords = ['REACT', 'MYSQL', 'CANVAS', 'TEAM', 'GAME', 'CODE', 'WEB', 'APP'];
      
      return {
        gameId,
        grid: mockGrid,
        words: mockWords,
        foundWords: new Map(),
        players: new Map([[user.id, { name: user.name, color: user.color, isLeader: true }]])
      };
    },

    joinGame: async (gameId) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation, fetch game state from database
      const mockGrid = generateMockGrid();
      const mockWords = ['REACT', 'MYSQL', 'CANVAS', 'TEAM', 'GAME', 'CODE', 'WEB', 'APP'];
      
      return {
        gameId,
        grid: mockGrid,
        words: mockWords,
        foundWords: new Map(),
        players: new Map([
          [user.id, { name: user.name, color: user.color, isLeader: false }],
          ['other_user', { name: 'Teammate', color: '#3742fa', isLeader: true }]
        ])
      };
    },

    // Word finding
    submitFoundWord: async (word, path, gameId, userId) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      // In real implementation: INSERT INTO found_words (game_id, user_id, word, path, timestamp)
      return {
        success: true,
        word,
        userId,
        color: user.color,
        timestamp: Date.now()
      };
    },

    // Real-time updates (replace with WebSocket)
    subscribeToGame: (gameId, onUpdate) => {
      // Simulate real-time updates
      const interval = setInterval(() => {
        // Mock occasional updates from other players
        if (Math.random() < 0.1) {
          onUpdate({
            type: 'word_found',
            word: 'MOCK',
            userId: 'other_user',
            color: '#3742fa'
          });
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  };

  // Generate mock grid for demonstration
  function generateMockGrid() {
    const grid = Array(50).fill().map(() => Array(100).fill(''));
    const words = ['REACT', 'MYSQL', 'CANVAS', 'TEAM', 'GAME', 'CODE', 'WEB', 'APP'];
    
    // Place words randomly
    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 50) {
        const row = Math.floor(Math.random() * 50);
        const col = Math.floor(Math.random() * (100 - word.length));
        const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        
        if (canPlaceWord(grid, word, row, col, direction)) {
          placeWord(grid, word, row, col, direction);
          placed = true;
        }
        attempts++;
      }
    });

    // Fill empty spaces
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < 50; row++) {
      for (let col = 0; col < 100; col++) {
        if (grid[row][col] === '') {
          grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    return grid;
  }

  function canPlaceWord(grid, word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
      const newRow = direction === 'vertical' ? row + i : row;
      const newCol = direction === 'horizontal' ? col + i : col;
      
      if (newRow >= 50 || newCol >= 100) return false;
      if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== word[i]) return false;
    }
    return true;
  }

  function placeWord(grid, word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
      const newRow = direction === 'vertical' ? row + i : row;
      const newCol = direction === 'horizontal' ? col + i : col;
      grid[newRow][newCol] = word[i];
    }
  }

  // Authentication
  const handleLogin = async () => {
    if (!user.name.trim()) return;
    
    try {
      const userData = await api.login(user.name);
      setUser(prev => ({ ...prev, ...userData, isAuthenticated: true }));
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Game management
  const createNewGame = async () => {
    setTeamState(prev => ({ ...prev, isCreatingTeam: true }));
    
    try {
      const gameData = await api.createGame();
      setGameState(prev => ({ ...prev, ...gameData, isLoading: false }));
      setTeamState(prev => ({ ...prev, showTeamModal: false, isCreatingTeam: false }));
    } catch (error) {
      console.error('Failed to create game:', error);
      setTeamState(prev => ({ ...prev, isCreatingTeam: false }));
    }
  };

  const joinGame = async () => {
    if (!teamState.teamCode.trim()) return;
    
    try {
      const gameData = await api.joinGame(teamState.teamCode);
      setGameState(prev => ({ ...prev, ...gameData, isLoading: false }));
      setTeamState(prev => ({ ...prev, showTeamModal: false, teamCode: '' }));
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  // Canvas drawing functions
  const getCellFromMouse = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor((x / canvasState.cellSize) + canvasState.scrollX);
    const row = Math.floor((y / canvasState.cellSize) + canvasState.scrollY);
    
    if (row >= 0 && row < 50 && col >= 0 && col < 100) {
      return [row, col];
    }
    return null;
  }, [canvasState.cellSize, canvasState.scrollX, canvasState.scrollY]);

  const startDrawing = useCallback((e) => {
    const cell = getCellFromMouse(e);
    if (cell) {
      setCanvasState(prev => ({
        ...prev,
        isDrawing: true,
        startCell: cell,
        currentPath: [cell]
      }));
    }
  }, [getCellFromMouse]);

  const continueDrawing = useCallback((e) => {
    if (!canvasState.isDrawing) return;
    
    const cell = getCellFromMouse(e);
    if (cell && isValidPath(canvasState.startCell, cell)) {
      const path = getPathBetweenCells(canvasState.startCell, cell);
      setCanvasState(prev => ({ ...prev, currentPath: path }));
    }
  }, [canvasState.isDrawing, canvasState.startCell, getCellFromMouse]);

  const endDrawing = useCallback(async () => {
    if (canvasState.isDrawing && canvasState.currentPath.length > 1) {
      await checkForWord();
    }
    setCanvasState(prev => ({
      ...prev,
      isDrawing: false,
      startCell: null,
      currentPath: []
    }));
  }, [canvasState.isDrawing, canvasState.currentPath]);

  const isValidPath = (start, end) => {
    const [startRow, startCol] = start;
    const [endRow, endCol] = end;
    
    const deltaRow = endRow - startRow;
    const deltaCol = endCol - startCol;
    
    return deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol);
  };

  const getPathBetweenCells = (start, end) => {
    const [startRow, startCol] = start;
    const [endRow, endCol] = end;
    const path = [];
    
    const deltaRow = endRow - startRow;
    const deltaCol = endCol - startCol;
    const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
    
    const stepRow = steps === 0 ? 0 : deltaRow / steps;
    const stepCol = steps === 0 ? 0 : deltaCol / steps;
    
    for (let i = 0; i <= steps; i++) {
      const row = Math.round(startRow + stepRow * i);
      const col = Math.round(startCol + stepCol * i);
      path.push([row, col]);
    }
    
    return path;
  };

  const checkForWord = async () => {
    const pathString = canvasState.currentPath.map(([row, col]) => gameState.grid[row][col]).join('');
    const reversePathString = pathString.split('').reverse().join('');
    
    for (let word of gameState.words) {
      if ((pathString === word || reversePathString === word) && 
          !gameState.foundWords.has(word)) {
        
        try {
          const result = await api.submitFoundWord(word, canvasState.currentPath, gameState.gameId, user.id);
          if (result.success) {
            setGameState(prev => ({
              ...prev,
              foundWords: new Map(prev.foundWords.set(word, {
                userId: result.userId,
                color: result.color,
                timestamp: result.timestamp
              }))
            }));
          }
        } catch (error) {
          console.error('Failed to submit word:', error);
        }
        break;
      }
    }
  };

  // Canvas drawing
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState.grid.length) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const visibleCols = Math.ceil(canvas.width / canvasState.cellSize);
    const visibleRows = Math.ceil(canvas.height / canvasState.cellSize);
    
    // Draw grid and letters
    for (let row = 0; row < visibleRows && (row + canvasState.scrollY) < 50; row++) {
      for (let col = 0; col < visibleCols && (col + canvasState.scrollX) < 100; col++) {
        const actualRow = row + canvasState.scrollY;
        const actualCol = col + canvasState.scrollX;
        const x = col * canvasState.cellSize;
        const y = row * canvasState.cellSize;
        
        // Draw cell background for found words
        gameState.foundWords.forEach((foundInfo, word) => {
          // This is simplified - in real implementation, store cell positions for each word
          ctx.fillStyle = foundInfo.color + '40';
        });
        
        // Draw cell border
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, canvasState.cellSize, canvasState.cellSize);
        
        // Draw letter
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          gameState.grid[actualRow][actualCol],
          x + canvasState.cellSize / 2,
          y + canvasState.cellSize / 2
        );
      }
    }
    
    // Draw current selection
    if (canvasState.isDrawing && canvasState.currentPath.length > 0) {
      ctx.fillStyle = user.color + '60';
      
      for (let [row, col] of canvasState.currentPath) {
        const x = (col - canvasState.scrollX) * canvasState.cellSize;
        const y = (row - canvasState.scrollY) * canvasState.cellSize;
        
        if (x >= -canvasState.cellSize && x < canvas.width && 
            y >= -canvasState.cellSize && y < canvas.height) {
          ctx.fillRect(x, y, canvasState.cellSize, canvasState.cellSize);
        }
      }
    }
  }, [gameState.grid, gameState.foundWords, canvasState, user.color]);

  // Scroll functions
  const scrollGrid = (direction) => {
    const scrollAmount = 5;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const visibleCols = Math.floor(canvas.width / canvasState.cellSize);
    const visibleRows = Math.floor(canvas.height / canvasState.cellSize);
    const maxScrollX = Math.max(0, 100 - visibleCols);
    const maxScrollY = Math.max(0, 50 - visibleRows);
    
    setCanvasState(prev => {
      let newScrollX = prev.scrollX;
      let newScrollY = prev.scrollY;
      
      switch(direction) {
        case 'up':
          newScrollY = Math.max(0, prev.scrollY - scrollAmount);
          break;
        case 'down':
          newScrollY = Math.min(maxScrollY, prev.scrollY + scrollAmount);
          break;
        case 'left':
          newScrollX = Math.max(0, prev.scrollX - scrollAmount);
          break;
        case 'right':
          newScrollX = Math.min(maxScrollX, prev.scrollX + scrollAmount);
          break;
      }
      
      return { ...prev, scrollX: newScrollX, scrollY: newScrollY };
    });
  };

  // Effects
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    if (gameState.gameId) {
      const unsubscribe = api.subscribeToGame(gameState.gameId, (update) => {
        if (update.type === 'word_found') {
          setGameState(prev => ({
            ...prev,
            foundWords: new Map(prev.foundWords.set(update.word, {
              userId: update.userId,
              color: update.color,
              timestamp: Date.now()
            }))
          }));
        }
      });

      return unsubscribe;
    }
  }, [gameState.gameId]);

  // Touch event handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = { clientX: touch.clientX, clientY: touch.clientY };
    startDrawing(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = { clientX: touch.clientX, clientY: touch.clientY };
    continueDrawing(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    endDrawing();
  };

  // Render login screen
  if (!user.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🔍 Word Search</h1>
            <p className="text-gray-600">Enter your name to start playing</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={user.name}
              onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            
            <div className="flex items-center gap-3">
              <Palette className="text-gray-600" size={20} />
              <input
                type="color"
                value={user.color}
                onChange={(e) => setUser(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <span className="text-gray-600">Your color</span>
            </div>
            
            <button
              onClick={handleLogin}
              disabled={!user.name.trim()}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render team selection screen
  if (!gameState.gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user.name}!</h1>
            <p className="text-gray-600">Create or join a team</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={createNewGame}
              disabled={teamState.isCreatingTeam}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Crown size={20} />
              Create New Team
            </button>
            
            <div className="text-center text-gray-500">or</div>
            
            <input
              type="text"
              placeholder="Team code"
              value={teamState.teamCode}
              onChange={(e) => setTeamState(prev => ({ ...prev, teamCode: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            
            <button
              onClick={joinGame}
              disabled={!teamState.teamCode.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Join Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render main game
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🔍 Multiplayer Word Search</h1>
              <p className="text-gray-600">Game ID: {gameState.gameId}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Team members */}
              <div className="flex -space-x-2">
                {Array.from(gameState.players.entries()).map(([playerId, player]) => (
                  <div
                    key={playerId}
                    className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: player.color }}
                    title={player.name}
                  >
                    {player.name[0].toUpperCase()}
                    {player.isLeader && <Crown size={12} className="absolute -top-1 -right-1" />}
                  </div>
                ))}
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Found Words</div>
                <div className="text-2xl font-bold text-purple-600">
                  {gameState.foundWords.size} / {gameState.words.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Controls */}
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Palette size={20} className="text-gray-600" />
                  <input
                    type="color"
                    value={user.color}
                    onChange={(e) => setUser(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-gray-600">Your marking color</span>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => scrollGrid('up')} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">↑</button>
                  <button onClick={() => scrollGrid('down')} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">↓</button>
                  <button onClick={() => scrollGrid('left')} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">←</button>
                  <button onClick={() => scrollGrid('right')} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">→</button>
                </div>
              </div>

              {/* Canvas */}
              <div className="border border-gray-300 rounded-xl overflow-hidden relative">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="block cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={continueDrawing}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                  Row: {canvasState.scrollY + 1}, Col: {canvasState.scrollX + 1}
                </div>
              </div>
            </div>
          </div>

          {/* Word List & Stats */}
          <div className="space-y-6">
            {/* Word List */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy size={20} />
                Words to Find
              </h3>
              
              <div className="space-y-2">
                {gameState.words.map(word => {
                  const found = gameState.foundWords.get(word);
                  const foundBy = found ? gameState.players.get(found.userId) : null;
                  
                  return (
                    <div
                      key={word}
                      className={`p-3 rounded-lg transition-all ${
                        found 
                          ? 'bg-green-100 text-green-800 line-through' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{word}</span>
                        {found && foundBy && (
                          <div
                            className="w-6 h-6 rounded-full border border-white"
                            style={{ backgroundColor: foundBy.color }}
                            title={`Found by ${foundBy.name}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Stats */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Team Progress</h3>
              
              <div className="space-y-3">
                {Array.from(gameState.players.entries()).map(([playerId, player]) => {
                  const wordsFound = Array.from(gameState.foundWords.values())
                    .filter(found => found.userId === playerId).length;
                  
                  return (
                    <div key={playerId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{player.name}</span>
                        {player.isLeader && <Crown size={16} className="text-yellow-500" />}
                      </div>
                      <span className="text-lg font-bold text-purple-600">{wordsFound}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerWordSearch;
