## svrx-plugin-less

[![svrx](https://img.shields.io/badge/svrx-plugin-%23ff69b4?style=flat-square)](https://svrx.io/)
[![npm](https://img.shields.io/npm/v/svrx-plugin-less.svg?style=flat-square)](https://www.npmjs.com/package/svrx-plugin-less)

The svrx plugin for less

## Usage

> Please make sure that you have installed [svrx](https://svrx.io/) already.

在`/css`目录下修改`.less`文件会自动生成`.css`文件，支持`autoprefix`

注： 以`_`开头命名的 less 文件修改时，该文件不会被编译，其他所有非`_`开头的 less 文件会被编译

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

指定 css 目录，默认值为`css`

`svrx -p less?path=css`

### **build \[String]:**

启动插件时编译所有 less 文件

`svrx -p less?build`

## License

MIT
