const less = require('less');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');
const chokidar = require('chokidar');
const readdirp = require('readdirp');
const fs = require('fs');
const { Transform } = require('stream');
const path = require('path');
const write = require('write');

function getFileNameNoSuffix(filePath) {
  return filePath.replace(/(.*\/)*([^.]+).*/gi, '$2');
}

class LessTransform extends Transform {
  constructor(sourceFile, srcFullPath, logger) {
    super({
      transform(chunk, enc, callback) {
        this._chunkString.push(chunk.toString());
        callback();
      },
      async flush(callback) {
        let code = this._chunkString.join('');
        try {
          const res = await less.render(code, {
            paths: [srcFullPath],
            plugins: [new LessPluginAutoPrefix({ browsers: ['last 2 versions'] })],
          });
          code = res.css;
          logger.log(`${sourceFile} compile success`);
        } catch (error) {
          logger.error(`${sourceFile} ${error}`);
        }
        this.push(code);
        callback();
      },
    });
    this._chunkString = [];
  }
}

function compileLessStream(filePath, srcFullPath, destFullPath, logger) {
  const readStream = fs.createReadStream(filePath);
  const transformPipe = new LessTransform(filePath, srcFullPath, logger);
  const relativePath = path.relative(srcFullPath, filePath);
  const targetCssPath = path
    .join(destFullPath, relativePath)
    .replace(/\.less/g, '.css');
  const writePipe = write.stream(targetCssPath);
  return readStream.pipe(transformPipe).pipe(writePipe);
}

function streamToPromise(stream) {
  return new Promise(((resolve) => {
    stream.on('close', () => {
      resolve();
    });
  }));
}

async function buildAllLess(srcFullPath, destFullPath, logger) {
  // eslint-disable-next-line no-restricted-syntax
  for await (const entry of readdirp(srcFullPath, { fileFilter: '*.less' })) {
    const { fullPath } = entry;
    if (getFileNameNoSuffix(fullPath).charAt(0) === '_') {
      // eslint-disable-next-line no-continue
      continue;
    }
    await streamToPromise(compileLessStream(
      fullPath,
      srcFullPath,
      destFullPath,
      logger,
    ));
  }
}

function watchLess(srcFullPath, destFullPath, logger) {
  const watcher = chokidar.watch(`${srcFullPath}/**/*.less`);
  watcher.on('change', (filePath) => {
    // 下划线开头的less文件不编译,会编译所有其他less文件
    if (getFileNameNoSuffix(filePath).charAt(0) === '_') {
      buildAllLess(srcFullPath, destFullPath, logger);
      return;
    }
    compileLessStream(filePath, srcFullPath, destFullPath, logger);
  });
}

module.exports = {
  // Ref: https://docs.svrx.io/en/plugin/contribution.html#schema
  configSchema: {},
  hooks: {
    // Ref: https://docs.svrx.io/en/plugin/contribution.html#server
    async onCreate({ config, logger }) {
      const srcPath = config.get('src') || 'css';
      const destPath = config.get('dest') || 'css';
      const isBuild = config.get('build');
      const srcFullPath = path.join(process.cwd(), srcPath);
      const destFullPath = path.join(process.cwd(), destPath);
      if (typeof isBuild !== 'undefined') {
        await buildAllLess(srcFullPath, destFullPath, logger);
      }
      watchLess(srcFullPath, destFullPath, logger);
    },
  },
};
