# SANJAF Ventas 🥬

App para registrar ventas y costos, generar notas de remisión y controlar cobranza,
para **SANJAF Frutas y Verduras**. Corre en **Supabase** (base de datos) + **Vercel** (hosting) + **GitHub** (código).

Funciona en celular y computadora con la misma liga, y los datos se sincronizan entre dispositivos.

---

## Qué incluye este paquete

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app completa. Es lo único que se publica en Vercel. |
| `schema.sql` | Crea las tablas y la seguridad en Supabase. **Se corre 1 vez.** |
| `seed_catalogo.sql` | Carga tus 117 productos. **Se corre 1 vez, después del schema.** |
| `seed_historial.sql` | *(Opcional)* Carga tus 38 ventas de agosto para ver el Panel con datos reales. |
| `vercel.json` | Configuración mínima para Vercel. |

---

## Puesta en marcha (una sola vez, ~15 minutos)

### 1) Crea tu base de datos en Supabase
1. Entra a **https://supabase.com** → *Start your project* → crea una cuenta (gratis).
2. **New project**. Ponle nombre (ej. `sanjaf`), elige una contraseña de base de datos y la región más cercana. Espera ~2 min a que se cree.

### 2) Crea las tablas
1. En el menú izquierdo abre **SQL Editor** → **New query**.
2. Abre `schema.sql`, **copia todo** el contenido, pégalo y presiona **Run**.
3. Nueva query: haz lo mismo con `seed_catalogo.sql` (carga tus productos).
4. *(Opcional)* Otra query con `seed_historial.sql` si quieres el Panel con agosto ya adentro.

### 3) Crea tu usuario para entrar a la app
1. Menú **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe tu **correo** y una **contraseña**. Marca "Auto Confirm User" si aparece.
3. Ese correo y contraseña serán tu login en la app.

### 4) Copia tus llaves de conexión
1. Menú **Project Settings** (engrane) → **API**.
2. Copia dos cosas y guárdalas a la mano:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key (una cadena larga que empieza con `eyJ...`)

> La llave `anon public` es segura para usarse en la app: la seguridad real la da tu login + las reglas (RLS) que ya vienen en `schema.sql`.

### 5) Sube el código a GitHub
**Opción fácil (sin instalar nada):**
1. Entra a **https://github.com**, crea cuenta y luego **New repository** → nómbralo `sanjaf-ventas` → **Create**.
2. En el repo vacío: **Add file → Upload files**, arrastra **todos** los archivos de esta carpeta y **Commit changes**.

### 6) Publica en Vercel
1. Entra a **https://vercel.com** → *Sign up* con tu cuenta de GitHub.
2. **Add New… → Project** → importa tu repo `sanjaf-ventas`.
3. Deja todo por defecto (Framework: *Other*) y presiona **Deploy**. En ~1 min te da una liga tipo `https://sanjaf-ventas.vercel.app`.

### 7) Entra y conéctala
1. Abre la liga de Vercel en tu celular o compu.
2. La primera vez te pide la **Project URL** y la **anon public key** (las del paso 4). Pégalas → **Conectar**.
3. Inicia sesión con el correo y contraseña del paso 3. ¡Listo!

> **Consejo:** en el celular, abre la liga en Chrome/Safari y elige **"Agregar a pantalla de inicio"**. Queda como una app.

---

## Cómo se usa

- **Vender:** eliges cliente, buscas el producto y escribes cantidad y precio (el precio se llena solo del catálogo y lo puedes ajustar). Al guardar se crea la nota con folio automático.
- **Notas:** todas tus ventas con su estatus. Cada nota tiene **Pago** (por cobrar / pagado) y **Factura** (por facturar / facturada). Filtra "por cobrar" o "por facturar". Adentro: **WhatsApp** e **Imprimir/PDF**.
- **Catálogo:** busca, edita costo/precio y agrega productos. Costo + % de ganancia calcula el precio solo.
- **Panel:** venta, utilidad y margen de hoy / semana / mes, más los más vendidos.

---

## Notas importantes

- **Folios:** los nuevos empiezan en **41** (tu Excel llegó al 40).
- **Historial de agosto:** si corriste `seed_historial.sql`, esas 38 ventas quedan marcadas como **pagadas y facturadas** (ventas ya cerradas), para que no aparezcan en "por cobrar".
- **10 productos sin precio:** los que traías como "pend" (uva morada, nectarina, cereza, mandarina, jícama, jitomate verde, espárrago, verdolaga, chícharo y uno más) aparecen con "—". Ponles costo y precio en Catálogo cuando los tengas.
- **Cambiar la conexión:** si te equivocas de llaves, en la pantalla de login toca "Cambiar conexión".
- **Fijar las llaves (opcional):** si no quieres pegarlas en cada dispositivo, abre `index.html`, busca `window.SANJAF_CONFIG` y escribe ahí tu `url` y `anon`.

---

## Próximas fases (cuando quieras)
- Ficha de cliente con saldo y precios especiales por cliente.
- Control de compra diaria e inventario.
- Facturación CFDI real ante el SAT (requiere contratar un timbrador / PAC).
