const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwvcSMB--xJFMhw4iwPL2gX8gwCOLLQUWGJTph4qfe00CjuU7Jn8mlKxYz6X2gX_ssx4g/exec";

const steps = [
  "Situation",
  "Impact",
  "Projection",
  "Désir",
  "Blocage",
  "Décision",
  "Synthèse"
];

const questions = [
  {
    title: "Qu'est-ce qui est le plus lourd à gérer pour toi en ce moment ?",
    highlight: "le plus lourd",
    hint: "💡 Décris ce qui te prend le plus d’énergie aujourd’hui.",
    type: "textarea",
    placeholder: "Stress, charge mentale, manque de temps, pression, fatigue..."
  },
  {
    title: "Qu'est-ce que cette situation te coûte déjà aujourd'hui ?",
    highlight: "te coûte",
    hint: "💡 Sélectionne tout ce qui correspond à ta situation.",
    type: "cards",
    options: [
      "⚡ Énergie",
      "😴 Sommeil",
      "🧠 Clarté mentale",
      "📈 Productivité",
      "❤️ Relations",
      "🏠 Vie personnelle",
      "💪 Santé",
      "🎯 Motivation",
      "😤 Patience",
      "🧭 Confiance"
    ]
  },
  {
    title: "Si rien ne change dans les 3 à 6 prochains mois, comment tu te vois ?",
    highlight: "rien ne change",
    hint: "💡 Imagine le scénario le plus probable si tu continues comme ça.",
    type: "textarea",
    placeholder: "Qu’est-ce qui risque de se passer pour toi, ton activité, ton entourage ?"
  },
  {
    title: "Si cette situation disparaissait demain, qu'est-ce que cela changerait concrètement pour toi ?",
    highlight: "disparaissait demain",
    hint: "💡 Décris ce que tu aimerais retrouver.",
    type: "textarea",
    placeholder: "Plus de sérénité, plus de temps, plus de clarté, plus d’énergie..."
  },
  {
    title: "Qu'est-ce qui t'empêche de régler ça aujourd'hui ?",
    highlight: "t'empêche",
    hint: "💡 Sélectionne les freins qui te parlent le plus.",
    type: "cards",
    options: [
      "Je ne sais pas par où commencer",
      "Je manque de temps",
      "J’ai déjà essayé seul(e)",
      "Je repousse toujours",
      "J’ai du mal à demander de l’aide",
      "Je ne veux pas montrer que je suis en difficulté",
      "Je ne sais pas si un accompagnement peut m’aider",
      "Je n’ai pas encore pris le temps de m’en occuper"
    ]
  },
  {
    title: "Si on se reparle dans 6 mois et que rien n'a changé, serais-tu déçu(e) de toi-même ?",
    highlight: "rien n'a changé",
    hint: "💡 Cette question permet de mesurer ton envie réelle de changement.",
    type: "decision"
  }
];

let currentStep = 0;
let answers = {};
let readinessScore = 5;
let conditionalAnswer = "";
let hasSubmittedToSheet = false;

const stepsEl = document.getElementById("steps");
const questionView = document.getElementById("questionView");
const summaryView = document.getElementById("summaryView");
const exitButton = document.querySelector(".exit");

function renderSteps() {
  stepsEl.innerHTML = steps.map((step, index) => `
    <div class="step ${index === currentStep ? "active" : ""}">
      <span>${index + 1}</span>
      ${step}
    </div>
  `).join("");
}

function renderQuestion() {
  summaryView.classList.add("hidden");
  questionView.classList.remove("hidden");

  const q = questions[currentStep];

  questionView.innerHTML = `
    <div class="badge">Étape ${currentStep + 1} sur ${questions.length}</div>
    <h2>${q.title.replace(q.highlight, `<span class="gold">${q.highlight}</span>`)}</h2>
    <div class="hint">${q.hint}</div>

    ${renderInput(q)}

    <div class="footer">
      <button class="btn secondary" onclick="prevStep()">← Précédent</button>

      <div class="dots">
        ${questions.map((_, i) => `<div class="dot ${i === currentStep ? "active" : ""}"></div>`).join("")}
      </div>

      <button class="btn primary" onclick="nextStep()">
        ${currentStep === questions.length - 1 ? "Voir ma synthèse" : "Suivant →"}
      </button>
    </div>
  `;
}

function renderInput(q) {
  if (q.type === "textarea") return renderTextarea(q);
  if (q.type === "cards") return renderCards(q);
  if (q.type === "decision") return renderDecision();
  return "";
}

function renderTextarea(q) {
  const value = answers[currentStep] || "";

  return `
    <textarea maxlength="500" placeholder="${q.placeholder}" oninput="saveText(this.value)">${value}</textarea>
    <div class="counter">${value.length} / 500</div>
  `;
}

