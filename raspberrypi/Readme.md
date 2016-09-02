# Hardware
1. Verbinde die Kamera mit dem Raspberry Pi
2. Verbinde den Lichtsensor mit dem Raspberry Pi
  * GND zu 06
  * VCC zu 01
  * SDA zu 03
  * SCL zu 05
3. Falls nötig, verbinde den Raspberry Pi mit dem Internet über Ethernet
4. Verbinde den Raspberry Pi mit Strom über Micro-USB

# Software
1. Aktiviere die Kamera über `sudo raspi-config`
2. Installiere Node.js und git auf dem Raspberry Pi
3. Klone das Repository
4. Wechsel in den Ordner `raspberrypi`
5. `npm install`
6. installiere forever
7. `forever start index.js`
