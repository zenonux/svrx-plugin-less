const less = require('less');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');
const fs = require('fs');
const chokidar = require('chokidar');

async function compileLess(sourceFile, dir, logger) {
  const code = fs.readFileSync(sourceFile, 'utf-8');
  try {
    const res = await less.render(code, {
      paths: [dir],
      plugins: [new LessPluginAutoPrefix({ browsers: ['last 2 versions'] })],
    });
    const data = res.css;
    logger.log(`compile ${sourceFile} success`);
    const cssPath = sourceFile.replace(/\.less/g, '.css');
    fs.writeFileSync(cssPath, data);
    return [null, data];
  } catch (e) {
    logger.error(`${sourceFile} ${e}`);
    return [e];
  }
}

function watchLess(dir, logger) {
  const watcher = chokidar.watch(`${dir}/**/*.less`);
  watcher.on('change', (path) => {
    // 下划线开头的less文件不编译
    if (path.replace(/(.*\/)*([^.]+).*/ig, '$2').substr(0, 1) === '_') {
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
      const dir = process.cwd() + cssPath;
      watchLess(dir, logger);
    },
  },
};
