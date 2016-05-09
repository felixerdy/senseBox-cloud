var suncalc = require("suncalc");
var Jimp = require("Jimp");

Jimp.read("clouds.jpg", function (err, image) {
    if (err) throw err;

    var pos = suncalc.getPosition(new Date(), 51.969, 7.596);

    pos.azimuth = 180 + (pos.azimuth * 57.295779513082320876798154814106);
    pos.altitude = (pos.altitude * 57.295779513082320876798154814106) * 0.7;


    var azimin = ((pos.azimuth - pos.altitude) < 0 ? 360 - Math.abs(pos.azimuth - pos.altitude) : pos.azimuth - pos.altitude);
    var azimax = (pos.azimuth + pos.altitude) > 360 ? 360 - pos.azimuth + pos.altitude : pos.azimuth + pos.altitude;

    var centerx = image.bitmap.width / 2;
    var centery = image.bitmap.height / 2;

    console.log(pos);
    console.log(azimin + " " + azimax);

    for(var x = 0; x < image.bitmap.width; x++) {
      for(var y = 0; y < image.bitmap.height; y++) {
        var dx = Math.abs(x - centerx);
        var dy = Math.abs(y - centery);

        alpha = Math.atan(dy/dx);

        alpha = alpha * 57.295779513082320876798154814106;

        if(x > centerx) {
          if(y > centery) {
            alpha = alpha + 270;
          } else {

          }
        } else {
          if(y > centery) {
            alpha = alpha + 180;
          } else {
            alpha = alpha + 90;
          }
        }

        if(alpha > azimin && alpha < azimax) {
          image.setPixelColor(0xFFFFFF, x, y);
        }

      }
    }

    image.write("clouds_with_alt.jpg"); // save
});
