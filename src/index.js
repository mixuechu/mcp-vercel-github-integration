#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  args.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[index + 1];
      if (value && !value.startsWith('--')) {
        params[key] = value;
      }
    }
  });
  
  return params;
}

// Get parameters from command line
const params = parseArgs();
const VERCELL_API_KEY = params.VERCELL_API_KEY;
const GITHUB_TOKEN = params.GITHUB_TOKEN;

if (!VERCELL_API_KEY || !GITHUB_TOKEN) {
  console.error("Error: Missing required parameters --VERCELL_API_KEY and --GITHUB_TOKEN");
  process.exit(1);
}

// Create MCP server
const server = new McpServer({
  name: "Vercel-GitHub Integration Service",
  version: "1.0.0",
});

server.tool(
  "createAndPushRepo",
  {
    repoName: z.string().describe("Name of the repository to create"),
    templateSource: z.string().optional().describe("URL of the template source to push").default("https://github.com/vercel/vercel/tree/main/examples/nextjs"),
    isPrivate: z.boolean().optional().describe("Whether the repository should be private").default(true),
  },
  async ({ repoName, templateSource, isPrivate }) => {
    try {
      // Get GitHub namespace
      const getNamespaceResponse = await axios.get("https://api.github.com/user", {
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "User-Agent": "MCP-Server-GitHub",
          "Accept": "application/vnd.github.v3+json"
        }
      });
      const githubNamespace = getNamespaceResponse.data.login;

      // Get default Vercel team ID
      let teamId = null;
      try {
        const teamResponse = await axios.get("https://api.vercel.com/v2/teams", {
          headers: {
            "Authorization": `Bearer ${VERCELL_API_KEY}`
          }
        });
        teamId = teamResponse.data?.teams?.[0]?.id || null;
      } catch (error) {
        console.warn("Could not fetch Vercel teams, proceeding without team ID");
      }

      // Create GitHub repository
      const createRepoResponse = await axios.post(
        "https://vercel.com/api/v1/integrations/git-repo",
        {
          provider: "github",
          namespace: githubNamespace,
          name: repoName,
          private: isPrivate
        },
        {
          headers: {
            "Authorization": `Bearer ${VERCELL_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Push template to repository
      const pushResponse = await axios.post(
        `https://vercel.com/api/v2/integrations/push-to-repo${teamId ? `?teamId=${teamId}` : ''}`,
        {
          type: "github",
          source: templateSource,
          repo: `${githubNamespace}/${repoName}`,
          branch: "main"
        },
        {
          headers: {
            "Authorization": `Bearer ${VERCELL_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully created and configured repository:
- GitHub Namespace: ${githubNamespace}
- Repository: ${repoName}
- Private: ${isPrivate}
- Template Source: ${templateSource}
- Vercel Project ID: ${pushResponse.data.projectId}
- Repository URL: ${createRepoResponse.data.url || createRepoResponse.data.id}`
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.response?.data?.error?.message || error.response?.data?.message || error.message}`
          },
        ],
      };
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);