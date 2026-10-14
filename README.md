# @limstorm/dsh-commandcode-usage-pill

[![DeepSeek Harness 插件](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4D6BFE)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/github/license/limstorm/dsh-commandcode-usage-pill)](https://github.com/limstorm/dsh-commandcode-usage-pill/blob/main/LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/limstorm/dsh-commandcode-usage-pill)](https://github.com/limstorm/dsh-commandcode-usage-pill/commits/main)

DSH 插件：把 **Command Code 订阅的滚动用量**放进 Web UI 输入框下方那一行状态栏，和「会话统计」「Token 用量」并排——5 小时窗口和每周窗口还剩多少，抬眼就能看到。

## 效果

那一行变成：

```
[⏱ 12 轮 34 步] [◲ 1.2M · 缓存命中 87%] [▁▅ 5小时 15% · 周 19%]
```

- **悬停**：一行摘要提示
- **点击**：详情面板（外观与旁边两个药丸的统计面板一致）

```
Command Code 用量                    GOAT
──────────────────────────────────────────
5 小时窗口              $2.04 / $14.00（15%）
重置                              34 分钟后
每周窗口                $6.48 / $35.00（19%）
重置                          1 天 15 小时后
账户余额                            $62.84
本周期花费                           $7.24
请求数                        1876（失败 2）
Tokens                              342.54M
```

- 任一窗口超额时整体转为警告色
- 每 60 秒刷新；单次轮询失败保留上次读数，不会闪成空白
- 点外部或按 `Esc` 关闭面板；窗口缩放与滚动时重新定位并夹在视口内

## 前置条件

**必须先安装 [`dsh-commandcode-goat`](https://github.com/Plocr/dsh-commandcode-goat)。** 用量数字来自它已经在 loopback 上提供的账户桥接接口，本插件不自带取数逻辑：

```sh
dsh plugin --profile web add github:Plocr/dsh-commandcode-goat
```

## 安装

```sh
dsh plugin --profile web add github:limstorm/dsh-commandcode-usage-pill
```

装完重启 `dsh web`（新增的 bundle 行在启动时挂载），然后刷新页面。

本包没有构建步骤、没有 `prepare` 脚本，所以 pnpm 不会要求 `allowBuilds` 批准。

## 它怎么工作

- 注册进会话级插槽 **`conversation.composer.dock`**（"composer card 下方的环境条目"），用独立 id `commandcode-usage`、`order: 10` 排在官方统计药丸（`order: 0`）之后，因此是**并排新增一格**而不是替换官方格子。
- 数据走 goat 插件的 `POST api/dsh-commandcode-goat/usage`。**账户密钥始终留在宿主侧**：本插件不读凭证、不直连 Command Code。
- 路由写成**文档相对**（不带前导 `/`）——DSH 用 `<base href="./">` 提供 GUI，根绝对路径在子路径部署下会打不到路由。
- 中间渲染层只 `require('react')` 与 `require('react-dom')`（DSH 前端模块表的基线模块），**不 import 任何 `@deepseek-ai/dsh-client-*` 包**；图标是内联 SVG，弹层定位与关闭逻辑自己实现。
- 样式只用主题令牌（`--dsw-alias-*`、`--dsw-specific-menu`、`--dsw-elevation-prominent`），因此跟随明暗主题；作为该插槽的条目，它还会自动继承皮肤给这行配的配件底板样式（`--dsh-composer-accessory-*`）。

## 降级行为

以下情况整条**不渲染**，不会留下空壳或报错：

- 没装 `dsh-commandcode-goat`（桥接路由不存在）
- 账户未配置 / 密钥无效
- 首次读数尚未返回
- 账户没返回任何窗口

## 兼容性

- `dsh >= 0.2.0-rc.2`
- 仅 Web profile（`dsh.client.platform: web`）

## 开发

源码就是仓库里的四个文件，没有构建步骤：

| 文件 | 作用 |
|---|---|
| `client.js` | 浏览器半：插槽注册、取数、药丸与面板 |
| `index.js` | 宿主半：无宿主行为，仅为挂载客户端模块而存在 |
| `cordis.patch.yml` | bundle patch，插入自己的 loader 行 |
| `package.json` | 清单：`exports["./client"]` 与 `dsh.client` 声明 |

本地开发用软链安装，改完刷新页面即生效：

```sh
dsh plugin --profile web add link:/path/to/dsh-commandcode-usage-pill
```

## 验证状态

作者侧已核对：JavaScript 语法、清单与 patch 结构、`./client` 导出解析、profile 组合（`dsh --profile web --dump-config` 退出码 0 且新行在组合树中）、桥接接口返回的字段与面板读取的字段一致、以及面板 CSS 与官方统计面板逐条比对。

**未验证**：没有浏览器控制权，因此未做截图或视觉回归；面板定位、明暗主题观感由使用者自行确认。

## License

MIT
