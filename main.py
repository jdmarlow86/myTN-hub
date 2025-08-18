import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from hub_config import APP_NAME, APP_ALIAS, INTENT_ALIASES, AGENT_LABELS
from agents import REGISTRY

RECEIPTS_DIR = "receipts"
RECEIPTS_FILE = os.path.join(RECEIPTS_DIR, "action_receipts.jsonl")
TZ = ZoneInfo("America/New_York")

def ensure_receipts():
    os.makedirs(RECEIPTS_DIR, exist_ok=True)
    if not os.path.exists(RECEIPTS_FILE):
        open(RECEIPTS_FILE, "a", encoding="utf-8").close()

def normalize_intent(user_intent: str) -> str | None:
    key = user_intent.strip().lower()
    return INTENT_ALIASES.get(key)

def pick_agent(intent_code: str, goal: str):
    agent_cls = REGISTRY.get(intent_code)
    if not agent_cls:
        raise ValueError(f"No agent registered for intent {intent_code}")
    return agent_cls(goal)

def store_action_receipt(intent_code: str, user_goal: str, result_summary: str, data: dict | None):
    ensure_receipts()
    now = datetime.now(TZ).isoformat()
    record = {
        "timestamp": now,
        "app": APP_NAME,
        "alias": APP_ALIAS,
        "agent_code": intent_code,
        "agent_label": AGENT_LABELS.get(intent_code, intent_code),
        "user_goal": user_goal,
        "result_summary": result_summary,
        "data": data or {},
    }
    with open(RECEIPTS_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record

def print_receipt_pretty(record: dict):
    print("\n=== Action Receipt ===")
    print(f" Time:        {record['timestamp']}")
    print(f" App/Alias:   {record['app']} ({record['alias']})")
    print(f" Agent:       {record['agent_label']} [{record['agent_code']}]")
    print(f" Intent/Goal: {record['user_goal']}")
    print(f" Result:      {record['result_summary']}")
    print(' Data:        ', json.dumps(record.get('data', {}), indent=2, ensure_ascii=False))
    print("======================\n")

def list_receipts(limit: int = 10):
    if not os.path.exists(RECEIPTS_FILE):
        print("No receipts yet.")
        return
    print(f"\nLast {limit} receipts:\n")
    lines = []
    with open(RECEIPTS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                lines.append(json.loads(line))
    for rec in lines[-limit:]:
        print(f"- [{rec['timestamp']}] {rec['agent_label']} • {rec['result_summary']} • Goal: {rec['user_goal']}")
    print()

def main():
    print(f"{APP_NAME} ({APP_ALIAS})")
    print("Welcome! Choose an intention (category) then describe your goal.")
    print("Categories:", ", ".join([f"{k}:{v}" for k, v in AGENT_LABELS.items()]))

    while True:
        cmd = input("\nCommand ([run]/list/quit): ").strip().lower() or "run"
        if cmd in ("quit", "q", "exit"):
            break
        if cmd == "list":
            try:
                n = int(input("Show how many? [10]: ") or "10")
            except ValueError:
                n = 10
            list_receipts(n)
            continue

        # RUN FLOW
        intent_raw = input("Intention (e.g., it/sales/press/farm/wildlife/church/job/arts/recreation): ")
        intent_code = normalize_intent(intent_raw)
        if not intent_code:
            print("Sorry, I didn't recognize that intention. Try again.")
            continue

        user_goal = input("Briefly describe your goal/intention: ").strip()
        if not user_goal:
            print("Please enter a brief goal.")
            continue

        # Dispatch to agent
        agent = pick_agent(intent_code, user_goal)
        result = agent.run()

        # Store receipt
        record = store_action_receipt(
            intent_code=intent_code,
            user_goal=user_goal,
            result_summary=result.summary,
            data=result.data if result.success else {"error": True},
        )

        # Show result + receipt
        status = "✅ Success" if result.success else "❌ Failed"
        print(f"\n{status}: {result.summary}")
        if result.data:
            print("Result data:", json.dumps(result.data, indent=2, ensure_ascii=False))
        print_receipt_pretty(record)

if __name__ == "__main__":
    main()
