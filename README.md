# WutheringWaves Echo Score

一个独立的鸣潮声骸评分网页。登录库街区后可选择游戏账号和展示角色，查看五枚声骸的逐项评分及总评分。界面部署在 GitHub Pages，库街区请求由白名单 Cloudflare Worker 转发，评分在浏览器本地完成。

[在线使用](https://haoyuehx.github.io/WutheringWavesEchoScore/) · 如果这个项目对你有帮助，欢迎点一个 Star。

## 隐私与安全

- 手机号和验证码由浏览器直接发送至 `api.kurobbs.com`，不经过 Worker。
- token 随角色数据请求经过项目专用 Worker，但不会被持久化保存。
- 默认情况下 token 仅保存在页面内存，刷新或退出后立即消失。
- 用户勾选“保存登录状态”后，token 和游戏账号列表会保存在当前浏览器 `localStorage` 中，最多 7 天；不会保存手机号或验证码，退出登录会立即清除。
- 请勿在网吧、公共电脑或他人设备上启用“保存登录状态”。
- Worker 仅允许本项目来源和固定接口，不提供通用代理，不启用持久化日志或存储。
- 页面依赖库街区非公开接口，接口或风控策略变化时可能暂时不可用。

## 本地运行

```bash
# 终端一：启动本地 Worker
cd worker
npm install
npm run dev

# 终端二：构建并启动网页
cd ..
KURO_PROXY_URL=http://127.0.0.1:8787 python3 scripts/build.py .pages-site
python3 -m http.server 8000 --directory .pages-site
```

打开 <http://localhost:8000>。不要直接双击 `index.html`，浏览器会阻止读取评分模板。

## 部署

### 1. 部署 Worker

1. 在 Cloudflare 创建一个权限模板为 **Edit Cloudflare Workers**、资源范围仅限目标账号的 API Token。
2. 在 GitHub 仓库 `Settings → Secrets and variables → Actions → Secrets` 添加：
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
3. 手动运行 `Deploy Cloudflare Worker` 工作流。
4. 从工作流输出或 Cloudflare 控制台复制 `https://wuthering-waves-echo-proxy.<你的子域>.workers.dev` 地址。

### 2. 连接 Pages

1. 在 `Settings → Secrets and variables → Actions → Variables` 添加 `KURO_PROXY_URL`，值为上一步 Worker 的完整 HTTPS 地址。
2. 手动运行 `Deploy to GitHub Pages` 工作流。

Cloudflare 官方说明：[使用 GitHub Actions 部署 Worker](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)。API Token 不要写入代码、Issue 或聊天记录。

## 评分来源与许可

评分公式与模板移植自 [WutheringWavesUID](https://github.com/CM-Edelweiss/WutheringWavesUID)，并保留 GPL-3.0 许可。评分仅供配装参考与娱乐，不代表库洛官方评价或实际伤害。
