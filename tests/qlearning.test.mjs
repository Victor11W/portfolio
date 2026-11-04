import test from 'node:test';
import assert from 'node:assert/strict';
import { qBoard, qStart, qGoal, qTrainingBudget, qUpdateValue, createQAgent, runQEpisode, readQPolicy } from '../qlearning-engine.js';

test('Q updates include the best discounted future value and stop at the terminal reward', () => {
  assert.ok(Math.abs(qUpdateValue(2, -1, 4) - 2.342) < 1e-12);
  assert.equal(qUpdateValue(0, 12, 0), 5.4);
  assert.equal(qUpdateValue(12, 12, 0), 12);
});

test('the demo learns a shorter legal route and evaluates it without mutating the policy', () => {
  const agent = createQAgent();
  const width = qBoard[0].length;
  const terrain = qBoard.join('');
  function checkRoute(route) {
    assert.equal(route[0], qStart);
    route.slice(1).forEach((next, index) => {
      const previous = route[index];
      const horizontal = Math.abs(next % width - previous % width);
      const vertical = Math.abs(Math.floor(next / width) - Math.floor(previous / width));
      assert.equal(horizontal + vertical, 1);
      assert.ok(next >= 0 && next < terrain.length && terrain[next] !== '#');
    });
  }
  const untrained = readQPolicy(agent);
  const first = runQEpisode(agent);
  checkRoute(first);
  assert.equal(first.at(-1), qGoal);
  assert.notEqual(untrained.at(-1), qGoal);
  while (agent.episodes < qTrainingBudget) checkRoute(runQEpisode(agent));
  const snapshot = agent.values.slice();
  const learned = readQPolicy(agent);
  checkRoute(learned);
  assert.deepEqual(agent.values, snapshot);
  assert.equal(agent.episodes, qTrainingBudget);
  assert.equal(learned.at(-1), qGoal);
  assert.ok(learned.length < first.length);
  // Ten steps is also the geometric lower bound between these two corners.
  assert.equal(learned.length - 1, qBoard.length - 1 + width - 1);
});
