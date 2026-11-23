#!/bin/bash
cd /tmp/claude-0/-home-claude/6344f15e-4e1e-5e43-ac0a-3b0b502f3398/scratchpad/site/out
curl -s -o /dev/null http://127.0.0.1:8765/ || (python3 -m http.server 8765 >/dev/null 2>&1 &)
sleep 1
