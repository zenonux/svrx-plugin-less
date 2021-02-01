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

### **src \[String]:**

指定 less 目录，默认值为`css`

`svrx -p less?src=css`

### **dest \[String]:**

指定 css 输出目录，默认值为`css`

`svrx -p less?dest=css`

### **build \[String]:**

启动插件时编译所有 less 文件

`svrx -p less?build`

## Changelog

- v0.1.11:优化以流的方式读写文件
- v0.1.10:fix build all less error
- v0.1.9:path 参数改为 src,新增 dest 参数，以便支持自定义 css 输出目录

## License

MIT
