document.addEventListener('DOMContentLoaded', function(){
const startBtn = document.getElementById('start-button');
const config = document.getElementById('config-section');
const loader = document.getElementById('loader');
const form = document.getElementById('start-form');
const catSelect = document.getElementById('category');
const questionsDiv = document.getElementById('questions');

let score = 0;
let total = 0;

startBtn.addEventListener('click', () => {
  startBtn.classList.add('hidden');
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
  questionsDiv.innerHTML = '';
  let answered = 0;
  questions.forEach((q, i) => {
    const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
    const qDiv = document.createElement('div');
    qDiv.style.marginBottom = '20px';
    qDiv.innerHTML = `<strong>Pregunta ${i + 1}:</strong> ${decodeHtml(q.question)}<br>`;
    answers.forEach(a => {
      const btn = document.createElement('button');
      btn.style.margin = '4px';
      btn.textContent = decodeHtml(a);
      btn.onclick = function () {
        if (btn.disabled) return;
        // Deshabilitar todos los botones de esta pregunta
        Array.from(qDiv.querySelectorAll('button')).forEach(b => b.disabled = true);
        answered++;
        if (a === q.correct_answer) {
          btn.style.background = '#27ae60';
          btn.style.color = '#fff';
          score++;
        } else {
          btn.style.background = '#c0392b';
          btn.style.color = '#fff';
 
          Array.from(qDiv.querySelectorAll('button')).forEach(b => {
            if (b.textContent === decodeHtml(q.correct_answer)) {
              b.style.background = '#27ae60';
              b.style.color = '#fff';
            }
          });
        }
 
        if (answered === total) {
          questionsDiv.innerHTML += `<div style="font-size:1.3em;margin-top:20px;"><b>¡Terminaste!</b> Puntaje: ${score} de ${total}</div>`;
        }
      };
      qDiv.appendChild(btn);
    });
    questionsDiv.appendChild(qDiv);
  });
}
}); 