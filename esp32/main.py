import time
import network
import machine
import ubinascii
import ujson

from umqtt.simple import MQTTClient

# You need to upload the matching driver file to ESP32:
# - bme280.py   or
# - bmp280.py
USE_BME280 = True

try:
    import ntptime
    HAS_NTP = True
except ImportError:
    HAS_NTP = False


# =========================
# CONFIG
# =========================
WIFI_SSID = ""
WIFI_PASSWORD = ""

MQTT_BROKER = ""      # your laptop/server IP in local network
MQTT_PORT = 1883 # default port 
MQTT_USER = ""
MQTT_PASSWORD = ""
MQTT_TOPIC = b""            # topic to publish to

DEVICE_ID = ""

# ESP32 common I2C pins:
# SDA = 21
# SCL = 22
I2C_SDA_PIN = 21
I2C_SCL_PIN = 22

# 5 minutes
PUBLISH_INTERVAL_SECONDS = 300


# =========================
# WIFI
# =========================
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if wlan.isconnected():
        print("WiFi already connected:", wlan.ifconfig())
        return wlan

    print("Connecting to WiFi...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    timeout = 20
    while timeout > 0:
        if wlan.isconnected():
            print("WiFi connected:", wlan.ifconfig())
            return wlan
        print("Waiting for WiFi...")
        time.sleep(1)
        timeout -= 1

    raise Exception("WiFi connection failed")


# =========================
# TIME / ISO DATETIME
# =========================
def sync_time():
    if not HAS_NTP:
        print("ntptime not available, skipping time sync")
        return

    try:
        ntptime.settime()  # sets RTC in UTC
        print("Time synced with NTP")
    except Exception as e:
        print("NTP sync failed:", e)


def iso_utc_now():
    # RTC time in UTC
    # returns: YYYY-MM-DDTHH:MM:SSZ
    t = time.localtime()
    year, month, day, hour, minute, second = t[0], t[1], t[2], t[3], t[4], t[5]
    return "{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}Z".format(
        year, month, day, hour, minute, second
    )


# =========================
# SENSOR
# =========================
def init_sensor():
    i2c = machine.I2C(
        0,
        scl=machine.Pin(I2C_SCL_PIN),
        sda=machine.Pin(I2C_SDA_PIN),
        freq=100000
    )

    print("I2C scan:", [hex(addr) for addr in i2c.scan()])

    # Most common address is 0x76 or 0x77
    if USE_BME280:
        import bme280
        sensor = bme280.BME280(i2c=i2c)
        print("BME280 initialized")
    else:
        import bmp280
        sensor = bmp280.BMP280(i2c)
        print("BMP280 initialized")

    return sensor


def read_temperature(sensor):
    if USE_BME280:
        # bme280 library usually returns bytes like b'24.3C'
        raw_temp = sensor.values[0]  # temperature
        if isinstance(raw_temp, bytes):
            raw_temp = raw_temp.decode("utf-8")
        raw_temp = raw_temp.replace("C", "").strip()
        return raw_temp
    else:
        # bmp280 library usually returns float
        temp = sensor.temperature
        return "{:.2f}".format(temp)


# =========================
# MQTT
# =========================
def create_mqtt_client():
    client_id = b"esp32-" + ubinascii.hexlify(machine.unique_id())

    client = MQTTClient(
        client_id=client_id,
        server=MQTT_BROKER,
        port=MQTT_PORT,
        user=MQTT_USER,
        password=MQTT_PASSWORD,
        keepalive=60
    )

    client.connect()
    print("Connected to MQTT:", MQTT_BROKER, MQTT_PORT)
    return client


def build_payload(temperature):
    payload = {
        "deviceId": DEVICE_ID,
        "data": {
            "temperature": str(temperature),
            "sentAt": iso_utc_now()
        }
    }
    return ujson.dumps(payload)


# =========================
# MAIN LOOP
# =========================
def main():
    connect_wifi()
    sync_time()

    sensor = init_sensor()
    client = create_mqtt_client()

    while True:
        try:
            # reconnect WiFi if needed
            wlan = network.WLAN(network.STA_IF)
            if not wlan.isconnected():
                print("WiFi lost, reconnecting...")
                connect_wifi()
                sync_time()

            temperature = read_temperature(sensor)
            payload = build_payload(temperature)

            client.publish(MQTT_TOPIC, payload)
            print("Published to", MQTT_TOPIC)
            print(payload)

        except Exception as e:
            print("Error:", e)

            # try MQTT reconnect
            try:
                client.disconnect()
            except Exception:
                pass

            time.sleep(2)

            try:
                connect_wifi()
            except Exception as wifi_err:
                print("WiFi reconnect failed:", wifi_err)

            try:
                client = create_mqtt_client()
            except Exception as mqtt_err:
                print("MQTT reconnect failed:", mqtt_err)

        time.sleep(PUBLISH_INTERVAL_SECONDS)


main()
