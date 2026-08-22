let gameMode = 'auto';
let forcedMultiplier = 2.00;

const autoPatterns = [
  1.12, 1.05, 2.00, 1.10, 1.02, 3.24, 1.15, 2.05, 1.08, 
  3.50, 1.20, 2.50, 1.04, 4.10, 1.11, 1.03, 2.20, 1.18, 
  5.80, 1.06, 1.15, 2.10, 1.09, 3.10, 1.02, 1.25, 12.50
];

let patternIndex = 0;

function getNextCrashPoint() {
  if (gameMode === 'manual') {
    gameMode = 'auto'; 
    return parseFloat(forcedMultiplier);
  }

  const crash = autoPatterns[patternIndex];
  patternIndex = (patternIndex + 1) % autoPatterns.length;

  const jitter = (Math.random() * 0.08 - 0.04); 
  let finalCrash = parseFloat((crash + jitter).toFixed(2));

  return finalCrash < 1.01 ? 1.01 : finalCrash;
}

function setManualOverride(multiplier) {
  gameMode = 'manual';
  forcedMultiplier = multiplier;
}

function setAutoMode() {
  gameMode = 'auto';
}

module.exports = {
  getNextCrashPoint,
  setManualOverride,
  setAutoMode,
  getCurrentMode: () => gameMode
};

