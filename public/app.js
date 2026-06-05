const GOOGLE_SHEET_URL = "COLLE_TON_URL_APPS_SCRIPT_ICI";

const questions = [
  {
    title: "Qu'est-ce qui est le plus lourd à gérer pour toi en ce moment ?",
    highlight: "plus lourd",
    type: "textarea",
    placeholder: "Décris ce qui te pèse le plus actuellement..."
  },
  {
    title: "Qu'est-ce que cette situation impacte aujourd'hui ?",
    highlight: "impacte",
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
    highlight: "rien ne change",
    type: "textarea",
    placeholder: "Projette-toi honnêtement..."
  },
  {
    title: "Si cette situation était réglée demain, qu'est-ce que cela changerait pour toi ?",
    highlight: "réglée demain",
    type: "textarea",
    placeholder: "Décris ce que tu aimerais retrouver..."
  },
  {
    title: "Qu'est-ce qui t'empêche encore de régler ça aujourd'hui ?",
    highlight: "t'empêche",
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
    highlight: "rien n'a changé",
    type: "decision"
  }
];

const stepLabels = [
  "Situation actuelle",
  "Impacts aujourd’hui",
  "Si rien ne change",
  "Si c’était réglé",
  "Ce qui bloque",
  "Préparation"
];

let currentStep = 0;
let answers = {};
let readinessScore = 5;
let hasSubmittedLead = false;

let leadData = {
  firstName: "",
  email: "",
  phone: "",
  consent: false
};

const questionView = document.getElementById("questionView");
const summaryView = document.getElementById("summaryView");
const stepsEl = document.getElementById("steps");
const exitButton = document.querySelector(".exit");

function renderSteps() {
  stepsEl.innerHTML = questions.map((_, index) => `
    <div class="step ${index === currentStep ? "active" : ""}">
      <span>${index + 1}</span>
      ${stepLabels[index]}
    </div>
  `).join("");
}

function updateTopProgress() {
  const progressFill = document.querySelector(".progress-fill");
  const progressDots = document.querySelectorAll(".progress-dot");

  if (progressFill) {
    const progress = ((currentStep + 1) / questions.length) * 100;
    progressFill.style.width = `${progress}%`;
  }

  progressDots.forEach((dot, index) => {
    dot.classList.toggle("active", index <= currentStep);
  });
}

function formatTitle(title, highlight) {
  if (!highlight || !title.includes(highlight)) return title;

  return title.replace(
    highlight,
    `<span class="highlight">${highlight}</span>`
  );
}

function renderQuestion() {
  summaryView.classList.add("hidden");
  questionView.classList.remove("hidden");

  renderSteps();
  updateTopProgress();

  const q = questions[currentStep];

  questionView.innerHTML = `
    <div class="badge">
      Étape ${currentStep + 1} sur ${questions.length}
    </div>

    <h2>${formatTitle(q.title, q.highlight)}</h2>

    ${renderInput(q)}

    <div class="footer">
      <button class="btn secondary" onclick="prevStep()" ${currentStep === 0 ? "disabled" : ""}>
        ← Précédent
      </button>

      <div class="dots">
        ${questions.map((_, index) => `
          <span class="dot ${index === currentStep ? "active" : ""}"></span>
        `).join("")}
      </div>

      <button class="btn primary" onclick="nextStep()">
        ${currentStep === questions.length - 1 ? "Voir ma synthèse" : "Suivant →"}
      </button>
    </div>
  `;
}

