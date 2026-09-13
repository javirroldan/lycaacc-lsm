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

const cuentas = [
  {
    clave: "admin",
    email: env.VITE_ADMIN_EMAIL ?? "admin@trenes.local",
    password: env.VITE_ADMIN_PASSWORD,
    nombre: "Admin",
  },
  {
    clave: "empleado",
    email: env.VITE_EMPLEADO_EMAIL ?? "empleado@trenes.local",
    password: env.VITE_EMPLEADO_PASSWORD,
    nombre: "Empleado",
  },
]

if (!url || !apiKey) {
  console.error(
    "Faltan INSFORGE_URL (o VITE_INSFORGE_URL) e INSFORGE_API_KEY en .env / .env.local",
  )
  process.exit(1)
}

for (const c of cuentas) {
  if (!c.password) {
    console.error(`Falta VITE_${c.clave.toUpperCase()}_PASSWORD en .env.local para "${c.clave}"`)
    process.exit(1)
  }
}

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

async function listarUsuarios() {
  const { body } = await api("/api/auth/users")
  return body?.data ?? []
}

for (const c of cuentas) {
  const usuarios = await listarUsuarios()
  const existente = usuarios.find((u) => u.email === c.email)

  if (existente) {
    const { res } = await api("/api/auth/users", {
      method: "DELETE",
      body: JSON.stringify({ userIds: [existente.id] }),
    })
    if (!res.ok) {
      console.error(`No se pudo recrear ${c.clave} (DELETE ${res.status}):`, existente)
      process.exit(1)
    }
    console.log(`${c.clave} previo eliminado:`, existente.id)
  }

  const { res: crea, body: creado } = await api("/api/auth/users", {
    method: "POST",
    body: JSON.stringify({
      email: c.email,
      password: c.password,
      name: c.nombre,
      autoConfirm: true,
    }),
  })
  if (!crea.ok) {
    console.error(`No se pudo crear el usuario ${c.clave} (${crea.status}):`, creado)
    process.exit(1)
  }

  let userId = creado?.user?.id ?? creado?.data?.id ?? creado?.id
  if (!userId) {
    const usuarios2 = await listarUsuarios()
    userId = usuarios2.find((u) => u.email === c.email)?.id
  }
  if (!userId) {
    console.error(`No se pudo obtener el id del usuario ${c.clave}. Respuesta:`, creado)
    process.exit(1)
  }

  console.log(`Usuario ${c.clave} creado:`, c.email, "id:", userId)

  if (c.clave === "admin") {
    const { error } = await insforge.database.from("roles").upsert({ user_id: userId, rol: "admin" })
    if (error) {
      console.error("No se pudo asignar el rol admin:", error.message)
      process.exit(1)
    }
    console.log("Rol admin asignado a", c.email)
  } else {
    const { error } = await insforge.database
      .from("roles")
      .delete()
      .eq("user_id", userId)
    if (error) {
      console.error(`No se pudo limpiar el rol del ${c.clave}:`, error.message)
      process.exit(1)
    }
    console.log(`Sin rol (solo lectura) para`, c.email)
  }
}

console.log("Cuentas listas.")