import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const pageFlowKey = new PluginKey('pageFlow');

// Paper configurations (matches constants)
const PAPER = {
  Letter:    { w: 816,  h: 1056 },
  Folio:     { w: 816,  h: 1248 },
  Legal:     { w: 816,  h: 1344 },
  A4:        { w: 794,  h: 1122 },
};

const MARGINS = {
  Normal:    96,
  Narrow:    48,
  Moderate:  72,
  Wide:      128,
  Narrative: { top: 96, bottom: 96, left: 144, right: 96 },
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
      isTemplateActive: false,
      onPageChange: null,
    };
  },

  addStorage() {
    return {
      options: {
        paperKey: 'A4',
        orientation: 'portrait',
        marginKey: 'Normal',
        headerText: '',
        footerText: '',
        showHeader: false,
        showFooter: false,
        isTemplateActive: false,
        onPageChange: null,
      }
    };
  },

  addCommands() {
    return {
      updatePageFlowOptions: (options) => ({ tr, dispatch }) => {
        this.storage.options = { ...this.storage.options, ...options };
        if (dispatch) {
          tr.setMeta('pageFlowUpdate', true);
          dispatch(tr);
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
            const meta = tr.getMeta(pageFlowKey);
            if (meta) {
              return meta;
            }
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
          let lastCallback = null;
          let lastDocVersion = null;
          let lastOptions = null;
          let lastSelectionFrom = null;
          let lastDomHeight = null;
          let debounceTimeout = null;

          const recalculate = () => {
            if (!editorView || !editorView.dom || !editorView.docView || editorView.isDestroyed) return;
            const currentDoc = editorView.state.doc;
            const currentOptionsStr = JSON.stringify({
              paperKey: extension.storage.options.paperKey,
              orientation: extension.storage.options.orientation,
              marginKey: extension.storage.options.marginKey,
              headerText: extension.storage.options.headerText,
              footerText: extension.storage.options.footerText,
              showHeader: extension.storage.options.showHeader,
              showFooter: extension.storage.options.showFooter,
              isTemplateActive: extension.storage.options.isTemplateActive,
            });
            const cursorFrom = editorView.state.selection?.from || 0;
            const callbackChanged = lastCallback !== extension.storage.options.onPageChange;
            const currentHeight = editorView.dom.scrollHeight;
            
            // Check if version, options, selection, callback, or visual DOM height changed
            if (
              lastDocVersion === currentDoc &&
              lastOptions === currentOptionsStr &&
              lastSelectionFrom === cursorFrom &&
              lastDomHeight === currentHeight &&
              !callbackChanged
            ) {
              return;
            }
            lastDocVersion = currentDoc;
            lastOptions = currentOptionsStr;
            lastSelectionFrom = cursorFrom;
            lastCallback = extension.storage.options.onPageChange;
            lastDomHeight = currentHeight;

            const options = extension.storage.options;
            const paper = PAPER[options.paperKey] || PAPER.A4;
            const pageHeight = options.orientation === 'landscape' ? paper.w : paper.h;
            const getMargins = (key) => {
              const preset = MARGINS[key] || MARGINS.Normal;
              if (typeof preset === 'number') {
                return { top: preset, bottom: preset, left: preset, right: preset };
              }
              return preset;
            };
            const margins = getMargins(options.marginKey);
            const padTopActual = (options.showHeader && options.isTemplateActive) ? 170 : margins.top;
            const usableHeight = pageHeight - (padTopActual + margins.bottom);

            const decorations = [];
            let runningHeight = 0;
            let pageNum = 1;
            
            // Selection cursor tracking
            let cursorPage = 1;

            const getScale = (el) => {
              let parent = el;
              while (parent) {
                if (parent.style.transform && parent.style.transform.includes('scale')) {
                  const match = parent.style.transform.match(/scale\(([^)]+)\)/);
                  if (match) return parseFloat(match[1]) || 1;
                }
                parent = parent.parentElement;
              }
              return 1;
            };
            const scale = getScale(editorView.dom);

             editorView.state.doc.forEach((node, offset) => {
               const dom = editorView.nodeDOM(offset);
               let height = 0;
               let marginTop = 0;
               let marginBottom = 0;
               
               if (dom && dom.nodeType === Node.ELEMENT_NODE) {
                 const style = window.getComputedStyle(dom);
                 marginTop = parseFloat(style.marginTop) || 0;
                 marginBottom = parseFloat(style.marginBottom) || 0;
                 const rect = dom.getBoundingClientRect();
                 height = (rect.height / scale) + marginTop + marginBottom;
               } else {
                 // Fallback estimation if DOM is not ready
                 if (node.type.name === 'heading') {
                   height = node.attrs.level === 1 ? 40 : 30;
                 } else if (node.type.name === 'paragraph') {
                   height = 20;
                 } else if (node.type.name === 'table') {
                   height = 120;
                 } else if (node.type.name === 'pageBreak') {
                   height = 1;
                 } else {
                   height = 20;
                 }
               }

               const forceBreak = node.type.name === 'pageBreak' || (dom && dom.nodeType === Node.ELEMENT_NODE && (
                                    dom.classList.contains('page-break') || 
                                    dom.querySelector('.page-break') !== null ||
                                    window.getComputedStyle(dom).pageBreakBefore === 'always' || 
                                    window.getComputedStyle(dom).breakBefore === 'page' ||
                                    dom.getAttribute('data-page-break') === 'true'
                                  ));

               if ((runningHeight + height > usableHeight || forceBreak) && runningHeight > 0) {
                 const remainingSpace = Math.max(0, usableHeight - runningHeight);
                 
                 const widgetEl = document.createElement('div');
                 widgetEl.className = 'page-break-widget';
                 widgetEl.setAttribute('contenteditable', 'false');
                 widgetEl.style.width = '100%';
                 widgetEl.style.boxSizing = 'border-box';
                 widgetEl.style.userSelect = 'none';

                 widgetEl.innerHTML = `
                   <!-- Page N Bottom Margin Area (covers bottom margin, transparent) -->
                   <div style="height: ${remainingSpace + margins.bottom}px; box-sizing: border-box;"></div>

                   <!-- Visual page break gap (transparent, lets gray workspace background show through) -->
                   <div style="height: 36px; box-sizing: border-box;"></div>

                   <!-- Page N+1 Top Margin Area (covers top margin, transparent) -->
                   <div style="height: ${padTopActual}px; box-sizing: border-box;"></div>
                 `;

                 decorations.push(Decoration.widget(offset, widgetEl, {
                   side: -1,
                   stopEvent: () => true
                 }));

                 pageNum++;
                 const isBreakElementEmpty = (node.type.name === 'pageBreak' || (dom && dom.nodeType === Node.ELEMENT_NODE && dom.classList.contains('page-break'))) && height < 10;
                 runningHeight = isBreakElementEmpty ? 0 : height;

                 // Update cursor page if this block starts after selection
                 if (offset <= cursorFrom) {
                   cursorPage = pageNum;
                 }
               } else {
                 runningHeight += height;
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

          const scheduleRecalculate = (delay = 200) => {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              recalculate();
            }, delay);
          };

          // Recalculate when images finish loading inside editor view
          const handleImageLoad = () => {
            recalculate();
          };
          if (editorView.dom) {
            editorView.dom.addEventListener('load', handleImageLoad, true);
          }

          // Initial immediate recalculate
          setTimeout(recalculate, 50);

          return {
            update(view, prevState) {
              // Debounce recalculate to prevent layout thrashing on every keystroke
              if (prevState.doc !== view.state.doc) {
                scheduleRecalculate(150);
              } else {
                scheduleRecalculate(300);
              }
            },
            destroy() {
              if (debounceTimeout) clearTimeout(debounceTimeout);
              if (editorView.dom) {
                editorView.dom.removeEventListener('load', handleImageLoad, true);
              }
            }
          };
        }
      })
    ];
  }
});

export default PageFlow;
