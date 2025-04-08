# MCP Vercel GitHub Integration

这是一个基于 MCP (Model Control Protocol) 的 Vercel 和 GitHub 集成工具。它提供了自动化创建 GitHub 仓库并配置 Vercel 部署的功能。

## 功能特性

- 自动创建 GitHub 仓库
- 自动推送模板代码到仓库
- 自动配置 Vercel 项目集成
- 支持团队和个人账户
- 支持自定义模板源

## 安装要求

- Node.js
- npm 或 yarn
- Vercel 账户
- GitHub 账户

## 安装

```bash
npm install -g mcp-vercel-github-integration
```

## MCP 服务器配置

在你的 MCP 配置文件中（通常位于 `~/.cursor/mcp.json`）添加以下配置：

```json
{
  "mcpServers": {
    "vercel-github": {
      "command": "npx",
      "args": [
        "mcp-vercel-github-integration"
      ],
      "env": {
        "VERCEL_API_KEY": "<YOUR_VERCEL_API_KEY>",
        "GITHUB_API_KEY": "<YOUR_GITHUB_API_KEY>",
        "GITHUB_NAMESPACE": "<YOUR_GITHUB_NAMESPACE>"
      }
    }
  }
}
```

### 配置说明

- `command`: 使用 `npx` 来运行已安装的包
- `args`: 指定要运行的包名
- `env`: 环境变量配置
  - `VERCEL_API_KEY`: Vercel API 密钥
  - `GITHUB_API_KEY`: GitHub API 密钥
  - `GITHUB_NAMESPACE`: GitHub 用户名或组织名

## 配置

使用此工具需要以下配置项：

- `VERCEL_API_KEY`: Vercel API 密钥
- `GITHUB_API_KEY`: GitHub API 密钥
- `GITHUB_NAMESPACE`: GitHub 用户名或组织名

## 使用方法

### 命令行参数

```bash
mcp-vercel-github-integration \
  --VERCEL_API_KEY="your_vercel_api_key" \
  --GITHUB_API_KEY="your_github_api_key" \
  --GITHUB_NAMESPACE="your_github_username" \
  --repoName="your_repo_name" \
  --templateSource="template_source_url"
```

### 参数说明

- `--VERCEL_API_KEY`: (必需) Vercel API 密钥
- `--GITHUB_API_KEY`: (必需) GitHub API 密钥
- `--GITHUB_NAMESPACE`: (必需) GitHub 用户名或组织名
- `--repoName`: (可选) 仓库名称，默认为 'scene-order-table'
- `--templateSource`: (可选) 模板源 URL，默认为 'https://github.com/vercel/vercel/tree/main/examples/nextjs'

### 示例

```bash
mcp-vercel-github-integration \
  --VERCEL_API_KEY="xxxxxxxx" \
  --GITHUB_API_KEY="xxxxxxxx" \
  --GITHUB_NAMESPACE="myusername" \
  --repoName="my-nextjs-project"
```

## 工作流程

1. 检查并获取团队 ID（如果存在）
2. 创建新的 GitHub 仓库
3. 推送模板代码到仓库
4. 配置 Vercel 项目集成

## 开发

### 依赖项

```json
{
  "dependencies": {
    "axios": "^0.26.1"
  }
}
```

### 本地开发

1. 克隆仓库
2. 安装依赖：
```bash
npm install
```
3. 运行开发环境：
```bash
npm start
```

## 错误处理

工具包含完整的错误处理机制：
- API 调用错误处理
- 参数验证
- 团队 ID 获取失败处理
- 项目创建失败处理

## 安全提示

- 请妥善保管你的 API 密钥
- 建议设置适当的 API 权限范围
- 不要在公共环境中暴露配置信息

## 贡献

欢迎提交问题和合并请求。这个项目处于积极开发中，我们欢迎任何形式的贡献。

## 许可证

MIT 