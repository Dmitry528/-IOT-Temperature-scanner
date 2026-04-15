from umqtt.simple import MQTTClient
import time
import ujson

def create_mqtt_client(mqtt_broker, mqtt_port, mqtt_user, mqtt_password):
    client_id = b"temperature-device-1-"

    client = MQTTClient(
        client_id=client_id,
        server=mqtt_broker,
        port=mqtt_port,
        user=mqtt_user,
        password=mqtt_password,
        keepalive=350
    )

    return client

def iso_utc_now():
    t = time.gmtime()  # UTC time
    return "{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}Z".format(
        t[0], t[1], t[2],
        t[3], t[4], t[5]
    )

def build_message_payload(device_id, temperature):
    payload = {
        "deviceId": device_id,
        "data": {
            "temperature": temperature,
            "sentAt": iso_utc_now()
        }
    }
    return ujson.dumps(payload)
