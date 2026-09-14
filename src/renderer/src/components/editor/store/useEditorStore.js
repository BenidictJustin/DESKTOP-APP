import { create } from 'zustand'

export const LEFT_MARGIN_DEFAULT = 56
export const RIGHT_MARGIN_DEFAULT = 56

export const MAX_DOCUMENT_IMAGES = 10

export const useEditorStore = create((set, get) => ({
  editor: null,
  mainEditor: null,
  headerEditor: null,
  footerEditor: null,
  currentPage: 1,
  setEditor: (editor) => set({ editor }),
  setMainEditor: (mainEditor) => set({ mainEditor }),
  setHeaderEditor: (headerEditor) => set({ headerEditor }),
  setFooterEditor: (footerEditor) => set({ footerEditor }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  leftMargin: LEFT_MARGIN_DEFAULT,
  rightMargin: RIGHT_MARGIN_DEFAULT,
  setLeftMargin: (margin) => set({ leftMargin: margin }),
  setRightMargin: (margin) => set({ rightMargin: margin }),

  getImageCount: () => {
    const { mainEditor, editor } = get()
    const targetEditor = mainEditor || editor
    const doc = targetEditor?.state?.doc
    if (!doc) return 0
    let count = 0
    doc.descendants((node) => {
      if (node.type.name === 'floatingImage') {
        count++
      }
    })
    return count
  },

  canInsertImage: () => {
    return get().getImageCount() < MAX_DOCUMENT_IMAGES
  }
}))
