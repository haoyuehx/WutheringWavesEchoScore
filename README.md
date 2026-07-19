# WutheringWaves Echo Score

一个独立、无业务后端的鸣潮声骸评分网页。登录库街区后可选择游戏账号和展示角色，查看五枚声骸的逐项评分及总评分。

[在线使用](https://haoyuehx.github.io/WutheringWavesEchoScore/) · 如果这个项目对你有帮助，欢迎点一个 Star。

## 隐私与安全

- 手机号、验证码和 token 由浏览器直接发送至 `api.kurobbs.com`。
- token 仅保存在页面内存，刷新或退出后立即消失。
- 本项目没有数据库或业务后端，不收集账号数据。
- 页面依赖库街区非公开接口及其跨域策略，接口变化时可能暂时不可用。

## 本地运行

```bash
python3 scripts/build.py .pages-site
python3 -m http.server 8000 --directory .pages-site
```

打开 <http://localhost:8000>。不要直接双击 `index.html`，浏览器会阻止读取评分模板。

## 部署

仓库内置 GitHub Pages 工作流。首次部署时，在仓库 `Settings → Pages → Build and deployment → Source` 选择 **GitHub Actions**，然后运行 `Deploy to GitHub Pages` 工作流。

## 评分来源与许可

评分公式与模板移植自 [WutheringWavesUID](https://github.com/CM-Edelweiss/WutheringWavesUID)，并保留 GPL-3.0 许可。评分仅供配装参考与娱乐，不代表库洛官方评价或实际伤害。
