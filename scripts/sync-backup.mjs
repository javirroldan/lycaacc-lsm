import { createClient } from "@supabase/supabase-js"
import fs from "node:fs/promises"
import { readFileSync } from "node:fs"

function leerEnv(ruta) {
  const vars = {}
  const texto = readFileSync(ruta, "utf8")
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

const url = env.VITE_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env / .env.local")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const backup = JSON.parse(await fs.readFile("backuotrenes.json", "utf8"))

function toIso(fecha) {
  if (!fecha) return null
  const [dd, mm, yyyy] = fecha.split("/")
  return `${yyyy}-${mm}-${dd}`
}

const { data: antes, error: errAntes } = await supabase
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

  const { error } = await supabase
    .from("formaciones")
    .update({ anteultima: fila.anteultima, ultima: fila.ultima, estado: fila.estado })
    .eq("formacion", f.formacion)

  if (error) throw new Error(`formacion ${f.formacion}: ${error.message}`)
  modificadas++
}

const { data: despues, error: errDespues } = await supabase
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