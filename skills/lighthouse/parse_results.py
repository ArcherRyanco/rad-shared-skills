import json
import sys

def get_metric_status(metric_name, value):
    if metric_name == "LARGEST_CONTENTFUL_PAINT":
        if value <= 2500: # 2.5 seconds
            return "Good"
        elif value <= 4000: # 4.0 seconds
            return "Needs Improvement"
        else:
            return "Poor"
    elif metric_name == "INTERACTION_TO_NEXT_PAINT":
        if value <= 200: # 200 milliseconds
            return "Good"
        elif value <= 500: # 500 milliseconds
            return "Needs Improvement"
        else:
            return "Poor"
    elif metric_name == "CUMULATIVE_LAYOUT_SHIFT":
        if value <= 0.1:
            return "Good"
        elif value <= 0.25:
            return "Needs Improvement"
        else:
            return "Poor"
    return "N/A"

def parse_lighthouse_report(report_path):
    with open(report_path, 'r') as f:
        report = json.load(f)

    url = report['finalUrl']
    performance_score = int(report['categories']['performance']['score'] * 100)

    metrics = {}
    desired_audit_ids = ['largest-contentful-paint', 'interaction-to-next-paint', 'cumulative-layout-shift']

    for audit_id in desired_audit_ids:
        audit = report['audits'].get(audit_id)
        if audit:
            metric_key = audit_id.replace('-', '_').upper() # Consistent key for metrics dict
            metrics[metric_key] = {
                "score": audit['score'],
                "value": audit['numericValue'],
                "display_value": audit['displayValue'],
                "status": get_metric_status(metric_key, audit['numericValue']) # Pass metric_key for status
            }

    recommendations = []
    
    # Extract opportunities and diagnostics that are not fully passed
    for audit_ref in report['categories']['performance']['auditRefs']:
        audit_id = audit_ref['id']
        audit = report['audits'][audit_id]
        
        # Check if it's an opportunity or diagnostic that indicates an issue
        if (audit_ref['group'] in ['opportunities', 'diagnostics']) and \
           (audit['score'] is not None and audit['score'] < 1):
            
            # Filter out the core web vitals from general recommendations if they are already in the metrics section
            if audit_id not in desired_audit_ids:
                impact = "High" if audit_ref.get('weight', 0) > 0.5 else "Medium"
                if audit_ref['group'] == 'diagnostics': # Diagnostics are generally informational, so usually Medium impact
                    impact = "Medium"

                recommendations.append({
                    "title": audit['title'],
                    "description": audit['description'],
                    "impact": impact,
                    "details_url": audit['helpUrl']
                })
    
    # Limit to top 5 recommendations for human-readable summary
    top_recommendations = recommendations[:5]

    # Human-readable summary
    human_readable_summary = f"""
Lighthouse Performance Report for: {url}

Overall Performance Score: {performance_score}/100

Core Web Vitals:
  - Largest Contentful Paint (LCP): {metrics.get('LARGEST_CONTENTFUL_PAINT', {}).get('display_value', 'N/A')} ({metrics.get('LARGEST_CONTENTFUL_PAINT', {}).get('status', 'N/A')})
  - Interaction to Next Paint (INP): {metrics.get('INTERACTION_TO_NEXT_PAINT', {}).get('display_value', 'N/A')} ({metrics.get('INTERACTION_TO_NEXT_PAINT', {}).get('status', 'N/A')})
  - Cumulative Layout Shift (CLS): {metrics.get('CUMULATIVE_LAYOUT_SHIFT', {}).get('display_value', 'N/A')} ({metrics.get('CUMULATIVE_LAYOUT_SHIFT', {}).get('status', 'N/A')})

Top Recommendations:
"""
    if top_recommendations:
        for i, rec in enumerate(top_recommendations):
            human_readable_summary += f"  {i+1}. {rec['title']} (Impact: {rec['impact']})\n     Description: {rec['description']}\n     Learn More: {rec['details_url']}\n"
    else:
        human_readable_summary += "  No specific recommendations identified, great job!\n"

    # Structured JSON output
    json_output = {
        "url": url,
        "performance_score": performance_score,
        "metrics": {
            "lcp": {
                "score": metrics.get('LARGEST_CONTENTFUL_PAINT', {}).get('score'),
                "value": metrics.get('LARGEST_CONTENTFUL_PAINT', {}).get('value'),
                "display_value": metrics.get('LARGEST_CONTENTFUL_PAINT', {}).get('display_value'),
                "status": metrics.get('LARGEST_CONTENTFUL_PAINT', {}).get('status')
            },
            "inp": {
                "score": metrics.get('INTERACTION_TO_NEXT_PAINT', {}).get('score'),
                "value": metrics.get('INTERACTION_TO_NEXT_PAINT', {}).get('value'),
                "display_value": metrics.get('INTERACTION_TO_NEXT_PAINT', {}).get('display_value'),
                "status": metrics.get('INTERACTION_TO_NEXT_PAINT', {}).get('status')
            },
            "cls": {
                "score": metrics.get('CUMULATIVE_LAYOUT_SHIFT', {}).get('score'),
                "value": metrics.get('CUMULATIVE_LAYOUT_SHIFT', {}).get('value'),
                "display_value": metrics.get('CUMULATIVE_LAYOUT_SHIFT', {}).get('display_value'),
                "status": metrics.get('CUMULATIVE_LAYOUT_SHIFT', {}).get('status')
            }
        },
        "recommendations": recommendations # Include all recommendations in JSON, top 5 for human-readable
    }

    return human_readable_summary, json.dumps(json_output, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 parse_results.py <path_to_lighthouse_json_report>")
        sys.exit(1)

    report_path = sys.argv[1]
    
    try:
        human_summary, json_summary = parse_lighthouse_report(report_path)
        print(human_summary)
        print("\n--- JSON Output ---\n")
        print(json_summary)
    except FileNotFoundError:
        print(f"Error: Report file not found at {report_path}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {report_path}. Is it a valid Lighthouse JSON report?")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)
