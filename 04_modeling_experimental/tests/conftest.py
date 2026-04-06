from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent
SRC = ROOT / "src"
BACKEND = REPO_ROOT / "03_application" / "backend"

for path in (SRC, BACKEND):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))
