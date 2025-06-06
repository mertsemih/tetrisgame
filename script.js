document.addEventListener('DOMContentLoaded', () => {
    // --- Element Seçimleri ---
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const piecesContainerEl = document.getElementById('pieces-container');
    const currentScoreValueEl = document.getElementById('current-score-value');
    const highScoreValueEl = document.getElementById('high-score-value');
    const gameOverOverlayEl = document.getElementById('game-over-overlay');
    const finalScoreEl = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    const comboMessageEl = document.getElementById('combo-message');
    const newRecordMessageEl = document.getElementById('new-record-message');
    const gameContainerEl = document.querySelector('.game-container');
    const sfxToggleButton = document.getElementById('sfx-toggle-button');
    const modeSelectionMenu = document.getElementById('mode-selection-menu');
    const modeButtons = document.querySelectorAll('.mode-button');
    const mainMenuButton = document.getElementById('main-menu-button');
    const inGameMenuButton = document.getElementById('in-game-menu-button');
    const statsButton = document.getElementById('stats-button');
    const statsOverlayEl = document.getElementById('stats-overlay');
    const statsCloseButton = document.getElementById('stats-close-button');
    const statsContentEl = document.getElementById('stats-content');
    const achievementToastEl = document.getElementById('achievement-unlocked-toast');

    // --- Ses Efektleri ---
    const SFX = {
        place: new Audio('sfx/place.wav'),
        clear: new Audio('sfx/clear.mp3'),
        combo: new Audio('sfx/combo.mp3'),
        gameOver: new Audio('sfx/game-over.mp3'),
        newRecord: new Audio('sfx/new-record.mp3'),
        click: new Audio('sfx/click.wav'),
        bomb: new Audio('sfx/bomba.mp3'),
        laser: new Audio('sfx/lazer.mp3')
    };

    // --- Oyun Sabitleri ve Değişkenleri ---
    const GRID_ROWS = 8;
    const GRID_COLS = 8;
    let CELL_SIZE = 40;
    const PREVIEW_CELL_SIZE = 14;
    const MAX_INITIAL_BLOCKS = 10;

    let grid = [];
    let score = 0;
    let highScore = 0;
    let availablePieces = [];
    let selectedPieceData = null;
    let selectedPieceElement = null;
    let dragOffsetX, dragOffsetY;
    let originalPieceIndexInAvailable = -1;
    let isGameOver = false;
    let isClearingLine = false;
    let isDragging = false;
    let isMuted = false;
    let highScoreJustBeaten = false;
    let ghostPiecePosition = null;
    let anticipatedLines = {
        rows: [],
        cols: []
    };
    let anticipationAnimationToggle = true;
    let anticipationInterval = null;
    let currentMode = 'klasik';
    let playerProfile = {};

    const COLORS = {
        empty: '#1e272e',
        gridLine: '#2c3e50',
        white: '#ecf0f1',
        ghost: 'rgba(236, 240, 241, 0.3)',
        clearAnimationColors: ['#e74c3c', '#f1c40f', '#2ecc71'],
        initialBlockColors: ['#16a085', '#27ae60', '#2980b9'],
        red: '#e74c3c',
        orange: '#f39c12',
        yellow: '#f1c40f',
        green: '#2ecc71',
        blue: '#3498db',
        purple: '#8e44ad',
        cyan: '#1abc9c',
        anticipationGlow: 'rgba(52, 152, 219, 0.7)',
        powerupBomb: '#34495e',
        powerupLaser: '#ecf0f1'
    };

    const PIECE_DEFINITIONS = [{
        id: 'I2',
        shape: [
            [0, 0],
            [1, 0]
        ],
        color: COLORS.red
    }, {
        id: 'I3',
        shape: [
            [0, 0],
            [1, 0],
            [2, 0]
        ],
        color: COLORS.orange
    }, {
        id: 'I4',
        shape: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0]
        ],
        color: COLORS.yellow
    }, {
        id: 'L3',
        shape: [
            [0, 0],
            [0, 1],
            [1, 1]
        ],
        color: COLORS.green
    }, {
        id: 'L4',
        shape: [
            [0, 0],
            [0, 1],
            [0, 2],
            [1, 2]
        ],
        color: COLORS.blue
    }, {
        id: 'O',
        shape: [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1]
        ],
        color: COLORS.purple
    }, {
        id: 'T',
        shape: [
            [0, 0],
            [1, 0],
            [2, 0],
            [1, 1]
        ],
        color: COLORS.orange
    }, {
        id: 'Z4',
        shape: [
            [0, 0],
            [1, 0],
            [1, 1],
            [2, 1]
        ],
        color: COLORS.red
    }, {
        id: 'S4',
        shape: [
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1]
        ],
        color: COLORS.green
    }, {
        id: 'SINGLE',
        shape: [
            [0, 0]
        ],
        color: COLORS.yellow
    }, {
        id: 'StairS',
        shape: [
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1]
        ],
        color: COLORS.green
    }, {
        id: 'Diag3',
        shape: [
            [0, 0],
            [1, 1],
            [2, 2]
        ],
        color: COLORS.blue
    }, {
        id: 'I5',
        shape: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [4, 0]
        ],
        color: COLORS.cyan
    }, {
        id: 'DOT_L',
        shape: [
            [0, 0],
            [0, 1],
            [1, 0]
        ],
        color: COLORS.blue
    }, ];

    const POWERUP_DEFINITIONS = [{
        id: 'BOMB',
        shape: [
            [0, 0]
        ],
        color: COLORS.powerupBomb,
        type: 'powerup',
        effect: 'bomb'
    }, {
        id: 'LAZER_ROW',
        shape: [
            [0, 0]
        ],
        color: COLORS.powerupLaser,
        type: 'powerup',
        effect: 'laser_row'
    }, {
        id: 'LAZER_COL',
        shape: [
            [0, 0]
        ],
        color: COLORS.powerupLaser,
        type: 'powerup',
        effect: 'laser_col'
    }];

    const COMBO_SCORES = {
        1: 100,
        2: 250,
        3: 450,
        4: 700,
        5: 1000,
        6: 1350,
        7: 1750,
        8: 2200,
        9: 2700,
        10: 3250,
        11: 3850,
        12: 4500,
        13: 5200,
        14: 5950,
        15: 6750,
        16: 7600
    };

    const ACHIEVEMENTS = {
        'REACH_5K_POINTS': {
            name: 'Skor Canavarı',
            description: 'Tek oyunda 5000 puana ulaş.',
            icon: '🎯',
            condition: (profile, gameData) => gameData.score >= 5000
        },
        'CLEAR_100_LINES': {
            name: 'Temizlik Ordusu',
            description: 'Toplamda 100 hat temizle.',
            icon: '🧹',
            condition: (profile, gameData) => profile.stats.totalLinesCleared >= 100
        },
        'MAKE_4_COMBO': {
            name: 'Kombo Ustası',
            description: 'Tek seferde 4\'lü kombo yap.',
            icon: '💥',
            condition: (profile, gameData) => gameData.linesCleared >= 4
        },
        'PLAY_10_GAMES': {
            name: 'Müptelası',
            description: 'Toplam 10 oyun oyna.',
            icon: '🎮',
            condition: (profile, gameData) => profile.stats.gamesPlayed >= 10
        }
    };

    // --- Veri Yönetimi ---
    function loadProfile() {
        const profileData = localStorage.getItem('blockPuzzleProfile');
        if (profileData) {
            playerProfile = JSON.parse(profileData);
        } else {
            playerProfile = {
                highScores: {
                    klasik: 0,
                    zen: 0,
                    arcane: 0
                },
                stats: {
                    gamesPlayed: 0,
                    totalLinesCleared: 0,
                    highestCombo: 0
                },
                achievements: {
                    'REACH_5K_POINTS': false,
                    'CLEAR_100_LINES': false,
                    'MAKE_4_COMBO': false,
                    'PLAY_10_GAMES': false
                }
            };
        }
    }

    function saveProfile() {
        localStorage.setItem('blockPuzzleProfile', JSON.stringify(playerProfile));
    }

    // --- Ses Fonksiyonları ---
    function playSound(sound) {
        if (isMuted) return;
        sound.currentTime = 0;
        sound.play();
    }

    function toggleMute() {
        isMuted = !isMuted;
        sfxToggleButton.textContent = isMuted ? '🔇' : '🔊';
        localStorage.setItem('blockGameMuted', isMuted);
    }

    // --- Başarım ve İstatistik Fonksiyonları ---
    function showAchievementToast(achievement) {
        if (!achievementToastEl) return;
        achievementToastEl.innerHTML = `🏆 Başarım Kazanıldı!<br><span>${achievement.name}</span>`;
        achievementToastEl.classList.add('show');
        setTimeout(() => {
            achievementToastEl.classList.remove('show');
        }, 4000);
    }

    function checkAchievements(gameData) {
        Object.keys(ACHIEVEMENTS).forEach(id => {
            if (!playerProfile.achievements[id] && ACHIEVEMENTS[id].condition(playerProfile, gameData)) {
                playerProfile.achievements[id] = true;
                saveProfile();
                showAchievementToast(ACHIEVEMENTS[id]);
            }
        });
    }

    function populateStatsModal() {
        const stats = playerProfile.stats;
        const highScores = playerProfile.highScores;
        statsContentEl.innerHTML = `
            <h3>📊 Genel İstatistikler</h3>
            <div class="stats-grid">
                <div class="stat-item"><div class="label">Oynanan Oyun</div><div class="value">${stats.gamesPlayed}</div></div>
                <div class="stat-item"><div class="label">Temizlenen Hat</div><div class="value">${stats.totalLinesCleared}</div></div>
                <div class="stat-item"><div class="label">En Yüksek Kombo</div><div class="value">${stats.highestCombo}</div></div>
            </div>
            <h3>⭐ Rekorlar</h3>
            <div class="stats-grid">
                <div class="stat-item"><div class="label">Klasik Mod</div><div class="value">${highScores.klasik}</div></div>
                <div class="stat-item"><div class="label">Zen Modu</div><div class="value">${highScores.zen}</div></div>
                <div class="stat-item"><div class="label">Arcane Mod</div><div class="value">${highScores.arcane}</div></div>
            </div>
            <h3>🏆 Başarımlar</h3>
        `;
        const achievementsList = document.createElement('div');
        Object.keys(ACHIEVEMENTS).forEach(id => {
            const achievement = ACHIEVEMENTS[id];
            const isUnlocked = playerProfile.achievements[id];
            const item = document.createElement('div');
            item.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
            item.innerHTML = `
                <div class="achievement-icon">${isUnlocked ? achievement.icon : '❓'}</div>
                <div class="achievement-details">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            `;
            achievementsList.appendChild(item);
        });
        statsContentEl.appendChild(achievementsList);
    }

    // --- Oyun Kurulum ve Çizim Fonksiyonları ---
    function calculateCellSize() {
        const gameWrapperEl = document.querySelector('.game-wrapper');
        let boardAreaWidth;
        if (!gameWrapperEl) {
            const gameContainerWidth = gameContainerEl.offsetWidth;
            boardAreaWidth = gameContainerWidth - 30 - 2;
        } else {
            const gameWrapperWidth = gameWrapperEl.offsetWidth;
            const containerPadding = 30;
            boardAreaWidth = gameWrapperWidth - containerPadding - 2;
        }
        const calculatedCellSize = Math.floor(boardAreaWidth / GRID_COLS);
        CELL_SIZE = Math.max(25, Math.min(45, calculatedCellSize));
        canvas.width = GRID_COLS * CELL_SIZE;
        canvas.height = GRID_ROWS * CELL_SIZE;
    }

    function initGrid() {
        grid = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            grid[r] = Array(GRID_COLS).fill(COLORS.empty);
        }
    }

    function addInitialRandomBlocksToGrid(numberOfBlocks) {
        let blocksPlaced = 0;
        let attempts = 0;
        while (blocksPlaced < numberOfBlocks && attempts < 200) {
            const r = Math.floor(Math.random() * GRID_ROWS);
            const c = Math.floor(Math.random() * GRID_COLS);
            if (grid[r][c] === COLORS.empty) {
                const randomColor = COLORS.initialBlockColors[Math.floor(Math.random() * COLORS.initialBlockColors.length)];
                grid[r][c] = randomColor;
                blocksPlaced++;
            }
            attempts++;
        }
    }

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                let isAnticipatedRow = anticipatedLines.rows.includes(r);
                let isAnticipatedCol = anticipatedLines.cols.includes(c);
                if (isDragging && (isAnticipatedRow || isAnticipatedCol) && anticipationAnimationToggle) {
                    ctx.fillStyle = COLORS.anticipationGlow;
                } else {
                    ctx.fillStyle = grid[r][c];
                }
                ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = COLORS.gridLine;
                ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
        if (ghostPiecePosition && selectedPieceData) {
            ctx.globalAlpha = 0.5;
            selectedPieceData.shape.forEach(p => {
                const r_ghost = ghostPiecePosition.r + p[1];
                const c_ghost = ghostPiecePosition.c + p[0];
                ctx.fillStyle = selectedPieceData.color;
                ctx.fillRect(c_ghost * CELL_SIZE, r_ghost * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            });
            ctx.globalAlpha = 1.0;
        }
    }

    // --- Parça Yönetim Fonksiyonları ---
    function getRandomPieceDefinition() {
        return PIECE_DEFINITIONS[Math.floor(Math.random() * PIECE_DEFINITIONS.length)];
    }

    function generateUpcomingPieces() {
        availablePieces = [];
        for (let i = 0; i < 3; i++) {
            if (currentMode === 'arcane' && Math.random() < 0.50) {
                availablePieces.push(POWERUP_DEFINITIONS[Math.floor(Math.random() * POWERUP_DEFINITIONS.length)]);
            } else {
                availablePieces.push(getRandomPieceDefinition());
            }
        }
        displayAvailablePieces();
    }

    function displayAvailablePieces() {
        piecesContainerEl.innerHTML = '';
        if (isGameOver) return;
        availablePieces.forEach((pieceDef, index) => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece-preview');
            if (pieceDef.type === 'powerup') {
                if (pieceDef.effect === 'bomb') {
                    pieceElement.classList.add('powerup-bomb-preview');
                } else {
                    pieceElement.classList.add('powerup-laser-preview');
                }
            }
            pieceElement.dataset.pieceIndex = index;
            let minR = 0,
                maxR = 0,
                minC = 0,
                maxC = 0;
            pieceDef.shape.forEach(p => {
                minR = Math.min(minR, p[1]);
                maxR = Math.max(maxR, p[1]);
                minC = Math.min(minC, p[0]);
                maxC = Math.max(maxC, p[0]);
            });
            const rows = maxR - minR + 1;
            const cols = maxC - minC + 1;
            pieceElement.style.gridTemplateRows = `repeat(${rows}, ${PREVIEW_CELL_SIZE}px)`;
            pieceElement.style.gridTemplateColumns = `repeat(${cols}, ${PREVIEW_CELL_SIZE}px)`;
            pieceElement.style.animationDelay = `${index * 100}ms`;
            const displayGridInternal = Array(rows).fill(null).map(() => Array(cols).fill(false));
            pieceDef.shape.forEach(p => {
                displayGridInternal[p[1] - minR][p[0] - minC] = true;
            });
            for (let r_idx = 0; r_idx < rows; r_idx++) {
                for (let c_idx = 0; c_idx < cols; c_idx++) {
                    const cellDiv = document.createElement('div');
                    cellDiv.classList.add('cell');
                    if (displayGridInternal[r_idx][c_idx]) {
                        cellDiv.style.backgroundColor = pieceDef.color;
                    } else {
                        cellDiv.style.backgroundColor = 'transparent';
                    }
                    pieceElement.appendChild(cellDiv);
                }
            }
            pieceElement.addEventListener('mousedown', (e) => handleDragStart(e, pieceDef, index));
            pieceElement.addEventListener('touchstart', (e) => handleDragStart(e, pieceDef, index), {
                passive: false
            });
            piecesContainerEl.appendChild(pieceElement);
        });
    }

    // --- Sürükle-Bırak Fonksiyonları (Performans için Optimize Edilmiş) ---
    function handleDragStart(event, pieceData, pieceIndex) {
        if (isGameOver || isDragging || isClearingLine) return;
        event.preventDefault();
        
        isDragging = true;
        document.body.classList.add('no-select');
        selectedPieceData = pieceData;
        originalPieceIndexInAvailable = pieceIndex;
        selectedPieceElement = document.createElement('div');
        selectedPieceElement.classList.add('dragging-piece');
        
        // ... (sürüklenen parça elementini oluşturma kodları aynı) ...
        let minR_drag = 0, maxR_drag = 0, minC_drag = 0, maxC_drag = 0; pieceData.shape.forEach(p => { minR_drag = Math.min(minR_drag, p[1]); maxR_drag = Math.max(maxR_drag, p[1]); minC_drag = Math.min(minC_drag, p[0]); maxC_drag = Math.max(maxC_drag, p[0]); }); const rows_drag = maxR_drag - minR_drag + 1; const cols_drag = maxC_drag - minC_drag + 1; selectedPieceElement.style.gridTemplateRows = `repeat(${rows_drag}, ${CELL_SIZE}px)`; selectedPieceElement.style.gridTemplateColumns = `repeat(${cols_drag}, ${CELL_SIZE}px)`; const displayGrid_drag = Array(rows_drag).fill(null).map(() => Array(cols_drag).fill(false)); pieceData.shape.forEach(p => { displayGrid_drag[p[1] - minR_drag][p[0] - minC_drag] = true; }); for (let r_drag_idx = 0; r_drag_idx < rows_drag; r_drag_idx++) { for (let c_drag_idx = 0; c_drag_idx < cols_drag; c_drag_idx++) { const cellDiv_drag = document.createElement('div'); cellDiv_drag.classList.add('cell'); cellDiv_drag.style.width = `${CELL_SIZE}px`; cellDiv_drag.style.height = `${CELL_SIZE}px`; if (displayGrid_drag[r_drag_idx][c_drag_idx]) { cellDiv_drag.style.backgroundColor = pieceData.color; } else { cellDiv_drag.style.backgroundColor = 'transparent'; } selectedPieceElement.appendChild(cellDiv_drag); } } document.body.appendChild(selectedPieceElement);
        
        const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
        const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY;
        const previewRect = event.currentTarget.getBoundingClientRect();
        
        lastDragX = clientX;
        lastDragY = clientY;
        dragOffsetX = clientX - previewRect.left;
        dragOffsetY = clientY - previewRect.top;

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(dragAnimationLoop);

        if (event.type === 'mousedown') {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        } else if (event.type === 'touchstart') {
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);
        }
        if (piecesContainerEl.children[originalPieceIndexInAvailable]) {
            piecesContainerEl.children[originalPieceIndexInAvailable].style.opacity = '0.3';
        }
    }

    function dragAnimationLoop() {
        if (!isDragging) return;

        const x = lastDragX - dragOffsetX;
        const y = lastDragY - dragOffsetY;
        selectedPieceElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        
        const canvasRect = canvas.getBoundingClientRect();
        const pieceOriginX = x - canvasRect.left + (selectedPieceElement.offsetWidth / 2); // Merkeze daha yakın hesap
        const pieceOriginY = y - canvasRect.top + (selectedPieceElement.offsetHeight / 2);
        const potentialDropCol = Math.round(pieceOriginX / CELL_SIZE) -1; // -1 gibi ofsetler gerekebilir
        const potentialDropRow = Math.round(pieceOriginY / CELL_SIZE) -1;

        anticipatedLines = { rows: [], cols: [] };
        if (selectedPieceData && isValidPlacement(selectedPieceData, potentialDropRow, potentialDropCol)) {
            ghostPiecePosition = { r: potentialDropRow, c: potentialDropCol };
            if (selectedPieceData.type !== 'powerup') {
                checkAnticipatedLines(selectedPieceData, potentialDropRow, potentialDropCol);
            }
        } else {
            ghostPiecePosition = null;
        }

        drawGrid();
        
        animationFrameId = requestAnimationFrame(dragAnimationLoop);
    }
    
    function handleDragMove(event) {
        if (!isDragging) return;
        event.preventDefault();
        lastDragX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
        lastDragY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY;
    }

    function handleDragEnd(event) {
        if (!isDragging) return;

        isDragging = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        document.body.classList.remove('no-select');
        ghostPiecePosition = null;
        anticipatedLines = { rows: [], cols: [] };

        const finalX = lastDragX - dragOffsetX;
        const finalY = lastDragY - dragOffsetY;
        const canvasRect = canvas.getBoundingClientRect();
        const dropRow = Math.round((finalY - canvasRect.top) / CELL_SIZE);
        const dropCol = Math.round((finalX - canvasRect.left) / CELL_SIZE);

        if (selectedPieceData && isValidPlacement(selectedPieceData, dropRow, dropCol)) {
            availablePieces.splice(originalPieceIndexInAvailable, 1);
            if (selectedPieceData.type === 'powerup') {
                applyPowerUpEffect(selectedPieceData.effect, dropRow, dropCol, () => {
                    checkAndClearLines(() => {
                        if (availablePieces.length === 0 && !isGameOver) generateUpcomingPieces();
                        else if (!isGameOver) displayAvailablePieces();
                        if (!isGameOver && checkForGameOver()) triggerGameOver();
                        drawGrid();
                    });
                });
            } else {
                placePieceOnGrid(selectedPieceData, dropRow, dropCol);
                playSound(SFX.place);
                checkAndClearLines(() => {
                    if (availablePieces.length === 0 && !isGameOver) generateUpcomingPieces();
                    else if (!isGameOver) displayAvailablePieces();
                    if (!isGameOver && checkForGameOver()) triggerGameOver();
                    drawGrid();
                });
            }
        } else {
            if (piecesContainerEl.children[originalPieceIndexInAvailable]) {
                piecesContainerEl.children[originalPieceIndexInAvailable].style.opacity = '1';
            }
            drawGrid();
        }
        
        document.body.removeChild(selectedPieceElement);
        selectedPieceElement = null;
        selectedPieceData = null;
        originalPieceIndexInAvailable = -1;
        
        if (event.type === 'mouseup') { document.removeEventListener('mousemove', handleDragMove); document.removeEventListener('mouseup', handleDragEnd); } 
        else if (event.type === 'touchend') { document.removeEventListener('touchmove', handleDragMove); document.removeEventListener('touchend', handleDragEnd); }
    }

    // --- Ana Oyun Mantığı Fonksiyonları ---
    function isValidPlacement(pieceData, startRow, startCol) {
        if (!pieceData) return false;
        for (const p of pieceData.shape) {
            const r_valid = startRow + p[1];
            const c_valid = startCol + p[0];
            if (r_valid < 0 || r_valid >= GRID_ROWS || c_valid < 0 || c_valid >= GRID_COLS || (pieceData.type !== 'powerup' && grid[r_valid][c_valid] !== COLORS.empty)) {
                return false;
            }
        }
        return true;
    }

    function placePieceOnGrid(pieceData, startRow, startCol) {
        pieceData.shape.forEach(p => {
            const r_place = startRow + p[1];
            const c_place = startCol + p[0];
            if (r_place >= 0 && r_place < GRID_ROWS && c_place >= 0 && c_place < GRID_COLS) {
                grid[r_place][c_place] = pieceData.color;
            }
        });
    }

    function applyPowerUpEffect(effect, r, c, onAnimationComplete) {
        isClearingLine = true;
        if (effect === 'bomb') {
            playSound(SFX.bomb);
            animateBombExplosion(r, c, () => {
                isClearingLine = false;
                onAnimationComplete();
            });
        } else if (effect === 'laser_row' || effect === 'laser_col') {
            playSound(SFX.laser);
            animateLaser(r, c, effect === 'laser_row' ? 'row' : 'col', () => {
                isClearingLine = false;
                onAnimationComplete();
            });
        }
    }

    function animateBombExplosion(r, c, callback) {
        const duration = 400;
        let startTime = null;
        const cellsInExplosion = [];
        for (let row = r - 1; row <= r + 1; row++) {
            for (let col = c - 1; col <= c + 1; col++) {
                if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
                    cellsInExplosion.push({ r: row, c: col });
                }
            }
        }

        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;
            drawGrid();
            if (progress < 1) {
                const radius = (CELL_SIZE * 1.5) * progress;
                const opacity = 1 - progress;
                ctx.fillStyle = `rgba(236, 240, 241, ${opacity * 0.8})`;
                ctx.beginPath();
                ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, radius, 0, Math.PI * 2);
                ctx.fill();
                requestAnimationFrame(animationStep);
            } else {
                let cellsCleared = 0;
                cellsInExplosion.forEach(cell => {
                    if (grid[cell.r][cell.c] !== COLORS.empty) cellsCleared++;
                    grid[cell.r][cell.c] = COLORS.empty;
                });
                score += cellsCleared * 10;
                updateScore(0);
                drawGrid();
                callback();
            }
        }
        requestAnimationFrame(animationStep);
    }

    function animateLaser(r, c, direction, callback) {
        const duration = 250;
        let startTime = null;
        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            drawGrid();
            ctx.fillStyle = 'rgba(255, 82, 82, 0.8)';
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 15;
            if (direction === 'row') {
                const lineWidth = canvas.width * progress;
                ctx.fillRect(0, r * CELL_SIZE + CELL_SIZE / 2 - 2, lineWidth, 4);
            } else {
                const lineHeight = canvas.height * progress;
                ctx.fillRect(c * CELL_SIZE + CELL_SIZE / 2 - 2, 0, 4, lineHeight);
            }
            ctx.shadowBlur = 0;
            if (progress < 1) {
                requestAnimationFrame(animationStep);
            } else {
                let cellsCleared = 0;
                if (direction === 'row') {
                    for (let col = 0; col < GRID_COLS; col++) { if (grid[r][col] !== COLORS.empty) cellsCleared++; grid[r][col] = COLORS.empty; }
                } else {
                    for (let row = 0; row < GRID_ROWS; row++) { if (grid[row][c] !== COLORS.empty) cellsCleared++; grid[row][c] = COLORS.empty; }
                }
                score += cellsCleared * 10;
                updateScore(0);
                drawGrid();
                callback();
            }
        }
        requestAnimationFrame(animationStep);
    }

    function checkAndClearLines(callback) {
        if (isClearingLine) return;
        let cellsToClearCoords = [];
        let fullRowsIndices = new Set();
        let fullColsIndices = new Set();
        for (let r_check = 0; r_check < GRID_ROWS; r_check++) {
            if (grid[r_check].every(cellColor => cellColor !== COLORS.empty)) {
                fullRowsIndices.add(r_check);
                for (let c_cell = 0; c_cell < GRID_COLS; c_cell++) {
                    cellsToClearCoords.push({ r: r_check, c: c_cell });
                }
            }
        }
        for (let c_check = 0; c_check < GRID_COLS; c_check++) {
            let colIsFull = true;
            for (let r_cell = 0; r_cell < GRID_ROWS; r_cell++) {
                if (grid[r_cell][c_check] === COLORS.empty) {
                    colIsFull = false;
                    break;
                }
            }
            if (colIsFull) {
                fullColsIndices.add(c_check);
                for (let r_cell = 0; r_cell < GRID_ROWS; r_cell++) {
                    cellsToClearCoords.push({ r: r_cell, c: c_check });
                }
            }
        }
        const uniqueCellsToClear = Array.from(new Set(cellsToClearCoords.map(coord => JSON.stringify(coord)))).map(str => JSON.parse(str));
        const linesClearedCount = fullRowsIndices.size + fullColsIndices.size;
        if (uniqueCellsToClear.length > 0) {
            playerProfile.stats.totalLinesCleared += linesClearedCount;
            saveProfile();
            playSound(SFX.clear);
            isClearingLine = true;
            updateScore(linesClearedCount, true);
            let animationStep = 0;
            const animationDuration = 300;
            const steps = COLORS.clearAnimationColors.length + 1;
            const stepInterval = animationDuration / steps;

            function animate() {
                if (animationStep < COLORS.clearAnimationColors.length) {
                    uniqueCellsToClear.forEach(coord => { grid[coord.r][coord.c] = COLORS.clearAnimationColors[animationStep]; });
                    drawGrid();
                    animationStep++;
                    setTimeout(animate, stepInterval);
                } else {
                    uniqueCellsToClear.forEach(coord => { grid[coord.r][coord.c] = COLORS.empty; });
                    isClearingLine = false;
                    if (callback) callback();
                }
            }
            animate();
        } else {
            if (callback) callback();
        }
    }
    
    function updateScore(linesClearedCount = 0, isPotentialCombo = false) {
        if (linesClearedCount > 0) {
            const pointsEarned = COMBO_SCORES[linesClearedCount] || (COMBO_SCORES[Object.keys(COMBO_SCORES).length] + (linesClearedCount - Object.keys(COMBO_SCORES).length) * 200);
            score += pointsEarned;
        }
        if (currentScoreValueEl) {
            currentScoreValueEl.textContent = score;
            currentScoreValueEl.parentElement.classList.add('score-pop');
            setTimeout(() => {
                currentScoreValueEl.parentElement.classList.remove('score-pop');
            }, 200);
        }
        const currentHighScore = playerProfile.highScores[currentMode] || 0;
        if (score > currentHighScore && !highScoreJustBeaten) {
            playSound(SFX.newRecord);
            highScoreJustBeaten = true;
            newRecordMessageEl.style.display = 'block';
            newRecordMessageEl.style.animation = 'none';
            newRecordMessageEl.offsetHeight;
            newRecordMessageEl.style.animation = '';
            setTimeout(() => {
                newRecordMessageEl.style.display = 'none';
            }, 2000);
        }
        if (isPotentialCombo && linesClearedCount >= 2) {
            playSound(SFX.combo);
            if (linesClearedCount > playerProfile.stats.highestCombo) {
                playerProfile.stats.highestCombo = linesClearedCount;
                saveProfile();
            }
            comboMessageEl.style.display = 'block';
            comboMessageEl.style.animation = 'none';
            comboMessageEl.offsetHeight;
            comboMessageEl.style.animation = '';
            gameContainerEl.classList.add('screen-shake');
            setTimeout(() => {
                comboMessageEl.style.display = 'none';
                gameContainerEl.classList.remove('screen-shake');
            }, 1000);
        }
        checkAchievements({ score: score, linesCleared: linesClearedCount });
    }

    function checkForGameOver() {
        if (availablePieces.length === 0 && !isGameOver) return false;
        for (const pieceData of availablePieces) {
            for (let r_game_over = 0; r_game_over < GRID_ROWS; r_game_over++) {
                for (let c_game_over = 0; c_game_over < GRID_COLS; c_game_over++) {
                    if (isValidPlacement(pieceData, r_game_over, c_game_over)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function triggerGameOver() {
        playSound(SFX.gameOver);
        isGameOver = true;
        finalScoreEl.textContent = score;
        gameOverOverlayEl.style.display = 'flex';
        const currentHighScore = playerProfile.highScores[currentMode] || 0;
        if (score > currentHighScore) {
            playerProfile.highScores[currentMode] = score;
            saveProfile();
            if (highScoreValueEl) highScoreValueEl.textContent = score;
        }
        if (anticipationInterval) {
            clearInterval(anticipationInterval);
            anticipationInterval = null;
        }
    }
    
    function createTwinklingStars() {
        const container = document.getElementById('twinkling-stars');
        if (!container || container.childElementCount > 0) return;
        const starCount = 60;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 4}s`;
            star.style.animationDuration = `${Math.random() * 3 + 3}s`;
            container.appendChild(star);
        }
    }

    // --- Oyun Başlatma ve Yönetim ---
    function startGame(mode) {
        if (!mode) return;
        currentMode = mode;
        modeSelectionMenu.style.display = 'none';
        gameContainerEl.style.display = 'block';
        isMuted = localStorage.getItem('blockGameMuted') === 'true';
        sfxToggleButton.textContent = isMuted ? '🔇' : '🔊';
        isGameOver = false;
        isClearingLine = false;
        isDragging = false;
        highScoreJustBeaten = false;
        score = 0;
        playerProfile.stats.gamesPlayed++;
        saveProfile();
        checkAchievements({ score: 0, linesCleared: 0 });
        
        if (currentScoreValueEl) currentScoreValueEl.textContent = score;
        
        highScoreValueEl.textContent = playerProfile.highScores[currentMode] || 0;
        
        if (gameOverOverlayEl) gameOverOverlayEl.style.display = 'none';
        
        ghostPiecePosition = null;
        anticipatedLines = {
            rows: [],
            cols: []
        };
        calculateCellSize();
        initGrid();
        if (currentMode === 'klasik') {
            addInitialRandomBlocksToGrid(MAX_INITIAL_BLOCKS);
        }
        generateUpcomingPieces();
        drawGrid();
        if (anticipationInterval) clearInterval(anticipationInterval);
        anticipationInterval = setInterval(() => {
            anticipationAnimationToggle = !anticipationAnimationToggle;
            if (isDragging && !isClearingLine) {
                drawGrid();
            }
        }, 400);
    }
    
    function returnToMainMenu() {
        playSound(SFX.click);
        isGameOver = true; 
        if (anticipationInterval) {
            clearInterval(anticipationInterval);
            anticipationInterval = null;
        }
        gameOverOverlayEl.style.display = 'none';
        gameContainerEl.style.display = 'none';
        modeSelectionMenu.style.display = 'block';
    }

    function initializePage() {
        loadProfile();
        gameContainerEl.style.display = 'none';
        modeSelectionMenu.style.display = 'block';
        createTwinklingStars();
    }
    
    // --- Event Listeners ---
    statsButton.addEventListener('click', () => {
        playSound(SFX.click);
        populateStatsModal();
        statsOverlayEl.style.display = 'flex';
    });
    
    statsCloseButton.addEventListener('click', () => {
        playSound(SFX.click);
        statsOverlayEl.style.display = 'none';
    });

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedMode = button.dataset.mode;
            playSound(SFX.click);
            startGame(selectedMode);
        });
    });

    restartButton.addEventListener('click', () => {
        playSound(SFX.click);
        startGame(currentMode);
    });

    mainMenuButton.addEventListener('click', returnToMainMenu);
    inGameMenuButton.addEventListener('click', returnToMainMenu);

    sfxToggleButton.addEventListener('click', toggleMute);

    window.addEventListener('resize', () => {
        calculateCellSize();
        drawGrid();
    });

    // --- İlk Başlatma ---
    initializePage();
});