function renderCards(q) {
  const selected = answers[currentStep] || [];

  return `
    <div class="card-options">
      ${q.options.map(option => `
        <button 
          type="button" 
          class="choice-card ${selected.includes(option) ? "selected" : ""}" 
          onclick="toggleCard('${escapeText(option)}')"
        >
          ${option}
        </button>
      `).join("")}
    </div>
  `;
}

function renderDecision() {
  const disappointed = answers[currentStep]?.disappointed || "";
  const conditional = answers[currentStep]?.conditional || "";

  return `
    <div class="decision-box">
      <div class="decision-section">
        <label>
          Si on se reparle dans 6 mois et que rien n'a changé,
          serais-tu déçu(e) de toi-même ?
        </label>

        <div class="yes-no">
          <button class="${disappointed === "Oui" ? "selected" : ""}" onclick="saveDisappointed('Oui')">Oui</button>
          <button class="${disappointed === "Non" ? "selected" : ""}" onclick="saveDisappointed('Non')">Non</button>
          <button class="${disappointed === "Je ne sais pas" ? "selected" : ""}" onclick="saveDisappointed('Je ne sais pas')">Je ne sais pas</button>
        </div>
      </div>

      <div class="decision-section score-section">
        <div class="score-title">
          Sur une échelle de 1 à 10, à quel point es-tu prêt(e) à agir pour changer cette situation ?
        </div>

        <div class="score-buttons">
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `
            <button 
              type="button"
              class="score-btn ${readinessScore === n ? "active" : ""}" 
              onclick="saveReadiness(${n})"
            >
              ${n}
            </button>
          `).join("")}
        </div>

        <div class="score-labels">
          <span>Pas prêt(e) du tout</span>
          <span>Prêt(e) à agir maintenant</span>
        </div>
      </div>

      <div class="decision-section conditional-question">
        <label>
          ${readinessScore >= 7 
            ? "Qu’est-ce qui te ferait passer à l’action aujourd’hui ?" 
            : "Qu’est-ce qui manque encore pour que tu te sentes prêt(e) ?"}
        </label>

        <textarea maxlength="400" placeholder="Écris ta réponse ici..." oninput="saveConditional(this.value)">${conditional}</textarea>
      </div>
    </div>
  `;
}

function saveText(value) {
  answers[currentStep] = value;
  const counter = document.querySelector(".counter");
  if (counter) counter.textContent = `${value.length} / 500`;
}

function toggleCard(option) {
  option = unescapeText(option);

  if (!answers[currentStep]) answers[currentStep] = [];

  if (answers[currentStep].includes(option)) {
    answers[currentStep] = answers[currentStep].filter(item => item !== option);
  } else {
    answers[currentStep].push(option);
  }

  renderQuestion();
}

function saveDisappointed(value) {
  answers[currentStep] = {
    ...(answers[currentStep] || {}),
    disappointed: value,
    readiness: readinessScore,
    conditional: conditionalAnswer
  };

  renderQuestion();
}

function saveReadiness(value) {
  readinessScore = Number(value);

  answers[currentStep] = {
    ...(answers[currentStep] || {}),
    readiness: readinessScore,
    conditional: conditionalAnswer
  };

  renderQuestion();
}

function saveConditional(value) {
  conditionalAnswer = value;

  answers[currentStep] = {
    ...(answers[currentStep] || {}),
    readiness: readinessScore,
    conditional: value
  };
}

function nextStep() {
  if (currentStep < questions.length - 1) {
    currentStep++;
    render();
  } else {
    currentStep = steps.length - 1;
    renderSummary();
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    render();
  }
}

function calculateUrgency() {
  const impactCount = (answers[1] || []).length;
  const blocageCount = (answers[4] || []).length;
  const decision = answers[5] || {};

  let score = 0;

  score += impactCount * 6;
  score += blocageCount * 4;
  score += readinessScore * 4;

  if (decision.disappointed === "Oui") score += 20;
  if (decision.disappointed === "Je ne sais pas") score += 8;

  return Math.min(score, 100);
}

function getStatus(score) {
  if (score >= 80) return "Priorité élevée";
  if (score >= 60) return "Besoin réel";
  if (score >= 40) return "Prise de conscience en cours";
  return "Besoin encore peu assumé";
}

function getUrgencyLabel(score) {
  if (score >= 80) return "🔴 Élevé";
  if (score >= 60) return "🟠 Modéré à élevé";
  if (score >= 40) return "🟡 Modéré";
  return "⚪ Faible";
}

