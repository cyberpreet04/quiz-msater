import { getState, updateState, updateGroupState, resetState } from './store.js';
import { showScreen, updateDashboard } from './ui.js';
import { initAdmin } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const state = getState();
    
    // Bind global events
    setupFormEvents();
    adminEvents();
    dashboardEvents();
    quizEvents();
    transitionEvents();
    winnerEvents();
    
    initAdmin(); // Setup admin module
    
    // Route to correct screen based on state
    route(state.screen);
}

function route(screen) {
    updateState({ screen });
    showScreen('screen-' + screen);
    
    if (screen === 'dashboard') {
        updateDashboard();
    }
}

// ==========================================
// SETUP SCREEN
// ==========================================
function setupFormEvents() {
    let g1SelectedAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=G1A';
    let g2SelectedAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=G2A';

    const g1Upload = document.getElementById('g1-avatar-upload');
    const g2Upload = document.getElementById('g2-avatar-upload');

    g1Upload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                g1SelectedAvatar = evt.target.result;
                document.getElementById('g1-avatar-preview').src = g1SelectedAvatar;
            };
            reader.readAsDataURL(file);
        }
    });

    g2Upload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                g2SelectedAvatar = evt.target.result;
                document.getElementById('g2-avatar-preview').src = g2SelectedAvatar;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('setup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const compName = document.getElementById('comp-name').value;
        const maxMarks = parseInt(document.getElementById('comp-marks').value);
        
        const g1Name = document.getElementById('g1-name').value;
        const g2Name = document.getElementById('g2-name').value;
        
        updateState({
            competition: { name: compName, maxMarks },
            groups: {
                g1: { name: g1Name, avatar: g1SelectedAvatar, scores: [null,null,null,null,null], totalScore: 0 },
                g2: { name: g2Name, avatar: g2SelectedAvatar, scores: [null,null,null,null,null], totalScore: 0 }
            }
        });
        
        route('admin');
    });
}

// ==========================================
// ADMIN SCREEN
// ==========================================
function adminEvents() {
    document.getElementById('btn-start-competition').addEventListener('click', () => {
        const state = getState();
        // Validation: Ensure all 5 quizzes have at least 1 question
        const invalid = state.quizzes.findIndex(q => q.questions.length === 0);
        if (invalid !== -1) {
            alert(`Quiz ${invalid + 1} has no questions. Please add at least one question to all 5 quizzes.`);
            return;
        }
        
        // Setup initial progress
        updateState({
            progress: { turn: 'g1', currentQuizIndex: 0, currentQuestionIndex: 0, tempScore: 0 }
        });
        
        route('dashboard');
    });
}

// ==========================================
// DASHBOARD SCREEN
// ==========================================
function dashboardEvents() {
    document.getElementById('btn-begin-turn').addEventListener('click', () => {
        const state = getState();
        // Verify quiz has questions just in case
        const currentQuiz = state.quizzes[state.progress.currentQuizIndex];
        const groupQuestions = currentQuiz.questions.filter((q, i) => state.progress.turn === 'g1' ? i % 2 === 0 : i % 2 !== 0);

        if (groupQuestions.length === 0) {
            alert(`This group has no assigned questions for this quiz! Skipping turn.`);
            updateState({
                progress: { ...state.progress, currentQuestionIndex: 0, tempScore: 0 }
            });
            finishQuizTurn(); // Skip turn
            return;
        }
        
        updateState({
            progress: { ...state.progress, currentQuestionIndex: 0, tempScore: 0 }
        });
        
        renderActiveQuestion();
        route('quiz');
    });
}

// ==========================================
// QUIZ SCREEN
// ==========================================
function quizEvents() {
    document.getElementById('btn-next-question').addEventListener('click', () => {
        const state = getState();
        const quiz = state.quizzes[state.progress.currentQuizIndex];
        const groupQuestions = quiz.questions.filter((q, i) => state.progress.turn === 'g1' ? i % 2 === 0 : i % 2 !== 0);
        
        if (state.progress.currentQuestionIndex + 1 < groupQuestions.length) {
            // Next question
            updateState({
                progress: { ...state.progress, currentQuestionIndex: state.progress.currentQuestionIndex + 1 }
            });
            renderActiveQuestion();
        } else {
            // Quiz finished
            finishQuizTurn();
        }
    });
}

function renderActiveQuestion() {
    const state = getState();
    const group = state.groups[state.progress.turn];
    const quiz = state.quizzes[state.progress.currentQuizIndex];
    const groupQuestions = quiz.questions.filter((q, i) => state.progress.turn === 'g1' ? i % 2 === 0 : i % 2 !== 0);
    const qData = groupQuestions[state.progress.currentQuestionIndex];
    
    // Update Header
    document.getElementById('active-group-avatar').src = group.avatar;
    document.getElementById('active-group-name').textContent = group.name;
    document.getElementById('active-quiz-info').textContent = `Quiz ${state.progress.currentQuizIndex + 1}`;
    
    document.getElementById('q-current').textContent = state.progress.currentQuestionIndex + 1;
    document.getElementById('q-total').textContent = groupQuestions.length;
    document.getElementById('q-score').textContent = state.progress.tempScore;
    
    // Render Question
    document.getElementById('question-text').textContent = qData.text;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    qData.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => handleAnswerSelect(idx, btn, qData.correctIdx);
        container.appendChild(btn);
    });
    
    document.getElementById('btn-next-question').classList.add('hidden');
}

