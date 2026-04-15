# IOT Temperature Scanner

ESP32 (MicroPython) reads temperature from a **BME280** sensor and publishes it to an **MQTT** broker. A **Fastify + Prisma** backend subscribes to the MQTT topic and persists readings into **Postgres**.

## Project structure

- **`esp32/`**: MicroPython firmware (Wi‑Fi + MQTT + BME280 reading loop)
- **`backend/`**: Fastify server, MQTT subscriber, Prisma/Postgres persistence
- **`mosquitto/`**: MQTT broker config (auth enabled)
- **`docker-compose.yml`**: runs `backend`, `db` (Postgres), `mosquitto`
- **`frontend/`**: placeholder (`.gitkeep` only)

## Data flow (end-to-end)

- **ESP32** publishes JSON to MQTT topic **`devices`**
- **Backend** subscribes to topic **`devices`** and validates payload
- **Backend** writes to Postgres table **`temperature_readings`** (Prisma model `TemperatureReadings`)

### MQTT message contract

- **Topic**: `devices`
- **Payload** (JSON string):

```json
{
  "deviceId": "temperature-device-1",
  "data": {
    "temperature": 23.5,
    "sentAt": "2026-04-15T11:22:33Z"
  }
}
```

## Running the backend stack (Docker)

### Prerequisites

- Docker + Docker Compose

### 1) Create `backend/.env`

Copy `backend/.env.example` to `backend/.env` and fill values.

Minimum required variables (all are required by the backend schema):

- **Server**
  - `HOST` (example: `0.0.0.0`)
  - `PORT` (example: `8080`)
- **MQTT**
  - `MQTT_HOST` (for compose: `mosquitto`)
  - `MQTT_PORT` (for compose: `1883`)
  - `MQTT_USERNAME`
  - `MQTT_PASSWORD`
- **Postgres**
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
  - `DATABASE_URL` (example below)

Example `DATABASE_URL` for this compose setup:

```text
postgresql://POSTGRES_USER:POSTGRES_PASSWORD@db:5432/POSTGRES_DB
```

### 2) Start services

From repo root:

```bash
docker compose up --build
```

### Ports

- **Backend HTTP**: `localhost:3000` (container listens on `8080`, mapped by compose)
- **Prisma Studio**: `localhost:5555` (only relevant if you run `pnpm prisma:studio` inside backend container or locally)
- **Postgres**: `localhost:5432`
- **MQTT**: `localhost:1883`

## MQTT broker authentication

Mosquitto is configured with:

- `allow_anonymous false`
- `password_file /mosquitto/config/passwd`

The repo includes a `mosquitto/config/passwd` file with users already created (hashed passwords). To avoid depending on unknown passwords, the simplest workflow is:

- **Option A (recommended)**: create your own Mosquitto password file and mount it in `mosquitto/config/`
- **Option B**: keep the existing `passwd` but set `MQTT_USERNAME`/`MQTT_PASSWORD` to match a known user you created

If you want to create/update credentials locally (requires `mosquitto_passwd` installed):

```bash
mosquitto_passwd -c mosquitto/config/passwd <username>
```

## ESP32 firmware (MicroPython)

### What it does

`esp32/main.py`:

- Reads configuration from `esp32/env_vars.json`
- Connects to Wi‑Fi
- Connects to MQTT
- Reads BME280 temperature over I2C
- Publishes to MQTT topic every **5 minutes** (300 seconds)
- Uses GPIO LEDs for status:
  - **GPIO 21**: success LED
  - **GPIO 18**: error LED

### Wiring / pins (as currently coded)

- **I2C**
  - `SCL = GPIO 4`
  - `SDA = GPIO 2`
  - `freq = 10000`

Update these pins in `esp32/main.py` if your wiring differs.

### Configure ESP32 (`esp32/env_vars.json`)

Fill in:

- `ssid`, `ssid_password`
- `mqtt_broker` (example: your laptop IP on the same Wi‑Fi, or a LAN broker)
- `mqtt_port` (default `1883`)
- `mqtt_username`, `mqtt_password`
- `mqtt_topic` (**must be** `devices` to match backend subscriptions)
- `device_id` (example: `temperature-device-1`)

### Flash / upload files

Use any MicroPython workflow you prefer (Thonny, `mpremote`, `rshell`, etc.). One `mpremote` example:

```bash
# adjust the port to your device (e.g. /dev/tty.usbserial-*)
mpremote connect /dev/tty.usbserial-XXXX fs cp esp32/*.py :
mpremote connect /dev/tty.usbserial-XXXX fs cp esp32/env_vars.json :
mpremote connect /dev/tty.usbserial-XXXX reset
```

## Local backend development (without Docker)

### Prerequisites

- Node.js (recent)
- `pnpm`
- A running Postgres + Mosquitto (or use `docker compose up db mosquitto`)

### Run

```bash
cd backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm start:dev
```

## Troubleshooting

- **Backend starts but no data is saved**
  - Ensure ESP32 publishes to topic **`devices`**
  - Ensure `MQTT_USERNAME`/`MQTT_PASSWORD` match Mosquitto credentials
  - Check backend logs for payload validation errors (schema mismatch)
- **ESP32 connects to Wi‑Fi but fails on MQTT**
  - Confirm `mqtt_broker` is reachable from ESP32 (IP/hostname + port)
  - Confirm Mosquitto auth is correct
- **No readings / sensor errors**
  - Verify I2C wiring (SDA/SCL) and power
  - If your board uses a different I2C bus/pins, change them in `esp32/main.py`
