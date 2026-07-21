export interface Account {
  username: string;
  elo: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
}

const ACCOUNT_KEY = 'aethermancer_account';

export function loadAccount(): Account | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAccount(account: Account): void {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch {/* ignore */}
}

export function createAccount(username: string): Account {
  const account: Account = {
    username: username.trim() || 'Aethermancer',
    elo: 1000,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
  };
  saveAccount(account);
  return account;
}

/** Calculate and apply ELO change. Returns updated account + elo delta. */
export function applyEloChange(
  account: Account,
  won: boolean,
  enemyElo: number,
): { account: Account; delta: number } {
  const K = 50;
  const expected = 1 / (1 + Math.pow(10, (enemyElo - account.elo) / 400));
  const actual = won ? 1 : 0;
  const rawChange = K * (actual - expected);

  let delta: number;
  if (won) {
    delta = Math.round(Math.max(40, Math.min(50, rawChange)));
  } else {
    delta = -Math.round(Math.max(40, Math.min(60, -rawChange)));
  }

  const newAccount: Account = {
    ...account,
    elo: Math.max(0, account.elo + delta),
    gamesPlayed: account.gamesPlayed + 1,
    wins: won ? account.wins + 1 : account.wins,
    losses: won ? account.losses : account.losses + 1,
  };
  saveAccount(newAccount);
  return { account: newAccount, delta };
}

export function getRankLabel(elo: number): string {
  if (elo >= 2200) return 'Void Master';
  if (elo >= 1800) return 'Arcane Lord';
  if (elo >= 1500) return 'Storm Sage';
  if (elo >= 1200) return 'Aether Knight';
  if (elo >= 1000) return 'Apprentice';
  if (elo >= 700)  return 'Initiate';
  return 'Novice';
}
