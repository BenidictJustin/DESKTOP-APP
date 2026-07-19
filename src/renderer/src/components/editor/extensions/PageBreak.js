import { Node } from '@tiptap/core';

export const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  selectable: true,

  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div.page-break',
      },
      {
        tag: 'p.page-break',
      },
      {
        tag: 'hr.page-break',
      },
      {
        tag: '[data-page-break]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'page-break', 'data-page-break': 'true', style: 'page-break-before: always; height: 1px; overflow: hidden; margin: 0; padding: 0;' }];
  },
});

export default PageBreak;
