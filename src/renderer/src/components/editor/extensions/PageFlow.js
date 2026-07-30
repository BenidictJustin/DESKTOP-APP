import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const pageFlowKey = new PluginKey('pageFlow')

// Paper configurations (matches constants)
const PAPER = {
  Letter: { w: 816, h: 1056 },
  Folio: { w: 816, h: 1248 },
  Legal: { w: 816, h: 1344 },
  A4: { w: 794, h: 1122 }
}

const MARGINS = {
  Normal: 96,
  Narrow: 48,
  Moderate: 72,
  Wide: 128,
  Narrative: { top: 96, bottom: 96, left: 144, right: 96 }
}

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
      onPageChange: null
    }
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
        onPageChange: null
      }
    }
  },

  addCommands() {
    return {
      updatePageFlowOptions:
        (options) =>
        ({ tr, dispatch }) => {
          this.storage.options = { ...this.storage.options, ...options }
          if (dispatch) {
            tr.setMeta('pageFlowUpdate', true)
            dispatch(tr)
          }
          return true
        }
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: pageFlowKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, value, oldState, newState) {
            const meta = tr.getMeta(pageFlowKey)
            if (meta) {
              return meta
            }
            if (tr.docChanged) {
              // Map existing decorations through document changes to preserve positions
              return value.map(tr.mapping, tr.doc)
            }
            return value
          }
        },
        props: {
          decorations(state) {
            return this.getState(state)
          }
        },
        view(editorView) {
          let rafId = null
          let pendingTimer = null
          let isDispatching = false // Re-entrancy guard - CRITICAL
          let lastDescriptorsStr = null
          let lastOptionsStr = null
          let lastDocSize = null

          const getScale = (el) => {
            let parent = el
            while (parent) {
              if (
                parent.style &&
                parent.style.transform &&
                parent.style.transform.includes('scale')
              ) {
                const match = parent.style.transform.match(/scale\(([^)]+)\)/)
                if (match) return parseFloat(match[1]) || 1
              }
              parent = parent.parentElement
            }
            return 1
          }

          const getMargins = (key) => {
            const preset = MARGINS[key] || MARGINS.Normal
            if (typeof preset === 'number') {
              return { top: preset, bottom: preset, left: preset, right: preset }
            }
            return preset
          }

          // Core recalculation - MUST only be called from outside the ProseMirror update cycle
          const doRecalculate = () => {
            // Safety: never run if already dispatching or view is dead
            if (isDispatching) return
            if (!editorView || editorView.isDestroyed) return
            const dom = editorView.dom
            if (!dom || !dom.isConnected) return

            const state = editorView.state
            const options = extension.storage.options

            // Quick change detection — skip if nothing relevant has changed
            const optionsStr = JSON.stringify({
              paperKey: options.paperKey,
              orientation: options.orientation,
              marginKey: options.marginKey,
              showHeader: options.showHeader,
              isTemplateActive: options.isTemplateActive
            })
            const docSize = state.doc.nodeSize

            // Always recalculate if options changed, but throttle on doc changes
            const optionsChanged = lastOptionsStr !== optionsStr
            lastOptionsStr = optionsStr

            const paper = PAPER[options.paperKey] || PAPER.A4
            const pageHeight = options.orientation === 'landscape' ? paper.w : paper.h
            const margins = getMargins(options.marginKey)
            const padTopActual = options.showHeader && options.isTemplateActive ? 170 : margins.top
            const usableHeight = pageHeight - (padTopActual + margins.bottom)
            const scale = getScale(dom)

            const decorations = []
            const descriptors = []
            let runningHeight = 0
            let pageNum = 1
            let cursorPage = 1
            const cursorFrom = state.selection ? state.selection.from : 0

            state.doc.forEach((node, offset) => {
              const nodeDom = editorView.nodeDOM(offset)
              let height = 0
              let marginTop = 0
              let marginBottom = 0

              if (nodeDom && nodeDom.nodeType === 1) {
                const style = window.getComputedStyle(nodeDom)
                marginTop = parseFloat(style.marginTop) || 0
                marginBottom = parseFloat(style.marginBottom) || 0
                const rect = nodeDom.getBoundingClientRect()
                // Use offsetHeight when rect.height is 0 (hidden or off-screen)
                const rawH = rect.height > 0 ? rect.height : nodeDom.offsetHeight
                height = rawH / scale + marginTop + marginBottom
              } else {
                if (node.type.name === 'heading') {
                  height = node.attrs.level === 1 ? 40 : 30
                } else if (node.type.name === 'paragraph') {
                  height = 24
                } else if (node.type.name === 'table') {
                  height = 120
                } else if (node.type.name === 'pageBreak') {
                  height = 1
                } else {
                  height = 24
                }
              }

              const isPageBreakNode = node.type.name === 'pageBreak'
              const forceBreak =
                isPageBreakNode ||
                (nodeDom &&
                  nodeDom.nodeType === 1 &&
                  (nodeDom.classList.contains('page-break') ||
                    (nodeDom.querySelector && nodeDom.querySelector('.page-break') !== null) ||
                    window.getComputedStyle(nodeDom).pageBreakBefore === 'always' ||
                    window.getComputedStyle(nodeDom).breakBefore === 'page' ||
                    nodeDom.getAttribute('data-page-break') === 'true'))

              if ((runningHeight + height > usableHeight || forceBreak) && runningHeight > 0) {
                const remainingSpace = Math.max(0, usableHeight - runningHeight)

                descriptors.push({
                  offset,
                  remainingSpace,
                  padTopActual,
                  bottomMargin: margins.bottom
                })

                const widgetEl = document.createElement('div')
                widgetEl.className = 'page-break-widget'
                widgetEl.setAttribute('contenteditable', 'false')
                widgetEl.style.cssText =
                  'width:100%;box-sizing:border-box;user-select:none;pointer-events:none;'
                widgetEl.innerHTML =
                  `<div style="height:${remainingSpace + margins.bottom}px;box-sizing:border-box;"></div>` +
                  `<div style="height:36px;box-sizing:border-box;"></div>` +
                  `<div style="height:${padTopActual}px;box-sizing:border-box;"></div>`

                decorations.push(
                  Decoration.widget(offset, widgetEl, {
                    side: -1,
                    stopEvent: () => true
                  })
                )

                pageNum++
                const isEmptyBreak = isPageBreakNode && height < 10
                runningHeight = isEmptyBreak ? 0 : height

                if (offset <= cursorFrom) cursorPage = pageNum
              } else {
                runningHeight += height
              }
            })

            // Skip dispatch if page break positions haven't changed — this is the key to stability
            const descriptorsStr = JSON.stringify(descriptors)
            if (descriptorsStr === lastDescriptorsStr && !optionsChanged) {
              // Still report page change if cursor moved between pages
              if (options.onPageChange) {
                if (
                  editorView._lastCursorPage !== cursorPage ||
                  editorView._lastTotalPages !== pageNum
                ) {
                  editorView._lastCursorPage = cursorPage
                  editorView._lastTotalPages = pageNum
                  setTimeout(
                    () => options.onPageChange && options.onPageChange(cursorPage, pageNum),
                    0
                  )
                }
              }
              return
            }
            lastDescriptorsStr = descriptorsStr
            lastDocSize = docSize

            // Notify page change callback
            if (options.onPageChange) {
              editorView._lastCursorPage = cursorPage
              editorView._lastTotalPages = pageNum
              setTimeout(() => options.onPageChange && options.onPageChange(cursorPage, pageNum), 0)
            }

            // Dispatch OUTSIDE ProseMirror's update cycle using the re-entrancy guard
            // CRITICAL: use editorView.state (not captured `state`) to avoid doc mismatch
            const currentState = editorView.state
            if (currentState.doc !== state.doc) {
              // Doc changed during our async calculation — re-schedule instead of dispatching stale data
              scheduleRecalculate(100)
              return
            }
            const decoset = DecorationSet.create(currentState.doc, decorations)
            isDispatching = true
            try {
              editorView.dispatch(currentState.tr.setMeta(pageFlowKey, decoset))
            } finally {
              isDispatching = false
            }
          }

          // Schedule recalculation safely outside the current update cycle
          const scheduleRecalculate = (delay) => {
            // Cancel any pending RAF and timer
            if (rafId !== null) {
              cancelAnimationFrame(rafId)
              rafId = null
            }
            if (pendingTimer !== null) {
              clearTimeout(pendingTimer)
              pendingTimer = null
            }

            if (delay === 0) {
              // Use RAF to run after browser has painted — safe from ProseMirror update loop
              rafId = requestAnimationFrame(() => {
                rafId = null
                doRecalculate()
              })
            } else {
              pendingTimer = setTimeout(() => {
                pendingTimer = null
                rafId = requestAnimationFrame(() => {
                  rafId = null
                  doRecalculate()
                })
              }, delay)
            }
          }

          // Listen for image loads inside the editor
          const handleImageLoad = () => scheduleRecalculate(200)
          editorView.dom.addEventListener('load', handleImageLoad, true)

          // Initial calculation after first render
          scheduleRecalculate(100)

          return {
            update(view, prevState) {
              // NEVER call dispatch synchronously here — that causes the re-entrant loop.
              // Always schedule via RAF + timer so we exit ProseMirror's update stack first.
              if (isDispatching) return // Ignore updates caused by our own dispatches

              if (prevState.doc !== view.state.doc) {
                // Document content changed (typing/paste/delete) — use longer delay
                // so the user can keep typing uninterrupted
                scheduleRecalculate(600)
              } else if (prevState.selection !== view.state.selection) {
                // Cursor moved but content unchanged — quick page counter update
                scheduleRecalculate(200)
              }
              // Ignore all other update reasons (decorations from our own dispatch, etc.)
            },
            destroy() {
              if (rafId !== null) cancelAnimationFrame(rafId)
              if (pendingTimer !== null) clearTimeout(pendingTimer)
              editorView.dom.removeEventListener('load', handleImageLoad, true)
            }
          }
        }
      })
    ]
  }
})

export default PageFlow
