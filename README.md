# Work-Rest Timer（工作/休息计时器）

一个悬浮的番茄钟式「工作 / 休息」提醒插件，运行在 DeepSeek Harness（DSH）的浏览器客户端里。

## 功能

- 可设置工作时长、休息时长（1–600 分钟）
- 大号 `MM:SS` 倒计时 + 进度条（工作 = 绿色，休息 = 橙色）
- 到时间语音播报（中文）+ 提示音
- 开始 / 暂停、重置、跳过
- 自动循环（工作 ↔ 休息自动切换，可关闭）
- 可收起为右下角小圆点

## 运行方式

本插件是一个动态 Cordis 插件（Client 端）。将 `work-rest-timer.client.js` 中
`return { ... }` 的代码块作为 `code.client` 传入 `cordis_define`，然后 `cordis_run` 即可。

## 环境要求

- DeepSeek Harness（DSH）浏览器客户端
- 浏览器需支持 `speechSynthesis`（语音播报）与 `AudioContext`（提示音，可选）
- 中文语音：需在系统里安装中文语音包

## 文件

- `work-rest-timer.client.js` — 插件 Client 端源码
