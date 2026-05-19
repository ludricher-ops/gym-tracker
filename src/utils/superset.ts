/**
 * Given the ordered list of exercise indices that belong to a superset group
 * and the current index, returns the next index in round-robin order.
 * Returns null if the group has fewer than 2 members or currentIndex is not in the group.
 */
export function nextSupersetIndex(groupIndices: number[], currentIndex: number): number | null {
  if (groupIndices.length < 2) return null
  const pos = groupIndices.indexOf(currentIndex)
  if (pos === -1) return null
  return groupIndices[(pos + 1) % groupIndices.length]
}
