document.addEventListener('DOMContentLoaded', function(){
const startBtn = document.getElementById('start-button');
const introSection = document.getElementById('intro-section');
const config = document.getElementById('config-section');
const loader = document.getElementById('loader');
const form = document.getElementById('start-form');
const catSelect = document.getElementById('category');
const questionsDiv = document.getElementById('questions');

let score = 0;
let total = 0;
let playerName = '';
let questionTimes = [];
let questionStartTime = 0;

startBtn.addEventListener('click', () => {
  introSection.classList.add('hidden');
  config.classList.remove('hidden');
  loadCategories();
});

async function loadCategories() {
  try {
    const res = await fetch('https://opentdb.com/api_category.php');
    const data = await res.json();
    const allowedIds = [9, 11, 12, 15, 17];
    data.trivia_categories.forEach(c => {
      if (allowedIds.includes(c.id)) {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        catSelect.appendChild(opt);
      }
    });
  } catch (e) {
    console.error('Error cargando categorías', e);
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  loader.classList.remove('hidden');
  questionsDiv.innerHTML = '';
  score = 0;
  total = 0;
  playerName = document.getElementById('player-name').value;
  questionTimes = [];
  config.classList.add('hidden');
  const amount = form['question-count'].value;
  const diff = form.difficulty.value;
  const cat = form.category.value;
  const url = `https://opentdb.com/api.php?amount=${amount}&difficulty=${diff}&type=multiple${cat ? '&category=' + cat : ''}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results.length === 0) {
      questionsDiv.innerHTML = '<p>No se encontraron preguntas para esa configuración.</p>';
      loader.classList.add('hidden');
      return;
    }
    total = data.results.length;
    showQuestions(data.results);
  } catch (e) {
    console.error('Error al obtener preguntas', e);
  } finally {
    loader.classList.add('hidden');
  }
});

function decodeHtml(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function showQuestions(questions) {
  const introSection = document.getElementById('intro-section');
  if (introSection) introSection.classList.add('hidden');
  questionsDiv.innerHTML = '';
  let current = 0;
  let correct = 0;
  let incorrect = 0;
  let score = 0;
  const scoreboard = document.getElementById('scoreboard');
  let timer = null;
  let timeLeft = 20;

  scoreboard.classList.remove('hidden');

  function updateScoreboard() {
    document.getElementById('score').textContent = score;
    document.getElementById('correct').textContent = correct;
    document.getElementById('incorrect').textContent = incorrect;
  }

  function showQuestion(idx) {
    questionsDiv.innerHTML = '';
    questionStartTime = Date.now();
    const q = questions[idx];
    const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
    // Crear el div principal con la clase question-card
    const qDiv = document.createElement('div');
    qDiv.className = 'question-card';
    qDiv.innerHTML = `
      <div>
        Pregunta ${idx + 1} de ${questions.length}
      </div>
      <strong>Pregunta ${idx + 1}:</strong> ${decodeHtml(q.question)}<br>
    `;

    const timerDiv = document.createElement('div');
    timerDiv.textContent = `Tiempo restante: 20s`;
    qDiv.appendChild(timerDiv);

    timeLeft = 20;

    timer = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = `Tiempo restante: ${timeLeft}s`;
      if (timeLeft === 0) {
        clearInterval(timer);
        finishQuestion();
        Array.from(qDiv.querySelectorAll('button')).forEach(b => b.disabled = true);
        Array.from(qDiv.querySelectorAll('button')).forEach(b => {
          if (b.textContent === decodeHtml(q.correct_answer)) {
            b.style.background = '#27ae60';
            b.style.color = '#fff';
          }
        });
        incorrect++;
        updateScoreboard();
        setTimeout(() => nextQuestion(), 1200);
      }
    }, 1000);

    answers.forEach(a => {
      const btn = document.createElement('button');
      btn.textContent = decodeHtml(a);
      btn.onclick = function () {
        if (btn.disabled) return;
        clearInterval(timer);
        finishQuestion();
        if (a === q.correct_answer) {
          btn.style.background = '#27ae60';
          btn.style.color = '#fff';
          score += 10;
          correct++;
        } else {
          btn.style.background = '#c0392b';
          btn.style.color = '#fff';
          Array.from(qDiv.querySelectorAll('button')).forEach(b => {
            if (b.textContent === decodeHtml(q.correct_answer)) {
              b.style.background = '#27ae60';
              b.style.color = '#fff';
            }
          });
          incorrect++;
        }
        updateScoreboard();
        setTimeout(() => nextQuestion(), 1200);
      };
      qDiv.appendChild(btn);
    });
    questionsDiv.appendChild(qDiv);
  }

  function nextQuestion() {
    current++;
    if (current < questions.length) {
      showQuestion(current);
    } else {
      showFinalResults(questions, correct, incorrect, score, questionTimes);
    }
  }

  updateScoreboard();
  showQuestion(current);
}

function finishQuestion() {
  const elapsed = (Date.now() - questionStartTime) / 1000;
  questionTimes.push(elapsed);
}

function showFinalResults(questions, correct, incorrect, score, questionTimes) {
  const totalQuestions = questions.length;
  const percent = ((correct / totalQuestions) * 100).toFixed(1);
  const avgTime = (questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length).toFixed(2);

  questionsDiv.innerHTML = `
    <div class="final-results-card">
      <b>Game Over!</b><br>
      <b>Player:</b> ${playerName}<br>
      <b>Score:</b> ${score}<br>
      <b>Correct:</b> ${correct} / ${totalQuestions}<br>
      <b>Accuracy:</b> ${percent}%<br>
      <b>Average time per question:</b> ${avgTime} s<br><br>
      <button id="play-again-btn">Play Again</button>
      <button id="change-config-btn">Change Settings</button>
      <button id="exit-btn">Exit</button>
    </div>
  `;
  scoreboard.classList.add('hidden');

  document.getElementById('play-again-btn').onclick = () => {
    scoreboard.classList.remove('hidden');
    showQuestions(questions);
  };
  document.getElementById('change-config-btn').onclick = () => {
    questionsDiv.innerHTML = '';
    config.classList.remove('hidden');
    scoreboard.classList.add('hidden');
  };
  document.getElementById('exit-btn').onclick = () => {
    questionsDiv.innerHTML = '<div class="thanks-message">Thanks for playing!</div>';
    scoreboard.classList.add('hidden');
  };
}
});