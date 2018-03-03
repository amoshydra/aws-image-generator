const sharp = require('sharp');
const request = require('request');

const resolveFloat = (value, otherwise) => {
  const parsed = parseFloat(value);
  if (parsed === 0) return 0;
  return parsed || otherwise;
}

const Profile = function Profile(options) {
  if (!options.url) throw new Error('Please specify a URL in the options');
  
  // Set up url
  this.url = options.url;

  // Set up sizes
  this.sizes = {}
  this.sizes.height = parseInt(options.h) || 630;
  this.sizes.width = parseInt(options.w) || 1200;
  this.sizes.padding = Math.trunc(this.sizes.height * resolveFloat(options.p, 0.04285714285714286));
  this.sizes.profile = Math.min(this.sizes.height, this.sizes.width) - (this.sizes.padding * 2);
  this.sizes.radius = this.sizes.profile / 2;

  // Set up background
  this.fill = (options.rgb || '255,255,255');
  const bgColor = this.fill.split(',').map(value => parseInt(value));
  
  this.background = {
    width: this.sizes.width,
    height: this.sizes.height,
    channels: 3,
    background: { r: bgColor[0], g: bgColor[1], b: bgColor[2] }
  };

  // Circles
  this.circle = !options.square && new Buffer(`<svg><circle cx="${this.sizes.radius}" cy="${this.sizes.radius}" r="${this.sizes.radius}" /></svg>`);

  // Shadow
  this.shadow = options.shadow && new Buffer(`
    <svg width="${this.sizes.width}" height="${this.sizes.height}">
      <defs>
        <filter id="dropshadow" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feComponentTransfer in="SourceAlpha">
            <feFuncR type="discrete" tableValues="0"/>
            <feFuncG type="discrete" tableValues="0"/>
            <feFuncB type="discrete" tableValues="0"/>
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="4"/>
          <feOffset dx="1" dy="1" result="shadow"/>
          <feComposite in="SourceGraphic" in2="shadow" operator="over"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="rgb(${this.fill})" />
      ${
        (this.circle)
        ? `<circle cx="${this.sizes.width / 2}" cy="${this.sizes.height / 2}" r="${this.sizes.radius - 2}" filter="url(#dropshadow)" />`
        : `<rect x="${this.sizes.width / 2 - this.sizes.radius}" y="${this.sizes.height / 2 - this.sizes.radius}" height="${this.sizes.profile - 2}" width="${this.sizes.profile - 2}" filter="url(#dropshadow)" />`
      }
    </svg>
  `)
};

/**
 * @returns stream
 */
Profile.prototype.fetch = function() {
  return request
    .get(this.url)
    .on('error', (error) => { throw error; });
};

Profile.prototype.toProfileImageStream = function() {
  const profileImageStream = sharp();
  profileImageStream
    .resize(this.sizes.profile, this.sizes.profile)
  if (this.circle) {
    profileImageStream.overlayWith(this.circle, { cutout: true })
  }
  profileImageStream.png();
  return profileImageStream;
}
Profile.prototype.placeOnBackground = function(buffer) {
  return new Promise((resolve, reject) => {
    const finalStream = sharp(this.shadow ? this.shadow : { create: this.background });
    finalStream
      .overlayWith(buffer)
      .jpeg()

    resolve(finalStream);
  })
}

// Download image and pass image to processing pipeline
module.exports = {
  generateImage(options, stream) {
    const profile = new Profile(options);

    try {
      return profile
        .fetch()
  
        // Crop picture to circle
        .pipe(profile.toProfileImageStream())
        .toBuffer()
  
        // Put picture on a background
        .then(profile.placeOnBackground.bind(profile))
  
        // End of stream
        .then((endStream) => {
          if (stream) endStream.pipe(stream);
          return endStream;
        })
    } catch (error) {
      return Promise.reject(error);
    }
  },
  getPlaceholder(stream) {
    return sharp(__dirname + './assets/empty.png')
      .jpeg()
      .pipe(stream);
  }
};
