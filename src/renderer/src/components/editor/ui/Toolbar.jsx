import React, { useState, useEffect } from 'react'
import { SketchPicker } from 'react-color'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  ListCollapse,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Plus,
  Printer,
  Redo2,
  RemoveFormatting,
  Search,
  SpellCheck,
  Underline,
  Undo2,
  Upload
} from 'lucide-react'

import { cn } from '../utils/cn'
import { Separator } from './shadcn/Separator'
import { useEditorStore } from '../store/useEditorStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './shadcn/DropdownMenu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './shadcn/Dialog'
import { Input } from './shadcn/Input'
import { Button } from './shadcn/Button'

const LineHeightButton = () => {
  const { editor } = useEditorStore()

  const lineHeights = [
    { label: 'Default', value: 'normal' },
    { label: 'Single', value: '1' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: 'Double', value: '2' }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
          <ListCollapse className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-white border border-neutral-200 shadow-md rounded">
        {lineHeights.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => editor?.chain().focus().setLineHeight(value).run()}
            className={cn(
              'flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80 w-full text-left text-sm cursor-pointer',
              editor?.getAttributes('paragraph').lineHeight === value && 'bg-neutral-200/80'
            )}
          >
            <span>{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const FontSizeButton = () => {
  const { editor } = useEditorStore()

  const getSelectionFontSize = () => {
    if (!editor) return '16'
    const { from, to, doc } = editor.state

    if (from === to) {
      const sizePx = editor.getAttributes('textStyle').fontSize || '16pt'
      return sizePx.replace('px', '').replace('pt', '')
    }

    const sizes = new Set()
    doc.nodesBetween(from, to, (node) => {
      if (node.isText) {
        const textStyleMark = node.marks.find((m) => m.type.name === 'textStyle')
        if (textStyleMark && textStyleMark.attrs.fontSize) {
          sizes.add(textStyleMark.attrs.fontSize.replace('px', '').replace('pt', ''))
        } else {
          sizes.add('16')
        }
      }
    })

    if (sizes.size === 0) {
      const sizePx = editor.getAttributes('textStyle').fontSize || '16pt'
      return sizePx.replace('px', '').replace('pt', '')
    }

    if (sizes.size > 1) {
      return '—'
    }

    return Array.from(sizes)[0]
  }

  const currentFontSize = getSelectionFontSize()
  const [inputValue, setInputValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setInputValue(currentFontSize)
    }
  }, [currentFontSize, isEditing])

  const updateFontSize = (newSize) => {
    const size = parseInt(newSize)
    if (!isNaN(size) && size > 0) {
      editor?.chain().focus().setFontSize(`${size}pt`).run()
      setIsEditing(false)
    }
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    updateFontSize(inputValue)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      updateFontSize(inputValue)
      editor?.commands.focus()
    }
  }

  const increment = () => {
    const { from, to } = editor.state
    editor.chain().focus().run()

    if (from !== to) {
      let tr = editor.state.tr
      let modified = false
      editor.state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.isText) {
          const textStyleMark = node.marks.find((m) => m.type.name === 'textStyle')
          const currentSizePx = textStyleMark?.attrs?.fontSize || '16pt'
          const currentSize = parseFloat(currentSizePx.replace('px', '').replace('pt', '')) || 16
          const newSize = currentSize + 1

          const startPos = Math.max(from, pos)
          const endPos = Math.min(to, pos + node.nodeSize)

          const textStyleType = editor.state.schema.marks.textStyle
          const newAttrs = { ...textStyleMark?.attrs, fontSize: `${newSize}pt` }
          tr.addMark(startPos, endPos, textStyleType.create(newAttrs))
          modified = true
        }
      })
      if (modified) {
        editor.view.dispatch(tr)
        return
      }
    }

    const liveSize = parseFloat(getSelectionFontSize()) || 16
    editor
      ?.chain()
      .focus()
      .setFontSize(`${liveSize + 1}pt`)
      .run()
  }

  const decrement = () => {
    const { from, to } = editor.state
    editor.chain().focus().run()

    if (from !== to) {
      let tr = editor.state.tr
      let modified = false
      editor.state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.isText) {
          const textStyleMark = node.marks.find((m) => m.type.name === 'textStyle')
          const currentSizePx = textStyleMark?.attrs?.fontSize || '16pt'
          const currentSize = parseFloat(currentSizePx.replace('px', '').replace('pt', '')) || 16
          const newSize = Math.max(1, currentSize - 1)

          const startPos = Math.max(from, pos)
          const endPos = Math.min(to, pos + node.nodeSize)

          const textStyleType = editor.state.schema.marks.textStyle
          const newAttrs = { ...textStyleMark?.attrs, fontSize: `${newSize}pt` }
          tr.addMark(startPos, endPos, textStyleType.create(newAttrs))
          modified = true
        }
      })
      if (modified) {
        editor.view.dispatch(tr)
        return
      }
    }

    const liveSize = parseFloat(getSelectionFontSize()) || 16
    editor
      ?.chain()
      .focus()
      .setFontSize(`${Math.max(1, liveSize - 1)}pt`)
      .run()
  }

  return (
    <div className="flex items-center gap-x-0.5">
      <button
        onClick={decrement}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 cursor-pointer"
      >
        <Minus className="size-4" />
      </button>
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="h-7 w-10 text-sm text-center border border-neutral-400 rounded-sm bg-transparent focus:outline-none focus:ring-0"
        />
      ) : (
        <button
          onClick={() => {
            setIsEditing(true)
            setInputValue(currentFontSize)
          }}
          className="h-7 w-10 text-sm text-center border border-neutral-400 rounded-sm hover:bg-neutral-200/80 cursor-pointer"
        >
          {currentFontSize}
        </button>
      )}
      <button
        onClick={increment}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 cursor-pointer"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

