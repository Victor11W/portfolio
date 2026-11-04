// The board knows which moves are legal. The agent receives no map of the route
// and learns the value of each move only from its own transitions.
export const qBoard = [
  '..#...G',
  '.##.#..',
  '....#..',
  '.#...#.',
  'S..#...'
];

const qWidth = qBoard[0].length;
const qCells = qBoard.join('');
export const qStart = qCells.indexOf('S');
export const qGoal = qCells.indexOf('G');
export const qTrainingBudget = 120;
const qDirections = [[1, 0], [0, -1], [-1, 0], [0, 1]];
const qMaxSteps = 100;

function qNeighbours(state) {
  if (qCells[state] === '#' || state === qGoal) return [];
  const x = state % qWidth;
  const y = Math.floor(state / qWidth);
  const neighbours = [];
  qDirections.forEach(([dx, dy], action) => {
    const nextX = x + dx;
    const nextY = y + dy;
    if (nextX >= 0 && nextX < qWidth && nextY >= 0 && nextY < qBoard.length && qBoard[nextY][nextX] !== '#') {
      neighbours.push({ action, next: nextY * qWidth + nextX });
    }
  });
  return neighbours;
}

const qMoves = Array.from(qCells, (_, state) => qNeighbours(state));
function qBestValue(agent, state) {
  if (state === qGoal) return 0;
  return Math.max(...qMoves[state].map(move => agent.values[state * 4 + move.action]));
}

export function qUpdateValue(previous, reward, nextBest) {
  const learningRate = 0.45;
  const discount = 0.94;
  return previous + learningRate * (reward + discount * nextBest - previous);
}

export function createQAgent(seed = 13) {
  // A repeatable seed lets visitors compare the same experiment on each run.
  let bits = seed >>> 0;
  function random() {
    bits = (Math.imul(bits, 1664525) + 1013904223) >>> 0;
    return bits / 4294967296;
  }
  return { values: new Float64Array(qCells.length * 4), episodes: 0, random };
}

export function runQEpisode(agent) {
  const epsilon = Math.max(0.10, Math.pow(0.955, agent.episodes));
  const route = [qStart];
  let state = qStart;
  for (let step = 0; step < qMaxSteps && state !== qGoal; step++) {
    const options = qMoves[state];
    let candidates = options;
    if (agent.random() >= epsilon) {
      const best = qBestValue(agent, state);
      candidates = options.filter(move => agent.values[state * 4 + move.action] === best);
    }
    const { action, next } = candidates[Math.floor(agent.random() * candidates.length)];
    const index = state * 4 + action;
    const reward = next === qGoal ? 12 : -1;
    agent.values[index] = qUpdateValue(agent.values[index], reward, qBestValue(agent, next));
    state = next;
    route.push(state);
  }
  agent.episodes++;
  return route;
}

// Test the learned policy with exploration and learning switched off.
export function readQPolicy(agent) {
  const route = [qStart];
  const seen = new Set();
  let state = qStart;
  while (state !== qGoal && !seen.has(state)) {
    seen.add(state);
    const best = qBestValue(agent, state);
    state = qMoves[state].find(move => agent.values[state * 4 + move.action] === best).next;
    route.push(state);
  }
  return route;
}
