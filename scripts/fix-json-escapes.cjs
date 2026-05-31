const fs = require('fs');
const path = require('path');

const lessonsDir = path.join(__dirname, '..', 'bai-hoc');

// Files with errors from the log
const errorFiles = [
  'toan10-bpt-bac-nhat-hai-an.json',
  'toan10-ham-so-bac-hai.json',
  'toan10-ham-so-do-thi.json',
  'toan10-he-bpt-bac-nhat-hai-an.json',
  'toan10-he-thuc-luong-tam-giac.json',
  'toan10-hoan-vi-chinh-hop-to-hop.json',
  'toan10-phep-toan-tap-hop.json',
  'toan10-phuong-trinh-duong-tron.json',
  'toan10-so-dac-trung-xu-the.json',
];

function fixJsonFile(filename) {
  const filePath = path.join(lessonsDir, filename);
  console.log(`\n📝 Processing: ${filename}`);

  try {
    // Read file
    let content = fs.readFileSync(filePath, 'utf-8');

    // Try to parse
    try {
      JSON.parse(content);
      console.log(`  ✅ Already valid JSON`);
      return true;
    } catch (parseError) {
      console.log(`  ❌ Parse error: ${parseError.message}`);

      // Create backup
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, content);
        console.log(`  💾 Backup created`);
      }

      // Extract error location
      const match = parseError.message.match(/position (\d+)|line (\d+) column (\d+)/);
      if (match) {
        const pos = match[1] ? parseInt(match[1]) : null;
        const line = match[2] ? parseInt(match[2]) : null;
        const col = match[3] ? parseInt(match[3]) : null;

        if (pos) {
          const snippet = content.substring(Math.max(0, pos - 100), Math.min(content.length, pos + 100));
          const errorChar = content[pos];
          console.log(`  📍 Error at position ${pos}`);
          console.log(`  Character: "${errorChar}" (code: ${errorChar?.charCodeAt(0)})`);
          console.log(`  Context: ...${snippet}...`);
        }
      }

      // Common fix: Replace single backslashes with double backslashes in string values
      // But we need to be careful not to double-escape already escaped characters

      console.log(`  🔧 Attempting automatic fix...`);

      // Read the file and fix common LaTeX escape issues
      // Replace \f with \\f, \s with \\s, etc. (common in LaTeX)
      let fixed = content;

      // Fix common problematic escapes in JSON strings
      // Look for patterns like "...\x..." where x is not a valid escape character
      const invalidEscapes = /\\([^"\\\/bfnrtu])/g;

      fixed = fixed.replace(invalidEscapes, (match, char) => {
        // If it's likely LaTeX, double escape it
        if (char.match(/[a-zA-Z{}()[\]]/)) {
          return '\\\\' + char;
        }
        return match;
      });

      // Try parsing the fixed version
      try {
        JSON.parse(fixed);
        fs.writeFileSync(filePath, fixed);
        console.log(`  ✅ Fixed and saved!`);
        return true;
      } catch (secondError) {
        console.log(`  ❌ Auto-fix failed: ${secondError.message}`);
        console.log(`  ℹ️  Manual editing required`);
        console.log(`  ℹ️  Backup available at: ${backupPath}`);
        return false;
      }
    }
  } catch (error) {
    console.log(`  ❌ Error reading file: ${error.message}`);
    return false;
  }
}

console.log('═══════════════════════════════════════');
console.log('🔧 JSON Escape Character Fixer');
console.log('═══════════════════════════════════════');

let successCount = 0;
let failCount = 0;

errorFiles.forEach(file => {
  const success = fixJsonFile(file);
  if (success) successCount++;
  else failCount++;
});

console.log('\n═══════════════════════════════════════');
console.log(`📊 Results:`);
console.log(`  ✅ Fixed: ${successCount}`);
console.log(`  ❌ Failed: ${failCount}`);
console.log(`  📁 Total: ${errorFiles.length}`);
console.log('═══════════════════════════════════════\n');
