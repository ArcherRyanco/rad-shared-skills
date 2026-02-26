# Roam Skill Setup Guide

Complete setup instructions for adding Roam HQ access to your OpenClaw agent.

## Prerequisites

- OpenClaw installed and running
- Node.js 18+ (comes with OpenClaw)
- Roam API access

## Step 1: Add Skill to Your Agent

Clone from repo:

```bash
cd ~/skills  # or your agent's skills directory
git clone --depth 1 https://github.com/ArcherRyanco/Archerspace.git temp-repo
mv temp-repo/skills/roam ./roam
rm -rf temp-repo
```

## Step 2: Create Credentials

```bash
mkdir -p ~/.clawdbot/secrets
chmod 700 ~/.clawdbot/secrets
```

Create `~/.clawdbot/secrets/roam.env`:

```env
ROAM_API_KEY=rmk-your-api-key-here
```

Set permissions:
```bash
chmod 600 ~/.clawdbot/secrets/roam.env
```

## Step 3: Set Up CLI Alias

```bash
echo 'alias roam="node ~/skills/roam/scripts/roam.js"' >> ~/.bashrc
source ~/.bashrc
```

## Step 4: Create Data Directory

```bash
mkdir -p ~/data/roam-transcripts
```

## Step 5: Test It

```bash
# List all chats
roam chats list

# List transcripts
roam transcripts list
```

## Step 6: Add to Your Agent's Skills

In your available_skills config:

```yaml
- name: roam
  description: Roam HQ team communication - chats, messages, meeting transcripts, action items. Use for team communication and meeting context.
  location: ~/skills/roam/SKILL.md
```

## Key Chat IDs

Save these for quick reference:

| Chat | ID |
|------|-----|
| Faith/Kyle/Ryan/Archer | `P-35a2b75c-75f2-4029-9551-7ce03614edd4` |
| Ryan DM | `D-1595e837-f4bd-473e-bc3b-88bf00a3234e` |
| RAD Leadership | `C-205009fc-e5b5-49f7-875b-432963a99d45` |
| SEO | `C-4672652f-62a8-426e-b216-60948b215249` |
| Web Dev | `C-05857b08-63df-4469-96ef-710f00dbe7c0` |
| Ignite Team | `C-4ba79363-0423-4790-b716-fd9e8d3326dd` |

## Troubleshooting

### "ROAM_API_KEY not found"
- Check file exists: `ls -la ~/.clawdbot/secrets/roam.env`
- Check format: `ROAM_API_KEY=rmk-...` (no quotes)

### Rate limit errors
- Roam allows 1 request/second with burst of 10
- The sync command has built-in rate limiting

### Can't send messages
- Verify you have write access to the chat
- Check the chat ID is correct (DMs start with `D-`, channels with `C-`, groups with `P-`)
