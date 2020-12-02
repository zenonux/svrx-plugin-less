const less = require('less');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');
const EventEmitter = require('events');
const { Transform } = require('stream');
const fs = require('fs');

const autoprefixPlugin = new LessPluginAutoPrefix({ browsers: ['last 2 versions'] });

class LessTransform extends Transform {
  constructor(cssPath, lessPath, logger) {
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
          logger.log(`compile ${lessPath} success`);
        } catch (error) {
          logger.error(`${lessPath} ${error}`);
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

module.exports = {
  // Ref: https://docs.svrx.io/en/plugin/contribution.html#schema
  configSchema: {},
  hooks: {
    // Ref: https://docs.svrx.io/en/plugin/contribution.html#server
    async onCreate({ middleware, config, logger }) {
      const cssPath = config.get('path') || '/css';
      middleware.add('svrx-plugin-less', {
        onRoute: async (ctx, next) => {
          await next();
          if (/\.(css)($|\?)/.test(ctx.path)) {
            if (!ctx.body) {
              return;
            }
            const lessPath = ctx.body.path.replace(/\.css/, '.less');
            // 同级目录下存在同名less文件，则返回编译后的less
            if (fs.existsSync(lessPath)) {
              const fileStream = fs.createReadStream(lessPath);
              if (isReadableStream(fileStream)) {
                ctx.body = fileStream.pipe(new LessTransform(cssPath, lessPath, logger));
              }
            }
          }
        },
      });
    },
  },
};
