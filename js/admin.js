import { getState, updateState } from './store.js';

let activeQuizIndex = 0;

export function initAdmin() {
    const state = getState();
    
    // Navigation Buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeQuizIndex = parseInt(e.target.dataset.quizIdx);
            renderQuestionsList();
        });
    });

    // Question Type Selection
    const qTypeSelect = document.getElementById('new-q-type');
    const mcqSetup = document.getElementById('mcq-options-setup');
    const tfSetup = document.getElementById('tf-options-setup');
    
    qTypeSelect.addEventListener('change', (e) => {
        if(e.target.value === 'mcq') {
            mcqSetup.classList.remove('hidden');
            tfSetup.classList.add('hidden');
        } else {
            mcqSetup.classList.add('hidden');
            tfSetup.classList.remove('hidden');
        }
    });

    // Add Question Button
    document.getElementById('btn-add-question').addEventListener('click', () => {
        const text = document.getElementById('new-q-text').value.trim();
        const type = qTypeSelect.value;
        if (!text) return alert("Question text cannot be empty.");
        
        let questionData = { text, type, options: [], correctIdx: -1 };
        
        if (type === 'mcq') {
            for(let i=0; i<4; i++) {
                questionData.options.push(document.getElementById(`opt-${i}`).value || `Option ${i+1}`);
            }
            const correctRadio = document.querySelector('input[name="correct-mcq"]:checked');
            questionData.correctIdx = parseInt(correctRadio.value);
        } else if (type === 'tf') {
            questionData.options = ['True', 'False'];
            const correctRadio = document.querySelector('input[name="correct-tf"]:checked');
            questionData.correctIdx = correctRadio.value === 'true' ? 0 : 1;
        }

        const state = getState();
        state.quizzes[activeQuizIndex].questions.push(questionData);
        updateState({ quizzes: state.quizzes });
        
        renderQuestionsList();
        
        // Reset Inputs
        document.getElementById('new-q-text').value = '';
        for(let i=0; i<4; i++) {
            const opt = document.getElementById(`opt-${i}`);
            if (opt) opt.value = '';
        }
    });

    // Global Delegate for Delete Buttons
    document.getElementById('questions-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const qIdx = parseInt(e.target.dataset.qIdx);
            const state = getState();
            state.quizzes[activeQuizIndex].questions.splice(qIdx, 1);
            updateState({ quizzes: state.quizzes });
            renderQuestionsList();
        }
    });

    renderQuestionsList();
}

function renderQuestionsList() {
    const state = getState();
    const list = document.getElementById('questions-list');
    const quiz = state.quizzes[activeQuizIndex];
    document.getElementById('editor-title').textContent = `Editing Quiz ${activeQuizIndex + 1} (${quiz.questions.length} questions)`;
    
    list.innerHTML = '';
    
    if (quiz.questions.length === 0) {
        list.innerHTML = '<p class="text-secondary mb-4">No questions added yet. Add one below!</p>';
        return;
    }
    
    quiz.questions.forEach((q, idx) => {
        const el = document.createElement('div');
        el.className = 'question-item';
        
        let optionsHtml = '<ul style="margin-left:1.5rem; margin-top:0.5rem; color:#cbd5e1;">';
        q.options.forEach((opt, oIdx) => {
            const isCorrect = oIdx === q.correctIdx;
            optionsHtml += `<li style="${isCorrect ? 'color:#10b981; font-weight:bold;' : ''}">${opt} ${isCorrect ? ' (Correct)' : ''}</li>`;
        });
        optionsHtml += '</ul>';
        
        el.innerHTML = `
            <strong>Q${idx + 1}: ${q.text}</strong>
            <button class="delete-btn" data-q-idx="${idx}">Delete</button>
            ${optionsHtml}
        `;
        list.appendChild(el);
    });
}
