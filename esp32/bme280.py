from machine import I2C
import time

# BME280 default address
BME280_I2CADDR = 0x76


class BME280:
    def __init__(self, i2c: I2C, address=BME280_I2CADDR):
        self.i2c = i2c
        self.address = address

        self._load_calibration()

    def _read(self, register, length):
        return self.i2c.readfrom_mem(self.address, register, length)

    def _read_u16(self, register):
        data = self._read(register, 2)
        return data[0] | (data[1] << 8)

    def _read_s16(self, register):
        result = self._read_u16(register)
        if result > 32767:
            result -= 65536
        return result

    def _load_calibration(self):
        self.dig_T1 = self._read_u16(0x88)
        self.dig_T2 = self._read_s16(0x8A)
        self.dig_T3 = self._read_s16(0x8C)

        self.dig_P1 = self._read_u16(0x8E)
        self.dig_P2 = self._read_s16(0x90)
        self.dig_P3 = self._read_s16(0x92)
        self.dig_P4 = self._read_s16(0x94)
        self.dig_P5 = self._read_s16(0x96)
        self.dig_P6 = self._read_s16(0x98)
        self.dig_P7 = self._read_s16(0x9A)
        self.dig_P8 = self._read_s16(0x9C)
        self.dig_P9 = self._read_s16(0x9E)

        self.dig_H1 = self._read(0xA1, 1)[0]
        self.dig_H2 = self._read_s16(0xE1)
        self.dig_H3 = self._read(0xE3, 1)[0]

        e4 = self._read(0xE4, 1)[0]
        e5 = self._read(0xE5, 1)[0]
        e6 = self._read(0xE6, 1)[0]

        self.dig_H4 = (e4 << 4) | (e5 & 0x0F)
        self.dig_H5 = (e6 << 4) | (e5 >> 4)
        self.dig_H6 = self._read(0xE7, 1)[0]
        if self.dig_H6 > 127:
            self.dig_H6 -= 256

    def read_raw_data(self):
        # force measurement
        self.i2c.writeto_mem(self.address, 0xF4, b'\x25')
        time.sleep_ms(10)

        data = self._read(0xF7, 8)

        adc_p = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4)
        adc_t = (data[3] << 12) | (data[4] << 4) | (data[5] >> 4)
        adc_h = (data[6] << 8) | data[7]

        return adc_t, adc_p, adc_h

    def read_compensated_data(self):
        adc_t, adc_p, adc_h = self.read_raw_data()

        # Temperature
        var1 = (((adc_t >> 3) - (self.dig_T1 << 1)) * self.dig_T2) >> 11
        var2 = (((((adc_t >> 4) - self.dig_T1) *
                 ((adc_t >> 4) - self.dig_T1)) >> 12) *
                self.dig_T3) >> 14

        t_fine = var1 + var2
        temperature = (t_fine * 5 + 128) >> 8  # *100

        # Pressure
        var1 = t_fine - 128000
        var2 = var1 * var1 * self.dig_P6
        var2 = var2 + ((var1 * self.dig_P5) << 17)
        var2 = var2 + (self.dig_P4 << 35)
        var1 = ((var1 * var1 * self.dig_P3) >> 8) + \
               ((var1 * self.dig_P2) << 12)
        var1 = (((1 << 47) + var1) * self.dig_P1) >> 33

        if var1 == 0:
            pressure = 0
        else:
            p = 1048576 - adc_p
            p = ((p << 31) - var2) * 3125 // var1
            var1 = (self.dig_P9 * (p >> 13) * (p >> 13)) >> 25
            var2 = (self.dig_P8 * p) >> 19
            pressure = ((p + var1 + var2) >> 8) + (self.dig_P7 << 4)

        # Humidity
        h = t_fine - 76800
        h = (((((adc_h << 14) - (self.dig_H4 << 20) -
               (self.dig_H5 * h)) + 16384) >> 15) *
             (((((((h * self.dig_H6) >> 10) *
               (((h * self.dig_H3) >> 11) + 32768)) >> 10) + 2097152) *
               self.dig_H2 + 8192) >> 14))

        h = h - (((((h >> 15) * (h >> 15)) >> 7) *
                 self.dig_H1) >> 4)

        h = 0 if h < 0 else h
        h = 419430400 if h > 419430400 else h
        humidity = h >> 12

        return temperature, pressure, humidity