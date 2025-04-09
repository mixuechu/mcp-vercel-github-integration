# GitHub-Vercel MCP Server

Automated GitHub repository creation and Vercel template deployment as an MCP service.

## Features

- 🚀 **Auto-detection** of GitHub namespace from token
- 🤖 **Team-aware** Vercel operations
- ⚡ **Zero-config** for most use cases
- 🔒 **Secure** credential handling

## Local Installation

```bash
npm install -g @yourpackage/mcp-server-github
```

## MCP Configuration

Add to your `mcp.config.json`:

```json
{
  "mcpServers": {
        "vercel-github": {
          "command": "npx",
          "args": [
            "mcp-vercel-github-integration",
            "-v",
            "<Your Vercel API Key>",
            "-g",
            "<Your Git API Key>"
          ]
    }
  }
}
```

## Required Permissions

### GitHub Token
```yaml
repo:       # Full repository control
user:       # Read user profile
read:org    # If using organizations
```

### Vercel Token
- `projects:read` and `projects:write`
- `teams:read` (if using teams)

## Usage

### Basic Deployment
```bash
mcp execute github --REPO_NAME "my-app" --TEMPLATE_SOURCE "https://github.com/vercel/vercel/tree/main/examples/nextjs"
```

### All Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| `VERCEL_API_KEY` | - | (Required) Vercel API key |
| `GITHUB_TOKEN` | - | (Required) GitHub personal access token |
| `REPO_NAME` | "new-repo" | Repository name |
| `TEMPLATE_SOURCE` | Vercel Next.js | Template Git URL |
| `IS_PRIVATE` | true | Make repository private |

## API Response
Successful execution returns:
```json
{
  "status": "success",
  "data": {
    "githubRepo": "https://github.com/yourname/repo",
    "vercelProject": "https://repo.vercel.app",
    "projectId": "prj_abc123"
  }
}
```

## Error Handling
Common error responses include:
```json
{
  "status": "error",
  "error": {
    "code": "GITHUB_AUTH_FAILED",
    "message": "Invalid GitHub token"
  }
}
```

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment:
   ```bash
   cp .env.example .env
   ```
4. Run tests:
   ```bash
   npm test
   ```

## Deployment
Package and publish to npm:
```bash
npm publish --access public
```

## License
MIT
