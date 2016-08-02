var Jimp = require('jimp')
var request = require('request')

var sensebox_id = '5710de1a45fd40c8198ccece'
var sensor_id = '5784ec9a6078ab1200a4f73d'

// geolocation of sensebox
var location = {
  lon: 51.9554,
  lat: 7.6206
}

var serverUrl = 'https://myserverurl.com/'

setInterval(function() {
        var spawn = require('child_process').spawn;

        // get luminance
        var luminanceSpawn = spawn(process.cwd() + '/./tsl');
        luminanceSpawn.stdout.on('data', (data) => {
            console.log(data.toString('utf-8').split('.')[0])
            var lux = parseFloat(data.toString('utf-8').split('.')[0])
                // var expSS = 0.0004*Math.exp(-7*(Math.pow(10, -5)*lux.toFixed(6)))

            // use own function to calculate shutterSpeed
            var potSS = 0.7368 * Math.pow(lux.toFixed(6), -0.915)

            // takePhoto("exp", data.toString('utf-8').split('.')[0], expSS)
            takePhoto("pot", data.toString('utf-8').split('.')[0], potSS)

        })
        intervalCounter++

    }, 10000) // 10 sec


/**
 *  Take a photo and send it to server
 *  @param type which shutterSpeed function is used (only used in filename)
 *  @param luminance the current luminance (only used in filename)
 *  @param shutterSpeed the required shutterSpeed
 */
function takePhoto(type, luminance, shutterSpeed) {
    if (luminance === 0) {
        shutterSpeed = 6
    }
    var spawnSync = require('child_process').spawnSync
    // filename of new photo
    var imageSrc = 'images/image_' + luminance + '_' + shutterSpeed.toFixed(6) + '_' + type + '_awb_sun_iso100_backlit.jpg'
    var cameraSpawn = spawnSync(
        'raspistill', [
            '-o',
            imageSrc,
            '-t',
            '1',
            '-ss',
            shutterSpeed * 1000000,
            '--metering',
            'backlit',
            '--ISO',
            '100',
            '--awb',
            'sun',
            '--nopreview'
        ]
    )

    // read photo and calculate cloud coverage
    Jimp.read(imageSrc, function(err, image) {
      request.post({
          url: serverUrl,
          form: {
              image: image,
              location: location,
              sensebox_id: sensebox_id,
              sensor_id: sensor_id,
              timestamp: new Date()
          }
      }, function(err, httpResponse, body) {
          console.log('own post respond: ' + httpResponse.statusCode)
      });
    })
}
