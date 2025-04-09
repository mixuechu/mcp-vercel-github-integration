import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios';

/**
 * 获取 GitHub 用户名
 */
async function getGitHubNamespace(githubToken) {
  const response = await axios.get("https://api.github.com/user", {
    headers: {
      "Authorization": `token ${githubToken}`,
      "User-Agent": "MCP-Vercel-GitHub-Integration",
      "Accept": "application/vnd.github.v3+json"
    }
  });
  return response.data.login;
}

/**
 * 获取默认 Vercel 团队 ID
 */
async function getDefaultTeamId(vercelApiKey) {
  try {
    const response = await axios.get("https://api.vercel.com/v2/teams", {
      headers: {
        "Authorization": `Bearer ${vercelApiKey}`
      }
    });
    return response.data?.teams?.[0]?.id || null;
  } catch (error) {
    console.warn("Warning: Could not fetch Vercel teams, proceeding without team ID");
    return null;
  }
}

/**
 * 创建 GitHub 仓库
 */
async function createGithubRepo(vercelApiKey, githubNamespace, repoName, isPrivate) {
  const response = await axios.post(
    "https://vercel.com/api/v1/integrations/git-repo",
    {
      provider: "github",
      namespace: githubNamespace,
      name: repoName,
      private: isPrivate
    },
    {
      headers: {
        "Authorization": `Bearer ${vercelApiKey}`,
        "Content-Type": "application/json"
      }
    }
  );
  return response.data;
}

/**
 * 推送模板到仓库
 */
async function pushToRepo(vercelApiKey, teamId, githubNamespace, repoName, templateSource) {
  const response = await axios.post(
    `https://vercel.com/api/v2/integrations/push-to-repo${teamId ? `?teamId=${teamId}` : ''}`,
    {
      type: "github",
      source: templateSource,
      repo: `${githubNamespace}/${repoName}`,
      branch: "main"
    },
    {
      headers: {
        "Authorization": `Bearer ${vercelApiKey}`,
        "Content-Type": "application/json"
      }
    }
  );
  return response.data;
}

/**
 * 创建并启动 MCP 服务器
 */
export async function runServer(vercelApiKey, githubToken) {
  // 验证 API 密钥有效性
  if (!vercelApiKey || !githubToken) {
    throw new Error("Missing required API keys: Vercel API key and GitHub token");
  }

  const server = new McpServer({
    name: "Vercel-GitHub Integration Service",
    version: "1.0.0",
  });

  server.tool(
    "createAndPushRepo",
    {
      repoName: z.string().min(1).describe("Name of the repository to create"),
      templateSource: z.string().url().optional()
        .describe("URL of the template source to push")
        .default("https://github.com/vercel/vercel/tree/main/examples/nextjs"),
      isPrivate: z.boolean().optional()
        .describe("Whether the repository should be private")
        .default(true),
    },
    async ({ repoName, templateSource, isPrivate }) => {
      try {
        // 1. 获取 GitHub 用户名
        const githubNamespace = await getGitHubNamespace(githubToken);
        
        // 2. 获取 Vercel 团队 ID (可选)
        const teamId = await getDefaultTeamId(vercelApiKey);

        // 3. 创建仓库
        const repoData = await createGithubRepo(
          vercelApiKey,
          githubNamespace,
          repoName,
          isPrivate
        );

        // 4. 推送模板
        const pushData = await pushToRepo(
          vercelApiKey,
          teamId,
          githubNamespace,
          repoName,
          templateSource
        );

        // 返回结构化响应
        return {
          content: [
            {
              type: "text",
              text: `✅ Successfully created and configured repository\n` +
                    `├─ GitHub Namespace: ${githubNamespace}\n` +
                    `├─ Repository: ${repoName}\n` +
                    `├─ Visibility: ${isPrivate ? "Private" : "Public"}\n` +
                    `├─ Template: ${templateSource}\n` +
                    `├─ Vercel Project ID: ${pushData.projectId}\n` +
                    `└─ Repository URL: ${repoData.url || repoData.id}`
            },
            {
              type: "markdown",
              text: `## Operation Successful\n` +
                    `| Property          | Value                  |\n` +
                    `|-------------------|------------------------|\n` +
                    `| GitHub Namespace  | ${githubNamespace}     |\n` +
                    `| Repository        | ${repoName}            |\n` +
                    `| Visibility        | ${isPrivate ? "Private" : "Public"} |\n` +
                    `| Vercel Project ID | ${pushData.projectId}  |\n\n` +
                    `[View Repository](${repoData.url || `https://github.com/${githubNamespace}/${repoName}`})`
            }
          ],
          metadata: {
            success: true,
            githubNamespace,
            repoName,
            isPrivate,
            vercelProjectId: pushData.projectId,
            repoUrl: repoData.url || `https://github.com/${githubNamespace}/${repoName}`
          }
        };
      } catch (error) {
        // 错误处理
        const errorMessage = error.response?.data?.error?.message || 
                            error.response?.data?.message || 
                            error.message;
        
        return {
          content: [
            {
              type: "text",
              text: `❌ Error: ${errorMessage}\n` +
                    `Operation failed while ${error.step || 'processing request'}`
            }
          ],
          metadata: {
            success: false,
            error: errorMessage,
            step: error.step || 'unknown'
          }
        };
      }
    }
  );

  // 启动服务器
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP server is running and ready to accept requests");
}

// 如果直接执行此文件（测试用）
if (import.meta.url === `file://${process.argv[1]}`) {
  const vercelKey = process.env.VERCELL_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!vercelKey || !githubToken) {
    console.error("Please set VERCELL_API_KEY and GITHUB_TOKEN environment variables");
    process.exit(1);
  }

  runServer(vercelKey, githubToken).catch(err => {
    console.error("Server failed to start:", err);
    process.exit(1);
  });
}
