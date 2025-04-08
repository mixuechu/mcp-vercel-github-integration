#!/usr/bin/env node


const { Server } = require('@modelcontextprotocol/sdk/server');
const axios = require('axios');

// 初始化 MCP 服务器
const server = new Server({
  name: 'vercel-repo-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// 定义工具
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [{
      name: 'create_vercel_template_repo',
      description: '在 GitHub 上创建一个新的仓库，并推送 Vercel 模板',
      inputSchema: {
        type: 'object',
        properties: {
          repo_name: {
            type: 'string',
            description: '要创建的仓库名称'
          }
        },
        required: ['repo_name']
      }
    }]
  };
});

// 实现工具逻辑
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'create_vercel_template_repo') {
    const { repo_name } = request.params.arguments;

    // 使用预先配置的 API 密钥
    const VERCEL_API_KEY = process.env.VERCEL_API_KEY;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // 在 GitHub 上创建仓库
    const githubResponse = await axios.post('https://api.github.com/user/repos', {
      name: repo_name,
      private: true
    }, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'MCP-Server-GitHub'
      }
    });

    // 推送 Vercel 模板到仓库
    const vercelResponse = await axios.post('https://api.vercel.com/v1/integrations/push-to-repo', {
      type: 'github',
      repo: `${githubResponse.data.owner.login}/${repo_name}`,
      branch: 'main',
      source: 'https://github.com/vercel/vercel/tree/main/examples/nextjs'
    }, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      content: [{
        type: 'text',
        text: `仓库 ${repo_name} 创建成功，并已推送 Vercel 模板。`
      }]
    };
  }
  throw new Error('未找到工具');
});

// 启动服务器
server.listen(3000, () => {
  console.log('MCP 服务器运行在端口 3000');
});
