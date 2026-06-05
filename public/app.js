const GOOGLE_SHEET_URL = "COLLE_TON_URL_APPS_SCRIPT_ICI";

const questions = [
  {
    title: "Qu'est-ce qui est le plus lourd à gérer pour toi en ce moment ?",
    type: "textarea",
    placeholder: "Décris ce qui te pèse le plus actuellement..."
  },

  {
    title: "Qu'est-ce que cette situation impacte aujourd'hui ?",
    type: "cards",
    options: [
      "⚡ Énergie",
      "😴 Sommeil",
      "🧠 Clarté mentale",
      "📈 Productivité",
      "❤️ Relations",
      "🏠 Vie personnelle",
      "💪 Santé",
      "🎯 Motivation"
    ]
  },

  {
    title: "Si rien ne change dans les prochains mois, qu'est-ce qui risque de se passer ?",
    type: "textarea",
    placeholder: "Projette-toi honnêtement..."
  },

  {
    title: "Si cette situation était réglée demain, qu'est-ce que cela changerait pour toi ?",
    type: "textarea",
    placeholder: "Décris ce que tu aimerais retrouver..."
  },

  {
    title: "Qu'est-ce qui t'empêche encore de régler ça aujourd'hui ?",
    type: "cards",
    options: [
      "Je manque de temps",
      "Je repousse toujours",
      "Je ne sais pas par où commencer",
      "J’ai déjà essayé seul(e)",
      "Je n’ose pas demander de l’aide"
    ]
  },

  {
    title: "Si on se reparle dans 6 mois et que rien n'a changé, serais-tu déçu(e) de toi-même ?",
    type: "decision"
  }
];

let currentStep = 0;
let answers = {};
let readinessScore = 5;

const questionView = document.getElementById("questionView");
const summaryView = document.getElementById("summaryView");
const stepsEl = document.getElementById("steps");

function renderSteps() {

  stepsEl.innerHTML = questions.map((_, index) => `
    <div class="step ${index === currentStep ? "active" : ""}">
      <span>${index + 1}</span>
      Étape ${index + 1}
    </div>
  `).join("");
}

function renderQuestion() {

  renderSteps();

  const q = questions[currentStep];

  questionView.innerHTML = `
    <div class="badge">
      Étape ${currentStep + 1} sur ${questions.length}
    </div>

    <h2>${q.title}</h2>

    ${renderInput(q)}

    <div class="footer">

      <button class="btn secondary" onclick="prevStep()">
        ← Précédent
      </button>

      <button class="btn primary" onclick="nextStep()">
        ${currentStep === questions.length - 1 ? "Voir ma synthèse" : "Suivant →"}
      </button>

    </div>
  `;
}

function renderInput(q) {

  if (q.type === "textarea") {

    return `
      <textarea
        placeholder="${q.placeholder}"
        oninput="saveText(this.value)"
      >${answers[currentStep] || ""}</textarea>
    `;
  }

  if (q.type === "cards") {

    const selected = answers[currentStep] || [];

    return `
      <div class="card-options">

        ${q.options.map(option => `
          <button
            class="choice-card ${selected.includes(option) ? "selected" : ""}"
            onclick="toggleCard('${option}')"
          >
            ${option}
          </button>
        `).join("")}

      </div>
    `;
  }

  if (q.type === "decision") {

    return `
      <div class="decision-box">

        <div class="score-title">
          Sur 10, à quel point souhaites-tu vraiment faire évoluer cette situation ?
        </div>

        <div class="score-buttons">

          ${[1,2,3,4,5,6,7,8,9,10].map(n => `
            <button
              class="score-btn ${readinessScore === n ? "active" : ""}"
              onclick="saveReadiness(${n})"
            >
              ${n}
            </button>
          `).join("")}

        </div>

      </div>
    `;
  }
}

function saveText(value) {
  answers[currentStep] = value;
}

function toggleCard(option) {

  if (!answers[currentStep]) {
    answers[currentStep] = [];
  }

  if (answers[currentStep].includes(option)) {

    answers[currentStep] =
      answers[currentStep].filter(item => item !== option);

  } else {

    answers[currentStep].push(option);
  }

  renderQuestion();
}

function saveReadiness(value) {

  readinessScore = value;

  answers[currentStep] = value;

  renderQuestion();
}

function nextStep() {

  if (currentStep < questions.length - 1) {

    currentStep++;
    renderQuestion();

  } else {

    renderSummary();
  }
}

function prevStep() {

  if (currentStep > 0) {

    currentStep--;
    renderQuestion();
  }
}

function calculateScore() {

  let score = readinessScore * 10;

  score += ((answers[1] || []).length * 5);

  score += ((answers[4] || []).length * 5);

  return Math.min(score, 100);
}

function getUrgency(score) {

  if (score >= 80) return "🔴 Élevé";

  if (score >= 60) return "🟠 Modéré à élevé";

  if (score >= 40) return "🟡 Modéré";

  return "⚪ Faible";
}

function renderSummary() {

  questionView.classList.add("hidden");

  summaryView.classList.remove("hidden");

  const score = calculateScore();

  summaryView.innerHTML = `
    <div class="summary-layout">

      <div class="summary-content">

        <h2>Ta synthèse personnalisée</h2>

        <div class="result-grid">

          <div class="result-card">
            <span>Score</span>
            <strong>${score}/100</strong>
          </div>

          <div class="result-card">
            <span>Urgence</span>
            <strong>${getUrgency(score)}</strong>
          </div>

        </div>

        <div class="cta">

          <h3>Prêt(e) à faire le point avec Sandra ?</h3>

          <p>
            Laisse tes coordonnées pour être recontacté(e).
          </p>

          <input
            type="text"
            id="firstName"
            placeholder="Prénom *"
          >

          <input
            type="email"
            id="email"
            placeholder="Email *"
          >

          <input
            type="tel"
            id="phone"
            placeholder="Téléphone"
          >

          <label class="consent">

            <input type="checkbox" id="consent">

            J'accepte d'être recontacté(e)

          </label>

          <button onclick="submitLead()">
            Demander un échange
          </button>

          <div id="successMessage"></div>

        </div>

      </div>

    </div>
  `;
}

async function submitLead() {

  const firstName =
    document.getElementById("firstName").value;

  const email =
    document.getElementById("email").value;

  const phone =
    document.getElementById("phone").value;

  const consent =
    document.getElementById("consent").checked;

  if (!firstName || !email || !consent) {

    alert("Merci de remplir les champs obligatoires.");

    return;
  }

  const payload = {

    score: calculateScore(),

    urgence: getUrgency(calculateScore()),

    situation: answers[0],

    impacts: (answers[1] || []).join(", "),

    projection: answers[2],

    desire: answers[3],

    blocages: (answers[4] || []).join(", "),

    preparation: readinessScore,

    firstName,

    email,

    phone,

    consent
  };

  try {

    await fetch(GOOGLE_SHEET_URL, {

      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(payload)
    });

    document.getElementById("successMessage").innerHTML = `
      ✅ Merci ${firstName} !
      Sandra reviendra vers vous prochainement.
    `;

  } catch (error) {

    alert("Erreur lors de l'envoi.");
  }
}

renderQuestion();