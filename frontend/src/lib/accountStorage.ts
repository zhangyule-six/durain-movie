const STORAGE_KEY = 'durian_accounts'

export interface StoredAccount {
  uid: string
  token: string
  username?: string
  avatar?: string
}

export interface AccountStorage {
  accounts: StoredAccount[]
  activeToken: string | null
}

const defaultStorage: AccountStorage = {
  accounts: [],
  activeToken: null,
}

export function getAccountStorage(): AccountStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultStorage }
    const parsed = JSON.parse(raw) as AccountStorage
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      activeToken: typeof parsed.activeToken === 'string' ? parsed.activeToken : null,
    }
  } catch {
    return { ...defaultStorage }
  }
}

export function setAccountStorage(data: AccountStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getActiveToken(): string | null {
  return getAccountStorage().activeToken
}

export function setActiveAccount(token: string | null): void {
  const storage = getAccountStorage()
  storage.activeToken = token
  setAccountStorage(storage)
}

const MAX_ACCOUNTS = 5

export function addAccount(account: StoredAccount): void {
  const storage = getAccountStorage()
  const filtered = storage.accounts.filter((a) => a.uid !== account.uid)
  storage.accounts = [account, ...filtered].slice(0, MAX_ACCOUNTS)
  storage.activeToken = account.token
  setAccountStorage(storage)
}

export function removeAccount(uid: string): void {
  const storage = getAccountStorage()
  const removed = storage.accounts.find((a) => a.uid === uid)
  storage.accounts = storage.accounts.filter((a) => a.uid !== uid)
  if (storage.activeToken && removed?.token === storage.activeToken) {
    storage.activeToken = storage.accounts[0]?.token ?? null
  }
  setAccountStorage(storage)
}

export function getAccounts(): StoredAccount[] {
  return getAccountStorage().accounts
}

export function updateStoredAccountProfile(
  uid: string,
  profile: { username?: string; avatar?: string },
): void {
  if (!uid) return
  const storage = getAccountStorage()
  const idx = storage.accounts.findIndex((a) => a.uid === uid)
  if (idx < 0) return

  const current = storage.accounts[idx]
  if (!current) return
  storage.accounts[idx] = {
    uid: current.uid,
    token: current.token,
    username: current.username,
    avatar: current.avatar,
    ...(profile.username !== undefined ? { username: profile.username } : {}),
    ...(profile.avatar !== undefined ? { avatar: profile.avatar } : {}),
  }
  setAccountStorage(storage)
}
