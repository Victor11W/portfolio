import {qBoard,qStart,qGoal,qTrainingBudget,createQAgent,runQEpisode,readQPolicy} from './qlearning-engine.js';

const qLabText = {
  fr: {
    eyebrow: 'Labo interactif · Q-learning', title: 'Un agent peut-il éviter les détours ?',
    intro: 'Quatre directions, des murs et une cible. Au départ, chaque direction a la même valeur pour l’agent.',
    map: 'Grille avec des obstacles, un départ en bas à gauche et une cible en haut à droite.',
    start: 'Départ', goal: 'Cible', agent: 'Agent', route: 'Trajet', trials: 'Essais effectués',
    initial: 'Premier essai', learned: 'Trajet appris', steps: 'pas', waiting: 'À découvrir',
    readyTitle: 'D’abord, explorer.', trainingTitle: 'Apprendre en essayant.', doneTitle: 'Suivre les valeurs apprises.',
    readyCopy: 'L’agent choisit ses premiers pas au hasard. Ses allers-retours lui coûtent des points.',
    trainingCopy: 'Il révise la valeur de chaque mouvement en combinant sa récompense immédiate avec la meilleure suite connue.',
    doneCopy: 'On coupe l’exploration. Dans chaque case, l’agent choisit le mouvement qui a obtenu la meilleure valeur.',
    train: 'Entraîner l’agent', skip: 'Voir le résultat', restart: 'Recommencer', replay: 'Rejouer le trajet',
    stop: 'Arrêter la lecture', step: 'Pas suivant', stepStart: 'Parcourir pas à pas', earned: 'à l’arrivée', cost: 'par case ordinaire',
    scope: 'Cette grille illustre le principe du Q-learning. Le poster présente le projet d’équipe sur le jeu Chartichaud.',
    compared: (first, last) => 'Objectif atteint en ' + last + ' pas, contre ' + first + ' au premier essai.',
    sample: n => 'Essai ' + n, initialStatus: n => 'Premier essai terminé en ' + n + ' pas.',
    started: 'Entraînement en cours.', stopped: 'Lecture arrêtée.', playing: 'Lecture du trajet.',
    reset: 'Retour au premier essai.', completed: 'Trajet terminé.'
  },
  en: {
    eyebrow: 'Interactive lab · Q-learning', title: 'Can an agent learn to skip the detours?',
    intro: 'Four directions, a few walls and a target. At first, every direction looks equally promising to the agent.',
    map: 'Grid with walls, a starting point at the bottom left and a target at the top right.',
    start: 'Start', goal: 'Target', agent: 'Agent', route: 'Route', trials: 'Training episodes',
    initial: 'First attempt', learned: 'Learned route', steps: 'steps', waiting: 'Undiscovered',
    readyTitle: 'First, explore.', trainingTitle: 'Learn by trying.', doneTitle: 'Follow the learned values.',
    readyCopy: 'The agent picks its first moves at random. Each time it doubles back, it pays for the extra steps.',
    trainingCopy: 'It updates the value of each move using the reward for this step and its best estimate of what comes next.',
    doneCopy: 'Exploration is switched off. At each square, the agent picks the move with the highest learned value.',
    train: 'Train the agent', skip: 'Show the result', restart: 'Start over', replay: 'Replay route',
    stop: 'Stop replay', step: 'Next step', stepStart: 'Walk through route', earned: 'at the target', cost: 'per ordinary square',
    scope: 'This grid illustrates how Q-learning works. The poster presents the team’s project on the strategy game Chartichaud.',
    compared: (first, last) => 'Target reached in ' + last + ' steps, down from ' + first + ' on the first attempt.',
    sample: n => 'Episode ' + n, initialStatus: n => 'First attempt finished in ' + n + ' steps.',
    started: 'Training in progress.', stopped: 'Replay stopped.', playing: 'Replaying the route.',
    reset: 'Back to the first attempt.', completed: 'Route complete.'
  }
};

const qTile = 32;
function qPoint(state) {
  return [(state % qBoard[0].length + 0.5) * qTile, (Math.floor(state / qBoard[0].length) + 0.5) * qTile];
}

