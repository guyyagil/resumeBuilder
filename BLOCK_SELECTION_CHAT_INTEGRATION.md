# Block Selection & Chat Integration

## 🎯 **New Functionality**

### **Block Selection System**
Users can now select specific resume blocks to provide focused context to the AI assistant.

### **Chat Integration**
Selected blocks are automatically referenced in chat conversations, enabling targeted AI assistance.

## 🔧 **Implementation Details**

### **Store Management**
```typescript
// New state in ResumeSlice
selectedBlocks: string[]; // Array of node addresses
setSelectedBlocks: (blocks: string[]) => void;
toggleBlockSelection: (blockAddr: string) => void;
clearBlockSelection: () => void;
```

### **Visual Selection System**
```typescript
// EditableNode styling
const isSelected = selectedBlocks.includes(node.addr!);
const selectedStyle = isSelected ? "border-blue-500 bg-blue-100 shadow-md" : "border-transparent";

// Selection indicator
{isSelected && (
  <div className="p-1 bg-blue-600 text-white rounded-full" title="Selected for chat">
    <CheckIcon />
  </div>
)}
```

### **Click Handling**
```typescript
// Block selection on click
onClick={(e) => {
  if (!isEditing && !e.defaultPrevented) {
    e.stopPropagation();
    toggleBlockSelection(node.addr!);
  }
}}

// Prevent selection when editing text
onClick={(e) => {
  e.stopPropagation();
  setIsEditing(true);
}}
```

## 🎨 **User Interface**

### **Block Selection Visual Feedback**
- **Selected blocks**: Blue border, blue background, checkmark icon
- **Hover states**: Subtle border and background changes
- **Selection counter**: Shows number of selected blocks

### **Manual Editor Enhancements**
```jsx
{/* Selected Blocks Indicator */}
{selectedBlocks.length > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
    <div className="flex items-center justify-between">
      <span>{selectedBlocks.length} block(s) selected</span>
      <div className="flex space-x-2">
        <button onClick={() => setShowChat(true)}>Ask AI about selection</button>
        <button onClick={clearBlockSelection}>Clear</button>
      </div>
    </div>
  </div>
)}
```

### **Chat Assistant Updates**
```jsx
// Context-aware header
<p className="text-xs text-gray-500">
  {selectedBlocks.length > 0 
    ? `${selectedBlocks.length} block(s) selected`
    : 'Writing guidance & tips'
  }
</p>

// Selected blocks indicator
{selectedBlocks.length > 0 && (
  <div className="mt-3 p-2 bg-blue-100 rounded-lg">
    <span>Focusing on selected content</span>
    <button onClick={clearBlockSelection}>Clear selection</button>
  </div>
)}
```

## 🤖 **AI Context Enhancement**

### **Selected Blocks Context**
```typescript
const getSelectedBlocksContent = (): string => {
  if (selectedBlocks.length === 0) return '';
  
  let selectedContent = '\n--- SELECTED BLOCKS FOR REFERENCE ---\n';
  selectedBlocks.forEach((addr, index) => {
    const node = getNodeByAddress(addr);
    if (node) {
      const content = node.text || node.title || '';
      selectedContent += `${index + 1}. [${node.layout}] ${content}\n`;
      
      // Include children if any
      if (node.children && node.children.length > 0) {
        selectedContent += serializeResumeForContext(node.children, 1);
      }
    }
  });
  selectedContent += '--- END SELECTED BLOCKS ---\n\n';
  return selectedContent;
};
```

### **Context-Aware Prompts**
```typescript
// Add selected blocks context to AI prompts
const selectedBlocksContent = getSelectedBlocksContent();
const fullResumeContent = currentResumeContent + selectedBlocksContent;

const guidancePrompt = PromptBuilder.buildChatPrompt(
  userMessage,
  fullResumeContent,
  resumeTitle
);
```

### **Dynamic Quick Suggestions**
```typescript
const quickSuggestions = selectedBlocks.length > 0 ? [
  "How can I improve the selected content?",
  "Suggest better wording for the selection",
  "Help me make this more impactful",
  "Rewrite this to be more professional"
] : [
  "How can I make this bullet point stronger?",
  "Suggest better action verbs",
  "Help me quantify this achievement",
  "Is this section well organized?"
];
```

## 🚀 **User Workflow**

### **Selection Process**
1. **Click blocks** in the manual editor to select them
2. **Visual feedback** - Selected blocks show blue styling and checkmark
3. **Selection counter** appears showing number of selected blocks
4. **"Ask AI about selection"** button becomes available

### **Chat Integration**
1. **Open chat assistant** (automatically or via button)
2. **Selected blocks context** is automatically included
3. **Context-aware suggestions** appear based on selection
4. **AI responses** focus on the selected content

### **Example Interaction**
```
User selects: "ניהול צוות עובדים, חלוקת משימות ובקרת איכות התוצרים"
User asks: "How can I make this more impactful?"

AI receives context:
--- SELECTED BLOCKS FOR REFERENCE ---
1. [list-item] ניהול צוות עובדים, חלוקת משימות ובקרת איכות התוצרים
--- END SELECTED BLOCKS ---

AI responds with targeted suggestions for that specific bullet point.
```

## 🎯 **Benefits**

### **Focused AI Assistance**
- **Targeted feedback** on specific content
- **Relevant suggestions** based on selected blocks
- **Efficient workflow** - no need to copy/paste content

### **Better User Experience**
- **Visual selection** makes it clear what's being discussed
- **Context preservation** - AI knows exactly what to focus on
- **Quick actions** - "Ask AI about selection" button

### **Improved Accuracy**
- **Specific context** leads to better AI responses
- **Reduced ambiguity** - AI knows which content to improve
- **Actionable suggestions** for selected content

## 🔄 **Integration with Actions**

### **Future Enhancement**
The chat assistant can generate specific actions for selected blocks:

```typescript
// AI can suggest modifications that become actions
{
  action: 'update',
  id: selectedBlockAddr,
  patch: { text: improvedContent }
}
```

This creates a seamless flow:
1. **Select blocks** → 2. **Ask AI** → 3. **Get suggestions** → 4. **Apply changes**

The block selection and chat integration provides a powerful, intuitive way for users to get targeted AI assistance on specific parts of their resume! 🎊