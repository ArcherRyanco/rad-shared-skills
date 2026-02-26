#!/usr/bin/env node
/**
 * GHL API Client - Multi-Agency Support
 * Wraps GHL API with agency-level access and sub-account routing
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SECRETS_DIR = process.env.GHL_SECRETS_DIR || path.join(process.env.HOME, '.clawdbot/secrets');
const SECRETS_PATH = path.join(SECRETS_DIR, 'ghl-agencies.env');
const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

// Load credentials from .env file
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const creds = {};
    content.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) creds[match[1].trim()] = match[2].trim();
      }
    });
    return creds;
  } catch (e) {
    return {};
  }
}

// Load main credentials
const CREDS = loadEnvFile(SECRETS_PATH);

// Load additional sub-account token files
function loadSubAccountTokens() {
  const tokens = {};
  const subFiles = [
    'ghl-revignite.env',
    'ghl-ycrc.env',
    'ghl-liberty.env',
    'ghl-revolution.env'
  ];
  
  subFiles.forEach(file => {
    const fileCreds = loadEnvFile(path.join(SECRETS_DIR, file));
    Object.assign(tokens, fileCreds);
  });
  
  // Also pull from main file
  Object.keys(CREDS).forEach(key => {
    if (key.includes('_API_KEY') && key !== 'SVG_LEADPRO_API_KEY' && 
        key !== 'LIBERTY_HQ_API_KEY' && key !== 'AUDIOLOGY_IGNITE_API_KEY') {
      tokens[key] = CREDS[key];
    }
  });
  
  return tokens;
}

const SUB_TOKENS = loadSubAccountTokens();

// Agency configurations
const AGENCIES = {
  'svg': {
    name: 'SVG Lead Pro',
    apiKey: CREDS.SVG_LEADPRO_API_KEY,
    agencyId: CREDS.SVG_LEADPRO_AGENCY_ID
  },
  'liberty': {
    name: 'Liberty HQ',
    apiKey: CREDS.LIBERTY_HQ_API_KEY,
    agencyId: CREDS.LIBERTY_HQ_AGENCY_ID
  },
  'ignite': {
    name: 'Audiology Ignite',
    apiKey: CREDS.AUDIOLOGY_IGNITE_API_KEY,
    agencyId: CREDS.AUDIOLOGY_IGNITE_AGENCY_ID
  }
};

// Known location ID to token mappings
const LOCATION_TOKEN_MAP = {
  // Add your location IDs and corresponding token env var names
  // 'locationId': 'GHL_SUBACCOUNT_API_KEY'
};

// Build from env vars
Object.keys(SUB_TOKENS).forEach(key => {
  const match = key.match(/^GHL_(.+)_API_KEY$/);
  if (match) {
    const locationId = CREDS[`GHL_${match[1]}_LOCATION_ID`];
    if (locationId) {
      LOCATION_TOKEN_MAP[locationId] = SUB_TOKENS[key];
    }
  }
});

// Sub-account cache
let subAccountCache = {};

class GHLClient {
  constructor(agencyKey = 'svg') {
    this.agency = AGENCIES[agencyKey];
    if (!this.agency?.apiKey) {
      throw new Error(`No API key configured for agency: ${agencyKey}. Check ${SECRETS_PATH}`);
    }
    this.currentLocationId = null;
  }

  getTokenForLocation(locationId) {
    // Check if we have a specific sub-account token
    if (LOCATION_TOKEN_MAP[locationId]) {
      return LOCATION_TOKEN_MAP[locationId];
    }
    // Check env vars for pattern GHL_*_LOCATION_ID matching this location
    for (const [key, val] of Object.entries(SUB_TOKENS)) {
      if (val && key.endsWith('_API_KEY')) {
        return val;
      }
    }
    // Fall back to agency token
    return this.agency.apiKey;
  }

  async request(method, endpoint, body = null, locationId = null) {
    const url = new URL(endpoint, BASE_URL);
    const loc = locationId || this.currentLocationId;
    
    if (loc && !url.searchParams.has('locationId')) {
      url.searchParams.set('locationId', loc);
    }

    const apiKey = loc ? this.getTokenForLocation(loc) : this.agency.apiKey;

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': API_VERSION,
        'Content-Type': 'application/json'
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    
    // Handle empty responses
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { raw: text };
    }

    if (!response.ok) {
      throw new Error(`GHL API Error (${response.status}): ${data.message || JSON.stringify(data)}`);
    }

    return data;
  }

  // === Sub-Account Management ===

  async listSubAccounts(forceRefresh = false) {
    const cacheKey = this.agency.name;
    if (!forceRefresh && subAccountCache[cacheKey]) {
      return subAccountCache[cacheKey];
    }

    const data = await this.request('GET', '/locations/search?limit=100');
    subAccountCache[cacheKey] = data.locations || [];
    return subAccountCache[cacheKey];
  }

  async findSubAccount(nameOrId) {
    const accounts = await this.listSubAccounts();
    const lower = nameOrId.toLowerCase();
    return accounts.find(a => 
      a.id === nameOrId || 
      a.name.toLowerCase() === lower ||
      a.name.toLowerCase().includes(lower)
    );
  }

  async getLocationId(accountName) {
    const account = await this.findSubAccount(accountName);
    if (!account) {
      throw new Error(`Sub-account not found: ${accountName}`);
    }
    this.currentLocationId = account.id;
    return account.id;
  }

  // === Contacts ===

  async listContacts(locationId, options = {}) {
    const params = new URLSearchParams({ locationId, limit: options.limit || 20 });
    if (options.query) params.set('query', options.query);
    if (options.startAfter) params.set('startAfter', options.startAfter);
    
    return this.request('GET', `/contacts/?${params}`);
  }

  async searchContacts(locationId, query) {
    return this.listContacts(locationId, { query });
  }

  async getContact(locationId, contactId) {
    return this.request('GET', `/contacts/${contactId}`, null, locationId);
  }

  async createContact(locationId, contactData) {
    return this.request('POST', '/contacts/', {
      ...contactData,
      locationId
    });
  }

  async updateContact(contactId, contactData) {
    return this.request('PUT', `/contacts/${contactId}`, contactData);
  }

  async deleteContact(contactId) {
    return this.request('DELETE', `/contacts/${contactId}`);
  }

  async addContactTags(contactId, tags) {
    return this.request('POST', `/contacts/${contactId}/tags`, { tags });
  }

  async removeContactTags(contactId, tags) {
    return this.request('DELETE', `/contacts/${contactId}/tags`, { tags });
  }

  async addContactNote(contactId, body) {
    return this.request('POST', `/contacts/${contactId}/notes`, { body });
  }

  // === Pipelines & Opportunities ===

  async listPipelines(locationId) {
    return this.request('GET', `/opportunities/pipelines?locationId=${locationId}`);
  }

  async listOpportunities(locationId, options = {}) {
    const params = new URLSearchParams({ locationId });
    if (options.pipelineId) params.set('pipelineId', options.pipelineId);
    if (options.stageId) params.set('stageId', options.stageId);
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', options.limit);
    
    return this.request('GET', `/opportunities/search?${params}`);
  }

  async createOpportunity(locationId, oppData) {
    return this.request('POST', '/opportunities/', {
      ...oppData,
      locationId
    });
  }

  async updateOpportunity(opportunityId, oppData) {
    return this.request('PUT', `/opportunities/${opportunityId}`, oppData);
  }

  // === Calendars ===

  async listCalendars(locationId) {
    return this.request('GET', `/calendars/?locationId=${locationId}`);
  }

  async getAvailableSlots(calendarId, locationId, startDate, endDate) {
    const params = new URLSearchParams({
      calendarId,
      startDate,
      endDate,
      timezone: 'America/New_York'
    });
    return this.request('GET', `/calendars/${calendarId}/free-slots?${params}`, null, locationId);
  }

  // === Messages ===

  async sendSMS(locationId, contactId, message) {
    return this.request('POST', '/conversations/messages', {
      type: 'SMS',
      contactId,
      message,
      locationId
    });
  }

  async sendEmail(locationId, contactId, subject, body) {
    return this.request('POST', '/conversations/messages', {
      type: 'Email',
      contactId,
      subject,
      message: body,
      locationId
    });
  }

  // === Workflows ===

  async listWorkflows(locationId) {
    // Note: trailing slash required!
    return this.request('GET', `/workflows/?locationId=${locationId}`);
  }

  async enrollInWorkflow(contactId, workflowId, eventStartTime = null) {
    const body = eventStartTime ? { eventStartTime } : {};
    return this.request('POST', `/contacts/${contactId}/workflow/${workflowId}`, body);
  }

  async removeFromWorkflow(contactId, workflowId) {
    return this.request('DELETE', `/contacts/${contactId}/workflow/${workflowId}`);
  }

  // === Tags ===

  async listTags(locationId) {
    return this.request('GET', `/locations/${locationId}/tags`);
  }

  // === Users ===

  async listUsers(locationId) {
    return this.request('GET', `/users/?locationId=${locationId}`);
  }
}

// Export for use as module
module.exports = { GHLClient, AGENCIES, SECRETS_PATH };

// CLI if run directly
if (require.main === module) {
  console.log('Use ghl.js for CLI interface');
}