function qBoardDrawing(text) {
  const tiles = Array.from(qBoard.join(''), (cell, index) => {
    const [x, y] = qPoint(index);
    const classes = cell === '#' ? 'ql-tile ql-wall' : 'ql-tile';
    return `<rect class="${classes}" x="${x-15}" y="${y-15}" width="30" height="30" rx="3"/>`;
  }).join('');
  const [sx, sy] = qPoint(qStart);
  const [gx, gy] = qPoint(qGoal);
  return `<svg class="ql-grid" viewBox="0 0 ${qTile*qBoard[0].length} ${qTile*qBoard.length}" role="img" aria-label="${text.map}">
    <defs><pattern id="ql-hatch" width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="5" height="5" fill="#d5cbdc"/><path d="M-1,1 1,-1 M0,5 5,0 M4,6 6,4" stroke="#796980" stroke-width="1"/>
    </pattern></defs>
    ${tiles}
    <polyline class="ql-trace" data-q="trace"/>
    <circle class="ql-origin" cx="${sx}" cy="${sy}" r="8"/>
    <path class="ql-target" d="M ${gx} ${gy-10} l 10 10 -10 10 -10 -10 Z"/>
    <circle class="ql-agent" data-q="dot" cx="${sx}" cy="${sy}" r="4.5"/>
  </svg>`;
}

export function qlearningLabMarkup(language) {
  const t = qLabText[language];
  return `<section class="ql-lab" aria-labelledby="ql-heading">
    <p class="ql-eyebrow mono">${t.eyebrow}</p>
    <h3 id="ql-heading">${t.title}</h3><p class="ql-intro">${t.intro}</p>
    <div class="ql-workbench">
      <figure class="ql-board">
        <div class="ql-map-heading"><span data-q="map-title">${t.initial}</span><span>07 × 05</span></div>
        ${qBoardDrawing(t)}
        <figcaption class="ql-legend">
          <span><i class="ql-key-start"></i>${t.start}</span><span><i class="ql-key-target"></i>${t.goal}</span><span><i class="ql-key-agent"></i>${t.agent}</span>
        </figcaption>
      </figure>
      <div class="ql-readout">
        <div><p class="ql-stage" data-q="stage"></p><h4 data-q="phase-title">${t.readyTitle}</h4>
          <p class="ql-phase-copy" data-q="phase-copy">${t.readyCopy}</p></div>
        <div class="ql-rewards"><span><b>−1</b> ${t.cost}</span><span><b>+12</b> ${t.earned}</span></div>
        <div class="ql-progress"><label for="ql-progress-bar">${t.trials} <strong data-q="episodes">1 / ${qTrainingBudget}</strong></label>
          <progress id="ql-progress-bar" data-q="bar" value="1" max="${qTrainingBudget}"></progress></div>
      </div>
    </div>
    <div class="ql-compare" role="group" aria-label="${t.route}">
      <button type="button" data-q="first" aria-pressed="true"><span>${t.initial}</span><strong data-q="first-steps"></strong></button>
      <button type="button" data-q="last" disabled aria-pressed="false"><span>${t.learned}</span><strong data-q="last-steps">${t.waiting}</strong></button>
    </div>
    <div class="ql-actions"><button class="button button-primary" data-q="train" type="button">${t.train}</button>
      <button class="text-button" data-q="replay" type="button">${t.replay}</button></div>
    <p class="ql-scope">${t.scope}</p><p class="sr-only" role="status" data-q="status"></p>
  </section>`;
}

