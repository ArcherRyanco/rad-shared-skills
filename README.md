# RAD Shared Skills

Curated skills for RAD team OpenClaw agents.

## Installation

Clone this repo and symlink or copy skills to your agent's skills directory:

```bash
# Clone
git clone <repo-url> ~/rad-shared-skills

# Symlink individual skills
ln -s ~/rad-shared-skills/skills/copywriting ~/.agents/skills/copywriting

# Or copy all
cp -r ~/rad-shared-skills/skills/* ~/.agents/skills/
```

## Skills Index

### Marketing & Content
- `copywriting` - Write marketing copy for pages
- `copy-editing` - Edit and improve existing copy
- `content-strategy` - Plan content strategy
- `seo-audit` - Audit SEO issues
- `programmatic-seo` - Build pages at scale
- `schema-markup` - Add structured data
- `competitor-alternatives` - Create comparison pages
- `social-content` - Social media content
- `email-sequence` - Drip campaigns and sequences
- `paid-ads` - PPC campaign help

### CRO & Optimization
- `page-cro` - Conversion optimization for pages
- `form-cro` - Form optimization
- `popup-cro` - Popup optimization
- `signup-flow-cro` - Signup flow optimization
- `onboarding-cro` - User onboarding
- `paywall-upgrade-cro` - Upgrade screens

### Strategy
- `marketing-ideas` - 139 marketing tactics
- `marketing-psychology` - 70+ mental models
- `pricing-strategy` - Pricing decisions
- `launch-strategy` - Product launches
- `referral-program` - Referral programs
- `free-tool-strategy` - Engineering as marketing

### Integrations
- `apollo-enrichment` - Lead enrichment via Apollo
- `hubspot` - HubSpot CRM
- `pipedrive` - Pipedrive CRM
- `canva-connect` - Canva design automation
- `figma` - Figma design analysis
- `gmail-client` - Gmail access
- `linkedin-cli` - LinkedIn automation
- `typefully` - Social scheduling
- `n8n-workflow-automation` - n8n workflows

### Technical
- `nextjs` - Next.js development
- `vercel` - Vercel deployment
- `lighthouse` - Performance audits
- `fal-text-to-image` - AI image generation
- `react-email-skills` - Email templates

## Customization

Each skill has a `SKILL.md` that defines behavior. You can copy and modify for your needs.
