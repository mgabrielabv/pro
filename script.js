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

startBtn.addEventListener('click', () => {
  introSection.classList.add('hidden');
  config.classList.remove('hidden');
  loadCategories();
});

async function loadCategories() {
  try {
    const res = await fetch('https://opentdb.com/api_category.php');
    const data = await res.json();
    data.trivia_categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
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
    const q = questions[idx];
    const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
    const qDiv = document.createElement('div');
    qDiv.style.marginBottom = '20px';
    qDiv.innerHTML = `<strong>Pregunta ${idx + 1}:</strong> ${decodeHtml(q.question)}<br>`;

    const timerDiv = document.createElement('div');
    timerDiv.style.fontWeight = 'bold';
    timerDiv.style.margin = '10px 0';
    timerDiv.textContent = `Tiempo restante: 20s`;
    qDiv.appendChild(timerDiv);

    timeLeft = 20;
    timerDiv.style.color = '#222';

    timer = setInterval(() => {
      timeLeft--;
      timerDiv.textContent = `Tiempo restante: ${timeLeft}s`;
      if (timeLeft <= 5) {
        timerDiv.style.color = '#c0392b';
        timerDiv.style.fontSize = '1.2em';
      } else {
        timerDiv.style.color = '#222';
        timerDiv.style.fontSize = '1em';
      }
      if (timeLeft === 0) {
        clearInterval(timer);
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
      btn.style.margin = '4px';
      btn.textContent = decodeHtml(a);
      btn.onclick = function () {
        if (btn.disabled) return;
        clearInterval(timer);
        Array.from(qDiv.querySelectorAll('button')).forEach(b => b.disabled = true);
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
      questionsDiv.innerHTML += `<div style="font-size:1.3em;margin-top:20px;"><b>¡Terminaste!</b><br>Puntaje final: ${score}<br>Correctas: ${correct}<br>Incorrectas: ${incorrect}</div>`;
    }
  }

  updateScoreboard();
  showQuestion(current);
}
});