async function sendToGoogleSheet(payload) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("Diagnostic envoyé à Google Sheets.");
  } catch (error) {
    console.error("Erreur Google Sheets :", error);
  }
}

function renderSummary() {
  renderSteps();
  questionView.classList.add("hidden");
  summaryView.classList.remove("hidden");

  const situation = answers[0] || "Tu sembles porter beaucoup de responsabilités au quotidien.";
  const impacts = answers[1] || [];
  const projection = answers[2] || "Cette situation risque de continuer à peser sur ton énergie, ta clarté et ton équilibre.";
  const desire = answers[3] || "Tu recherches probablement plus de clarté, de sérénité et de contrôle.";
  const blockers = answers[4] || [];
  const decision = answers[5] || {};

  const score = calculateUrgency();
  const status = getStatus(score);
  const urgency = getUrgencyLabel(score);

  if (!hasSubmittedToSheet) {
    hasSubmittedToSheet = true;

    sendToGoogleSheet({
      score,
      urgence: urgency,
      statut: status,
      readiness: decision.readiness || readinessScore,
      disappointed: decision.disappointed || "",
      situation,
      impacts,
      projection,
      desire,
      blockers,
      conditional: decision.conditional || ""
    });
  }

  summaryView.innerHTML = `
    <div class="summary-layout">
      <aside class="summary-left">
        <div class="logo">✦</div>
        <h3>Ta synthèse personnalisée</h3>
        <p>Voici ce qui ressort de tes réponses.</p>

        <div class="summary-tabs">
          <div>Ce que tu vis</div>
          <div>Ce que cela te coûte</div>
          <div>Le risque si rien ne change</div>
          <div>Ce que tu veux retrouver</div>
          <div>Ton niveau d’urgence</div>
        </div>
      </aside>

      <div class="summary-content">
        <section>
          <h3>Ce que tu vis aujourd’hui</h3>
          <p>${situation}</p>
        </section>

        <section>
          <h3>Ce que cela te coûte</h3>
          <p>
            Cette situation semble déjà toucher :
            <strong>${impacts.length ? impacts.join(", ") : "ton énergie, ta clarté mentale ou ton équilibre personnel"}</strong>.
          </p>
        </section>

        <section>
          <h3>Si rien ne change</h3>
          <p>${projection}</p>
        </section>

        <section>
          <h3>Ce que tu recherches vraiment</h3>
          <p>${desire}</p>
        </section>

        <section>
          <h3>Ce qui peut encore te freiner</h3>
          <p>
            ${blockers.length ? blockers.join(", ") : "Tu n’as pas identifié de frein précis, mais il peut être utile de clarifier ce qui bloque encore le passage à l’action."}
          </p>
        </section>

        <section>
          <h3>Ton niveau d’urgence</h3>
          <div class="result-grid">
            <div class="result-card">
              <span>Score</span>
              <strong>${score}/100</strong>
            </div>
            <div class="result-card">
              <span>Urgence</span>
              <strong>${urgency}</strong>
            </div>
            <div class="result-card">
              <span>Préparation au changement</span>
              <strong>${decision.readiness || readinessScore}/10</strong>
            </div>
            <div class="result-card">
              <span>Statut</span>
              <strong>${status}</strong>
            </div>
          </div>
        </section>

        <section>
          <h3>Ce que cela peut vouloir dire</h3>
          <p>
            Ce n’est probablement pas seulement une question de stress ou d’organisation.
            Ce que tu recherches semble être davantage de la clarté, de la stabilité intérieure
            et la sensation de reprendre le contrôle de ton quotidien.
          </p>
        </section>

        <aside class="cta">
          <h3>Prêt(e) à faire le point avec Sandra ?</h3>
          <p>
            Un échange peut t’aider à clarifier ta situation, comprendre ce qui te bloque
            et identifier les premiers leviers pour avancer plus sereinement.
          </p>
          <button type="button">Demander un échange</button>
          <small>Aucun engagement. Juste un échange pour y voir plus clair.</small>
        </aside>
      </div>
    </div>
  `;
}

function resetDiagnostic() {
  const confirmExit = confirm("Veux-tu vraiment quitter le diagnostic ? Tes réponses seront réinitialisées.");

  if (!confirmExit) return;

  answers = {};
  currentStep = 0;
  readinessScore = 5;
  conditionalAnswer = "";
  hasSubmittedToSheet = false;

  render();
}

function render() {
  renderSteps();
  renderQuestion();
}

function escapeText(text) {
  return text.replace(/'/g, "\\'");
}

function unescapeText(text) {
  return text.replace(/\\'/g, "'");
}

if (exitButton) {
  exitButton.addEventListener("click", resetDiagnostic);
}

render();