function handleAnswerSelect(selectedIdx, btnElement, correctIdx) {
    const state = getState();
    
    // Disable all options
    const container = document.getElementById('options-container');
    const buttons = container.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);
    
    // Check answer
    if (selectedIdx === correctIdx) {
        btnElement.classList.add('correct');
        const newScore = state.progress.tempScore + state.competition.maxMarks;
        updateState({ progress: { ...state.progress, tempScore: newScore } });
        document.getElementById('q-score').textContent = newScore;
    } else {
        btnElement.classList.add('wrong');
        // highlight correct answer
        buttons[correctIdx].classList.add('correct');
    }
    
    // Show next button
    document.getElementById('btn-next-question').classList.remove('hidden');
}

function finishQuizTurn() {
    const state = getState();
    const groupKey = state.progress.turn;
    const groupName = state.groups[groupKey].name;
    const finalScore = state.progress.tempScore;
    const quizIdx = state.progress.currentQuizIndex;
    
    // Save Score
    const updatedScores = [...state.groups[groupKey].scores];
    updatedScores[quizIdx] = finalScore;
    const newTotal = updatedScores.reduce((acc, val) => acc + (val || 0), 0);
    
    updateGroupState(groupKey, { scores: updatedScores, totalScore: newTotal });
    
    // Configure Transition Screen
    const quiz = state.quizzes[quizIdx];
    const groupQuestions = quiz.questions.filter((q, i) => groupKey === 'g1' ? i % 2 === 0 : i % 2 !== 0);
    const maxScore = groupQuestions.length * state.competition.maxMarks;
    
    document.getElementById('trans-title').textContent = `${groupName} Completed Quiz ${quizIdx + 1}!`;
    document.getElementById('trans-score').textContent = `Score: ${finalScore} / ${maxScore}`;
    
    if (groupKey === 'g1') {
        document.getElementById('trans-next-msg').textContent = `Get Ready, ${state.groups.g2.name}!`;
    } else {
        if (quizIdx === 4) {
            document.getElementById('trans-next-msg').textContent = `Competition Finished!`;
        } else {
            document.getElementById('trans-next-msg').textContent = `Get Ready, ${state.groups.g1.name}!`;
        }
    }
    
    route('transition');
}

// ==========================================
// TRANSITION SCREEN
// ==========================================
function transitionEvents() {
    document.getElementById('btn-continue-dash').addEventListener('click', () => {
        const state = getState();
        
        if (state.progress.turn === 'g1') {
            // Hand over to Group 2 for the same quiz
            updateState({ progress: { ...state.progress, turn: 'g2' } });
            route('dashboard');
        } else {
            // Group 2 finished, move to next quiz or finish
            if (state.progress.currentQuizIndex === 4) {
                // Game Over
                finishCompetition();
            } else {
                updateState({ 
                    progress: { 
                        ...state.progress, 
                        turn: 'g1', 
                        currentQuizIndex: state.progress.currentQuizIndex + 1 
                    } 
                });
                route('dashboard');
            }
        }
    });
}

// ==========================================
// WINNER SCREEN & HISTORY
// ==========================================
function finishCompetition() {
    const state = getState();
    const g1 = state.groups.g1;
    const g2 = state.groups.g2;
    
    // Populate Winner Screen
    document.getElementById('final-g1-avatar').src = g1.avatar;
    document.getElementById('final-g1-name').textContent = g1.name;
    document.getElementById('final-g1-score').textContent = g1.totalScore;
    
    document.getElementById('final-g2-avatar').src = g2.avatar;
    document.getElementById('final-g2-name').textContent = g2.name;
    document.getElementById('final-g2-score').textContent = g2.totalScore;
    
    const winTitle = document.getElementById('winner-name');
    const winAvatar = document.getElementById('winner-avatar');
    
    if (g1.totalScore > g2.totalScore) {
        winTitle.textContent = g1.name + ' Wins!';
        winAvatar.src = g1.avatar;
    } else if (g2.totalScore > g1.totalScore) {
        winTitle.textContent = g2.name + ' Wins!';
        winAvatar.src = g2.avatar;
    } else {
        winTitle.textContent = "It's a TIE!";
        winAvatar.style.display = 'none';
        document.querySelector('#winner-announcement h2').textContent = "🤝 DRAW 🤝";
    }
    
    route('winner');
    
    // Fire Confetti!
    if (typeof confetti === 'function') {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ef4444', '#fcd34d']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#3b82f6', '#fcd34d']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

function winnerEvents() {
    document.getElementById('btn-view-history').addEventListener('click', () => {
        populateHistory();
        route('history');
    });
    
    document.getElementById('btn-back-winner').addEventListener('click', () => {
        route('winner');
    });
    
    document.getElementById('btn-restart').addEventListener('click', () => {
        if(confirm("Are you sure you want to start a new competition? Scores will be lost, but quizzes will remain.")) {
            resetState();
            route('setup');
        }
    });
}

function populateHistory() {
    const state = getState();
    const g1 = state.groups.g1;
    const g2 = state.groups.g2;
    
    document.getElementById('hist-g1-name').textContent = g1.name;
    document.getElementById('hist-g2-name').textContent = g2.name;
    
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';
    
    for(let i=0; i<5; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>Quiz ${i+1}</td>
            <td>${g1.scores[i] !== null ? g1.scores[i] : 0}</td>
            <td>${g2.scores[i] !== null ? g2.scores[i] : 0}</td>
        `;
        tbody.appendChild(tr);
    }
    
    document.getElementById('hist-g1-total').textContent = g1.totalScore;
    document.getElementById('hist-g2-total').textContent = g2.totalScore;
}
