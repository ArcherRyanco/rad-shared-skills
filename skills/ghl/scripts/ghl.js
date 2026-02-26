#!/usr/bin/env node
/**
 * GHL CLI - Main Entry Point
 * Routes between API (fast) and Browser (when needed)
 */

const { GHLClient, AGENCIES } = require('./api-client');
const { 
  generateLoginInstructions,
  generateWorkflowCreationInstructions,
  generateAccountSwitchInstructions,
  toOpenClawBrowserInstructions
} = require('./browser-automation');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subCommand = args[1];
  
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      // Handle flag with value
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

// Format output for human readability
function formatOutput(data, type = 'json') {
  if (type === 'table' && Array.isArray(data)) {
    // Simple table format
    if (data.length === 0) return 'No results';
    const keys = Object.keys(data[0]).slice(0, 5); // Limit columns
    console.log(keys.join('\t'));
    console.log('-'.repeat(80));
    data.forEach(row => {
      console.log(keys.map(k => String(row[k] || '').slice(0, 30)).join('\t'));
    });
    return;
  }
  return JSON.stringify(data, null, 2);
}

async function main() {
  const { command, subCommand, flags } = parseArgs();
  
  // Determine which agency to use
  const agencyKey = flags.agency || 'svg';
  let client;
  
  try {
    client = new GHLClient(agencyKey);
  } catch (error) {
    if (command !== 'help' && !['browser', 'login'].includes(command)) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  try {
    switch (command) {
      // === ACCOUNT MANAGEMENT ===
      case 'accounts':
        if (subCommand === 'list') {
          const accounts = await client.listSubAccounts();
          const simplified = accounts.map(a => ({
            id: a.id,
            name: a.name,
            email: a.email || '-',
            phone: a.phone || '-'
          }));
          if (flags.json) {
            console.log(JSON.stringify(simplified, null, 2));
          } else {
            console.log(`\n${AGENCIES[agencyKey].name} - ${accounts.length} Sub-Accounts:\n`);
            simplified.forEach(a => console.log(`  ${a.name} (${a.id})`));
          }
        } else if (subCommand === 'find') {
          const account = await client.findSubAccount(flags.query || flags.name);
          console.log(JSON.stringify(account, null, 2));
        }
        break;

      // === CONTACTS ===
      case 'contacts':
        const contactLoc = await client.getLocationId(flags.account || 'RevIgnite');
        
        switch (subCommand) {
          case 'list':
            const contacts = await client.listContacts(contactLoc, { 
              limit: parseInt(flags.limit) || 20 
            });
            console.log(JSON.stringify(contacts, null, 2));
            break;
            
          case 'search':
            const results = await client.searchContacts(contactLoc, flags.query || flags.q);
            console.log(JSON.stringify(results, null, 2));
            break;
            
          case 'get':
            const contact = await client.getContact(contactLoc, flags.id);
            console.log(JSON.stringify(contact, null, 2));
            break;
            
          case 'create':
            const newContact = await client.createContact(contactLoc, {
              firstName: flags.firstName || (flags.name ? flags.name.split(' ')[0] : undefined),
              lastName: flags.lastName || (flags.name ? flags.name.split(' ').slice(1).join(' ') : undefined),
              email: flags.email,
              phone: flags.phone,
              tags: flags.tags ? flags.tags.split(',') : undefined,
              source: flags.source
            });
            console.log('Contact created:', JSON.stringify(newContact, null, 2));
            break;
            
          case 'update':
            const updated = await client.updateContact(flags.id, {
              firstName: flags.firstName,
              lastName: flags.lastName,
              email: flags.email,
              phone: flags.phone
            });
            console.log('Contact updated:', JSON.stringify(updated, null, 2));
            break;
            
          case 'tags':
            if (flags.add) {
              await client.addContactTags(flags.id, flags.add.split(','));
              console.log('Tags added');
            } else if (flags.remove) {
              await client.removeContactTags(flags.id, flags.remove.split(','));
              console.log('Tags removed');
            }
            break;
            
          case 'note':
            await client.addContactNote(flags.id, flags.body || flags.note);
            console.log('Note added');
            break;
            
          default:
            console.log('Usage: ghl contacts <list|search|get|create|update|tags|note> [flags]');
        }
        break;

      // === PIPELINES & OPPORTUNITIES ===
      case 'pipelines':
        const pipeLoc = await client.getLocationId(flags.account || 'RevIgnite');
        
        if (subCommand === 'list') {
          const pipelines = await client.listPipelines(pipeLoc);
          if (flags.json) {
            console.log(JSON.stringify(pipelines, null, 2));
          } else {
            console.log('\nPipelines:');
            (pipelines.pipelines || []).forEach(p => {
              console.log(`\n  ${p.name} (${p.id})`);
              (p.stages || []).forEach(s => console.log(`    - ${s.name} (${s.id})`));
            });
          }
        }
        break;

      case 'opportunities':
        const oppLoc = await client.getLocationId(flags.account || 'RevIgnite');
        
        switch (subCommand) {
          case 'list':
            const opps = await client.listOpportunities(oppLoc, {
              pipelineId: flags.pipeline,
              stageId: flags.stage,
              limit: parseInt(flags.limit) || 20
            });
            console.log(JSON.stringify(opps, null, 2));
            break;
            
          case 'create':
            const newOpp = await client.createOpportunity(oppLoc, {
              name: flags.name,
              pipelineId: flags.pipeline,
              stageId: flags.stage,
              contactId: flags.contact,
              monetaryValue: parseFloat(flags.value) || 0,
              status: flags.status || 'open'
            });
            console.log('Opportunity created:', JSON.stringify(newOpp, null, 2));
            break;
            
          case 'update':
            const updatedOpp = await client.updateOpportunity(flags.id, {
              stageId: flags.stage,
              status: flags.status,
              monetaryValue: flags.value ? parseFloat(flags.value) : undefined
            });
            console.log('Opportunity updated:', JSON.stringify(updatedOpp, null, 2));
            break;
        }
        break;

      // === WORKFLOWS ===
      case 'workflows':
        const wfLoc = await client.getLocationId(flags.account || 'RevIgnite');
        
        switch (subCommand) {
          case 'list':
            const workflows = await client.listWorkflows(wfLoc);
            if (flags.json) {
              console.log(JSON.stringify(workflows, null, 2));
            } else {
              console.log('\nWorkflows:');
              (workflows.workflows || []).forEach(w => {
                const status = w.status === 'published' ? '✓' : '○';
                console.log(`  ${status} ${w.name} (${w.id})`);
              });
            }
            break;
            
          case 'enroll':
            if (!flags.contact || !flags.workflow) {
              console.error('Required: --contact <id> --workflow <id>');
              process.exit(1);
            }
            const enrolled = await client.enrollInWorkflow(flags.contact, flags.workflow);
            console.log('Enrolled in workflow:', JSON.stringify(enrolled, null, 2));
            break;
            
          case 'remove':
            if (!flags.contact || !flags.workflow) {
              console.error('Required: --contact <id> --workflow <id>');
              process.exit(1);
            }
            const removed = await client.removeFromWorkflow(flags.contact, flags.workflow);
            console.log('Removed from workflow:', JSON.stringify(removed, null, 2));
            break;
            
          case 'create':
            // This requires browser automation
            if (!flags.prompt) {
              console.error('Required: --prompt "workflow description for AI Builder"');
              process.exit(1);
            }
            const locationId = await client.getLocationId(flags.account || 'RevIgnite');
            const instructions = generateWorkflowCreationInstructions(
              locationId,
              flags.prompt,
              flags.name
            );
            console.log('\n=== BROWSER AUTOMATION REQUIRED ===');
            console.log('Workflow creation requires GHL\'s AI Builder (no API available).\n');
            console.log('Instructions for OpenClaw browser tool:');
            console.log(JSON.stringify(toOpenClawBrowserInstructions(instructions), null, 2));
            break;
        }
        break;

      // === CALENDARS ===
      case 'calendars':
        const calLoc = await client.getLocationId(flags.account || 'RevIgnite');
        
        if (subCommand === 'list') {
          const calendars = await client.listCalendars(calLoc);
          console.log(JSON.stringify(calendars, null, 2));
        } else if (subCommand === 'slots') {
          const slots = await client.getAvailableSlots(
            flags.calendar,
            calLoc,
            flags.start || new Date().toISOString().split('T')[0],
            flags.end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          );
          console.log(JSON.stringify(slots, null, 2));
        }
        break;

      // === MESSAGES ===
      case 'messages':
        const msgLoc = await client.getLocationId(flags.account || 'RevIgnite');
        
        switch (subCommand) {
          case 'send-sms':
            if (!flags.contact || !flags.message) {
              console.error('Required: --contact <id> --message "text"');
              process.exit(1);
            }
            const smsResult = await client.sendSMS(msgLoc, flags.contact, flags.message);
            console.log('SMS sent:', JSON.stringify(smsResult, null, 2));
            break;
            
          case 'send-email':
            if (!flags.contact || !flags.subject || !flags.body) {
              console.error('Required: --contact <id> --subject "subject" --body "email body"');
              process.exit(1);
            }
            const emailResult = await client.sendEmail(msgLoc, flags.contact, flags.subject, flags.body);
            console.log('Email sent:', JSON.stringify(emailResult, null, 2));
            break;
        }
        break;

      // === BROWSER AUTOMATION ===
      case 'browser':
        switch (subCommand) {
          case 'login':
            console.log(JSON.stringify(toOpenClawBrowserInstructions(generateLoginInstructions()), null, 2));
            break;
            
          case 'switch':
            console.log(JSON.stringify(toOpenClawBrowserInstructions(generateAccountSwitchInstructions(flags.account)), null, 2));
            break;
        }
        break;

      // === HELP ===
      case 'help':
      default:
        console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    GHL CLI - GoHighLevel Management                  ║
╚══════════════════════════════════════════════════════════════════════╝

Usage: ghl <command> <subcommand> [flags]

ACCOUNTS
  ghl accounts list [--agency svg|liberty|ignite]   List all sub-accounts
  ghl accounts find --query "name"                   Find sub-account by name

CONTACTS (API - Fast)
  ghl contacts list --account "RevIgnite" [--limit 20]
  ghl contacts search --account "RevIgnite" --query "email@example.com"
  ghl contacts create --account "RevIgnite" --name "John Doe" --email "john@example.com"
  ghl contacts update --id <contactId> --email "new@email.com"
  ghl contacts tags --id <contactId> --add "Tag1,Tag2"
  ghl contacts note --id <contactId> --body "Note text"

PIPELINES & OPPORTUNITIES (API - Fast)
  ghl pipelines list --account "RevIgnite"
  ghl opportunities list --account "RevIgnite" [--pipeline <id>]
  ghl opportunities create --account "RevIgnite" --name "Deal" --pipeline <id> --stage <id>

WORKFLOWS (API for enroll, Browser for create)
  ghl workflows list --account "RevIgnite"
  ghl workflows enroll --contact <id> --workflow <id>
  ghl workflows remove --contact <id> --workflow <id>
  ghl workflows create --account "RevIgnite" --prompt "description for AI Builder"

CALENDARS (API - Fast)
  ghl calendars list --account "RevIgnite"
  ghl calendars slots --calendar <id> --start 2026-03-01 --end 2026-03-07

MESSAGES (API - Fast)
  ghl messages send-sms --account "RevIgnite" --contact <id> --message "Hello!"
  ghl messages send-email --account "RevIgnite" --contact <id> --subject "Hi" --body "Email text"

BROWSER AUTOMATION
  ghl browser login                     Generate GHL login instructions
  ghl browser switch --account "Name"   Generate account switch instructions

COMMON FLAGS
  --agency <key>     Agency: svg (default), liberty, ignite
  --account <name>   Sub-account name (default: RevIgnite)
  --json             Output raw JSON
  --limit <n>        Limit results

EXAMPLES
  # List all SVG Lead Pro sub-accounts
  ghl accounts list --agency svg

  # Search contacts in RevIgnite
  ghl contacts search --account "RevIgnite" --query "john@example.com"

  # Create new contact
  ghl contacts create --account "RevIgnite" --name "Jane Doe" --email "jane@example.com" --phone "+15551234567"

  # Create workflow using AI Builder (browser automation)
  ghl workflows create --account "RevIgnite" --prompt "When contact fills form, send welcome email, wait 1 day, send follow-up SMS"
`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (flags.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
