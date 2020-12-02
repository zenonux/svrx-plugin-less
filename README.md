## svrx-plugin-less

[![svrx](https://img.shields.io/badge/svrx-plugin-%23ff69b4?style=flat-square)](https://svrx.io/)
[![npm](https://img.shields.io/npm/v/svrx-plugin-less.svg?style=flat-square)](https://www.npmjs.com/package/svrx-plugin-less)

The svrx plugin for less

## Usage

> Please make sure that you have installed [svrx](https://svrx.io/) already.

寻找 css 目录下，与请求 css 同名的 less 文件并编译返回，支持 autoprefix，如果不存在同名 less 文件，则返回请求的 css 文件

### Via CLI

```bash
svrx -p less
```

### Via API

```js
const svrx = require("@svrx/svrx");

svrx({ plugins: ["less"] }).start();
```

## Options

### **path \[String]:**

指定 css 目录，默认值为`/css`

## License

MIT
