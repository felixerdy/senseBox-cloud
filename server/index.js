var Jimp = require('jimp')
var request = require('request')
var SunCalc = require('suncalc')
var express = require('express')

var app = express()


var averageCoverage = []
var intervalCounter = 0

app.post('/', function (req, res) {
  Jimp.read(req.params.image, function(err, image) {

    // counts the cloud pixels
    var counter = 0;

    // required, otherwise the sun is calculated on the wrong side
    image.rotate(180)
    image.flip(true, false)

    // current sun position in Münster
    var sunPos = SunCalc.getPosition(req.params.timestamp, req.params.location.lon, req.params.location.lat)
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
        postToOSeM(avg, sensebox_id, sensor_id, timestamp)

        averageCoverage = [] // flush array
    }
  });
});

/*
 *  post coverage to openSenseMap
 *  @param coverage the measured coverage
 */
function postToOSeM(coverage, sensebox_id, sensor_id, timestamp) {
    // post measured coverage
    request.post({
        url: 'https://api.opensensemap.org/boxes/' + sensebox_id + '/' + sensor_id,
        form: {
            value: coverage.toFixed(2).toString(),
            createdAt: timestamp.toISOString()
        }
    }, function(err, httpResponse, body) {
        console.log('own post respond: ' + httpResponse.statusCode)
    });

    // get ifgi ceilometer coverage and post it
    request('http://www.uni-muenster.de/Klima/data/0017behg_de.txt', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var ifgiCoverage = body.split('/8')[0]
            request.post({
                url: 'https://api.opensensemap.org/boxes/' + sensebox_id + '/5784ec9a6078ab1200a4f73d',
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

app.listen(3000, function () {
  console.log('server running on :3000')
});
