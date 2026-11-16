# Usage: python note.py "One plain line saying what changed for the person using the app."
# Stamps version.json (so open apps notice the new page) and adds the line to What's new.
import json, sys, datetime
v = json.load(open("version.json"))
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
v["web"] = now
if len(sys.argv) > 1 and sys.argv[1].strip():
    v["notes"] = ([{"at": now, "text": sys.argv[1].strip()[:200]}] + v.get("notes", []))[:30]
json.dump(v, open("version.json", "w"), separators=(",", ":"))
print("stamped", now, "notes", len(v.get("notes", [])))
