import { getState } from './store.js';

export function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
}

export function updateDashboard() {
    const state = getState();
    
    // Names and Avatars
    document.getElementById('dash-g1-name').textContent = state.groups.g1.name;
    document.getElementById('dash-g1-avatar').src = state.groups.g1.avatar;
    document.getElementById('dash-g2-name').textContent = state.groups.g2.name;
    document.getElementById('dash-g2-avatar').src = state.groups.g2.avatar;
    
    // Total Scores
    document.getElementById('dash-g1-total').textContent = state.groups.g1.totalScore;
    document.getElementById('dash-g2-total').textContent = state.groups.g2.totalScore;
    
    // Title
    document.getElementById('dash-comp-name').textContent = state.competition.name;
    
    // Turn Indicator
    const currentGroup = state.groups[state.progress.turn];
    const turnNameEl = document.getElementById('current-turn-name');
    turnNameEl.textContent = currentGroup.name;
    turnNameEl.className = state.progress.turn === 'g1' ? 'animate-bounce text-glow group-1-theme' : 'animate-bounce text-glow group-2-theme';
    
    document.getElementById('current-round-text').textContent = `Round ${state.progress.currentQuizIndex + 1} / 5 (Quiz ${state.progress.currentQuizIndex + 1})`;
    
    // Progress Lists
    const g1List = document.getElementById('prog-g1-list');
    const g2List = document.getElementById('prog-g2-list');
    g1List.innerHTML = '';
    g2List.innerHTML = '';
    
    for(let i=0; i<5; i++) {
        const g1Completed = state.groups.g1.scores[i] !== null;
        const g2Completed = state.groups.g2.scores[i] !== null;
        
        g1List.innerHTML += `<li class="${g1Completed ? 'completed' : 'pending'}">Quiz ${i+1}</li>`;
        g2List.innerHTML += `<li class="${g2Completed ? 'completed' : 'pending'}">Quiz ${i+1}</li>`;
    }

    // Scoreboard Table
    const tbody = document.getElementById('scoreboard-body');
    tbody.innerHTML = '';
    ['g1', 'g2'].forEach(g => {
        const tr = document.createElement('tr');
        const group = state.groups[g];
        let html = `<td><strong>${group.name}</strong></td>`;
        for(let i=0; i<5; i++) {
            html += `<td>${group.scores[i] !== null ? group.scores[i] : '-'}</td>`;
        }
        html += `<td><strong>${group.totalScore}</strong></td>`;
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}
