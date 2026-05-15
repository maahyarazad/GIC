const Jimp = require("jimp").default;

async function processImage() {
  const img = Jimp.read("/Users/germanworldclub/Desktop/GIC/ui/public/gic-log-main.png");

  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    const isNearBlack = r < 40 && g < 40 && b < 40;
    const isNearWhite = r > 215 && g > 215 && b > 215;
    const isYellow = r > 180 && g > 130 && b < 80;
    const isRed = r > 150 && g < 60 && b < 60;
    const isGray =
      Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r > 60 && r < 200;

    if (isYellow || isRed || isGray) return;

    if (isNearBlack) {
      this.bitmap.data[idx] = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
      return;
    }

    if (isNearWhite) {
      this.bitmap.data[idx] = 0;
      this.bitmap.data[idx + 1] = 0;
      this.bitmap.data[idx + 2] = 0;
    }
  });

  await img.writeAsync("/Users/germanworldclub/Desktop/GIC/output-light.png");
  console.log("Done");
}

processImage().catch(console.error);