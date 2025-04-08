#!/usr/bin/env node

const axios = require('axios');

// Function to parse command line arguments
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

// Function to get default team ID
async function getDefaultTeamId(VERCEL_API_KEY) {
  const url = "https://api.vercel.com/v2/teams";
  const headers = {
    "accept": "*/*",
    "content-type": "application/json; charset=utf-8",
    "authorization": `Bearer ${VERCEL_API_KEY}`
  };

  try {
    const response = await axios.get(url, { headers });
    if (response.data && response.data.teams && response.data.teams.length > 0) {
      return response.data.teams[0].id; // Return first team's ID
    }
    return null; // No teams found (personal account)
  } catch (error) {
    console.error("Error fetching teams:", error);
    return error.response ? error.response.data : error.message;
  }
}

// Function to create GitHub repository
async function createGithubRepo(VERCEL_API_KEY, GITHUB_NAMESPACE, repoName, private = true) {
  const url = "https://vercel.com/api/v1/integrations/git-repo";
  const data = {
    provider: "github",
    namespace: GITHUB_NAMESPACE,
    name: repoName,
    private: private
  };

  const headers = {
    "accept": "*/*",
    "content-type": "application/json; charset=utf-8",
    "authorization": `Bearer ${VERCEL_API_KEY}`
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error("Error creating GitHub repo:", error);
    return error.response ? error.response.data : error.message;
  }
}

// Function to push template to the repository
async function pushToRepo(VERCEL_API_KEY, TEAM_ID, GITHUB_NAMESPACE, repoName, templateSource) {
  const url = `https://vercel.com/api/v1/integrations/push-to-repo${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`;
  const data = {
    type: "github",
    source: templateSource,
    repo: `${GITHUB_NAMESPACE}/${repoName}`,
    branch: "main"
  };

  const headers = {
    "accept": "*/*",
    "content-type": "application/json; charset=utf-8",
    "authorization": `Bearer ${VERCEL_API_KEY}`
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error("Error pushing to repo:", error);
    return error.response ? error.response.data : error.message;
  }
}

// Function to configure project integration
async function configureProjectIntegration(VERCEL_API_KEY, TEAM_ID, projectId) {
  const url = `https://vercel.com/api/v4/projects/${projectId}/integrations${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`;
  const headers = {
    "accept": "*/*",
    "content-type": "application/json; charset=utf-8",
    "authorization": `Bearer ${VERCEL_API_KEY}`
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error("Error configuring project integration:", error);
    return error.response ? error.response.data : error.message;
  }
}

// Main execution function
async function main() {
  const params = parseArgs();

  const VERCEL_API_KEY = params.VERCEL_API_KEY;
  const GITHUB_API_KEY = params.GITHUB_API_KEY;
  const GITHUB_NAMESPACE = params.GITHUB_NAMESPACE;
  const repoName = params.repoName || 'scene-order-table'; // Default to 'scene-order-table' if not provided
  const templateSource = params.templateSource || "https://github.com/vercel/vercel/tree/main/examples/nextjs";

  if (!VERCEL_API_KEY || !GITHUB_API_KEY || !GITHUB_NAMESPACE) {
    console.error("Missing required parameters. Please provide VERCEL_API_KEY, GITHUB_API_KEY, and GITHUB_NAMESPACE.");
    process.exit(1);
  }

  // Get default team ID automatically
  const TEAM_ID = await getDefaultTeamId(VERCEL_API_KEY);
  if (TEAM_ID === null) {
    console.log("No team found - using personal account");
  } else {
    console.log(`Using team ID: ${TEAM_ID}`);
  }

  // 1. Create GitHub repo
  const repoResponse = await createGithubRepo(VERCEL_API_KEY, GITHUB_NAMESPACE, repoName);
  console.log("Repo created:", repoResponse);

  // 2. Push template to repo
  const pushResponse = await pushToRepo(VERCEL_API_KEY, TEAM_ID, GITHUB_NAMESPACE, repoName, templateSource);
  console.log("Template pushed:", pushResponse);

  // 3. Configure project integration (if needed)
  const projectId = pushResponse.projectId; // Get projectId from the previous response
  if (projectId) {
    const integrationResponse = await configureProjectIntegration(VERCEL_API_KEY, TEAM_ID, projectId);
    console.log("Integration configured:", integrationResponse);
  }
}

// Run the script
main();