function renderInput(q) {
  if (q.type === "textarea") {
    const value = answers[currentStep] || "";

    return `
      <textarea
        maxlength="1000"
        placeholder="${q.placeholder}"
        oninput="saveText(this.value)"
      >${value}</textarea>

      <div class="counter">${value.length} / 1000</div>
    `;
  }

  if (q.type === "cards") {
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

  if (q.type === "decision") {
    return `
      <div class="decision-box">
        <div class="decision-section">
          <label>
            Si on se reparle dans 6 mois et que rien n’a changé,
            serais-tu déçu(e) de toi-même ?
          </label>

          <div class="yes-no">
            <button
              type="button"
              class="${answers[currentStep]?.disappointed === "Oui" ? "selected" : ""}"
              onclick="saveDisappointed('Oui')"
            >
              Oui
            </button>

            <button
              type="button"
              class="${answers[currentStep]?.disappointed === "Non" ? "selected" : ""}"
              onclick="saveDisappointed('Non')"
            >
              Non
            </button>

            <button
              type="button"
              class="${answers[currentStep]?.disappointed === "Je ne sais pas" ? "selected" : ""}"
              onclick="saveDisappointed('Je ne sais pas')"
            >
              Je ne sais pas
            </button>
          </div>
        </div>

        <div class="decision-section">
          <div class="score-title">
            Sur 10, à quel point souhaites-tu vraiment faire évoluer cette situation ?
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
            <span>Pas prêt(e)</span>
            <span>Prêt(e) à agir</span>
          </div>
        </div>

        <div class="decision-section conditional-question">
          <label>
            ${readinessScore >= 7
              ? "Qu’est-ce qui te ferait passer à l’action aujourd’hui ?"
              : "Qu’est-ce qui manque encore pour que tu te sentes prêt(e) ?"}
          </label>

          <textarea
            maxlength="400"
            placeholder="Écris ta réponse ici..."
            oninput="saveConditional(this.value)"
          >${answers[currentStep]?.conditional || ""}</textarea>
        </div>
      </div>
    `;
  }

  return "";
}

function saveText(value) {
  answers[currentStep] = value;

  const counter = document.querySelector(".counter");
  if (counter) counter.textContent = `${value.length} / 1000`;
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
    readiness: readinessScore
  };

  renderQuestion();
}

function saveReadiness(value) {
  readinessScore = Number(value);

  answers[currentStep] = {
    ...(answers[currentStep] || {}),
    readiness: readinessScore
  };

  renderQuestion();
}

function saveConditional(value) {
  answers[currentStep] = {
    ...(answers[currentStep] || {}),
    readiness: readinessScore,
    conditional: value
  };
}

function nextStep() {
  if (currentStep < questions.length - 1) {
    currentStep++;
    renderQuestion();
    return;
  }

  renderLeadGate();
}

function prevStep() {
  if (!summaryView.classList.contains("hidden")) {
    renderLeadGate();
    return;
  }

  if (currentStep > 0) {
    currentStep--;
    renderQuestion();
  }
}

function calculateScore() {
  let score = readinessScore * 10;

  score += ((answers[1] || []).length * 5);
  score += ((answers[4] || []).length * 5);

  const decision = answers[5] || {};

  if (decision.disappointed === "Oui") score += 15;
  if (decision.disappointed === "Je ne sais pas") score += 5;

  return Math.min(score, 100);
}

function getUrgency(score) {
  if (score >= 80) return "🔴 Élevé";
  if (score >= 60) return "🟠 Modéré à élevé";
  if (score >= 40) return "🟡 Modéré";
  return "⚪ Faible";
}

