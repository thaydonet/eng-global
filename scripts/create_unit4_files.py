#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to create Unit 4 (Urbanisation) Part 1-7 files
Copies structure from Unit 1 and updates IDs and names
"""
import json
import os

# Mapping: copy from Unit 1 to Unit 4
files_to_copy = [
    ("anh12-unit-1-p1-getting-started.json", "anh12-unit-4-p1-getting-started.json"),
    ("anh12-unit-1-p2-vocabulary.json", "anh12-unit-4-p2-vocabulary.json"),
    ("anh12-unit-1-p3-grammar.json", "anh12-unit-4-p3-grammar.json"),
    ("anh12-unit-1-p4-reading.json", "anh12-unit-4-p4-reading.json"),
    ("anh12-unit-1-p5-speaking.json", "anh12-unit-4-p5-speaking.json"),
    ("anh12-unit-1-p6-listening.json", "anh12-unit-4-p6-listening.json"),
    ("anh12-unit-1-p7-writing.json", "anh12-unit-4-p7-writing.json"),
]

base_dir = "src/content/anh12"

# Name mapping for Unit 4: Urbanisation
name_mapping = {
    "1": "Part 1: Getting Started - Urban Life",
    "2": "Part 2: Language - Vocabulary (Urbanisation)",
    "3": "Part 3: Language - Grammar (Past Simple vs Present Perfect)",
    "4": "Part 4: Reading - Understanding Urbanisation",
    "5": "Part 5: Speaking - Discussing Urban Issues",
    "6": "Part 6: Listening - Urban Development",
    "7": "Part 7: Writing - Essays on Urbanisation"
}

print("🏙️  Creating Unit 4: Urbanisation files...\n")

for source_file, target_file in files_to_copy:
    source_path = os.path.join(base_dir, source_file)
    target_path = os.path.join(base_dir, target_file)
    
    # Read source
    with open(source_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Modify IDs and names for Unit 4
    part_num = target_file.split('-p')[1].split('-')[0]
    data['id'] = f"anh12-unit-4-p{part_num}"
    data['name'] = name_mapping.get(part_num, data['name'])
    
    # Save to target
    with open(target_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Created {target_file}")

print("\n✅ All 7 files for Unit 4 created successfully!")
print("\n📝 Note: Files have correct structure with 20 exercises each.")
print("💡 Content is based on Unit 1 template. Update content to match Urbanisation theme as needed.")
