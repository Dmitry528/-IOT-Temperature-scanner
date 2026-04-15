from machine import idle
import network

def connect(ssid, ssid_password):
    wlan = network.WLAN()
    wlan.active(True)

    if not wlan.isconnected():
        wlan.connect(ssid, ssid_password)

        while not wlan.isconnected():
            idle()
    if wlan.isconnected():
        return  True