function getStatus(score) {
  if (score >= 80) return "Priorité élevée";
  if (score >= 60) return "Besoin réel";
  if (score >= 40) return "Prise de conscience en cours";
  return "Besoin encore peu assumé";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function renderLeadGate() {
  questionView.classList.remove("hidden");
  summaryView.classList.add("hidden");

  renderSteps();
  updateTopProgress();

  questionView.innerHTML = `
    <div class="badge">Ta synthèse est prête</div>

    <h2>
      Où souhaites-tu recevoir ton
      <span class="highlight">retour personnalisé</span> ?
    </h2>

    <div class="lead-gate">
      <p>
        Renseigne tes informations pour afficher ta synthèse et permettre à Sandra
        de te faire un retour si tu souhaites aller plus loin.
      </p>

      <input
        type="text"
        id="gateFirstName"
        placeholder="Prénom *"
        value="${leadData.firstName}"
        oninput="updateGateButtonState()"
      >

      <input
        type="email"
        id="gateEmail"
        placeholder="Email *"
        value="${leadData.email}"
        oninput="updateGateButtonState()"
      >

      <input
        type="tel"
        id="gatePhone"
        placeholder="Téléphone (optionnel)"
        value="${leadData.phone}"
        oninput="updateGateButtonState()"
      >

      <label class="consent">
        <input
          type="checkbox"
          id="gateConsent"
          ${leadData.consent ? "checked" : ""}
          onchange="updateGateButtonState()"
        >
        J'accepte d'être recontacté(e)
      </label>

      <div id="gateError" class="lead-error"></div>

      <div class="footer gate-footer">
        <button class="btn secondary" onclick="renderQuestion()">
          ← Modifier mes réponses
        </button>

        <button
          type="button"
          id="gateSubmitButton"
          class="btn primary disabled"
          disabled
          onclick="validateLeadGate()"
        >
          Voir ma synthèse
        </button>
      </div>
    </div>
  `;

  updateGateButtonState();
}

function updateGateButtonState() {
  const firstName = document.getElementById("gateFirstName");
  const email = document.getElementById("gateEmail");
  const phone = document.getElementById("gatePhone");
  const consent = document.getElementById("gateConsent");
  const button = document.getElementById("gateSubmitButton");
  const error = document.getElementById("gateError");

  if (!firstName || !email || !phone || !consent || !button) return;

  leadData.firstName = firstName.value.trim();
  leadData.email = email.value.trim();
  leadData.phone = phone.value.trim();
  leadData.consent = consent.checked;

  const valid =
    leadData.firstName.length > 0 &&
    isValidEmail(leadData.email) &&
    leadData.consent;

  button.disabled = !valid;
  button.classList.toggle("disabled", !valid);

  if (error) error.textContent = "";
}

function validateLeadGate() {
  updateGateButtonState();

  const error = document.getElementById("gateError");

  if (!leadData.firstName) {
    error.textContent = "Merci de renseigner votre prénom.";
    return;
  }

  if (!isValidEmail(leadData.email)) {
    error.textContent = "Merci de renseigner un email valide.";
    return;
  }

  if (!leadData.consent) {
    error.textContent = "Merci d'accepter d'être recontacté(e).";
    return;
  }

  renderSummary();
}

function renderSummary() {
  questionView.classList.add("hidden");
  summaryView.classList.remove("hidden");

  currentStep = questions.length - 1;
  renderSteps();
  updateTopProgress();

  const score = calculateScore();
  const urgency = getUrgency(score);
  const status = getStatus(score);

  summaryView.innerHTML = `
    <div class="summary-layout">
      <div class="summary-content">
        <h2>${leadData.firstName}, voici ta synthèse personnalisée</h2>

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
            <span>Statut</span>
            <strong>${status}</strong>
          </div>

          <div class="result-card">
            <span>Préparation</span>
            <strong>${readinessScore}/10</strong>
          </div>
        </div>

        <div class="cta">
          <h3>Tu veux un retour de Sandra ?</h3>

          <p>
            Tes réponses sont prêtes. Clique ci-dessous pour transmettre ta demande
            et permettre à Sandra de revenir vers toi.
          </p>

          <div id="leadError" class="lead-error"></div>
          <div id="successMessage" class="lead-success hidden"></div>

          <button
            type="button"
            id="leadSubmitButton"
            onclick="submitLead()"
          >
            Demander un échange
          </button>
        </div>
      </div>
    </div>
  `;
}

async function submitLead() {
  const error = document.getElementById("leadError");
  const success = document.getElementById("successMessage");
  const button = document.getElementById("leadSubmitButton");

  if (hasSubmittedLead) return;

  const score = calculateScore();

  const payload = {
    score,
    urgence: getUrgency(score),
    statut: getStatus(score),
    preparation: readinessScore,
    disappointed: answers[5]?.disappointed || "",
    situation: answers[0] || "",
    impacts: Array.isArray(answers[1]) ? answers[1].join(", ") : "",
    projection: answers[2] || "",
    desire: answers[3] || "",
    blocages: Array.isArray(answers[4]) ? answers[4].join(", ") : "",
    reponseFinale: answers[5]?.conditional || "",
    firstName: leadData.firstName,
    email: leadData.email,
    phone: leadData.phone,
    consent: leadData.consent ? "Oui" : "Non"
  };

  try {
    button.disabled = true;
    button.textContent = "Envoi en cours...";
    error.textContent = "";

    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    hasSubmittedLead = true;

    success.classList.remove("hidden");
    success.innerHTML = `
      ✅ Merci ${leadData.firstName} !<br>
      Sandra reviendra vers toi prochainement.
    `;

    button.textContent = "Demande envoyée";
    button.classList.add("disabled");
  } catch (error) {
    button.disabled = false;
    button.textContent = "Demander un échange";
    alert("Erreur lors de l'envoi.");
  }
}

function resetDiagnostic() {
  const confirmExit = confirm(
    "Veux-tu vraiment quitter le diagnostic ? Tes réponses seront réinitialisées."
  );

  if (!confirmExit) return;

  currentStep = 0;
  answers = {};
  readinessScore = 5;
  hasSubmittedLead = false;

  leadData = {
    firstName: "",
    email: "",
    phone: "",
    consent: false
  };

  summaryView.classList.add("hidden");
  questionView.classList.remove("hidden");

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

renderQuestion();