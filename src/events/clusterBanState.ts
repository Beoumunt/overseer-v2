const clusterBans = new Map<string, number>();
const CLUSTER_BAN_TTL_MS = 60_000;

export function markClusterBan(userId: string) {
  clusterBans.set(userId, Date.now() + CLUSTER_BAN_TTL_MS);
}

export function isClusterBanInProgress(userId: string) {
  const expiresAt = clusterBans.get(userId);
  if (!expiresAt) return false;

  if (expiresAt <= Date.now()) {
    clusterBans.delete(userId);
    return false;
  }

  return true;
}
