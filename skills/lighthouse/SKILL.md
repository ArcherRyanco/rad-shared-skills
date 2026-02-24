---
name: lighthouse-audit
version: 1.0.0
description: When the user wants to audit website performance using Lighthouse. Use when the user mentions "Lighthouse audit," "website speed," "performance score," "Core Web Vitals," "page load time," or "website optimization report."
---

# Lighthouse Performance Audit

You are an expert in web performance optimization. Your goal is to run Lighthouse audits, analyze the results, and provide actionable recommendations to improve website speed and user experience.

## Capabilities

This skill enables you to:

1.  **Run Lighthouse Audits**: Execute Lighthouse on any provided URL.
2.  **Parse Key Metrics**: Extract critical performance metrics:
    *   Largest Contentful Paint (LCP)
    *   Interaction to Next Paint (INP)
    *   Cumulative Layout Shift (CLS)
    *   Performance Score
3.  **Generate Recommendations**: Provide actionable suggestions based on audit findings.
4.  **Compare Scores**: Facilitate before/after comparisons of performance scores.
5.  **Output Formats**: Deliver results in both JSON and human-readable summaries.

## Usage

To use this skill, you will typically run the following helper scripts:

### 1. Running an Audit

Use the `run_audit.sh` script to execute a Lighthouse audit on a given URL.

**Command:**
`exec command="~/clawd/skills/lighthouse/run_audit.sh <URL>"`

**Example:**
`exec command="~/clawd/skills/lighthouse/run_audit.sh https://www.example.com"`

This script will save the raw Lighthouse JSON report to a file (e.g., `lighthouse_report_<timestamp>.json`).

### 2. Parsing Results and Generating Summary

Use the `parse_results.py` script to parse a Lighthouse JSON report and generate a human-readable summary and extract key metrics.

**Command:**
`exec command="python3 ~/clawd/skills/lighthouse/parse_results.py <path_to_json_report>"`

**Example:**
`exec command="python3 ~/clawd/skills/lighthouse/parse_results.py lighthouse_report_1678886400.json"`

This script will output a summary to the console and can optionally save a structured JSON output of key metrics and recommendations.

## Key Metrics Explained

*   **Largest Contentful Paint (LCP)**: Measures perceived load speed. It marks the point in the page load timeline when the page's main content has likely loaded. (Good: < 2.5s)
*   **Interaction to Next Paint (INP)**: Measures a page's responsiveness to user interactions by quantifying the latency of all eligible interactions made by a user with a page. (Good: < 200ms)
*   **Cumulative Layout Shift (CLS)**: Measures visual stability. It quantifies the amount of unexpected layout shift of visible page content. (Good: < 0.1)
*   **Performance Score**: An aggregated score (0-100) that summarizes the page's overall performance. Higher is better.

## Output Format

### Human-Readable Summary

A concise summary highlighting:
*   Performance Score
*   Core Web Vitals (LCP, INP, CLS) and their status (Good/Needs Improvement/Poor)
*   Top 3-5 critical recommendations with brief explanations.

### JSON Output (from `parse_results.py`)

A structured JSON object containing:
```json
{
  "url": "audited_url",
  "performance_score": 95,
  "metrics": {
    "lcp": {
      "score": 0.98,
      "value": 2400,
      "display_value": "2.4 s",
      "status": "Good"
    },
    "inp": {
      "score": 0.95,
      "value": 150,
      "display_value": "150 ms",
      "status": "Good"
    },
    "cls": {
      "score": 0.99,
      "value": 0.05,
      "display_value": "0.05",
      "status": "Good"
    }
  },
  "recommendations": [
    {
      "title": "Reduce unused JavaScript",
      "description": "Remove or defer JavaScript that isn't critical for the initial page load.",
      "impact": "High",
      "details_url": "https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/"
    },
    // ... more recommendations
  ]
}
```

## Before/After Comparisons

To compare scores:
1. Run an audit (e.g., "before" changes).
2. Save the key metrics (or the full JSON).
3. Make changes to the website.
4. Run another audit (e.g., "after" changes).
5. Compare the key metrics and performance scores manually or by using a custom script that processes two JSON outputs from `parse_results.py`.

## Tools Referenced

-   **Lighthouse CLI**: Installed globally and executed via `run_audit.sh`.
