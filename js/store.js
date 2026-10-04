const STORAGE_KEY = 'quizBattleState';

const defaultState = {
    screen: 'setup', // setup, admin, dashboard, quiz, transition, winner, history
    competition: {
        name: '',
        maxMarks: 10
    },
    groups: {
        g1: { name: '', avatar: '', scores: [null, null, null, null, null], totalScore: 0 },
        g2: { name: '', avatar: '', scores: [null, null, null, null, null], totalScore: 0 }
    },
    quizzes: [
        { id: 0, name: 'Quiz 1', questions: [] },
        { id: 1, name: 'Quiz 2', questions: [] },
        { id: 2, name: 'Quiz 3', questions: [] },
        { id: 3, name: 'Quiz 4', questions: [] },
        { id: 4, name: 'Quiz 5', questions: [] }
    ],
    progress: {
        turn: 'g1', // 'g1' or 'g2'
        currentQuizIndex: 0, // 0 to 4
        currentQuestionIndex: 0,
        tempScore: 0
    }
};

let state = null;

export function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch(e) {
            console.error("Failed to parse state", e);
            state = JSON.parse(JSON.stringify(defaultState));
        }
    } else {
        state = JSON.parse(JSON.stringify(defaultState));
    }
    return state;
}

export function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getState() {
    if (!state) loadState();
    return state;
}

export function updateState(newState) {
    state = { ...state, ...newState };
    saveState();
}

export function updateGroupState(groupId, updates) {
    state.groups[groupId] = { ...state.groups[groupId], ...updates };
    saveState();
}

export function resetState() {
    // Keep the quizzes but reset progress, groups, and competition
    const oldQuizzes = state ? state.quizzes : defaultState.quizzes;
    state = JSON.parse(JSON.stringify(defaultState));
    state.quizzes = oldQuizzes; // Preserve quizzes
    saveState();
}
