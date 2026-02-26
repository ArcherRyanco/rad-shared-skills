#!/usr/bin/env node
/**
 * GHL Browser Automation - Workflow Creation
 * Uses OpenClaw browser control to create workflows via GHL's AI Builder
 */

const fs = require('fs');
const path = require('path');

// Load credentials
const SECRETS_PATH = path.join(process.env.HOME, '.clawdbot/secrets/ghl-agencies.env');

function loadCredentials() {
  const content = fs.readFileSync(SECRETS_PATH, 'utf8');
  const creds = {};
  content.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) creds[match[1].trim()] = match[2].trim();
    }
  });
  return creds;
}

const CREDS = loadCredentials();

/**
 * GHL Browser Automation Steps
 * 
 * This generates instructions for OpenClaw's browser tool.
 * The actual browser control is done by the agent using these steps.
 */

const GHL_URLS = {
  login: 'https://app.gohighlevel.com/login',
  dashboard: 'https://app.gohighlevel.com/v2/location',
  workflows: (locationId) => `https://app.gohighlevel.com/v2/location/${locationId}/automation/workflows`
};

/**
 * Generate login instructions for OpenClaw browser
 */
function generateLoginInstructions() {
  return {
    description: 'Log into GoHighLevel',
    steps: [
      {
        action: 'navigate',
        url: GHL_URLS.login
      },
      {
        action: 'wait',
        selector: 'input[type="email"]',
        timeout: 10000
      },
      {
        action: 'type',
        selector: 'input[type="email"]',
        text: CREDS.GHL_BROWSER_EMAIL
      },
      {
        action: 'type',
        selector: 'input[type="password"]',
        text: CREDS.GHL_BROWSER_PASSWORD
      },
      {
        action: 'click',
        selector: 'button[type="submit"]'
      },
      {
        action: 'wait',
        timeout: 5000,
        description: 'Wait for dashboard to load'
      }
    ]
  };
}

/**
 * Generate workflow creation instructions
 */
function generateWorkflowCreationInstructions(locationId, prompt, workflowName = null) {
  return {
    description: `Create workflow in location ${locationId}`,
    prerequisite: 'Must be logged into GHL',
    steps: [
      {
        action: 'navigate',
        url: GHL_URLS.workflows(locationId)
      },
      {
        action: 'wait',
        selector: '[data-testid="workflows-page"]',
        timeout: 10000,
        fallback: 'Wait for workflows page to load'
      },
      {
        action: 'click',
        selector: 'button:has-text("Build using AI")',
        description: 'Click the Build using AI button'
      },
      {
        action: 'wait',
        selector: 'textarea, [data-testid="ai-prompt-input"]',
        timeout: 5000,
        description: 'Wait for AI prompt modal'
      },
      {
        action: 'type',
        selector: 'textarea, [data-testid="ai-prompt-input"]',
        text: prompt,
        description: 'Enter the workflow description'
      },
      {
        action: 'click',
        selector: 'button:has-text("Build Workflow"), button:has-text("Generate")',
        description: 'Click Build Workflow button'
      },
      {
        action: 'wait',
        timeout: 30000,
        description: 'Wait for AI to generate the workflow (can take 10-30 seconds)'
      },
      {
        action: 'verify',
        description: 'Verify workflow was created successfully'
      }
    ],
    prompt: prompt,
    workflowName: workflowName
  };
}

/**
 * Generate instructions to switch sub-accounts
 */
function generateAccountSwitchInstructions(accountName) {
  return {
    description: `Switch to sub-account: ${accountName}`,
    steps: [
      {
        action: 'click',
        selector: '[data-testid="location-switcher"], .location-dropdown',
        description: 'Open location/account switcher'
      },
      {
        action: 'type',
        selector: 'input[placeholder*="Search"], input[type="search"]',
        text: accountName,
        description: 'Search for account'
      },
      {
        action: 'click',
        selector: `[data-testid="location-item"]:has-text("${accountName}")`,
        description: 'Click on the account'
      },
      {
        action: 'wait',
        timeout: 3000,
        description: 'Wait for account switch'
      }
    ]
  };
}

/**
 * Convert instructions to OpenClaw browser tool format
 */
function toOpenClawBrowserInstructions(instructions) {
  return {
    type: 'browser_automation',
    profile: 'openclaw',
    ...instructions,
    openClawSteps: instructions.steps.map(step => {
      switch (step.action) {
        case 'navigate':
          return { action: 'navigate', targetUrl: step.url };
        case 'click':
          return { action: 'act', request: { kind: 'click', ref: step.selector } };
        case 'type':
          return { action: 'act', request: { kind: 'type', ref: step.selector, text: step.text } };
        case 'wait':
          return { action: 'act', request: { kind: 'wait', timeMs: step.timeout || 5000 } };
        default:
          return step;
      }
    })
  };
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Parse flags
  const flags = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      flags[key] = args[i + 1] || true;
      i++;
    }
  }

  switch (command) {
    case 'login':
      console.log(JSON.stringify(toOpenClawBrowserInstructions(generateLoginInstructions()), null, 2));
      break;

    case 'create-workflow':
      if (!flags.location || !flags.prompt) {
        console.error('Required: --location <locationId> --prompt "workflow description"');
        process.exit(1);
      }
      const instructions = generateWorkflowCreationInstructions(
        flags.location,
        flags.prompt,
        flags.name
      );
      console.log(JSON.stringify(toOpenClawBrowserInstructions(instructions), null, 2));
      break;

    case 'switch-account':
      if (!flags.account) {
        console.error('Required: --account <accountName>');
        process.exit(1);
      }
      console.log(JSON.stringify(toOpenClawBrowserInstructions(generateAccountSwitchInstructions(flags.account)), null, 2));
      break;

    case 'credentials':
      console.log(JSON.stringify({
        email: CREDS.GHL_BROWSER_EMAIL,
        hasPassword: !!CREDS.GHL_BROWSER_PASSWORD
      }, null, 2));
      break;

    default:
      console.log(`
GHL Browser Automation - Workflow Creation

Usage: node browser-automation.js <command> [flags]

Commands:
  login                    Generate login instructions
  create-workflow          Generate workflow creation instructions
  switch-account           Generate account switch instructions
  credentials              Check stored credentials

Flags:
  --location <id>         Location ID for workflow
  --prompt <text>         Workflow description for AI Builder
  --name <text>           Optional workflow name
  --account <name>        Account name to switch to

Example:
  node browser-automation.js create-workflow \\
    --location kpyBSmizngtQkwXRGjMX \\
    --prompt "When contact fills form, send welcome email, wait 1 day, send follow-up SMS"
`);
  }
}

// Export for use as module
module.exports = {
  generateLoginInstructions,
  generateWorkflowCreationInstructions,
  generateAccountSwitchInstructions,
  toOpenClawBrowserInstructions,
  GHL_URLS,
  CREDS
};

// Run CLI if executed directly
if (require.main === module) {
  main();
}
