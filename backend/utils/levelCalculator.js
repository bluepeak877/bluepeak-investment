function calculateLevel(totalInvested) {

  if (totalInvested >= 1000000) {
    return "BluePeak Legend";
  }

  if (totalInvested >= 200000) {
    return "BluePeak Prime";
  }

  if (totalInvested >= 50000) {
    return "BluePeak Elite";
  }

  if (totalInvested >= 10000) {
    return "BluePeak Pro";
  }

  return "BluePeak Starter";
}

module.exports = calculateLevel;