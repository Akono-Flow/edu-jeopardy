// Educational Jeopardy Game
document.addEventListener('DOMContentLoaded', () => {
    // Game State
    const gameState = {
        categories: [],
        selectedCategories: ['', '', '', ''],
        board: Array(5).fill().map(() => Array(4).fill(null)),
        players: [],
        currentPlayer: null,
        activeQuestion: null,
        pointValues: [200, 400, 600, 800, 1000],
        availableCategories: []
    };

    // DOM Elements
    const elements = {
        gameBoard: document.querySelector('.game-board'),
        categorySelects: document.querySelectorAll('.category-select'),
        playersContainer: document.getElementById('players-container'),
        addPlayerBtn: document.getElementById('addPlayerBtn'),
        questionModal: document.getElementById('questionModal'),
        questionCategory: document.getElementById('questionCategory'),
        questionPoints: document.getElementById('questionPoints'),
        questionText: document.getElementById('questionText'),
        answerText: document.getElementById('answerText'),
        answerArea: document.getElementById('answerArea'),
        showAnswerBtn: document.getElementById('showAnswerBtn'),
        closeQuestionBtn: document.getElementById('closeQuestionBtn'),
        correctBtn: document.getElementById('correctBtn'),
        incorrectBtn: document.getElementById('incorrectBtn'),
        togglePlayersBtn: document.getElementById('togglePlayersBtn'),
        playerPanel: document.querySelector('.player-panel'),
        newGameBtn: document.getElementById('newGameBtn'),
        importGameBtn: document.getElementById('importGameBtn'),
        exportGameBtn: document.getElementById('exportGameBtn'),
        importQuestionsBtn: document.getElementById('importQuestionsBtn'),
        exportQuestionsBtn: document.getElementById('exportQuestionsBtn'),
        importModal: document.getElementById('importModal'),
        importTitle: document.getElementById('importTitle'),
        importTextarea: document.getElementById('importTextarea'),
        confirmImportBtn: document.getElementById('confirmImportBtn'),
        cancelImportBtn: document.getElementById('cancelImportBtn'),
        fileInput: document.getElementById('fileInput')
    };

    // Initialize the Game
    async function initGame() {
        try {
            // Load questions from JSON file
            const questionsData = await fetchQuestions();
            gameState.categories = questionsData.categories;
            gameState.availableCategories = questionsData.categories.map(category => category.name);
            
            // Setup category dropdowns
            setupCategoryDropdowns();
            
            // Generate initial board
            generateBoard();
            
            // Setup event listeners
            setupEventListeners();
            
            // Add default players
            addPlayer('Freitas');
            
            console.log('Game initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to load the game. Please try again.');
        }
    }

    // Fetch Questions from JSON file
    async function fetchQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error('Failed to load questions');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading questions:', error);
            // If fetch fails, return some default questions
            return getDefaultQuestions();
        }
    }

    // Setup Category Dropdowns
    function setupCategoryDropdowns() {
        elements.categorySelects.forEach((select, index) => {
            // Clear existing options
            select.innerHTML = '';
            
            // Add blank option
            const blankOption = document.createElement('option');
            blankOption.value = '';
            blankOption.textContent = 'Select Category';
            select.appendChild(blankOption);
            
            // Add available categories
            gameState.availableCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                
                // Set as selected if it matches the current selection
                if (category === gameState.selectedCategories[index]) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });
            
            // Add change event listener
            select.addEventListener('change', () => {
                gameState.selectedCategories[index] = select.value;
                refreshBoard();
            });
        });
    }

    // Generate Game Board
    function generateBoard() {
        elements.gameBoard.innerHTML = '';
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Set point value
                cell.textContent = `$${gameState.pointValues[row]}`;
                
                // Mark as answered if needed
                if (gameState.board[row][col]) {
                    cell.classList.add('answered');
                }
                
                // Add click event only if not answered and category is selected
                if (!gameState.board[row][col] && gameState.selectedCategories[col]) {
                    cell.addEventListener('click', () => openQuestion(row, col));
                }
                
                elements.gameBoard.appendChild(cell);
            }
        }
    }

    // Refresh Board (after category change)
    function refreshBoard() {
        generateBoard();
    }

    // Open Question
    function openQuestion(row, col) {
        const categoryName = gameState.selectedCategories[col];
        const pointValue = gameState.pointValues[row];
        
        // Find the category in our data
        const category = gameState.categories.find(cat => cat.name === categoryName);
        if (!category) return;
        
        // Get questions for this category
        const availableQuestions = category.questions.filter(q => !q.used && q.difficulty === row + 1);
        
        if (availableQuestions.length === 0) {
            alert('No more questions available for this category and difficulty!');
            return;
        }
        
        // Select a random question
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const question = availableQuestions[randomIndex];
        
        // Mark question as used
        question.used = true;
        
        // Set as active question
        gameState.activeQuestion = {
            row,
            col,
            questionObj: question,
            pointValue
        };
        
        // Update game board state
        gameState.board[row][col] = question;
        
        // Update modal content
        elements.questionCategory.textContent = categoryName;
        elements.questionPoints.textContent = `$${pointValue}`;
        elements.questionText.textContent = question.question;
        elements.answerText.textContent = question.answer;
        elements.answerArea.classList.add('hidden');
        
        // Show the modal
        elements.questionModal.classList.add('active');
    }

    // Handle Correct Answer
    function handleCorrectAnswer() {
        if (!gameState.activeQuestion || !gameState.currentPlayer) return;
        
        // Add points to current player
        const playerIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
        if (playerIndex !== -1) {
            gameState.players[playerIndex].score += gameState.activeQuestion.pointValue;
            updatePlayersDisplay();
        }
        
        // Close the question
        closeQuestionModal();
    }

    // Handle Incorrect Answer
    function handleIncorrectAnswer() {
        if (!gameState.activeQuestion || !gameState.currentPlayer) return;
        
        // Subtract points from current player
        const playerIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
        if (playerIndex !== -1) {
            gameState.players[playerIndex].score -= gameState.activeQuestion.pointValue;
            updatePlayersDisplay();
        }
        
        // Close the question
        closeQuestionModal();
    }

    // Close Question Modal
    function closeQuestionModal() {
        elements.questionModal.classList.remove('active');
        gameState.activeQuestion = null;
        
        // Update the board to reflect the answered question
        refreshBoard();
    }

    // Add Player
    function addPlayer(name = '') {
        // Generate a unique ID
        const playerId = 'player_' + Date.now();
        
        // Create player object
        const player = {
            id: playerId,
            name: name || `Player ${gameState.players.length + 1}`,
            score: 0
        };
        
        // Add to players array
        gameState.players.push(player);
        
        // If this is the first player, make them the current player
        if (gameState.players.length === 1) {
            gameState.currentPlayer = player.id;
        }
        
        // Update the display
        updatePlayersDisplay();
        
        return player;
    }

    // Update Players Display
    function updatePlayersDisplay() {
        elements.playersContainer.innerHTML = '';
        
        gameState.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.dataset.id = player.id;
            
            if (player.id === gameState.currentPlayer) {
                playerCard.classList.add('selected');
            }
            
            playerCard.innerHTML = `
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-score">$${player.score}</div>
                </div>
                <div class="player-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="remove-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            // Add click event to select player
            playerCard.addEventListener('click', (e) => {
                // Ignore clicks on buttons
                if (e.target.closest('.player-actions')) return;
                
                // Set as current player
                gameState.currentPlayer = player.id;
                updatePlayersDisplay();
            });
            
            // Edit player name
            const editBtn = playerCard.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                const newName = prompt('Enter new name:', player.name);
                if (newName && newName.trim()) {
                    player.name = newName.trim();
                    updatePlayersDisplay();
                }
            });
            
            // Remove player
            const removeBtn = playerCard.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                if (confirm(`Remove ${player.name}?`)) {
                    gameState.players = gameState.players.filter(p => p.id !== player.id);
                    
                    // If we removed the current player, select another one
                    if (player.id === gameState.currentPlayer) {
                        gameState.currentPlayer = gameState.players.length > 0 ? gameState.players[0].id : null;
                    }
                    
                    updatePlayersDisplay();
                }
            });
            
            elements.playersContainer.appendChild(playerCard);
        });
    }
    
    // Toggle Players Panel
    function togglePlayersPanel() {
        elements.playerPanel.classList.toggle('collapsed');
        document.querySelector('.game-container').classList.toggle('panel-collapsed');
    }
    
    // Export Game State
    function exportGameState() {
        const exportData = {
            categories: gameState.categories,
            selectedCategories: gameState.selectedCategories,
            board: gameState.board,
            players: gameState.players,
            currentPlayer: gameState.currentPlayer,
            pointValues: gameState.pointValues
        };
        
        // Convert to JSON
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create download
        downloadJSON(jsonData, 'jeopardy_game_state.json');
    }
    
    // Export Questions
    function exportQuestions() {
        const exportData = {
            categories: gameState.categories
        };
        
        // Convert to JSON
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create download
        downloadJSON(jsonData, 'jeopardy_questions.json');
    }
    
    // Helper function to download JSON
    function downloadJSON(jsonData, filename) {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // Import Game State
    function importGameState() {
        showImportModal('Import Game State', data => {
            try {
                const importedData = JSON.parse(data);
                
                // Validate the data
                if (!importedData.categories || !importedData.selectedCategories || 
                    !importedData.board || !importedData.players || 
                    !importedData.pointValues) {
                    throw new Error('Invalid game state format');
                }
                
                // Update the game state
                gameState.categories = importedData.categories;
                gameState.selectedCategories = importedData.selectedCategories;
                gameState.board = importedData.board;
                gameState.players = importedData.players;
                gameState.currentPlayer = importedData.currentPlayer;
                gameState.pointValues = importedData.pointValues;
                gameState.availableCategories = importedData.categories.map(category => category.name);
                
                // Refresh the UI
                setupCategoryDropdowns();
                refreshBoard();
                updatePlayersDisplay();
                
                alert('Game state imported successfully!');
            } catch (error) {
                console.error('Error importing game state:', error);
                alert('Error importing game state. Please check the file format.');
            }
        });
    }
    
    // Import Questions
    function importQuestions() {
        showImportModal('Import Questions', data => {
            try {
                const importedData = JSON.parse(data);
                
                // Validate the data
                if (!importedData.categories) {
                    throw new Error('Invalid questions format');
                }
                
                // Update just the categories
                gameState.categories = importedData.categories;
                gameState.availableCategories = importedData.categories.map(category => category.name);
                
                // Reset the board
                gameState.board = Array(5).fill().map(() => Array(4).fill(null));
                
                // Refresh the UI
                setupCategoryDropdowns();
                refreshBoard();
                
                alert('Questions imported successfully!');
            } catch (error) {
                console.error('Error importing questions:', error);
                alert('Error importing questions. Please check the file format.');
            }
        });
    }
    
    // Show Import Modal
    function showImportModal(title, callback) {
        elements.importTitle.textContent = title;
        elements.importTextarea.value = '';
        elements.importModal.classList.add('active');
        
        // Store the callback for when the user confirms
        elements.confirmImportBtn.onclick = () => {
            const data = elements.importTextarea.value.trim();
            if (data) {
                callback(data);
                elements.importModal.classList.remove('active');
            } else {
                alert('Please enter JSON data to import.');
            }
        };
        
        // Cancel button
        elements.cancelImportBtn.onclick = () => {
            elements.importModal.classList.remove('active');
        };
    }
    
    // New Game
    function startNewGame() {
        if (confirm('Start a new game? Current game progress will be lost.')) {
            // Reset game state
            gameState.selectedCategories = ['', '', '', ''];
            gameState.board = Array(5).fill().map(() => Array(4).fill(null));
            
            // Reset used questions
            gameState.categories.forEach(category => {
                category.questions.forEach(question => {
                    question.used = false;
                });
            });
            
            // Reset player scores
            gameState.players.forEach(player => {
                player.score = 0;
            });
            
            // Refresh UI
            setupCategoryDropdowns();
            refreshBoard();
            updatePlayersDisplay();
        }
    }
    
    // Setup Event Listeners
    function setupEventListeners() {
        // Show Answer Button
        elements.showAnswerBtn.addEventListener('click', () => {
            elements.answerArea.classList.remove('hidden');
        });
        
        // Close Question Button
        elements.closeQuestionBtn.addEventListener('click', closeQuestionModal);
        
        // Correct/Incorrect Buttons
        elements.correctBtn.addEventListener('click', handleCorrectAnswer);
        elements.incorrectBtn.addEventListener('click', handleIncorrectAnswer);
        
        // Add Player Button
        elements.addPlayerBtn.addEventListener('click', () => {
            const name = prompt('Enter player name:');
            if (name) addPlayer(name);
        });
        
        // Toggle Players Panel
        elements.togglePlayersBtn.addEventListener('click', togglePlayersPanel);
        
        // Import/Export Buttons
        elements.newGameBtn.addEventListener('click', startNewGame);
        elements.importGameBtn.addEventListener('click', importGameState);
        elements.exportGameBtn.addEventListener('click', exportGameState);
        elements.importQuestionsBtn.addEventListener('click', importQuestions);
        elements.exportQuestionsBtn.addEventListener('click', exportQuestions);
        
        // File Input
        elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    elements.importTextarea.value = event.target.result;
                };
                reader.readAsText(file);
            }
        });
    }
    
    // Default Questions (in case JSON fails to load)
    
    
    // Initialize the game when document is loaded
    initGame();
});