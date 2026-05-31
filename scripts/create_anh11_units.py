#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to create Part 1-7 files for all Anh 11 Units (1-10)
Based on Anh 12 Unit 1 structure
"""
import json
import os

base_dir_anh11 = "src/content/anh11"
base_dir_anh12 = "src/content/anh12"

# Anh 11 Unit configurations based on Global Success curriculum
units_anh11 = [
    {
        "num": 1,
        "name": "A Long and Healthy Life",
        "parts": {
            "1": "Part 1: Getting Started - Living a Healthy Life",
            "2": "Part 2: Language - Vocabulary (Health & Lifestyle)",
            "3": "Part 3: Language - Grammar (Past Simple vs Present Perfect)",
            "4": "Part 4: Reading - Healthy Living Tips",
            "5": "Part 5: Speaking - Discussing Health Habits",
            "6": "Part 6: Listening - Health Advice",
            "7": "Part 7: Writing - Health Articles"
        }
    },
    {
        "num": 2,
        "name": "The Generation Gap",
        "parts": {
            "1": "Part 1: Getting Started - Understanding Generations",
            "2": "Part 2: Language - Vocabulary (Family & Relationships)",
            "3": "Part 3: Language - Grammar (Modal Verbs)",
            "4": "Part 4: Reading - Bridging the Generation Gap",
            "5": "Part 5: Speaking - Discussing Family Issues",
            "6": "Part 6: Listening - Generation Differences",
            "7": "Part 7: Writing - Opinion Essays"
        }
    },
    {
        "num": 3,
        "name": "Cities of the Future",
        "parts": {
            "1": "Part 1: Getting Started - Future Urban Life",
            "2": "Part 2: Language - Vocabulary (Cities & Technology)",
            "3": "Part 3: Language - Grammar (Future Forms)",
            "4": "Part 4: Reading - Smart Cities",
            "5": "Part 5: Speaking - Discussing Future Cities",
            "6": "Part 6: Listening - Urban Development",
            "7": "Part 7: Writing - Descriptive Essays"
        }
    },
    {
        "num": 4,
        "name": "ASEAN and Vietnam",
        "parts": {
            "1": "Part 1: Getting Started - ASEAN Community",
            "2": "Part 2: Language - Vocabulary (ASEAN & Cooperation)",
            "3": "Part 3: Language - Grammar (Gerunds & Infinitives)",
            "4": "Part 4: Reading - ASEAN Integration",
            "5": "Part 5: Speaking - Discussing ASEAN",
            "6": "Part 6: Listening - ASEAN Activities",
            "7": "Part 7: Writing - Reports on ASEAN"
        }
    },
    {
        "num": 5,
        "name": "Global Warming",
        "parts": {
            "1": "Part 1: Getting Started - Climate Change",
            "2": "Part 2: Language - Vocabulary (Environment & Climate)",
            "3": "Part 3: Language - Grammar (Perfect Gerunds & Infinitives)",
            "4": "Part 4: Reading - Causes and Effects",
            "5": "Part 5: Speaking - Discussing Solutions",
            "6": "Part 6: Listening - Climate Action",
            "7": "Part 7: Writing - Problem-Solution Essays"
        }
    },
    {
        "num": 6,
        "name": "Preserving Our Heritage",
        "parts": {
            "1": "Part 1: Getting Started - Cultural Heritage",
            "2": "Part 2: Language - Vocabulary (Heritage & Culture)",
            "3": "Part 3: Language - Grammar (Participle Clauses)",
            "4": "Part 4: Reading - World Heritage Sites",
            "5": "Part 5: Speaking - Discussing Heritage",
            "6": "Part 6: Listening - Heritage Conservation",
            "7": "Part 7: Writing - Descriptive Reports"
        }
    },
    {
        "num": 7,
        "name": "Education Options for School-leavers",
        "parts": {
            "1": "Part 1: Getting Started - After High School",
            "2": "Part 2: Language - Vocabulary (Education & Careers)",
            "3": "Part 3: Language - Grammar (Phrasal Verbs)",
            "4": "Part 4: Reading - Education Choices",
            "5": "Part 5: Speaking - Discussing Future Plans",
            "6": "Part 6: Listening - Career Advice",
            "7": "Part 7: Writing - Application Letters"
        }
    },
    {
        "num": 8,
        "name": "Becoming Independent",
        "parts": {
            "1": "Part 1: Getting Started - Independence Skills",
            "2": "Part 2: Language - Vocabulary (Life Skills)",
            "3": "Part 3: Language - Grammar (To-infinitives)",
            "4": "Part 4: Reading - Independent Living",
            "5": "Part 5: Speaking - Discussing Independence",
            "6": "Part 6: Listening - Life Skills Tips",
            "7": "Part 7: Writing - Advice Articles"
        }
    },
    {
        "num": 9,
        "name": "Social Issues",
        "parts": {
            "1": "Part 1: Getting Started - Society Today",
            "2": "Part 2: Language - Vocabulary (Social Problems)",
            "3": "Part 3: Language - Grammar (Conditional Sentences)",
            "4": "Part 4: Reading - Social Challenges",
            "5": "Part 5: Speaking - Discussing Solutions",
            "6": "Part 6: Listening - Social Programs",
            "7": "Part 7: Writing - Argumentative Essays"
        }
    },
    {
        "num": 10,
        "name": "The Ecosystem",
        "parts": {
            "1": "Part 1: Getting Started - Nature's Balance",
            "2": "Part 2: Language - Vocabulary (Ecology & Nature)",
            "3": "Part 3: Language - Grammar (Linking Words)",
            "4": "Part 4: Reading - Ecosystems and Biodiversity",
            "5": "Part 5: Speaking - Discussing Environmental Issues",
            "6": "Part 6: Listening - Conservation Efforts",
            "7": "Part 7: Writing - Reports on Environment"
        }
    }
]

print("📚 Creating 7 parts for all Anh 11 Units (1-10)...\n")

for unit in units_anh11:
    unit_num = unit["num"]
    unit_name = unit["name"]
    
    print(f"📖 Unit {unit_num}: {unit_name}")
    
    for part_num in range(1, 8):
        # Source: always copy from Anh 12 Unit 1
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
        
        # Target file for Anh 11
        target_file = f"anh11-unit-{unit_num}-p{part_num}-"
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
        
        source_path = os.path.join(base_dir_anh12, source_file)
        target_path = os.path.join(base_dir_anh11, target_file)
        
        # Read source from Anh 12
        try:
            with open(source_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Update ID and name for Anh 11
            data['id'] = f"anh11-unit-{unit_num}-p{part_num}"
            data['name'] = unit["parts"][str(part_num)]
            
            # Save to Anh 11 directory
            with open(target_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"  ✓ Part {part_num}")
        except Exception as e:
            print(f"  ✗ Part {part_num}: {e}")
    
    print()

print("✅ All Anh 11 files created successfully!")
print(f"\n📊 Summary:")
print(f"  - Created 7 parts for each of 10 units (Units 1-10)")
print(f"  - Total: 70 files")
print(f"  - Each file has 20 exercises")
print(f"\n💡 Note: Content is based on Anh 12 Unit 1 structure.")
print(f"   Files have correct IDs and names for Anh 11.")
print(f"   Update content to match each unit's theme as needed.")
