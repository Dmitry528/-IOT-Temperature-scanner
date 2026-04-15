import ujson
from time import sleep, time
import sys
from machine import  Pin, I2C

import mqtt
import wifi
import bme280

Error_Led = Pin(18, Pin.OUT)
Success_Led = Pin(21, Pin.OUT)

i2c = I2C(0, scl=Pin(4), sda=Pin(2), freq=10000)
sensor = bme280.BME280(i2c=i2c)

last_sent_time = 0
sent_interval = 300 # 5mins


def main():
    global last_sent_time
    
    Success_Led.off()
    Error_Led.off()
    
    
    with open("env_vars.json") as file:
        config = ujson.load(file)

    # Tries to connect to wifi
    # Success - Green LED glows for 3 seconds
    # Failed - Red LED glows for 3 seconds then program stops executing
    try:
        is_connected = wifi.connect(
            config["ssid"],
            config["ssid_password"]
        )

        Success_Led.on()
        sleep(3)
        Success_Led.off()
        sleep(3)

    except OSError:
        Error_Led.on()
        sleep(3)
        Error_Led.off()
        sys.exit()

    # Create MQTT client
    # Success - Green glows for 3 seconds
    # Failed - Red LED glows for 3 seconds then program stops executing
    try:
        mqtt_client = mqtt.create_mqtt_client(
            config["mqtt_broker"],
            config["mqtt_port"],
            config["mqtt_username"],
            config["mqtt_password"]
        )

        mqtt_client.connect()

        Success_Led.on()
        sleep(3)
        Success_Led.off()
        sleep(3)

    except:
        Error_Led.on()
        sleep(3)
        Error_Led.off()
        sys.exit()
    
    # Wifi and MQTT are connected, now we have to read data from sensor and send it to esp32 each 5 mins
    while True:
        try:
            now = time()
            
            if now - last_sent_time >= sent_interval:
                data = sensor.read_compensated_data()
                payload = mqtt.build_message_payload(config["device_id"],  data[0]/100)
                mqtt_client.publish(config["mqtt_topic"] ,payload)
                last_sent_time = now
                Success_Led.on()
                sleep(1)
                Success_Led.off()
        except Exception as error:
             print(error)
             Error_Led.on()
             sleep(1)
             Error_Led.off()
            


main()