# GHL Skill — GoHighLevel Agency Management

Comprehensive GoHighLevel management for agencies with multiple sub-accounts. Combines API access (fast, reliable) with browser automation (for workflow creation only).

## Quick Start

```bash
# List all sub-accounts in an agency
ghl accounts list --agency svg

# Search contacts in a sub-account
ghl contacts search --account "RevIgnite" --query "john@example.com"

# Create a contact
ghl contacts create --account "RevIgnite" --name "John Doe" --email "john@example.com"

# List workflows
ghl workflows list --account "RevIgnite"

# Enroll contact in workflow (API - fast)
ghl workflows enroll --contact "abc123" --workflow "Discovery Call Scheduled"

# Create workflow (browser automation)
ghl workflows create --account "RevIgnite" --prompt "When contact fills form, send welcome email, wait 1 day, send follow-up SMS"
```

## Setup

### 1. Install Dependencies

```bash
# Clone/navigate to skill directory
cd /path/to/skills/ghl

# No npm install needed - uses native Node.js fetch
```

### 2. Create Credentials File

Create `~/.clawdbot/secrets/ghl-agencies.env`:

```env
# Agency-Level Tokens (for listing sub-accounts)
SVG_LEADPRO_API_KEY=pit-xxx
LIBERTY_HQ_API_KEY=pit-xxx
AUDIOLOGY_IGNITE_API_KEY=pit-xxx

# Sub-Account Tokens (for data operations)
GHL_REVIGNITE_API_KEY=pit-xxx
GHL_YCRC_API_KEY=pit-xxx

# Browser Automation Credentials (for workflow creation)
GHL_BROWSER_EMAIL=your@email.com
GHL_BROWSER_PASSWORD=yourpassword
```

**Token Types:**
- **Agency tokens** (`pit-*`): Can list sub-accounts but not access data
- **Sub-account tokens** (`pit-*`): Full access to that specific sub-account's data
- **Browser credentials**: Only needed for workflow creation

### 3. Set Up CLI Alias

```bash
# Add to ~/.bashrc or ~/.zshrc
alias ghl='node /path/to/skills/ghl/scripts/ghl.js'
```

### 4. Browser Setup (Optional - for workflow creation)

**For VPS/headless environments:**

```bash
# Install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb

# Configure OpenClaw
openclaw config set browser.enabled true
openclaw config set browser.executablePath "/usr/bin/google-chrome-stable"
openclaw config set browser.headless true
openclaw config set browser.noSandbox true
openclaw gateway restart
```

## API Capabilities (90% of operations)

### Contacts
- `contacts list` — List with filters
- `contacts search` — Search by email/phone/name
- `contacts create` — Create new contact
- `contacts update` — Update fields
- `contacts tags add/remove` — Manage tags
- `contacts note` — Add notes

### Pipelines & Opportunities
- `pipelines list` — List all pipelines
- `opportunities list` — List/filter opportunities
- `opportunities create` — Create opportunity
- `opportunities update` — Update/move stages

### Calendars
- `calendars list` — List calendars
- `slots available` — Get available slots
- `appointments create/cancel`

### Messages
- `messages send-sms` — Send SMS
- `messages send-email` — Send email

### Workflows (API)
- `workflows list` — List all workflows
- `workflows enroll` — Add contact to workflow
- `workflows remove` — Remove from workflow

## Browser Capabilities (10% - workflow creation only)

GHL's API doesn't support workflow creation. The skill uses GHL's built-in AI Builder via browser automation:

```bash
ghl workflows create --account "RevIgnite" \
  --prompt "When a lead fills the contact form, add tag 'New Lead', send welcome email, wait 2 days, send follow-up SMS"
```

This:
1. Opens GHL in headless Chrome
2. Navigates to Workflows
3. Clicks "Build using AI"
4. Enters your prompt
5. Lets GHL's AI build the workflow

## Architecture

```
┌───────────────────────────────────────────────────────┐
│                     GHL Skill                         │
├─────────────────────┬─────────────────────────────────┤
│    API Layer        │      Browser Layer              │
│    (Fast, 90%)      │      (Workflow creation only)   │
├─────────────────────┼─────────────────────────────────┤
│ • Contacts CRUD     │ • Create workflows              │
│ • Pipelines/Opps    │ • Edit workflow logic           │
│ • Calendars         │ • Complex UI config             │
│ • Messages          │                                 │
│ • Workflow enroll   │                                 │
└─────────────────────┴─────────────────────────────────┘
```

## Common Flags

| Flag | Description |
|------|-------------|
| `--agency <key>` | Agency: `svg`, `liberty`, `ignite` |
| `--account <name>` | Sub-account name |
| `--json` | Output raw JSON |
| `--limit <n>` | Limit results |
| `--debug` | Show error details |

## Examples

### Daily Contact Management

```bash
# Search for a contact
ghl contacts search --account "RevIgnite" --query "john@example.com"

# Add tags to contact
ghl contacts tags --id "abc123" --add "VIP,Hot Lead"

# Add note
ghl contacts note --id "abc123" --body "Spoke with John, interested in premium plan"
```

### Pipeline Management

```bash
# List pipelines and stages
ghl pipelines list --account "RevIgnite"

# Create opportunity
ghl opportunities create --account "RevIgnite" \
  --name "Acme Corp Deal" \
  --pipeline "Sales Pipeline" \
  --stage "Discovery" \
  --value 5000

# Move to next stage
ghl opportunities update --id "opp123" --stage "Proposal"
```

### Automation Setup

```bash
# List existing workflows
ghl workflows list --account "RevIgnite"

# Enroll contact in workflow
ghl workflows enroll --contact "abc123" --workflow "Onboarding Sequence"

# Create new workflow via AI Builder
ghl workflows create --account "RevIgnite" \
  --prompt "Create follow-up sequence: when opportunity moves to Proposal Sent, wait 3 days, send reminder email, wait 2 days, create follow-up task"
```

## Troubleshooting

### "No API key configured"
Check `~/.clawdbot/secrets/ghl-agencies.env` exists and has the right tokens.

### "Sub-account not found"
- Run `ghl accounts list --agency svg` to see available accounts
- Account names are case-insensitive partial matches

### Browser automation fails
1. Verify Chrome is installed: `which google-chrome-stable`
2. Check OpenClaw browser config: `openclaw config get browser`
3. Test manually: `openclaw browser --browser-profile openclaw status`

### Rate limits
GHL has API rate limits. The skill handles retries automatically, but bulk operations may need pacing.
