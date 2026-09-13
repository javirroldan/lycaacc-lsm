import { createAdminClient } from "@insforge/sdk"
import { readFileSync } from "node:fs"

function leerEnv(ruta) {
  const vars = {}
  let texto
  try {
    texto = readFileSync(ruta, "utf8")
  } catch {
    return vars
  }
  for (const linea of texto.split("\n")) {
    const m = linea.match(/^([A-Z_]+)="?([^"]*)"?$/)
    if (m) vars[m[1]] = m[2]
  }
  return vars
}

const env = {
  ...leerEnv(".env"),
  ...leerEnv(".env.local"),
  ...process.env,
}

const url = env.VITE_INSFORGE_URL ?? env.INSFORGE_URL
const apiKey = env.INSFORGE_API_KEY
const password = env.INSFORGE_ADMIN_PASSWORD ?? process.argv[2]

if (!url || !apiKey || !password) {
  console.error(
    "Uso: node scripts/setup-admin.mjs <password> — con INSFORGE_URL (o VITE_INSFORGE_URL) e INSFORGE_API_KEY en .env / .env.local",
  )
  process.exit(1)
}

const adminEmail = "admin@trenes.local"
const insforge = createAdminClient({ baseUrl: url, apiKey })

async function api(path, options = {}) {
  const res = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(options.headers ?? {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  return { res, body }
}

const { body: lista } = await api("/api/auth/users")
const existente = (lista?.data ?? []).find((u) => u.email === adminEmail)

if (existente) {
  const { res } = await api("/api/auth/users", {
    method: "DELETE",
    body: JSON.stringify({ userIds: [existente.id] }),
  })
  if (!res.ok) {
    console.error(`No se pudo recrear el admin (DELETE ${res.status}):`, existente)
    process.exit(1)
  }
  console.log("Admin previo eliminado:", existente.id)
}

const { res: crea, body: creado } = await api("/api/auth/users", {
  method: "POST",
  body: JSON.stringify({
    email: adminEmail,
    password,
    name: "Admin",
    autoConfirm: true,
  }),
})
if (!crea.ok) {
  console.error(`No se pudo crear el usuario admin (${crea.status}):`, creado)
  process.exit(1)
}

let userId = creado?.user?.id ?? creado?.data?.id ?? creado?.id
if (!userId) {
  const { body: lista2 } = await api("/api/auth/users")
  userId = (lista2?.data ?? []).find((u) => u.email === adminEmail)?.id
}
if (!userId) {
  console.error("No se pudo obtener el id del usuario admin. Respuesta:", creado)
  process.exit(1)
}

console.log("Usuario admin creado:", adminEmail, "id:", userId)

const { error } = await insforge.database.from("roles").upsert({ user_id: userId, rol: "admin" })
if (error) {
  console.error("No se pudo asignar el rol admin:", error.message)
  process.exit(1)
}

console.log("Rol admin asignado a", adminEmail)