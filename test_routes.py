#!/usr/bin/env python3
"""Test route registration."""

import sys
sys.path.insert(0, 'backend')

from app import app

print("Testing route registration...")
print(f"App name: {app.name}")
print(f"Number of routes: {len(app.url_map._rules)}")

# Check all routes
print("\nAll routes:")
for rule in sorted(app.url_map.iter_rules(), key=lambda x: x.rule):
    print(f"  {rule.rule} -> {rule.endpoint}")

# Test for root route specifically
print("\nLooking for root route...")
found_root = False
for rule in app.url_map.iter_rules():
    if rule.rule == '/':
        print(f"Found root route: {rule.rule} -> {rule.endpoint}")
        found_root = True
        break

if not found_root:
    print("Root route NOT found!")
