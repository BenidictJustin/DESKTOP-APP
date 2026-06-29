import React from 'react';
import { X } from 'lucide-react';

/**
 * CommentsPanel — Side panel for adding, viewing, resolving, and deleting comments.
 */
export default function CommentsPanel({
  show, onClose,
  comments, setComments,
  commentInput, setCommentInput,
  onAddComment,
}) {
  if (!show) return null;

  return (
    <div className="w-64 bg-white border-r border-gray-200 shrink-0 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Comments</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer transition">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add comment */}
      <div className="p-3 border-b border-gray-100">
        <textarea
          value={commentInput}
          onChange={e => setCommentInput(e.target.value)}
          placeholder="Add a comment about selected text…"
          className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-16 transition"
        />
        <button
          onClick={onAddComment}
          disabled={!commentInput.trim()}
          className="mt-1.5 w-full bg-navy-blue text-white text-[10px] font-semibold py-1.5 rounded-lg hover:bg-navy-blue/90 cursor-pointer transition disabled:opacity-50"
        >
          Post Comment
        </button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.length === 0 ? (
          <p className="text-[10px] text-gray-400 italic text-center py-4">No comments yet.</p>
        ) : (
          comments.map(c => (
            <div
              key={c.id}
              className={`bg-gray-50 rounded-xl p-2.5 border transition ${
                c.resolved ? 'opacity-50 border-gray-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-navy-blue">{c.author}</span>
                <span className="text-[9px] text-gray-400">{c.time}</span>
              </div>
              {c.selectedText && (
                <p className="text-[9px] text-gray-400 italic mb-1 truncate">"{c.selectedText}"</p>
              )}
              <p className="text-[10px] text-gray-700">{c.text}</p>

              {/* Reply section */}
              {c.replies && c.replies.length > 0 && (
                <div className="mt-2 pl-2 border-l-2 border-blue-200 space-y-1">
                  {c.replies.map((reply, i) => (
                    <div key={i} className="text-[9px] text-gray-600">
                      <span className="font-bold">{reply.author}:</span> {reply.text}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setComments(prev => prev.map(x =>
                    x.id === c.id ? { ...x, resolved: !x.resolved } : x
                  ))}
                  className="text-[9px] text-green-600 hover:underline cursor-pointer font-semibold"
                >
                  {c.resolved ? 'Unresolve' : 'Resolve'}
                </button>
                <button
                  onClick={() => {
                    const reply = window.prompt('Reply:');
                    if (reply) {
                      setComments(prev => prev.map(x =>
                        x.id === c.id
                          ? { ...x, replies: [...(x.replies || []), { author: 'You', text: reply }] }
                          : x
                      ));
                    }
                  }}
                  className="text-[9px] text-blue-600 hover:underline cursor-pointer font-semibold"
                >
                  Reply
                </button>
                <button
                  onClick={() => setComments(prev => prev.filter(x => x.id !== c.id))}
                  className="text-[9px] text-red-500 hover:underline cursor-pointer font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
