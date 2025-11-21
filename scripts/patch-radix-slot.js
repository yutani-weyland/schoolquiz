#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all @radix-ui/react-slot installations
const nodeModulesPath = path.join(__dirname, '..', 'node_modules', '.pnpm');
const pattern = /@radix-ui\+react-slot@[\d.]+/;

function findSlotPackages() {
  if (!fs.existsSync(nodeModulesPath)) {
    return [];
  }
  
  const entries = fs.readdirSync(nodeModulesPath);
  return entries.filter(entry => pattern.test(entry));
}

function patchFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if already correctly patched (using element.props.ref or element.props?.ref)
    // Don't patch if it already uses props.ref pattern correctly
    if (content.includes('element.props.ref') || content.includes('element.props?.ref') || 
        content.includes('children.props.ref') || content.includes('children.props?.ref')) {
      // But check if there are still problematic patterns
      if (!content.includes('children.ref') && !content.match(/[^.]\w+\.ref(?!\s*[:?])/)) {
        return false; // Already correctly patched
      }
    }
    
    // Only patch if we find the problematic pattern (direct .ref access on elements)
    // Don't patch if it's already using props.ref
    const hasProblematicPattern = content.includes('children.ref') || 
                                  (content.match(/[^.]\w+\.ref(?!\s*[:?])/) && 
                                   !content.includes('element.props.ref') && 
                                   !content.includes('element.props?.ref'));
    
    if (!hasProblematicPattern) {
      return false; // No problematic patterns found
    }
    
    // Replace children.ref with children.props?.ref (most common case)
    content = content.replace(/children\.ref/g, 'children.props?.ref');
    
    // Replace element.ref with element.props?.ref (for getElementRef function)
    // Only if it's not already using props.ref
    if (content.includes('element.ref') && !content.includes('element.props.ref') && !content.includes('element.props?.ref')) {
      content = content.replace(/element\.ref/g, 'element.props?.ref');
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Patched: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error patching ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const packages = findSlotPackages();
  let patched = 0;
  let skipped = 0;
  
  packages.forEach(pkgDir => {
    const indexPath = path.join(nodeModulesPath, pkgDir, 'node_modules', '@radix-ui', 'react-slot', 'dist', 'index.mjs');
    if (fs.existsSync(indexPath)) {
      // Skip if this is the patched version (1.2.4 with patch_hash)
      if (pkgDir.includes('patch_hash')) {
        skipped++;
        return;
      }
      if (patchFile(indexPath)) {
        patched++;
      }
    }
  });
  
  if (patched > 0) {
    console.log(`\n✅ Patched ${patched} @radix-ui/react-slot installation(s) for React 19 compatibility`);
  } else if (skipped > 0) {
    console.log(`\n✅ Skipped ${skipped} already-patched installation(s), all packages are using correct version`);
  } else {
    console.log('\n✅ All @radix-ui/react-slot packages are already patched or using correct version');
  }
}

main();

