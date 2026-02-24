#!/usr/bin/env python3
"""Quick image generation script using fal.ai API."""
import os
import sys
import json
import requests
import time
from pathlib import Path

# Load FAL_KEY from env file if not already set
if not os.environ.get("FAL_KEY"):
    env_file = Path.home() / ".clawdbot/secrets/fal.env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()

FAL_KEY = os.environ.get("FAL_KEY", "")
if not FAL_KEY:
    print("ERROR: FAL_KEY not set")
    sys.exit(1)

def generate(model_endpoint, prompt, output_path, image_size="landscape_16_9"):
    """Generate an image using fal.ai queue API."""
    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "prompt": prompt,
        "image_size": image_size,
    }
    
    # Submit to queue
    submit_url = f"https://queue.fal.run/{model_endpoint}"
    print(f"Submitting to {submit_url}...")
    r = requests.post(submit_url, headers=headers, json=payload)
    if not r.ok:
        print(f"Submit error {r.status_code}: {r.text[:300]}")
        r.raise_for_status()
    result = r.json()
    request_id = result.get("request_id")
    status_url = result.get("status_url")
    response_url = result.get("response_url")
    
    print(f"Request ID: {request_id}")
    print(f"Status URL: {status_url}")
    
    # Poll for completion
    for i in range(120):
        time.sleep(3)
        sr = requests.get(status_url, headers=headers)
        sr.raise_for_status()
        status = sr.json()
        queue_status = status.get("status", "")
        print(f"  [{i*3}s] Status: {queue_status}")
        if queue_status in ("COMPLETED", "completed"):
            break
        elif queue_status in ("FAILED", "failed", "ERROR", "error"):
            print(f"FAILED: {status}")
            sys.exit(1)
    
    # Get result
    rr = requests.get(response_url, headers=headers)
    rr.raise_for_status()
    result_data = rr.json()
    
    # Extract image URL
    images = result_data.get("images", [])
    if not images:
        images = result_data.get("image", [])
        if isinstance(images, dict):
            images = [images]
    
    if not images:
        print(f"No images in result: {json.dumps(result_data, indent=2)[:500]}")
        sys.exit(1)
    
    img_info = images[0]
    image_url = img_info.get("url") or img_info.get("image_url")
    print(f"Image URL: {image_url}")
    
    # Download
    img_r = requests.get(image_url)
    img_r.raise_for_status()
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(img_r.content)
    
    size = len(img_r.content)
    print(f"Saved to: {output_path} ({size:,} bytes)")
    return output_path

if __name__ == "__main__":
    model = sys.argv[1]
    prompt = sys.argv[2]
    output = sys.argv[3]
    size = sys.argv[4] if len(sys.argv) > 4 else "landscape_16_9"
    generate(model, prompt, output, size)
