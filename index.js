const less = require('less');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');
const chokidar = require('chokidar');
const readdirp = require('readdirp');
const fs = require('fs');

function getFileNameNoSuffix(filePath) {
  return filePath.replace(/(.*\/)*([^.]+).*/ig, '$2');
}

async function compileLess(sourceFile, dir, logger) {
  const code = await fs.promises.readFile(sourceFile, 'utf-8');
  try {
    const res = await less.render(code, {
      paths: [dir],
      plugins: [new LessPluginAutoPrefix({ browsers: ['last 2 versions'] })],
    });
    const data = res.css;
    logger.log(`${sourceFile} compile success`);
    const cssPath = sourceFile.replace(/\.less/g, '.css');
    await fs.promises.writeFile(cssPath, data);
    return [null, data];
  } catch (e) {
    logger.error(`${sourceFile} ${e}`);
    return [e];
  }
}

async function buildAllLess(dir, logger) {
  const errors = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const entry of readdirp(dir, { fileFilter: '*.less' })) {
    const { fullPath } = entry;
    if (getFileNameNoSuffix(fullPath).charAt(0) === '_') {
      return;
    }
    const [err] = await compileLess(fullPath, dir, logger);
    errors.push(err);
  }
  if (errors.length > 0) {
    logger.error(`build all less file occurred ${errors.length} error`);
  } else {
    logger.log('build all less file success');
  }
}

function watchLess(dir, logger) {
  const watcher = chokidar.watch(`${dir}/**/*.less`);
  watcher.on('change', (path) => {
    // 下划线开头的less文件不编译,会编译所有其他less文件
    if (getFileNameNoSuffix(path).charAt(0) === '_') {
      buildAllLess(dir, logger);
      return;
    }
    compileLess(path, dir, logger);
  });
}

module.exports = {
  // Ref: https://docs.svrx.io/en/plugin/contribution.html#schema
  configSchema: {},
  hooks: {
    // Ref: https://docs.svrx.io/en/plugin/contribution.html#server
    async onCreate({ config, logger }) {
      const cssPath = config.get('path') || '/css';
      const isBuild = config.get('build');
      const dir = process.cwd() + cssPath;
      if (typeof (isBuild) !== 'undefined') {
        await buildAllLess(dir, logger);
      }
      watchLess(dir, logger);
    },
  },
};
