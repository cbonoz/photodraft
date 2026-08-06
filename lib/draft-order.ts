export function playerForPick(
  pickNumber: number,
  numPlayers: number,
  snake: boolean
): number {
  if (numPlayers <= 1) return 0;

  if (!snake) {
    return pickNumber % numPlayers;
  }

  const round = Math.floor(pickNumber / numPlayers);
  const posInRound = pickNumber % numPlayers;

  return round % 2 === 0 ? posInRound : numPlayers - 1 - posInRound;
}
