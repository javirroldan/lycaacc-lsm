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

const res = await fetch(`${url}/api/auth/users`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    email: adminEmail,
    password,
    name: "Admin",
    autoConfirm: true,
  }),
})

const body = await res.json()

if (!res.ok) {
  console.error(`No se pudo crear el usuario admin (${res.status}):`, body)
  process.exit(1)
}

const userId = body?.id ?? body?.user?.id ?? body?.data?.id
if (!userId) {
  console.error("No se pudo obtener el id del usuario admin. Respuesta:", body)
  process.exit(1)
}

console.log("Usuario admin creado:", adminEmail, "id:", userId)

const { error } = await insforge.database.from("roles").upsert({ user_id: userId, rol: "admin" })
if (error) {
  console.error("No se pudo asignar el rol admin:", error.message)
  process.exit(1)
}

console.log("Rol admin asignado a", adminEmail)