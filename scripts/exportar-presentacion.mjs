import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const raiz = resolve(__dirname, "..")

const BUSCAR = [
  "CHROME_BIN",
  "CHROMIUM",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/opt/google/chrome/chrome",
]

const cromium = BUSCAR.map((c) => process.env[c] ?? c).find((c) => existsSync(c))
if (!cromium) {
  console.error("No se encontró Chromium/Chrome. Seteá la variable CHROME_BIN.")
  process.exit(1)
}

const html = resolve(raiz, "presentacion", "index.html")
const salida = process.argv[2] ?? resolve(raiz, "presentacion-trenes-imagenes", "AACC-LSM.pdf")

const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  `--print-to-pdf=${salida}`,
  "--print-to-pdf-no-header",
  `file://${html}`,
]

const res = spawnSync(cromium, args, { stdio: "inherit", timeout: 120000 })

if (res.status !== 0) {
  console.error(`Exportación falló (código ${res.status}).`)
  process.exit(1)
}
console.log(`PDF generado: ${salida}`)