# Quick Legacy Removal Checklist

## 🎯 What You Need to Do

### Option 1: Use the PowerShell Script (Recommended)
```powershell
# Run this in PowerShell from project root:
.\Remove-LegacyCode.ps1
```

The script will:
- ✅ Create a safety git commit
- ✅ Backup legacy files
- ✅ Search for any usage of legacy code
- ✅ Show you what would be deleted
- ✅ Delete files if you confirm

---

### Option 2: Manual Removal

#### Step 1: Delete this file
```
src/utils/conversionUtils.ts
```

#### Step 2: Edit `src/types_complete.ts` (or `src/types.ts`)
Remove these lines at the end of the file:

```typescript
// DELETE FROM LINE: "// Legacy format types for backward compatibility"
// TO END OF FILE (the LegacyResumeItem, LegacySection, LegacyResume types)
```

#### Step 3: Verify no imports exist
Run these commands to search:

```powershell
# PowerShell:
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String "conversionUtils"
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String "LegacyResume|LegacySection"
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String "treeToLegacy|legacyToTree"
```

Or in bash:
```bash
grep -r "conversionUtils" src/
grep -r "LegacyResume\|LegacySection" src/
grep -r "treeToLegacy\|legacyToTree" src/
```

#### Step 4: Test
```bash
npm run type-check
npm run build
```

#### Step 5: Commit
```bash
git add .
git commit -m "Remove legacy compatibility code"
```

---

## ⚠️ Important Note

**Before deleting conversionUtils.ts**, if you want to keep the `createDefaultTree()` function, copy it to `src/utils/treeUtils.ts` first:

```typescript
/**
 * Create a default/empty resume tree structure
 */
export function createDefaultTree(): ResumeNode[] {
  return [
    {
      uid: generateUid(),
      title: 'Contact Information',
      meta: { type: 'contact' },
      children: []
    },
    {
      uid: generateUid(),
      title: 'Professional Summary',
      meta: { type: 'section' },
      children: []
    },
    {
      uid: generateUid(),
      title: 'Work Experience',
      meta: { type: 'section' },
      children: []
    },
    {
      uid: generateUid(),
      title: 'Education',
      meta: { type: 'section' },
      children: []
    },
    {
      uid: generateUid(),
      title: 'Skills',
      meta: { type: 'section' },
      children: []
    }
  ];
}
```

---

## 📋 Verification

After removal, verify:
- [ ] No TypeScript compilation errors
- [ ] Application builds successfully
- [ ] No import errors for conversionUtils
- [ ] No references to Legacy types
- [ ] Application runs without errors

---

## 🔄 If Something Breaks

```bash
# Restore from git:
git reset --hard HEAD

# Or restore specific file:
git checkout HEAD -- src/utils/conversionUtils.ts
```

---

## 📚 More Details

See `LEGACY_REMOVAL_GUIDE.md` for comprehensive documentation.
