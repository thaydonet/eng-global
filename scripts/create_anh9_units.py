import json
import os

# Template file path
TEMPLATE_FILE = "src/content/anh12/anh12-unit-1-p1-getting-started.json"

# Output directory
OUTPUT_DIR = "src/content/anh9"

# Anh 9 Units configuration
UNITS = [
    {
        "number": 1,
        "slug": "local-community",
        "name": "Local Community"
    },
    {
        "number": 2,
        "slug": "city-life",
        "name": "City Life"
    },
    {
        "number": 3,
        "slug": "healthy-living-for-teens",
        "name": "Healthy Living for Teens"
    },
    {
        "number": 4,
        "slug": "remembering-the-past",
        "name": "Remembering the Past"
    },
    {
        "number": 5,
        "slug": "our-experiences",
        "name": "Our Experiences"
    },
    {
        "number": 6,
        "slug": "vietnamese-lifestyles-then-and-now",
        "name": "Vietnamese Lifestyle: Then and Now"
    },
    {
        "number": 7,
        "slug": "natural-wonders-of-the-world",
        "name": "Natural Wonders of The World"
    },
    {
        "number": 8,
        "slug": "tourism",
        "name": "Tourism"
    },
    {
        "number": 9,
        "slug": "world-englishes",
        "name": "World Englishes"
    },
    {
        "number": 10,
        "slug": "planet-earth",
        "name": "Planet Earth"
    },
    {
        "number": 11,
        "slug": "electronic-devices",
        "name": "Electronic Devices"
    },
    {
        "number": 12,
        "slug": "career-choices",
        "name": "Career Choices"
    }
]

# Parts configuration
PARTS = [
    {"number": 1, "name": "Getting Started", "subtitle": "Introduction"},
    {"number": 2, "name": "Vocabulary", "subtitle": "Key Words and Phrases"},
    {"number": 3, "name": "Grammar", "subtitle": "Language Focus"},
    {"number": 4, "name": "Reading", "subtitle": "Comprehension"},
    {"number": 5, "name": "Speaking", "subtitle": "Communication"},
    {"number": 6, "name": "Listening", "subtitle": "Audio Skills"},
    {"number": 7, "name": "Writing", "subtitle": "Composition"}
]

def load_template():
    """Load the template file"""
    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_part_file(unit, part, template):
    """Create a part file for a specific unit"""
    # Create a deep copy of template
    content = json.loads(json.dumps(template))
    
    # Update ID and name
    content["id"] = f"anh9-unit-{unit['number']}-p{part['number']}"
    content["name"] = f"Part {part['number']}: {part['name']} - {part['subtitle']}"
    
    # Update theory title to match unit theme
    content["content"]["theory"]["title"] = f"{part['name']}: {unit['name']}"
    
    # Update exercise IDs
    for i, exercise in enumerate(content["content"]["exercises"]):
        exercise["id"] = f"p{part['number']}-ex{i+1}"
    
    # Create output filename
    filename = f"anh9-unit-{unit['number']}-p{part['number']}-{part['name'].lower().replace(' ', '-')}.json"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    # Write file
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    
    return filename

def main():
    print("📚 Creating 7 parts for all Anh 9 Units (1-12)...\n")
    
    # Load template
    template = load_template()
    
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Process each unit
    for unit in UNITS:
        print(f"📖 Unit {unit['number']}: {unit['name']}")
        
        # Create 7 parts for this unit
        for part in PARTS:
            filename = create_part_file(unit, part, template)
            print(f"  ✓ Part {part['number']}")
        
        print()
    
    print("✅ All Anh 9 files created successfully!")
    print(f"📊 Summary:")
    print(f"  - Created 7 parts for each of 12 units (Units 1-12)")
    print(f"  - Total: {len(UNITS) * len(PARTS)} files")
    print(f"  - Each file has 20 exercises")
    print(f"💡 Note: Content is based on Anh 12 Unit 1 structure.")
    print(f"   Files have correct IDs and names for Anh 9.")
    print(f"   Update content to match each unit's theme as needed.")

if __name__ == "__main__":
    main()
