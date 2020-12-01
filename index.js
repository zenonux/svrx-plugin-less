const less = require('less');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');
const EventEmitter = require('events');
const { Transform } = require('stream');
const fs = require('fs');

const autoprefixPlugin = new LessPluginAutoPrefix({ browsers: ['last 2 versions'] });

class LessTransform extends Transform {
  constructor(cssPath) {
    super({
      transform(chunk, enc, callback) {
        this._chunkString.push(chunk.toString());
        callback();
      },
      async flush(callback) {
        let code = this._chunkString.join('');
        try {
          const res = await less.render(code, {
            paths: [process.cwd() + cssPath],
            plugins: [autoprefixPlugin],
          });
          code = res.css;
        } catch (error) {
          console.warn('LessTransform', error);
        }
        this.push(code);
        callback();
      },
    });

    this._chunkString = [];
  }
}

function isReadableStream(test) {
  // ducking type check
  return test instanceof EventEmitter && typeof test.read === 'function';
}

function _transform(body, cssPath) {
  if (isReadableStream(body)) {
    body = body.pipe(new LessTransform(cssPath));
  }
  return body;
}

async function onTransform(ctx, next, cssPath) {
  await next();
  if (/\.(css)($|\?)/.test(ctx.path)) {
    if (!ctx.body) {
      return;
    }
    const lessPath = ctx.body.path.replace(/\.css/, '.less');
    if (fs.existsSync(lessPath)) {
      const fileStream = fs.createReadStream(lessPath);
      ctx.body = _transform(fileStream, cssPath);
    }
  }
}

module.exports = {
  // Ref: https://docs.svrx.io/en/plugin/contribution.html#schema
  configSchema: {},
  hooks: {
    // Ref: https://docs.svrx.io/en/plugin/contribution.html#server
    async onCreate({ middleware, config }) {
      const cssPath = config.get('path') || '/css';
      const isBuild = config.get('build') || false;
      middleware.add('svrx-plugin-less', {
        onRoute: (ctx, next) => onTransform(ctx, next, cssPath, isBuild),
      });
    },
  },
};
