#!/usr/bin/env python3
"""
GLM-5.3 Development Assistant for NYAAY Legal App
Powered by NVIDIA NIM API & GLM-5.3 Reasoning Models.

Usage:
  # Interactive developer chat:
  python tools/glm_dev.py

  # Direct question:
  python tools/glm_dev.py "How do I add a new filter in CaseListPage.tsx?"

  # Inspect or refactor a specific file:
  python tools/glm_dev.py --file src/App.tsx "Analyze state management and suggest improvements"

  # Review uncommitted git changes:
  python tools/glm_dev.py --review

  # Use the flagship heavy model (z-ai/glm-5.3):
  python tools/glm_dev.py --model full "Design a real-time cause list sync architecture"
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path
from openai import OpenAI

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

DEFAULT_API_KEY = "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"
BASE_URL = "https://integrate.api.nvidia.com/v1"

def load_api_key():
    # 1. Environment variable
    key = os.environ.get("NVIDIA_API_KEY") or os.environ.get("VITE_NVIDIA_API_KEY")
    if key:
        return key

    # 2. .env file in workspace
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if env_file.exists():
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("NVIDIA_API_KEY="):
                        return line.split("=", 1)[1].strip()
                    if line.startswith("VITE_NVIDIA_API_KEY="):
                        return line.split("=", 1)[1].strip()
        except Exception:
            pass

    return DEFAULT_API_KEY

def get_git_diff():
    try:
        diff = subprocess.check_output(["git", "diff", "HEAD"], text=True, stderr=subprocess.DEVNULL)
        if not diff.strip():
            # Check staged
            diff = subprocess.check_output(["git", "diff", "--cached"], text=True, stderr=subprocess.DEVNULL)
        return diff
    except Exception as e:
        return f"Error retrieving git diff: {e}"

def ask_glm(client, model, messages, show_thinking=False, max_tokens=4096):
    print(f"\n[Consulting {model}...]", flush=True)
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_tokens=max_tokens,
            stream=False
        )
        msg = completion.choices[0].message
        reasoning = getattr(msg, "reasoning_content", None)
        content = msg.content or ""

        if show_thinking and reasoning:
            print("\n" + "=" * 50)
            print("🧠 THINKING PROCESS:")
            print("=" * 50)
            print(reasoning.strip())
            print("=" * 50 + "\n")

        return content, reasoning
    except Exception as e:
        print(f"\n❌ Error calling NVIDIA API: {e}", file=sys.stderr)
        return None, None

def interactive_session(client, model, show_thinking=False):
    print("\n" + "=" * 60)
    print("🚀 NYAAY GLM-5.3 Development Assistant")
    print(f"Model: {model}")
    print("Commands: 'exit' or 'quit' to exit | 'think' to toggle reasoning")
    print("=" * 60 + "\n")

    history = [
        {
            "role": "system",
            "content": (
                "You are an expert senior full-stack AI software engineer assisting in developing "
                "the NYAAY Legal Application (React 19, TypeScript, Vite, Tailwind CSS 4, Firebase Firestore/Auth). "
                "Provide accurate, production-ready, clean code and actionable solutions."
            )
        }
    ]

    while True:
        try:
            user_input = input("\n👨‍💻 You: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit", "q"):
                print("Exiting GLM Dev Assistant. Happy coding!")
                break
            if user_input.lower() == "think":
                show_thinking = not show_thinking
                print(f"[Thinking process display: {'ON' if show_thinking else 'OFF'}]")
                continue

            history.append({"role": "user", "content": user_input})
            content, _ = ask_glm(client, model, history, show_thinking=show_thinking)
            if content:
                print(f"\n🤖 GLM-5.3:\n{content}")
                history.append({"role": "assistant", "content": content})
        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break

def main():
    parser = argparse.ArgumentParser(description="GLM-5.3 AI Developer Assistant for NYAAY")
    parser.add_argument("prompt", nargs="*", help="Optional direct prompt to ask")
    parser.add_argument("--model", choices=["flash", "full"], default="flash",
                        help="Model choice: 'flash' (z-ai/glm-5.3-flash, fast ~20s) or 'full' (z-ai/glm-5.3, deep reasoning)")
    parser.add_argument("--file", "-f", help="Path to code file to attach into prompt context")
    parser.add_argument("--review", action="store_true", help="Review current uncommitted git diff")
    parser.add_argument("--thinking", "-t", action="store_true", help="Print reasoning thought process")
    args = parser.parse_args()

    api_key = load_api_key()
    client = OpenAI(base_url=BASE_URL, api_key=api_key)

    model_name = "z-ai/glm-5.3" if args.model == "full" else "z-ai/glm-5.3-flash"

    # 1. Review mode
    if args.review:
        diff = get_git_diff()
        if not diff.strip():
            print("No uncommitted changes detected in git.")
            return
        prompt_text = (
            "Please review the following git diff for bugs, edge cases, regressions, performance issues, "
            "and code style. Provide actionable, concise recommendations:\n\n```diff\n"
            f"{diff[:20000]}\n```"
        )
        content, _ = ask_glm(
            client,
            model_name,
            [
                {"role": "system", "content": "You are a senior code reviewer for TypeScript and React."},
                {"role": "user", "content": prompt_text}
            ],
            show_thinking=args.thinking
        )
        if content:
            print("\n" + "=" * 50)
            print("🔍 CODE REVIEW REPORT:")
            print("=" * 50)
            print(content)
        return

    # 2. File context mode
    context_prefix = ""
    if args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"File not found: {args.file}", file=sys.stderr)
            return
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            code = f.read()
        context_prefix = f"Context file ({file_path.name}):\n```\n{code[:25000]}\n```\n\n"

    # 3. Direct prompt
    if args.prompt:
        user_prompt = " ".join(args.prompt)
        full_query = context_prefix + user_prompt
        content, _ = ask_glm(
            client,
            model_name,
            [
                {"role": "system", "content": "You are a senior software engineer for NYAAY (React 19 + TypeScript + Firebase)."},
                {"role": "user", "content": full_query}
            ],
            show_thinking=args.thinking
        )
        if content:
            print(f"\n🤖 GLM-5.3:\n{content}")
        return

    # 4. Interactive session
    interactive_session(client, model_name, show_thinking=args.thinking)

if __name__ == "__main__":
    main()
