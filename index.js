const less = require('less');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');
const chokidar = require('chokidar');
const readdirp = require('readdirp');
const fs = require('fs');
const path = require('path');
const write = require('write');

function getFileNameNoSuffix(filePath) {
  return filePath.replace(/(.*\/)*([^.]+).*/ig, '$2');
}

async function writeCssFile(code, sourceFile, srcFullPath, destFullPath) {
  const relativePath = path.relative(srcFullPath, sourceFile);
  const targetCssPath = path.join(destFullPath, relativePath).replace(/\.less/g, '.css');
  await write(targetCssPath, code);
}

async function compileLess(sourceFile, srcFullPath, destFullPath, logger) {
  const code = await fs.promises.readFile(sourceFile, 'utf-8');
  try {
    const res = await less.render(code, {
      paths: [srcFullPath],
      plugins: [new LessPluginAutoPrefix({ browsers: ['last 2 versions'] })],
    });
    const data = res.css;
    await writeCssFile(data, sourceFile, srcFullPath, destFullPath);
    logger.log(`${sourceFile} compile success`);
    return [null, data];
  } catch (e) {
    logger.error(`${sourceFile} ${e}`);
    return [e];
  }
}

async function buildAllLess(srcFullPath, destFullPath, logger) {
  const errors = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const entry of readdirp(srcFullPath, { fileFilter: '*.less' })) {
    const { fullPath } = entry;
    if (getFileNameNoSuffix(fullPath).charAt(0) === '_') {
      // eslint-disable-next-line no-continue
      continue;
    }
    const [err] = await compileLess(fullPath, srcFullPath, destFullPath, logger);
    if (err) {
      errors.push(err);
    }
  }
  if (errors.length > 0) {
    logger.error(`build all less file occurred ${errors.length} error`);
  } else {
    logger.log('build all less file success');
  }
}

function watchLess(srcFullPath, destFullPath, logger) {
  const watcher = chokidar.watch(`${srcFullPath}/**/*.less`);
  watcher.on('change', (filePath) => {
    // 下划线开头的less文件不编译,会编译所有其他less文件
    if (getFileNameNoSuffix(filePath).charAt(0) === '_') {
      buildAllLess(srcFullPath, logger);
      return;
    }
    compileLess(filePath, srcFullPath, destFullPath, logger);
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

      if (typeof (isBuild) !== 'undefined') {
        await buildAllLess(srcFullPath, destFullPath, logger);
      }
      watchLess(srcFullPath, destFullPath, logger);
    },
  },
};
