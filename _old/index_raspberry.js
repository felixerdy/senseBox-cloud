var Jimp = require('jimp')
var request = require('request')
var SunCalc = require('suncalc')


var averageCoverage = []
var intervalCounter = 0

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

    }, 5000) // 10 sec


/**
 *  Take a photo and calculate cloud coverage
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
        var counter = 0

        // required, otherwise the sun is calculated on the wrong side
        image.rotate(180)
        image.flip(true, false)

        // current sun position in Münster
        var sunPos = SunCalc.getPosition(new Date(), 51.9554, 7.6206)
        sunPos.azimuth *= (180 / Math.PI)
        sunPos.azimuth += 180

        // factor 0.7 for a big kegel
        sunPos.altitude = sunPos.altitude * (180 / Math.PI) * 0.7;

        // center of the image
        var centerx = Math.floor(image.bitmap.width / 2)
        var centery = Math.floor(image.bitmap.height / 2)

        // min and max for the kegel
        var azimin = ((sunPos.azimuth - sunPos.altitude) < 0 ? 360 - Math.abs(sunPos.azimuth - sunPos.altitude) : sunPos.azimuth - sunPos.altitude);
        var azimax = (sunPos.azimuth + sunPos.altitude) > 360 ? 360 - sunPos.azimuth + sunPos.altitude : sunPos.azimuth + sunPos.altitude;

        console.log(sunPos)
        console.log({
            azimin,
            azimax
        })

        for (var x = 0; x < image.bitmap.width; x++) {
            for (var y = 0; y < image.bitmap.height; y++) {

                // calculate angle of current pixel
                var dx = Math.abs(x - centerx);
                var dy = Math.abs(y - centery);

                var alpha = 0

                if (x > centerx) {
                    if (y > centery) {
                        alpha = Math.atan(dx / dy) * (180 / Math.PI);
                    } else {
                        alpha = (Math.atan(dy / dx) * (180 / Math.PI)) + 90;
                    }
                } else {
                    if (y > centery) {
                        alpha = (Math.atan(dy / dx) * (180 / Math.PI)) + 270;
                    } else {
                        alpha = (Math.atan(dx / dy) * (180 / Math.PI)) + 180;
                    }
                }
                // TODO: add thereshold when sun has no impact on image
                if (alpha > azimin && alpha < azimax && altitude > 75) {
                    image.setPixelColor(0x000000ff, x, y);
                } else {

                    var hex = image.getPixelColor(x, y)
                    var rgb = Jimp.intToRGBA(hex)
                    var rbr = rgb.r / rgb.b
                        //console.log(rbr)
                    if (rgb.r > 250 && rgb.g > 250 && rgb.b > 250) { // volle sättigung -> sonne
                        image.setPixelColor(0xffffffff, x, y); // white
                    } else {
                        counter++
                        if (rbr >= 1) {
                            image.setPixelColor(0xff0000ff, x, y); // rot
                        } else if (rbr < 1 && rbr >= 0.95) {
                            image.setPixelColor(0xfffc00ff, x, y); // gelb
                        } else if (rbr < 0.95 && rbr >= 0.85) {
                            image.setPixelColor(0x1cff00ff, x, y); // gruen
                        } else {
                            image.setPixelColor(0x400ffff, x, y); // blau
                            counter--
                        }
                    }
                }
            }
        }
        // calculate coverage in %
        var coverage = ((counter / (image.bitmap.width * image.bitmap.height)) * 100)

        averageCoverage.push(coverage)

        // use 6 measurements to calculate the average coverage during the last interval
        if (intervalCounter % 6 == 0) {
            var sum = 0
            for (var i = 0; i < averageCoverage.length; i++) {
                sum += averageCoverage[i]
            }
            var avg = sum / averageCoverage.length

            // post data to opensensemap
            postToOSeM(avg)

            averageCoverage = [] // flush array
        }

        image.write(imageSrc.split('.jpg')[0] + '-output.jpg')
    })
}

/*
 *  post coverage to openSenseMap
 *  @param coverage the measured coverage 
 */
function postToOSeM(coverage) {
    // post measured coverage
    request.post({
        url: 'https://api.opensensemap.org/boxes/5710de1a45fd40c8198ccece/57809b186fea66130081cb6d',
        form: {
            value: coverage.toFixed(2).toString(),
            createdAt: (new Date()).toISOString()
        }
    }, function(err, httpResponse, body) {
        console.log('own post respond: ' + httpResponse.statusCode)
    });

    // get ifgi ceilometer coverage and post it
    request('http://www.uni-muenster.de/Klima/data/0017behg_de.txt', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var ifgiCoverage = body.split('/8')[0]
            request.post({
                url: 'https://api.opensensemap.org/boxes/5710de1a45fd40c8198ccece/5784ec9a6078ab1200a4f73d',
                form: {
                    value: ifgiCoverage,
                    createdAt: (new Date()).toISOString()
                }
            }, function(err, httpResponse, body) {
                console.log('ifgi post respond: ' + httpResponse.statusCode)
            });
        }
    })
}
