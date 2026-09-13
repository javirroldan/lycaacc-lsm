import type { CamposEditables } from "./types"
import type { CamposEditablesLocomotora } from "./typesLocomotoras"

export type TablaOp = "formaciones" | "locomotoras"

export interface PendingOp {
  id: string
  tabla: TablaOp
  registroId: number
  campos: Partial<CamposEditables> | Partial<CamposEditablesLocomotora>
  ts: number
}

const DB_NAME = "trenes-offline"
const STORE = "ops"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore, tx: IDBTransaction) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE), tx)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function addOp(
  tabla: TablaOp,
  registroId: number,
  campos: Partial<CamposEditables> | Partial<CamposEditablesLocomotora>,
): Promise<void> {
  const full: PendingOp = { tabla, registroId, campos, id: crypto.randomUUID(), ts: Date.now() }
  await withStore("readwrite", (s) => s.put(full))
}

export async function getOps(tabla?: TablaOp): Promise<PendingOp[]> {
  const all = await withStore<PendingOp[]>("readonly", (s) => s.getAll())
  return all
    .filter((o) => (tabla ? o.tabla === tabla : true))
    .sort((a, b) => a.ts - b.ts)
}

export async function removeOp(id: string): Promise<void> {
  await withStore("readwrite", (s) => s.delete(id))
}

export async function clearOps(): Promise<void> {
  await withStore("readwrite", (s) => s.clear())
}

export async function hasPendingOps(): Promise<boolean> {
  const all = await getOps()
  return all.length > 0
}