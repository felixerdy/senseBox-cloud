var request = require('request')
const fs = require('fs')

var sensebox_id = '5710de1a45fd40c8198ccece'
var sensor_id = '57809b186fea66130081cb6d'

var serverUrl = 'http://myserverurl'

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
    var imageSrc = 'image.jpg'
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

    var bitmap = fs.readFileSync(__dirname + '/' + imageSrc)
    var base64image = new Buffer(bitmap).toString('base64')

    var formData = {
        image: base64image,
        sensebox_id: sensebox_id,
        sensor_id: sensor_id,
        timestamp: new Date()
    }

    request.post({
        url: serverUrl,
        form: formData
    }, function(err, httpResponse, body) {
        if (err)
            console.log(err)
        else
            console.log('respond: ' + httpResponse.statusCode)
    });
}
