import { create } from 'zustand'

export const LEFT_MARGIN_DEFAULT = 56
export const RIGHT_MARGIN_DEFAULT = 56

export const useEditorStore = create((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  leftMargin: LEFT_MARGIN_DEFAULT,
  rightMargin: RIGHT_MARGIN_DEFAULT,
  setLeftMargin: (margin) => set({ leftMargin: margin }),
  setRightMargin: (margin) => set({ rightMargin: margin })
}))
