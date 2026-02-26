# GHL Skill Setup Guide

Complete setup instructions for adding GHL management to your OpenClaw agent.

## Prerequisites

- OpenClaw installed and running
- Node.js 18+ (comes with OpenClaw)
- GHL account access

## Step 1: Add Skill to Your Agent

Point your agent's skill config to this repo location:

```yaml
# In your AGENTS.md or skill configuration
skills:
  - name: ghl
    location: https://github.com/ArcherRyanco/Archerspace/skills/ghl
```

Or clone locally:

```bash
cd ~/your-agent-dir/skills/
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/ArcherRyanco/Archerspace.git temp-repo
cd temp-repo
git sparse-checkout set skills/ghl
mv skills/ghl ../ghl
cd .. && rm -rf temp-repo
```

## Step 2: Create Secrets Directory

```bash
mkdir -p ~/.clawdbot/secrets
chmod 700 ~/.clawdbot/secrets
```

## Step 3: Add Credentials

Create `~/.clawdbot/secrets/ghl-agencies.env`:

```env
# ====================================
# GHL Agency & Sub-Account Credentials
# ====================================

# Agency-Level Tokens (Private Integration keys)
# Used for listing sub-accounts
SVG_LEADPRO_API_KEY=pit-your-token-here
LIBERTY_HQ_API_KEY=pit-your-token-here
AUDIOLOGY_IGNITE_API_KEY=pit-your-token-here

# Sub-Account Tokens (for specific sub-account access)
# Get these from GHL > Settings > Integrations > Private Integration
GHL_REVIGNITE_API_KEY=pit-your-token-here
GHL_REVIGNITE_LOCATION_ID=kpyBSmizngtQkwXRGjMX

GHL_YCRC_API_KEY=pit-your-token-here
GHL_YCRC_LOCATION_ID=ndvF0nS3WUHWioGOwHfJ

# Browser Automation (for workflow creation only)
GHL_BROWSER_EMAIL=your-ghl-login@email.com
GHL_BROWSER_PASSWORD=your-password
```

**Important:** Set proper permissions:
```bash
chmod 600 ~/.clawdbot/secrets/ghl-agencies.env
```

## Step 4: Set Up CLI Alias

```bash
# Add to ~/.bashrc
alias ghl='node ~/path/to/skills/ghl/scripts/ghl.js'

# Reload
source ~/.bashrc
```

## Step 5: Test API Access

```bash
# List sub-accounts
ghl accounts list --agency svg

# List workflows in a sub-account
ghl workflows list --account "RevIgnite"
```

## Step 6: Browser Setup (Optional)

Only needed if you want to create workflows via GHL's AI Builder.

### For VPS/Headless Servers

```bash
# Install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb

# Configure OpenClaw browser
openclaw config set browser.enabled true
openclaw config set browser.executablePath "/usr/bin/google-chrome-stable"
openclaw config set browser.headless true
openclaw config set browser.noSandbox true

# Restart gateway
openclaw gateway restart

# Verify
openclaw browser --browser-profile openclaw status
```

### Test Browser Automation

```bash
# Generate login instructions (for manual testing)
ghl browser login
```

## Getting GHL API Tokens

### Agency Token (lists sub-accounts)
1. Log into GHL as agency admin
2. Go to Agency Settings > Integrations
3. Create Private Integration
4. Copy the `pit-*` token

### Sub-Account Token (access data)
1. Log into the specific sub-account
2. Go to Settings > Integrations > Private Integration
3. Create new integration with scopes:
   - contacts.read, contacts.write
   - opportunities.read, opportunities.write
   - workflows.read
   - calendars.read
   - conversations.read, conversations.write
4. Copy the `pit-*` token

## Troubleshooting

### "No API key configured"
- Check file exists: `ls -la ~/.clawdbot/secrets/ghl-agencies.env`
- Check format (no quotes around values)
- Check permissions: `chmod 600 ~/.clawdbot/secrets/ghl-agencies.env`

### "Sub-account not found"
- Run `ghl accounts list` to see available accounts
- Names are matched case-insensitively with partial matching

### API returns empty/403
- Verify token is for correct account (agency vs sub-account)
- Check token hasn't expired
- Ensure required scopes are enabled

### Browser automation fails
1. Check Chrome installed: `which google-chrome-stable`
2. Check OpenClaw browser: `openclaw browser --browser-profile openclaw status`
3. Check credentials in `.env` file
