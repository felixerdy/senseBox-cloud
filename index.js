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

    var counter = 0;

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

        if(alpha > azimin && alpha < azimax && pos.altitude > 45) {
          //image.setPixelColor(0xFFFFFF, x, y);
        } else {
          var rgb = Jimp.intToRGBA(image.getPixelColor(x, y));
          var hsv = rgb2hsv(rgb.r, rgb.g, rgb.b);
          //console.log(hsv.h);
          //if(rgb2hsv(rgb.r, rgb.g, rgb.b).v > 49) {       // helligkeit
          //if((hsv.h < 120 || hsv.h > 300) && hsv.v > 30 ) {  // blauwert & helligkeit
          //if(hsv.s < 15) {  // saettigung
          if(hsv.v > 60) {  // saettigung
            // Pixel is cloud
            counter ++;
            image.setPixelColor(0xffffffff, x, y);
          } else {
            // Pixel is sky
            image.setPixelColor(0x00000000, x, y);
          }

        }

      }
    }

    var imageSize = image.bitmap.width * image.bitmap.height;

    console.log((counter/imageSize)*100 + "");

    image.write("clouds_with_alt.jpg"); // save
});

function rgb2hsv () {
    var rr, gg, bb,
        r = arguments[0] / 255,
        g = arguments[1] / 255,
        b = arguments[2] / 255,
        h, s,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function(c){
            return (v - c) / 6 / diff + 1 / 2;
        };

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        }else if (g === v) {
            h = (1 / 3) + rr - bb;
        }else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };
}
