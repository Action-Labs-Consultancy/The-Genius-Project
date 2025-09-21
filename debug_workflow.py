#!/usr/bin/env python3
"""
Create a simple test workflow to debug the data flow
"""

import json

# Create minimal test data
test_data = {
    "company_id": "test_123",
    "company_name": "Test Company",
    "section_number": 1,
    "section_title": "Introduction & Engagement Context",
    "section_description": "Test section description"
}

print("🧪 Test Data for Workflow:")
print(json.dumps(test_data, indent=2))

# Create a simple test prompt
test_prompt = "You are a test. Generate a short introduction for Test Company. Keep it under 100 words."

print("\n🧪 Test Prompt:")
print(test_prompt)

# Save test data
with open('test_workflow_data.json', 'w') as f:
    json.dump({
        "input_data": test_data,
        "test_prompt": test_prompt
    }, f, indent=2)

print("\n✅ Test data saved to test_workflow_data.json")
print("\n💡 This can be used to manually test the workflow nodes")
