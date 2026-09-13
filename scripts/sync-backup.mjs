import { createAdminClient } from "@insforge/sdk"
import fs from "node:fs/promises"
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

if (!url || !apiKey) {
  console.error("Falta VITE_INSFORGE_URL (o INSFORGE_URL) e INSFORGE_API_KEY en .env / .env.local")
  process.exit(1)
}

const insforge = createAdminClient({ baseUrl: url, apiKey })

const backup = JSON.parse(await fs.readFile("backuotrenes.json", "utf8"))

function toIso(fecha) {
  if (!fecha) return null
  const [dd, mm, yyyy] = fecha.split("/")
  return `${yyyy}-${mm}-${dd}`
}

const { data: antes, error: errAntes } = await insforge.database
  .from("formaciones")
  .select("formacion, anteultima, ultima, estado")
  .order("formacion")

if (errAntes) throw new Error(`No se pudo leer la base: ${errAntes.message}`)

const antesMap = new Map(antes.map((r) => [r.formacion, r]))
let modificadas = 0

for (const f of backup) {
  const fila = {
    formacion: f.formacion,
    anteultima: f.anteultima ? toIso(f.anteultima) : null,
    ultima: f.ultima ? toIso(f.ultima) : null,
    estado: f.estado,
  }
  const actual = antesMap.get(f.formacion)
  const coincide =
    actual &&
    actual.anteultima === fila.anteultima &&
    actual.ultima === fila.ultima &&
    actual.estado === fila.estado

  if (coincide) continue

  const { error } = await insforge.database
    .from("formaciones")
    .update({ anteultima: fila.anteultima, ultima: fila.ultima, estado: fila.estado })
    .eq("formacion", f.formacion)

  if (error) throw new Error(`formacion ${f.formacion}: ${error.message}`)
  modificadas++
}

const { data: despues, error: errDespues } = await insforge.database
  .from("formaciones")
  .select("formacion, anteultima, ultima, estado")
  .order("formacion")

if (errDespues) throw new Error(`Verificación fallida: ${errDespues.message}`)

let ok = 0
for (const f of backup) {
  const esperado = {
    formacion: f.formacion,
    anteultima: f.anteultima ? toIso(f.anteultima) : null,
    ultima: f.ultima ? toIso(f.ultima) : null,
    estado: f.estado,
  }
  const enDb = despues.find((r) => r.formacion === f.formacion)
  if (enDb && JSON.stringify(enDb) === JSON.stringify(esperado)) ok++
}

console.log(`Formaciones actualizadas: ${modificadas} de ${backup.length}`)
console.log(`Verificación contra backuotrenes.json: ${ok}/${backup.length} coinciden`)

if (ok !== backup.length) process.exit(1)