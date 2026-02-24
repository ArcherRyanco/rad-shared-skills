# Getting Started with RAD Skills

## 1. Clone This Repo

```bash
git clone https://github.com/ArcherRyanco/rad-shared-skills.git ~/rad-shared-skills
```

## 2. Set Up Your Agent Identity

Copy and customize the templates:

```bash
# In your agent directory (e.g., ~/.agents/your-agent/)
cp ~/rad-shared-skills/templates/SOUL.md.template SOUL.md
cp ~/rad-shared-skills/templates/USER.md.template USER.md
cp ~/rad-shared-skills/templates/TOOLS.md.template TOOLS.md
```

Edit each file to match your personality and setup.

## 3. Install Skills You Need

**Option A: Symlink (recommended - gets updates)**
```bash
ln -s ~/rad-shared-skills/skills/copywriting ~/.agents/skills/copywriting
ln -s ~/rad-shared-skills/skills/seo-audit ~/.agents/skills/seo-audit
# etc.
```

**Option B: Copy (for customization)**
```bash
cp -r ~/rad-shared-skills/skills/copywriting ~/.agents/skills/
```

## 4. Set Up Credentials

Each integration skill may need API keys. Store them securely:

```bash
mkdir -p ~/.clawdbot/secrets
chmod 700 ~/.clawdbot/secrets

# Example: ClickUp
echo "CLICKUP_API_TOKEN=pk_xxx" > ~/.clawdbot/secrets/clickup.env
chmod 600 ~/.clawdbot/secrets/clickup.env
```

Document your credentials in your TOOLS.md.

## 5. Recommended Skills by Role

### Content/SEO (Trevor, Bre)
- copywriting, copy-editing
- seo-audit, programmatic-seo, schema-markup
- content-strategy
- competitor-alternatives

### Operations (Faith)
- gmail-client, imap-email
- hubspot or pipedrive
- n8n-workflow-automation
- canva-connect

### Marketing
- paid-ads
- social-content
- email-sequence
- analytics-tracking

## Need Help?

Check each skill's `SKILL.md` for usage instructions.
