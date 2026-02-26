# Roam Skill — Team Communication & Meeting Transcripts

Access Roam HQ for chat messaging, meeting transcripts, and action item tracking.

## Quick Start

```bash
# List all chats (DMs, channels, groups)
roam chats list

# Get recent messages from a chat
roam chat history --chat "P-35a2b75c-75f2-4029-9551-7ce03614edd4"

# Send a message
roam chat send --chat "P-35a2b75c-75f2-4029-9551-7ce03614edd4" --text "Got it, working on that now"

# List meeting transcripts
roam transcripts list

# Get full transcript with action items
roam transcript get --id "abc123"

# Sync all transcripts to local markdown files
roam transcripts sync
```

## Setup

See [docs/SETUP.md](docs/SETUP.md) for full instructions.

Quick version:
1. Clone skill to `~/skills/roam/`
2. Create `~/.clawdbot/secrets/roam.env` with API key
3. Add CLI alias: `alias roam='node ~/skills/roam/scripts/roam.js'`

## Capabilities

### Chat Operations
- `chats list` — List all accessible chats (DMs, channels, groups)
- `chat history` — Get recent messages from a chat
- `chat send` — Send a message to a chat

### Transcripts
- `transcripts list` — List all meeting transcripts
- `transcript get` — Get full transcript with summary + action items
- `transcripts sync` — Sync all transcripts to local markdown files

### Groups & Recordings
- `groups list` — List all groups
- `recordings list` — List all recordings

## Key Chats

| Name | Chat ID |
|------|---------|
| Faith/Kyle/Ryan/Archer | `P-35a2b75c-75f2-4029-9551-7ce03614edd4` |
| Ryan DM | `D-1595e837-f4bd-473e-bc3b-88bf00a3234e` |
| RAD Leadership | `C-205009fc-e5b5-49f7-875b-432963a99d45` |
| SEO | `C-4672652f-62a8-426e-b216-60948b215249` |
| Web Dev | `C-05857b08-63df-4469-96ef-710f00dbe7c0` |
| Ignite Team | `C-4ba79363-0423-4790-b716-fd9e8d3326dd` |

## API Reference

**Rate Limit:** 1 request/second, burst of 10

**Endpoints Used:**
- `v0/chat.list` — List all chats
- `v0/chat.history` — Get chat messages
- `v0/chat.post` — Send message
- `v0/transcript.list` — List transcripts
- `v0/transcript.info` — Get full transcript
- `v1/groups.list` — List groups
- `v1/recording.list` — List recordings

## Examples

### Check for Action Items Assigned to You

```bash
# Get recent transcripts
roam transcripts list --limit 5

# Get specific transcript with action items
roam transcript get --id "abc123"
```

### Respond to Team in Roam

```bash
# Read recent messages
roam chat history --chat "P-35a2b75c-75f2-4029-9551-7ce03614edd4" --limit 10

# Send response
roam chat send --chat "P-35a2b75c-75f2-4029-9551-7ce03614edd4" --text "Done - updated the ClickUp task"
```

### Sync Transcripts for Context

```bash
# Sync all to ~/data/roam-transcripts/
roam transcripts sync

# Then read locally
cat ~/data/roam-transcripts/2026-02-26_abc123.md
```
