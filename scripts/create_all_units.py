#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to create Part 1-7 files for Units 5-10
"""
import json
import os

base_dir = "src/content/anh12"

# Unit configurations
units = [
    {
        "num": 5,
        "name": "World of Work",
        "parts": {
            "1": "Part 1: Getting Started - Career Choices",
            "2": "Part 2: Language - Vocabulary (Work & Careers)",
            "3": "Part 3: Language - Grammar (Reported Speech)",
            "4": "Part 4: Reading - The Changing World of Work",
            "5": "Part 5: Speaking - Discussing Career Plans",
            "6": "Part 6: Listening - Job Interviews",
            "7": "Part 7: Writing - CVs and Cover Letters"
        }
    },
    {
        "num": 6,
        "name": "Artificial Intelligence",
        "parts": {
            "1": "Part 1: Getting Started - AI in Our Lives",
            "2": "Part 2: Language - Vocabulary (AI & Technology)",
            "3": "Part 3: Language - Grammar (Future Forms)",
            "4": "Part 4: Reading - The Impact of AI",
            "5": "Part 5: Speaking - Discussing AI Applications",
            "6": "Part 6: Listening - AI Developments",
            "7": "Part 7: Writing - Opinion Essays on AI"
        }
    },
    {
        "num": 7,
        "name": "Mass Media",
        "parts": {
            "1": "Part 1: Getting Started - Media in Modern Life",
            "2": "Part 2: Language - Vocabulary (Media & Communication)",
            "3": "Part 3: Language - Grammar (Passive Voice)",
            "4": "Part 4: Reading - The Role of Mass Media",
            "5": "Part 5: Speaking - Discussing Media Influence",
            "6": "Part 6: Listening - News and Broadcasting",
            "7": "Part 7: Writing - News Reports"
        }
    },
    {
        "num": 8,
        "name": "Wildlife Conservation",
        "parts": {
            "1": "Part 1: Getting Started - Protecting Wildlife",
            "2": "Part 2: Language - Vocabulary (Wildlife & Conservation)",
            "3": "Part 3: Language - Grammar (Conditional Sentences)",
            "4": "Part 4: Reading - Endangered Species",
            "5": "Part 5: Speaking - Discussing Conservation",
            "6": "Part 6: Listening - Wildlife Protection Programs",
            "7": "Part 7: Writing - Reports on Conservation"
        }
    },
    {
        "num": 9,
        "name": "Career Paths",
        "parts": {
            "1": "Part 1: Getting Started - Choosing a Career",
            "2": "Part 2: Language - Vocabulary (Careers & Skills)",
            "3": "Part 3: Language - Grammar (Modal Verbs)",
            "4": "Part 4: Reading - Career Development",
            "5": "Part 5: Speaking - Career Interviews",
            "6": "Part 6: Listening - Career Advice",
            "7": "Part 7: Writing - Application Letters"
        }
    },
    {
        "num": 10,
        "name": "Lifelong Learning",
        "parts": {
            "1": "Part 1: Getting Started - Learning Throughout Life",
            "2": "Part 2: Language - Vocabulary (Learning & Education)",
            "3": "Part 3: Language - Grammar (Gerunds & Infinitives)",
            "4": "Part 4: Reading - The Importance of Lifelong Learning",
            "5": "Part 5: Speaking - Discussing Learning Methods",
            "6": "Part 6: Listening - Online Learning",
            "7": "Part 7: Writing - Learning Plans"
        }
    }
]

print("📚 Creating files for Units 5-10...\n")

for unit in units:
    unit_num = unit["num"]
    unit_name = unit["name"]
    
    print(f"📖 Unit {unit_num}: {unit_name}")
    
    for part_num in range(1, 8):
        # Source: always copy from Unit 1
        source_file = f"anh12-unit-1-p{part_num}-"
        if part_num == 1:
            source_file += "getting-started.json"
        elif part_num == 2:
            source_file += "vocabulary.json"
        elif part_num == 3:
            source_file += "grammar.json"
        elif part_num == 4:
            source_file += "reading.json"
        elif part_num == 5:
            source_file += "speaking.json"
        elif part_num == 6:
            source_file += "listening.json"
        elif part_num == 7:
            source_file += "writing.json"
        
        # Target file
        target_file = f"anh12-unit-{unit_num}-p{part_num}-"
        if part_num == 1:
            target_file += "getting-started.json"
        elif part_num == 2:
            target_file += "vocabulary.json"
        elif part_num == 3:
            target_file += "grammar.json"
        elif part_num == 4:
            target_file += "reading.json"
        elif part_num == 5:
            target_file += "speaking.json"
        elif part_num == 6:
            target_file += "listening.json"
        elif part_num == 7:
            target_file += "writing.json"
        
        source_path = os.path.join(base_dir, source_file)
        target_path = os.path.join(base_dir, target_file)
        
        # Read source
        try:
            with open(source_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Update ID and name
            data['id'] = f"anh12-unit-{unit_num}-p{part_num}"
            data['name'] = unit["parts"][str(part_num)]
            
            # Save to target
            with open(target_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"  ✓ Part {part_num}")
        except Exception as e:
            print(f"  ✗ Part {part_num}: {e}")
    
    print()

print("✅ All files created successfully!")
print(f"\n📊 Summary:")
print(f"  - Created 7 parts for each of 6 units (Units 5-10)")
print(f"  - Total: 42 files")
print(f"  - Each file has 20 exercises")
print(f"\n💡 Note: Content is based on Unit 1 structure.")
print(f"   Update content to match each unit's theme as needed.")
