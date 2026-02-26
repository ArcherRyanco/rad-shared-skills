#!/usr/bin/env node
/**
 * Roam CLI - Team Communication & Transcripts
 * Access Roam HQ chats, messages, and meeting transcripts
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SECRETS_DIR = process.env.ROAM_SECRETS_DIR || path.join(process.env.HOME, '.clawdbot/secrets');
const SECRETS_PATH = path.join(SECRETS_DIR, 'roam.env');
const DATA_DIR = path.join(process.env.HOME, 'data/roam-transcripts');

// Load credentials
function loadCredentials() {
  try {
    const content = fs.readFileSync(SECRETS_PATH, 'utf8');
    const creds = {};
    content.split('\n').forEach(line => {
      const match = line.match(/^(\w+)=(.*)$/);
      if (match) creds[match[1]] = match[2].replace(/^["']|["']$/g, '');
    });
    return creds;
  } catch (e) {
    console.error(`Error: Could not load credentials from ${SECRETS_PATH}`);
    console.error('Create the file with: ROAM_API_KEY=rmk-your-key-here');
    process.exit(1);
  }
}

const CREDS = loadCredentials();
const API_KEY = CREDS.ROAM_API_KEY;

if (!API_KEY) {
  console.error('Error: ROAM_API_KEY not found in credentials file');
  process.exit(1);
}

// API request helper
function roamRequest(endpoint, version = 'v0', method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.ro.am/${version}/${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          if (data.trim() === '') resolve({});
          else reject(new Error(`Failed to parse: ${data}`));
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// POST request helper
function roamPost(endpoint, body, version = 'v0') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.ro.am',
      path: `/${version}/${endpoint}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          if (data.trim() === '') resolve({ success: true });
          else reject(new Error(`Failed to parse: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

// Format helpers
function formatDate(isoString) {
  return new Date(isoString).toISOString().split('T')[0];
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', { 
    hour: '2-digit', minute: '2-digit', hour12: true 
  });
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subCommand = args[1];
  
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        flags[key] = args[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  
  return { command, subCommand, flags };
}

// Commands
async function listChats() {
  const data = await roamRequest('chat.list');
  return data.chats || [];
}

async function getChatHistory(chatId, limit = 20) {
  const data = await roamRequest(`chat.history?chat=${chatId}&limit=${limit}`);
  return data.messages || [];
}

async function sendMessage(chatId, text) {
  return roamPost('chat.post', { chat: chatId, text });
}

async function listTranscripts() {
  const data = await roamRequest('transcript.list');
  return data.transcripts || [];
}

async function getTranscript(id) {
  return roamRequest(`transcript.info?id=${id}`);
}

async function listGroups() {
  const data = await roamRequest('groups.list', 'v1');
  return data.groups || [];
}

async function listRecordings() {
  const data = await roamRequest('recording.list', 'v1');
  return data.recordings || [];
}

async function syncTranscripts() {
  // Ensure data directory exists
  fs.mkdirSync(DATA_DIR, { recursive: true });
  
  console.log('Fetching transcript list...');
  const transcripts = await listTranscripts();
  console.log(`Found ${transcripts.length} transcripts`);
  
  let synced = 0;
  
  for (const t of transcripts) {
    const date = formatDate(t.start);
    const filename = `${date}_${t.id.slice(0, 8)}.md`;
    const filepath = path.join(DATA_DIR, filename);
    
    // Skip if exists
    if (fs.existsSync(filepath)) {
      continue;
    }
    
    console.log(`Syncing: ${date} - ${t.participants.map(p => p.name).join(', ').slice(0, 40)}...`);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 1100));
    
    const detail = await getTranscript(t.id);
    
    // Build markdown
    let md = `# Meeting Transcript\n\n`;
    md += `**Date:** ${date}\n`;
    md += `**Time:** ${formatTime(t.start)} - ${formatTime(t.end)}\n`;
    md += `**Participants:** ${t.participants.map(p => p.name).join(', ')}\n\n`;
    
    if (detail.summary) {
      md += `## Summary\n\n${detail.summary}\n\n`;
    }
    
    if (detail.actionItems?.length) {
      md += `## Action Items\n\n`;
      for (const item of detail.actionItems) {
        md += `- **${item.assignee || 'Unassigned'}**: ${item.title}\n`;
      }
      md += '\n';
    }
    
    if (detail.cues?.length) {
      md += `## Transcript\n\n`;
      for (const cue of detail.cues) {
        md += `**${cue.speaker}:** ${cue.text}\n\n`;
      }
    }
    
    fs.writeFileSync(filepath, md);
    synced++;
  }
  
  console.log(`\nSync complete. ${synced} new transcripts saved to ${DATA_DIR}`);
  return synced;
}

// Main CLI
async function main() {
  const { command, subCommand, flags } = parseArgs();
  
  try {
    switch (command) {
      case 'chats':
        if (subCommand === 'list') {
          const chats = await listChats();
          if (flags.json) {
            console.log(JSON.stringify(chats, null, 2));
          } else {
            console.log('\nChats:\n');
            chats.forEach(c => {
              const type = c.id.startsWith('D-') ? 'DM' : c.id.startsWith('C-') ? 'Channel' : 'Group';
              console.log(`  [${type}] ${c.name || c.id}`);
              console.log(`       ID: ${c.id}`);
            });
          }
        }
        break;
        
      case 'chat':
        if (subCommand === 'history') {
          if (!flags.chat) {
            console.error('Required: --chat <chatId>');
            process.exit(1);
          }
          const messages = await getChatHistory(flags.chat, parseInt(flags.limit) || 20);
          if (flags.json) {
            console.log(JSON.stringify(messages, null, 2));
          } else {
            console.log(`\nRecent messages (${messages.length}):\n`);
            messages.reverse().forEach(m => {
              const time = new Date(m.timestamp).toLocaleString();
              console.log(`[${time}] ${m.senderName || m.sender}:`);
              console.log(`  ${m.text}\n`);
            });
          }
        } else if (subCommand === 'send') {
          if (!flags.chat || !flags.text) {
            console.error('Required: --chat <chatId> --text "message"');
            process.exit(1);
          }
          const result = await sendMessage(flags.chat, flags.text);
          console.log('Message sent:', JSON.stringify(result, null, 2));
        }
        break;
        
      case 'transcripts':
        if (subCommand === 'list') {
          const transcripts = await listTranscripts();
          if (flags.json) {
            console.log(JSON.stringify(transcripts, null, 2));
          } else {
            console.log(`\nTranscripts (${transcripts.length}):\n`);
            const limit = parseInt(flags.limit) || 10;
            transcripts.slice(0, limit).forEach(t => {
              const date = formatDate(t.start);
              const participants = t.participants.map(p => p.name).join(', ');
              console.log(`  ${date} | ${t.id.slice(0, 8)} | ${participants.slice(0, 50)}`);
            });
          }
        } else if (subCommand === 'sync') {
          await syncTranscripts();
        }
        break;
        
      case 'transcript':
        if (subCommand === 'get') {
          if (!flags.id) {
            console.error('Required: --id <transcriptId>');
            process.exit(1);
          }
          const transcript = await getTranscript(flags.id);
          if (flags.json) {
            console.log(JSON.stringify(transcript, null, 2));
          } else {
            console.log('\n' + '='.repeat(60));
            if (transcript.summary) {
              console.log('\nSUMMARY:\n' + transcript.summary);
            }
            if (transcript.actionItems?.length) {
              console.log('\nACTION ITEMS:');
              transcript.actionItems.forEach(item => {
                console.log(`  • [${item.assignee || 'Unassigned'}] ${item.title}`);
              });
            }
            console.log('\n' + '='.repeat(60));
          }
        }
        break;
        
      case 'groups':
        if (subCommand === 'list') {
          const groups = await listGroups();
          console.log(JSON.stringify(groups, null, 2));
        }
        break;
        
      case 'recordings':
        if (subCommand === 'list') {
          const recordings = await listRecordings();
          console.log(JSON.stringify(recordings, null, 2));
        }
        break;
        
      case 'help':
      default:
        console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    Roam CLI - Team Communication                     ║
╚══════════════════════════════════════════════════════════════════════╝

Usage: roam <command> <subcommand> [flags]

CHATS
  roam chats list                          List all chats
  roam chat history --chat <id> [--limit]  Get chat messages
  roam chat send --chat <id> --text "msg"  Send message

TRANSCRIPTS
  roam transcripts list [--limit 10]       List meeting transcripts
  roam transcript get --id <id>            Get full transcript + action items
  roam transcripts sync                    Sync all to local markdown files

GROUPS & RECORDINGS
  roam groups list                         List all groups
  roam recordings list                     List all recordings

COMMON FLAGS
  --json          Output raw JSON
  --limit <n>     Limit results

KEY CHAT IDS
  P-35a2b75c-... Faith/Kyle/Ryan/Archer (team chat)
  D-1595e837-... Ryan DM
  C-205009fc-... RAD Leadership
  C-4672652f-... SEO
  C-4ba79363-... Ignite Team

EXAMPLES
  # Check recent team messages
  roam chat history --chat "P-35a2b75c-75f2-4029-9551-7ce03614edd4" --limit 5

  # Reply to team
  roam chat send --chat "P-35a2b75c-75f2-4029-9551-7ce03614edd4" --text "On it!"

  # Get transcript action items
  roam transcript get --id "abc123"
`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (flags.debug) console.error(error.stack);
    process.exit(1);
  }
}

main();
