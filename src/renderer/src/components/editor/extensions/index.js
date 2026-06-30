import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import FontSize from './FontSize';
import PageFlow from './PageFlow';

/**
 * Returns the full array of TipTap extensions for the document editor.
 */
export function getEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    FontFamily.configure({ types: ['textStyle'] }),
    Color.configure({ types: ['textStyle'] }),
    FontSize,
    Highlight.configure({ multicolor: true }),
    TiptapImage.configure({
      inline: false,
      allowBase64: true,
      acceptMimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      multiple: false,
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'doc-link' },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Subscript,
    Superscript,
    CharacterCount,
    Placeholder.configure({
      placeholder: 'Start typing your document…',
    }),
    PageFlow,
  ];
}

