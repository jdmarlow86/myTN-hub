East Tennessee Hub (myTN)

An agentic program that routes user intentions to category-specific agents and stores neat local action receipts.

Categories

TA: IT Agent

SA: Sales Agent

PA: Press Agent

FA: Farming Agent

WA: Wildlife Agent

CA: Church Agent

JA: Job Agent

ArA: Arts Agent

RA: Recreation Agent


Requirements

Python 3.10+

Recommended: a virtual environment (venv)


Install

# from the project root
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

Run (CLI)

python main.py

Commands:

run  → select an intention & goal

list → view recent receipts

quit → exit



---

Web UI

A simple web interface is included for non‑technical users. It auto‑selects a category based on the user’s intent (no manual category pickers).

Start the Web UI

# Option A (common): run the provided script
python webui.py

# Option B (if using Uvicorn/FastAPI style)
uvicorn webui:app --reload --port 8000

By default the app serves at:

http://localhost:8000 (or the port you set)


> If you’re using Flask, you can also do:

flask --app webui run --debug --port=8000



Using the Web UI (Step‑by‑step)

1. Open the site
Visit http://localhost:8000.


2. Enter your intention
In the main input box, briefly describe what you want to do (e.g., “help me fix Wi‑Fi on Windows 11” or “find weekend family events in Knoxville”).

The app infers the best category (e.g., IT, Recreation) automatically.

You can optionally provide a goal or extra context in the “Details/Goal” area.



3. Submit
Click Run. The hub will:

Detect intent → route to the matching agent (TA/SA/PA/FA/WA/CA/JA/ArA/RA).

Execute the agent workflow.

Create a receipt (a compact summary of the action taken and results).



4. View results
The results panel shows the agent’s response. If the agent performed multiple steps, you’ll see a short step log and the final summary.


5. Save & review receipts

Each run stores a receipt automatically.

Click Receipts (top/right menu or tab) to view recent receipts.

Use Search to filter by keywords, inferred category, or date.



6. Run again or refine

Use Refine on the result to tweak your intent (e.g., “make it budget‑friendly”).

Or press New Request to start over.




Tips

Short and clear intentions improve the auto‑category selection.

Add location hints (“near Oak Ridge” or “in Knox County”) when relevant.

Use Receipts → Export to download results (CSV/JSON) if the export button is present in your build.


Web UI Shortcuts & Buttons (if present)

New Request: clears the form.

Refine: pre‑fills a new prompt with the previous result context.

Receipts: opens the receipts list.

Export: downloads your receipts.

Help: quick usage tips and examples.


Troubleshooting

Nothing loads at /: confirm the server log shows it’s listening on :8000 (or your chosen port).

Port in use: run with another port, e.g. --port 8010.

Auto‑category feels off: try a clearer intention (“I need to… because… in … county”).

Receipts not persisting: ensure the app can write to its data/ (or configured storage) directory.



---

Configuration (optional)

PORT: set PORT=8000 (or any free port) if your host requires it.

DATA_DIR: change where receipts are stored.

LOG_LEVEL: INFO or DEBUG for more verbose logs.


Example:

export PORT=8010
export DATA_DIR=./data
export LOG_LEVEL=DEBUG
python webui.py


---

Example Intents

IT (TA): “Diagnose slow Wi‑Fi and suggest fixes for Windows 11.”

Recreation (RA): “Plan a Saturday picnic with easy hikes within 30 miles.”

Church (CA): “Draft a bulletin announcement for this Sunday.”

Farming (FA): “Planting guide for fall crops in East Tennessee.”

Jobs (JA): “Find entry‑level IT roles and prep a quick cover letter.”



---

Development

Keep UI text simple and large enough for non‑technical readers.

The router should remain category‑agnostic; rely on intent detection.

Receipts are append‑only; prefer small, readable summaries with links to any longer artifacts.



---

