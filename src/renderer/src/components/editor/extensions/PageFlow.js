import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const pageFlowKey = new PluginKey('pageFlow');

// Paper configurations (matches constants)
const PAPER = {
  A4:     { w: 816,  h: 1056 },
  Letter: { w: 850,  h: 1100 },
  Legal:  { w: 850,  h: 1400 },
};

const MARGINS = {
  Normal:   96,
  Narrow:   48,
  Moderate: 72,
  Wide:     128,
};

export const PageFlow = Extension.create({
  name: 'pageFlow',

  addOptions() {
    return {
      paperKey: 'A4',
      orientation: 'portrait',
      marginKey: 'Normal',
      headerText: '',
      footerText: '',
      showHeader: false,
      showFooter: false,
    };
  },

  addCommands() {
    return {
      updatePageFlowOptions: (options) => ({ tr, dispatch }) => {
        this.options = { ...this.options, ...options };
        if (dispatch) {
          tr.setMeta('pageFlowUpdate', true);
        }
        return true;
      }
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: pageFlowKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, value, oldState, newState) {
            const hasUpdate = tr.docChanged || tr.getMeta('pageFlowUpdate');
            if (hasUpdate) {
              // Mark state as needing recalculation
              return value;
            }
            return value.map(tr.mapping, tr.doc);
          }
        },
        props: {
          decorations(state) {
            return this.getState(state);
          }
        },
        view(editorView) {
          let lastDocVersion = null;
          let lastOptions = JSON.stringify(extension.options);

          const recalculate = () => {
            if (!editorView || !editorView.dom) return;
            const currentDoc = editorView.state.doc;
            const currentOptionsStr = JSON.stringify(extension.options);
            
            // Check if version or options changed
            if (lastDocVersion === currentDoc && lastOptions === currentOptionsStr) {
              return;
            }
            lastDocVersion = currentDoc;
            lastOptions = currentOptionsStr;

            const options = extension.options;
            const paper = PAPER[options.paperKey] || PAPER.A4;
            const pageHeight = options.orientation === 'landscape' ? paper.w : paper.h;
            const margin = MARGINS[options.marginKey] || 96;
            const usableHeight = pageHeight - margin * 2;

            const decorations = [];
            let runningHeight = 0;
            let pageNum = 1;
            
            // Selection cursor tracking
            const cursorFrom = editorView.state.selection?.from || 0;
            let cursorPage = 1;

            editorView.state.doc.forEach((node, offset) => {
              const dom = editorView.nodeDOM(offset);
              if (dom && dom.nodeType === Node.ELEMENT_NODE) {
                const style = window.getComputedStyle(dom);
                const marginTop = parseFloat(style.marginTop) || 0;
                const marginBottom = parseFloat(style.marginBottom) || 0;
                const rect = dom.getBoundingClientRect();
                const height = rect.height + marginTop + marginBottom;

                // Track cursor page
                if (offset <= cursorFrom) {
                  cursorPage = pageNum;
                }

                if (runningHeight + height > usableHeight && runningHeight > 0) {
                  const remainingSpace = Math.max(0, usableHeight - runningHeight);
                  
                  const widgetEl = document.createElement('div');
                  widgetEl.className = 'page-break-widget';
                  widgetEl.setAttribute('contenteditable', 'false');
                  widgetEl.style.width = '100%';
                  widgetEl.style.boxSizing = 'border-box';
                  widgetEl.style.userSelect = 'none';

                   widgetEl.innerHTML = `
                    <!-- Page N Bottom Margin Area (covers bottom margin, transparent) -->
                    <div style="height: ${remainingSpace + margin}px; position: relative; box-sizing: border-box;">
                      <div class="page-footer-rendered" style="position: absolute; bottom: 16px; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; font-family: sans-serif; border-top: 1px dashed #e5e7eb; padding-top: 6px;">
                        <span>${options.showFooter ? options.footerText : ''}</span>
                        <span>Page ${pageNum}</span>
                      </div>
                    </div>

                    <!-- Visual page break gap (transparent, lets gray workspace background show through) -->
                    <div style="height: 36px; box-sizing: border-box;"></div>

                    <!-- Page N+1 Top Margin Area (covers top margin, transparent) -->
                    <div style="height: ${margin}px; position: relative; box-sizing: border-box;">
                      <div class="page-header-rendered" style="position: absolute; top: 16px; left: 0; right: 0; font-size: 10px; color: #9ca3af; font-family: sans-serif; border-bottom: 1px dashed #e5e7eb; padding-bottom: 6px;">
                        <span>${options.showHeader ? options.headerText : ''}</span>
                      </div>
                    </div>
                  `;

                  decorations.push(Decoration.widget(offset, widgetEl, {
                    side: -1,
                    stopEvent: () => true
                  }));

                  pageNum++;
                  runningHeight = height;

                  // Update cursor page if this block starts after selection
                  if (offset <= cursorFrom) {
                    cursorPage = pageNum;
                  }
                } else {
                  runningHeight += height;
                }
              }
            });

            // Dispatch layout options callback safely
            if (options.onPageChange) {
              if (editorView.lastReportedCurrentPage !== cursorPage || editorView.lastReportedTotalPages !== pageNum) {
                editorView.lastReportedCurrentPage = cursorPage;
                editorView.lastReportedTotalPages = pageNum;
                setTimeout(() => {
                  if (options.onPageChange) {
                    options.onPageChange(cursorPage, pageNum);
                  }
                }, 0);
              }
            }

            const decoset = DecorationSet.create(editorView.state.doc, decorations);
            editorView.dispatch(editorView.state.tr.setMeta(pageFlowKey, decoset));
          };

          setTimeout(recalculate, 100);

          return {
            update(view, prevState) {
              requestAnimationFrame(recalculate);
            }
          };
        }
      })
    ];
  }
});

export default PageFlow;
