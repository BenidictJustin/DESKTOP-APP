/* 
================================================================================
CUSTOM MOVABLE TABLE IMPLEMENTATION WITH DRAG & RESIZE HANDLES (COMMENTED OUT)
================================================================================
import { Table } from '@tiptap/extension-table'
import { mergeAttributes } from '@tiptap/core'

export const MovableTableCustom = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      leftOffset: {
        default: 0,
        parseHTML: (element) => {
          const attrVal = element.getAttribute('data-left-offset')
          if (attrVal) return parseFloat(attrVal)
          const leftVal = element.style.left
          return leftVal ? parseFloat(leftVal) : 0
        },
        renderHTML: (attributes) => {
          return {
            'data-left-offset': attributes.leftOffset || 0
          }
        }
      },
      topOffset: {
        default: 0,
        parseHTML: (element) => {
          const attrVal = element.getAttribute('data-top-offset')
          if (attrVal) return parseFloat(attrVal)
          const topVal = element.style.top
          return topVal ? parseFloat(topVal) : 0
        },
        renderHTML: (attributes) => {
          return {
            'data-top-offset': attributes.topOffset || 0
          }
        }
      },
      tableWidth: {
        default: null,
        parseHTML: (element) => {
          const attrVal = element.getAttribute('data-table-width')
          if (attrVal) return attrVal
          return element.style.width || null
        },
        renderHTML: (attributes) => {
          if (!attributes.tableWidth) return {}
          return {
            'data-table-width': attributes.tableWidth
          }
        }
      }
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const left = node.attrs.leftOffset || 0
    const top = node.attrs.topOffset || 0
    const width = node.attrs.tableWidth || '100%'

    return [
      'div',
      {
        class: 'movable-table-wrapper',
        style: 'position: relative; display: block; margin: 16px 0; padding: 0; min-height: 40px; overflow: visible; z-index: 10;'
      },
      [
        'table',
        mergeAttributes(HTMLAttributes, {
          class: 'movable-table',
          style: `position: relative; left: ${left}px; top: ${top}px; width: ${width}; max-width: 100%; margin: 0;`
        }),
        0
      ]
    ]
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      let currentNode = node

      const getEditorScale = () => {
        if (!editor || !editor.view || !editor.view.dom) return 1
        let el = editor.view.dom
        while (el && el !== document.body) {
          if (el.style && el.style.transform && el.style.transform.includes('scale')) {
            const match = el.style.transform.match(/scale\(([^)]+)\)/)
            if (match && match[1]) {
              const val = parseFloat(match[1])
              if (!isNaN(val) && val > 0) return val
            }
          }
          el = el.parentElement
        }
        return 1
      }

      const wrapperDOM = document.createElement('div')
      wrapperDOM.className = 'movable-table-wrapper'
      wrapperDOM.style.position = 'relative'
      wrapperDOM.style.display = 'block'
      wrapperDOM.style.margin = '16px 0'
      wrapperDOM.style.padding = '0'
      wrapperDOM.style.minHeight = '40px'
      wrapperDOM.style.overflow = 'visible'
      wrapperDOM.style.zIndex = '10'

      const tableDOM = document.createElement('table')
      Object.entries(HTMLAttributes).forEach(([key, val]) => {
        if (key !== 'style') tableDOM.setAttribute(key, val)
      })
      
      const initialLeft = currentNode.attrs.leftOffset || 0
      const initialTop = currentNode.attrs.topOffset || 0
      const initialWidth = currentNode.attrs.tableWidth || '100%'

      tableDOM.style.position = 'relative'
      tableDOM.style.left = `${initialLeft}px`
      tableDOM.style.top = `${initialTop}px`
      tableDOM.style.width = initialWidth
      tableDOM.classList.add('movable-table')

      const contentDOM = document.createElement('tbody')
      tableDOM.appendChild(contentDOM)
      wrapperDOM.appendChild(tableDOM)

      if (!editor.isEditable) {
        return {
          dom: wrapperDOM,
          contentDOM,
          update: (updatedNode) => {
            if (updatedNode.type.name !== 'table') return false
            currentNode = updatedNode
            tableDOM.style.left = `${updatedNode.attrs.leftOffset || 0}px`
            tableDOM.style.top = `${updatedNode.attrs.topOffset || 0}px`
            if (updatedNode.attrs.tableWidth) {
              tableDOM.style.width = updatedNode.attrs.tableWidth
            }
            return true
          }
        }
      }

      // Move Handle (Top-Left corner straddle)
      const moveHandle = document.createElement('div')
      moveHandle.className = 'table-move-handle'
      moveHandle.setAttribute('contenteditable', 'false')
      moveHandle.title = 'Drag to move table'
      moveHandle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`
      moveHandle.style.position = 'absolute'
      moveHandle.style.width = '22px'
      moveHandle.style.height = '22px'
      moveHandle.style.background = '#ffffff'
      moveHandle.style.border = '1.5px solid #3b82f6'
      moveHandle.style.borderRadius = '4px'
      moveHandle.style.display = 'flex'
      moveHandle.style.alignItems = 'center'
      moveHandle.style.justifyContent = 'center'
      moveHandle.style.cursor = 'move'
      moveHandle.style.zIndex = '99'
      moveHandle.style.userSelect = 'none'
      moveHandle.style.boxShadow = '0 2px 6px rgba(59,130,246,0.25)'
      wrapperDOM.appendChild(moveHandle)

      // Resize Handle (Bottom-Right corner)
      const resizeHandle = document.createElement('div')
      resizeHandle.className = 'table-resize-handle'
      resizeHandle.setAttribute('contenteditable', 'false')
      resizeHandle.title = 'Drag to resize table width'
      resizeHandle.style.position = 'absolute'
      resizeHandle.style.width = '12px'
      resizeHandle.style.height = '12px'
      resizeHandle.style.background = '#3b82f6'
      resizeHandle.style.border = '2px solid #ffffff'
      resizeHandle.style.borderRadius = '50%'
      resizeHandle.style.cursor = 'se-resize'
      resizeHandle.style.zIndex = '99'
      resizeHandle.style.userSelect = 'none'
      resizeHandle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
      wrapperDOM.appendChild(resizeHandle)

      const syncHandlePositions = () => {
        requestAnimationFrame(() => {
          if (!wrapperDOM || !tableDOM) return
          const left = parseFloat(tableDOM.style.left) || 0
          const top = parseFloat(tableDOM.style.top) || 0
          const w = tableDOM.offsetWidth
          const h = tableDOM.offsetHeight

          moveHandle.style.left = `${left - 11}px`
          moveHandle.style.top = `${top - 11}px`

          resizeHandle.style.left = `${left + w - 6}px`
          resizeHandle.style.top = `${top + h - 6}px`

          wrapperDOM.style.minHeight = `${Math.max(40, h + top)}px`
        })
      }

      syncHandlePositions()

      moveHandle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        document.body.style.userSelect = 'none'

        const scale = getEditorScale()
        const startX = e.clientX
        const startY = e.clientY
        const startLeft = parseFloat(tableDOM.style.left) || 0
        const startTop = parseFloat(tableDOM.style.top) || 0

        let currentLeft = startLeft
        let currentTop = startTop

        const onMouseMove = (moveEvent) => {
          const dx = (moveEvent.clientX - startX) / scale
          const dy = (moveEvent.clientY - startY) / scale

          currentLeft = Math.round(startLeft + dx)
          currentTop = Math.round(startTop + dy)

          tableDOM.style.left = `${currentLeft}px`
          tableDOM.style.top = `${currentTop}px`
          syncHandlePositions()
        }

        const onMouseUp = () => {
          document.body.style.userSelect = ''
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)

          if (typeof getPos === 'function') {
            const pos = getPos()
            if (typeof pos === 'number') {
              editor.view.dispatch(
                editor.view.state.tr.setNodeMarkup(pos, undefined, {
                  ...currentNode.attrs,
                  leftOffset: currentLeft,
                  topOffset: currentTop
                })
              )
            }
          }
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      })

      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        document.body.style.userSelect = 'none'

        const scale = getEditorScale()
        const startX = e.clientX
        const startWidth = tableDOM.offsetWidth
        let currentWidthStr = `${startWidth}px`

        const onMouseMove = (moveEvent) => {
          const dx = (moveEvent.clientX - startX) / scale
          const newWidth = Math.max(120, Math.round(startWidth + dx))
          currentWidthStr = `${newWidth}px`

          tableDOM.style.width = currentWidthStr
          syncHandlePositions()
        }

        const onMouseUp = () => {
          document.body.style.userSelect = ''
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)

          if (typeof getPos === 'function') {
            const pos = getPos()
            if (typeof pos === 'number') {
              editor.view.dispatch(
                editor.view.state.tr.setNodeMarkup(pos, undefined, {
                  ...currentNode.attrs,
                  tableWidth: currentWidthStr
                })
              )
            }
          }
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      })

      return {
        dom: wrapperDOM,
        contentDOM,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'table') return false
          currentNode = updatedNode
          tableDOM.style.left = `${updatedNode.attrs.leftOffset || 0}px`
          tableDOM.style.top = `${updatedNode.attrs.topOffset || 0}px`
          if (updatedNode.attrs.tableWidth) {
            tableDOM.style.width = updatedNode.attrs.tableWidth
          }
          syncHandlePositions()
          return true
        },
        stopEvent: (event) => {
          const target = event.target
          if (
            target &&
            (target.closest('.table-move-handle') || target.closest('.table-resize-handle'))
          ) {
            return true
          }
          return false
        },
        ignoreMutation: (mutation) => {
          const target = mutation.target
          if (
            target &&
            (target.closest('.table-move-handle') || target.closest('.table-resize-handle'))
          ) {
            return true
          }
          return false
        }
      }
    }
  }
})
================================================================================
*/

import { Table } from '@tiptap/extension-table'

// Standard Tiptap Table Extension (Restored clean Tiptap table behavior)
export const MovableTable = Table

export default MovableTable


