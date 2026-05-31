#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import shutil
import os

# Mapping: copy from Unit 1 to Unit 3
files_to_copy = [
    ("anh12-unit-1-p2-vocabulary.json", "anh12-unit-3-p2-vocabulary.json"),
    ("anh12-unit-1-p3-grammar.json", "anh12-unit-3-p3-grammar.json"),
    ("anh12-unit-1-p4-reading.json", "anh12-unit-3-p4-reading.json"),
    ("anh12-unit-1-p5-speaking.json", "anh12-unit-3-p5-speaking.json"),
    ("anh12-unit-1-p6-listening.json", "anh12-unit-3-p6-listening.json"),
    ("anh12-unit-1-p7-writing.json", "anh12-unit-3-p7-writing.json"),
]

base_dir = "src/content/anh12"

for source_file, target_file in files_to_copy:
    source_path = os.path.join(base_dir, source_file)
    target_path = os.path.join(base_dir, target_file)
    
    # Read source
    with open(source_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Modify IDs and names for Unit 3
    part_num = target_file.split('-p')[1].split('-')[0]
    data['id'] = f"anh12-unit-3-p{part_num}"
    
    # Update names based on part
    name_mapping = {
        "2": "Part 2: Language - Vocabulary",
        "3": "Part 3: Language - Grammar (Phrasal Verbs & Which)",
        "4": "Part 4: Reading - Green Living Texts",
        "5": "Part 5: Speaking - Discussing Environmental Issues",
        "6": "Part 6: Listening - Green Living Tips",
        "7": "Part 7: Writing - Environmental Proposals"
    }
    
    data['name'] = name_mapping.get(part_num, data['name'])
    
    # Save to target
    with open(target_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Created {target_file}")

print("\n✅ All 6 files created successfully!")
print("Note: Content is copied from Unit 1. You need to update the content to match Green Living theme.")