const ListButton = () => {
  const { editor } = useEditorStore()

  const lists = [
    {
      label: 'Bullet List',
      icon: List,
      isActive: () => editor?.isActive('bulletList'),
      onClick: () => editor?.chain().focus().toggleBulletList().run()
    },
    {
      label: 'Ordered List',
      icon: ListOrdered,
      isActive: () => editor?.isActive('orderedList'),
      onClick: () => editor?.chain().focus().toggleOrderedList().run()
    }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
          <List className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-white border border-neutral-200 shadow-md rounded">
        {lists.map(({ label, icon: Icon, onClick, isActive }) => (
          <button
            key={label}
            onClick={onClick}
            className={cn(
              'flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80 w-full text-left text-sm cursor-pointer',
              isActive() && 'bg-neutral-200/80'
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const AlignButton = () => {
  const { editor } = useEditorStore()

  const alignments = [
    {
      label: 'Align Left',
      value: 'left',
      icon: AlignLeft
    },
    {
      label: 'Align Center',
      value: 'center',
      icon: AlignCenter
    },
    {
      label: 'Align Right',
      value: 'right',
      icon: AlignRight
    },
    {
      label: 'Align Justify',
      value: 'justify',
      icon: AlignJustify
    }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
          <AlignLeft className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-white border border-neutral-200 shadow-md rounded">
        {alignments.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => editor?.chain().focus().setTextAlign(value).run()}
            className={cn(
              'flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80 w-full text-left text-sm cursor-pointer',
              editor?.isActive({ textAlign: value }) && 'bg-neutral-200/80'
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ImageButton = () => {
  const { editor } = useEditorStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const onChange = (src) => {
    editor?.chain().focus().setImage({ src }).run()
  }

  const onUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          onChange(event.target.result)
        }
        reader.readAsDataURL(file)
      }
    }

    input.click()
  }

  const handleImageUrlSubmit = () => {
    if (imageUrl) {
      onChange(imageUrl)
      setImageUrl('')
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
            <ImageIcon className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-1 bg-white border border-neutral-200 shadow-md rounded">
          <DropdownMenuItem onClick={onUpload} className="cursor-pointer">
            <Upload className="size-4 mr-2" />
            Upload from computer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="cursor-pointer">
            <Search className="size-4 mr-2" />
            Paste image URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border border-neutral-200 p-6 rounded shadow-lg max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Insert image URL</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Paste image URL here"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleImageUrlSubmit()
              }
            }}
            className="my-4"
          />
          <DialogFooter className="flex justify-end gap-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={handleImageUrlSubmit} className="cursor-pointer">
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const LinkButton = () => {
  const { editor } = useEditorStore()
  const [value, setValue] = useState('')

  const onChange = (href) => {
    editor?.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setValue('')
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          setValue(editor?.getAttributes('link').href || '')
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
          <Link2 className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2.5 flex items-center gap-x-2 bg-white border border-neutral-200 shadow-md rounded">
        <Input
          placeholder="https://example.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-48 text-sm"
        />
        <Button size="sm" onClick={() => onChange(value)} className="cursor-pointer h-8">
          Apply
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const HighlightColorButton = () => {
  const { editor } = useEditorStore()

  const value = editor?.getAttributes('highlight').color || '#FFFFFFFF'

  const onChange = (color) => {
    editor?.chain().focus().setHighlight({ color: color.hex }).run()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
          <Highlighter className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 border-none shadow-none">
        <SketchPicker color={value} onChange={onChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const TextColorButton = () => {
  const { editor } = useEditorStore()

  const value = editor?.getAttributes('textStyle').color || '#000000'

  const onChange = (color) => {
    editor?.chain().focus().setColor(color.hex).run()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
          <span className="text-xs font-bold">A</span>
          <div className="h-0.5 w-full mt-0.5" style={{ backgroundColor: value }} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 border-none shadow-none">
        <SketchPicker color={value} onChange={onChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const HeadingLevelButton = () => {
  const { editor } = useEditorStore()

  const headings = [
    { label: 'Normal text', value: 0, fontSize: '16px' },
    { label: 'Heading 1', value: 1, fontSize: '32px' },
    { label: 'Heading 2', value: 2, fontSize: '24px' },
    { label: 'Heading 3', value: 3, fontSize: '20px' },
    { label: 'Heading 4', value: 4, fontSize: '18px' },
    { label: 'Heading 5', value: 5, fontSize: '16px' }
  ]

  const getCurrentHeading = () => {
    for (let level = 1; level <= 5; level++) {
      if (editor?.isActive('heading', { level })) {
        return `Heading ${level}`
      }
    }
    return 'Normal text'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 min-w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
          <span className="truncate max-w-[80px]">{getCurrentHeading()}</span>
          <ChevronDown className="ml-2 size-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-white border border-neutral-200 shadow-md rounded">
        {headings.map(({ label, value, fontSize }) => (
          <button
            key={value}
            style={{ fontSize }}
            onClick={() => {
              if (value === 0) {
                editor?.chain().focus().setParagraph().run()
              } else {
                editor?.chain().focus().toggleHeading({ level: value }).run()
              }
            }}
            className={cn(
              'flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80 w-full text-left cursor-pointer',
              ((value === 0 && !editor?.isActive('heading')) ||
                editor?.isActive('heading', { level: value })) &&
                'bg-neutral-200/80'
            )}
          >
            {label}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const FontFamilyButton = () => {
  const { editor } = useEditorStore()

  const fonts = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 w-[120px] shrink-0 flex items-center justify-between rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm cursor-pointer">
          <span className="truncate">
            {editor?.getAttributes('textStyle').fontFamily || 'Arial'}
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 bg-white border border-neutral-200 shadow-md rounded">
        {fonts.map(({ label, value }) => (
          <button
            onClick={() => editor?.chain().focus().setFontFamily(value).run()}
            key={value}
            className={cn(
              'flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80 w-full text-left cursor-pointer',
              editor?.getAttributes('textStyle').fontFamily === value && 'bg-neutral-200/80'
            )}
            style={{ fontFamily: value }}
          >
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ToolbarButton = ({ onClick, isActive, icon: Icon }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-sm h-7 min-w-7 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 cursor-pointer',
        isActive && 'bg-neutral-200/80'
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

export const Toolbar = () => {
  const { editor } = useEditorStore()
  const [, setUpdateTrigger] = useState(0)

  useEffect(() => {
    if (!editor) return
    const handleUpdate = () => {
      setUpdateTrigger((prev) => prev + 1)
    }
    editor.on('transaction', handleUpdate)
    editor.on('selectionUpdate', handleUpdate)
    return () => {
      editor.off('transaction', handleUpdate)
      editor.off('selectionUpdate', handleUpdate)
    }
  }, [editor])

  const sections = [
    [
      {
        label: 'Undo',
        icon: Undo2,
        onClick: () => editor?.chain().focus().undo().run()
      },
      {
        label: 'Redo',
        icon: Redo2,
        onClick: () => editor?.chain().focus().redo().run()
      },
      {
        label: 'Print',
        icon: Printer,
        onClick: () => window.print()
      },
      {
        label: 'Spell Check',
        icon: SpellCheck,
        onClick: () => {
          const current = editor?.view.dom.getAttribute('spellcheck')
          editor?.view.dom.setAttribute('spellcheck', current === 'false' ? 'true' : 'false')
        }
      }
    ],
    [
      {
        label: 'Bold',
        icon: Bold,
        isActive: editor?.isActive('bold'),
        onClick: () => editor?.chain().focus().toggleBold().run()
      },
      {
        label: 'Italic',
        icon: Italic,
        isActive: editor?.isActive('italic'),
        onClick: () => editor?.chain().focus().toggleItalic().run()
      },
      {
        label: 'Underline',
        icon: Underline,
        isActive: editor?.isActive('underline'),
        onClick: () => editor?.chain().focus().toggleUnderline().run()
      }
    ],
    [
      {
        label: 'List Todo',
        icon: ListTodo,
        onClick: () => editor?.chain().focus().toggleTaskList().run(),
        isActive: editor?.isActive('taskList')
      },
      {
        label: 'Remove Formatting',
        icon: RemoveFormatting,
        onClick: () => editor?.chain().focus().unsetAllMarks().run()
      }
    ]
  ]

  return (
    <div className="bg-[#F1F4F9] px-2.5 py-1 rounded-[24px] min-h-[40px] flex items-center gap-x-0.5 overflow-x-auto print:hidden">
      {sections[0].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      <Separator orientation="vertical" className="h-6 bg-neutral-300 mx-1" />
      <FontFamilyButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 mx-1" />
      <HeadingLevelButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 mx-1" />
      <FontSizeButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 mx-1" />
      {sections[1].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      <TextColorButton />
      <HighlightColorButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 mx-1" />
      <LinkButton />
      <ImageButton />
      <AlignButton />
      <LineHeightButton />
      <ListButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300 mx-1" />
      {sections[2].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
    </div>
  )
}