export function mountQlearningLab(container, language) {
  const t = qLabText[language];
  const lab = container.querySelector('.ql-lab');
  const fields = Object.fromEntries(Array.from(lab.querySelectorAll('[data-q]'), item => [item.dataset.q, item]));
  const listeners = new AbortController();
  const options = {signal: listeners.signal};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let agent = createQAgent();
  let first = runQEpisode(agent);
  let learned = null;
  let mode = 'first';
  let timer = 0;
  let replaying = false;
  let manualStep = 0;

  function selectedRoute() {
    return mode === 'learned' ? learned : first;
  }

  function paint(route, length = route.length) {
    const points = route.slice(0, length).map(qPoint);
    const [x, y] = points.at(-1);
    fields.trace.setAttribute('points', points.map(point => point.join(',')).join(' '));
    fields.dot.setAttribute('cx', x);
    fields.dot.setAttribute('cy', y);
  }

  function stopPlayback() {
    window.clearTimeout(timer);
    replaying = false;
    manualStep = 0;
  }

  function render() {
    const training = mode === 'training';
    const phaseTitle = training ? t.trainingTitle : mode === 'learned' ? t.doneTitle : t.readyTitle;
    const phaseCopy = training ? t.trainingCopy : mode === 'learned' ? t.doneCopy : t.readyCopy;
    fields['phase-title'].textContent = phaseTitle;
    fields['phase-copy'].textContent = phaseCopy;
    fields.stage.textContent = training ? '02 / 03' : mode === 'learned' ? '03 / 03' : '01 / 03';
    fields['map-title'].textContent = training ? t.sample(agent.episodes) : mode === 'learned' ? t.learned : t.initial;
    fields.episodes.textContent = agent.episodes + ' / ' + qTrainingBudget;
    fields.bar.value = agent.episodes;
    fields['first-steps'].textContent = (first.length - 1) + ' ' + t.steps;
    fields['last-steps'].textContent = learned ? (learned.length - 1) + ' ' + t.steps : t.waiting;
    fields.first.setAttribute('aria-pressed', String(mode === 'first'));
    fields.last.setAttribute('aria-pressed', String(mode === 'learned'));
    fields.first.disabled = training;
    fields.last.disabled = !learned;
    fields.train.textContent = training ? t.skip : learned ? t.restart : t.train;
    fields.replay.textContent = replaying ? t.stop : t.replay;
    if (reducedMotion.matches) {
      fields.replay.textContent = manualStep ? t.step + ' · ' + manualStep + ' / ' + (selectedRoute().length - 1) : t.stepStart;
    }
    fields.replay.disabled = training;
  }

  function showRoute(selected) {
    stopPlayback();
    mode = selected;
    render();
    paint(selectedRoute());
    fields.status.textContent = mode === 'learned' ? t.compared(first.length - 1, learned.length - 1) : t.initialStatus(first.length - 1);
  }

  function trainThrough(episode) {
    let last;
    while (agent.episodes < episode) last = runQEpisode(agent);
    return last;
  }

  function completeTraining() {
    trainThrough(qTrainingBudget);
    learned = readQPolicy(agent);
    showRoute('learned');
  }

  // Each frame is a prefix of the actual episode, including its detours.
  function animateRoute(route, frameDelay, maxFrames, onEnd) {
    const stride = Math.max(1, Math.ceil((route.length - 1) / maxFrames));
    let visible = 1;
    function frame() {
      paint(route, visible);
      if (visible === route.length) { onEnd(); return; }
      visible = Math.min(route.length, visible + stride);
      timer = window.setTimeout(frame, frameDelay);
    }
    frame();
  }

  function startTraining() {
    stopPlayback();
    if (reducedMotion.matches) { completeTraining(); return; }
    mode = 'training';
    fields.status.textContent = t.started;
    const checkpoints = [5, 18, 48, 90];
    function checkpoint() {
      const next = checkpoints.shift();
      if (!next) { completeTraining(); return; }
      const trace = trainThrough(next);
      render();
      animateRoute(trace, 72, 14, () => { timer = window.setTimeout(checkpoint, 180); });
    }
    checkpoint();
  }

  fields.train.addEventListener('click', () => {
    if (mode === 'training') { completeTraining(); return; }
    if (learned) {
      agent = createQAgent();
      first = runQEpisode(agent);
      learned = null;
      showRoute('first');
      fields.status.textContent = t.reset;
      return;
    }
    startTraining();
  }, options);
  fields.first.addEventListener('click', () => showRoute('first'), options);
  fields.last.addEventListener('click', () => showRoute('learned'), options);
  fields.replay.addEventListener('click', () => {
    if (reducedMotion.matches) {
      const route = selectedRoute();
      manualStep++;
      paint(route, manualStep + 1);
      fields.status.textContent = manualStep + ' / ' + (route.length - 1);
      if (manualStep === route.length - 1) {
        manualStep = 0;
        fields.status.textContent = t.completed;
      }
      render();
      return;
    }
    if (replaying) {
      showRoute(mode);
      fields.status.textContent = t.stopped;
      return;
    }
    replaying = true;
    fields.status.textContent = t.playing;
    render();
    animateRoute(selectedRoute(), 110, 60, () => {
      replaying = false;
      fields.status.textContent = t.completed;
      render();
    });
  }, options);
  reducedMotion.addEventListener('change', () => {
    if (mode === 'training') completeTraining();
    else showRoute(mode);
  }, options);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (mode === 'training') completeTraining();
    else if (replaying) showRoute(mode);
  }, options);
  showRoute('first');
  return { destroy() { stopPlayback(); listeners.abort(); } };
}
