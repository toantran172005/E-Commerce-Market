#!/usr/bin/env python3
"""
Zero-dependency DeepSeek runner for APEX-ORCHESTRATOR.
Standard library only: urllib.request, json, os, sys, time, argparse, pathlib.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def load_env():
    """Load environment variables from nearest .env file without external dependencies."""
    candidates = [
        Path.cwd() / ".env",
        Path.cwd() / "ECommerceApp" / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent / "ECommerceApp" / ".env",
    ]
    for env_path in candidates:
        if env_path.is_file():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ and v:
                                os.environ[k] = v
                break
            except Exception:
                pass

def get_api_key():
    load_env()
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key or key == "your_deepseek_api_key_here":
        print("ERROR: DEEPSEEK_API_KEY is missing or invalid in .env / environment variables.", file=sys.stderr)
        sys.exit(1)
    return key

def call_deepseek_api(prompt: str, system_prompt: str = "", model: str = "deepseek-reasoner", max_retries: int = 5):
    api_key = get_api_key()
    url = "https://api.deepseek.com/chat/completions"

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2 if "reasoner" not in model else 1.0,
        "stream": False
    }

    req_data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    for attempt in range(1, max_retries + 1):
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                choice = data.get("choices", [{}])[0]
                msg = choice.get("message", {})
                reasoning = msg.get("reasoning_content", "")
                content = msg.get("content", "")
                if reasoning:
                    print("\n[DEEPSEEK REASONING LOG]:", file=sys.stderr)
                    print(reasoning[:500] + "..." if len(reasoning) > 500 else reasoning, file=sys.stderr)
                usage = data.get("usage", {})
                if usage:
                    print("\n[DEEPSEEK TOKEN USAGE]:", file=sys.stderr)
                    print(f"  - Prompt Tokens:     {usage.get('prompt_tokens', 0):,}", file=sys.stderr)
                    print(f"  - Completion Tokens: {usage.get('completion_tokens', 0):,}", file=sys.stderr)
                    details = usage.get("completion_tokens_details") or {}
                    if details.get("reasoning_tokens"):
                        print(f"    * Reasoning Tokens: {details.get('reasoning_tokens'):,}", file=sys.stderr)
                    print(f"  - Total Tokens:      {usage.get('total_tokens', 0):,}", file=sys.stderr)
                return content
        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8")
            except Exception:
                pass
            status = e.code
            print(f"[Warning] HTTP {status} (attempt {attempt}/{max_retries}): {err_body}", file=sys.stderr)
            if status in (429, 500, 502, 503, 504) and attempt < max_retries:
                wait_time = 2 ** attempt
                time.sleep(wait_time)
                continue
            raise RuntimeError(f"DeepSeek API failed with status {status}: {err_body}")
        except Exception as e:
            print(f"[Warning] Network error (attempt {attempt}/{max_retries}): {e}", file=sys.stderr)
            if attempt < max_retries:
                time.sleep(2 ** attempt)
                continue
            raise

def main():
    parser = argparse.ArgumentParser(description="Call DeepSeek API for code generation and analysis.")
    parser.add_argument("--prompt-file", required=True, help="Path to the markdown or text prompt file")
    parser.add_argument("--context-files", nargs="*", default=[], help="Optional list of context files to append")
    parser.add_argument("--out", help="Optional path to save output code/response")
    parser.add_argument("--model", default=None, help="Model name (defaults to env DEEPSEEK_MODEL or deepseek-reasoner)")
    args = parser.parse_args()

    load_env()
    model = args.model or os.environ.get("DEEPSEEK_MODEL", "deepseek-reasoner")

    prompt_path = Path(args.prompt_file)
    if not prompt_path.is_file():
        print(f"ERROR: Prompt file not found: {prompt_path}", file=sys.stderr)
        sys.exit(1)

    prompt = prompt_path.read_text(encoding="utf-8")

    if args.context_files:
        prompt += "\n\n=== ADDITIONAL CONTEXT FILES ===\n"
        for cpath in args.context_files:
            cp = Path(cpath)
            if cp.is_file():
                prompt += f"\n--- File: {cpath} ---\n```\n{cp.read_text(encoding='utf-8')}\n```\n"

    system_prompt = (
        "You are an expert principal software engineer. Provide complete, production-ready, "
        "idiomatic code. Always include relative file paths formatted as markdown headers or comments, "
        "and never truncate code or use '// TODO' comments."
    )

    try:
        result = call_deepseek_api(prompt=prompt, system_prompt=system_prompt, model=model)
        if args.out:
            out_p = Path(args.out)
            out_p.parent.mkdir(parents=True, exist_ok=True)
            out_p.write_text(result, encoding="utf-8")
            print(f"Output saved to {args.out}")
        else:
            print(result)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
