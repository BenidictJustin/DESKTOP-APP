import React from 'react';

/**
 * NavigationPane — Shows document headings for quick navigation.
 */
export default function NavigationPane({ show, editor }) {
  if (!show || !editor) return null;

  const headings = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({ level: node.attrs.level, text: node.textContent, pos });
    }
  });

  return (
    <div className="w-52 bg-white border-r border-gray-200 shrink-0 overflow-y-auto p-3">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
        Navigation
      </h3>
      {headings.length > 0 ? (
        <div className="space-y-0.5">
          {headings.map((h, i) => (
            <button
              key={i}
              onClick={() => editor.chain().focus().setTextSelection(h.pos).run()}
              className="w-full text-left text-[10px] text-gray-700 hover:text-blue-600 hover:bg-blue-50 py-1 px-1 truncate cursor-pointer rounded transition"
              style={{ paddingLeft: `${(h.level - 1) * 12 + 4}px` }}
            >
              <span className="text-[8px] text-gray-400 font-bold mr-1">H{h.level}</span>
              {h.text || '(empty heading)'}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-400 italic">
          No headings yet. Add headings to see the outline.
        </p>
      )}
    </div>
  );
}
