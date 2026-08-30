import { useLayoutEffect, useRef } from 'react'
import katex from 'katex'
import { parseMathNotes } from '../mathParser'
import { splitSpeakerLabels } from '../transcriptFormatter'

type LiveMathDocumentProps = {
  value: string
  onChange: (value: string) => void
}

export function LiveMathDocument({ value, onChange }: LiveMathDocumentProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const currentSource = useRef<string | null>(null)
  const history = useRef<string[]>([value])
  const historyIndex = useRef(0)

  useLayoutEffect(() => {
    if (!editorRef.current || currentSource.current === value) return
    editorRef.current.innerHTML = renderMathHtml(value)
    currentSource.current = value
    history.current = [value]
    historyIndex.current = 0
  }, [value])

  function recordHistory(source: string) {
    if (history.current[historyIndex.current] === source) return
    const next = history.current.slice(0, historyIndex.current + 1)
    next.push(source)
    if (next.length > 500) next.shift()
    history.current = next
    historyIndex.current = next.length - 1
  }

  function applyHistory(index: number) {
    if (!editorRef.current || index < 0 || index >= history.current.length) return
    const source = history.current[index]
    historyIndex.current = index
    editorRef.current.innerHTML = renderMathHtml(source)
    currentSource.current = source
    restoreCaretToEnd(editorRef.current)
    onChange(source)
  }

  function normalizeEditor(forceInterpretation = false) {
    if (!editorRef.current) return
    const source = readRichText(editorRef.current)
    const { end } = readSelectionOffsets(editorRef.current)
    const desiredTokens = parseMathNotes(source)
      .filter((part) => part.type === 'math')
      .map((part) => part.source)
    const renderedTokens = Array.from(editorRef.current.querySelectorAll<HTMLElement>('[data-source]'))
      .map((token) => token.dataset.source ?? '')
    const typedBoundary = end > 0 && /[\s,.;:!?()[\]{}]/.test(source.charAt(end - 1))

    if ((forceInterpretation || typedBoundary) && JSON.stringify(desiredTokens) !== JSON.stringify(renderedTokens)) {
      const wasTypingAtEnd = end === source.length
      editorRef.current.innerHTML = renderMathHtml(source)
      if (wasTypingAtEnd) restoreCaretToEnd(editorRef.current)
      else restoreCaret(editorRef.current, end)
    }
    recordHistory(source)
    currentSource.current = source
    onChange(source)
  }

  return (
    <div
      ref={editorRef}
      className={`live-document ${value ? '' : 'is-empty'}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Math document"
      data-placeholder="Start writing naturally… try “the integral from a to b”"
      onBeforeInput={() => moveCaretOutsideMath(editorRef.current)}
      onInput={() => normalizeEditor()}
      onBlur={() => normalizeEditor(true)}
      onKeyDown={(event) => {
        const commandKey = event.ctrlKey || event.metaKey
        if (commandKey && event.key.toLowerCase() === 'z') {
          event.preventDefault()
          applyHistory(historyIndex.current + (event.shiftKey ? 1 : -1))
          return
        }
        if (commandKey && event.key.toLowerCase() === 'y') {
          event.preventDefault()
          applyHistory(historyIndex.current + 1)
          return
        }
        if (event.key !== 'Enter') return
        event.preventDefault()
        document.execCommand('insertLineBreak')
      }}
      onPaste={(event) => {
        event.preventDefault()
        moveCaretOutsideMath(editorRef.current)
        document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
        normalizeEditor(true)
      }}
    />
  )
}

function renderMathHtml(value: string) {
  return parseMathNotes(value).map((part) => {
    if (part.type === 'text') {
      return splitSpeakerLabels(part.value).map((textPart) => textPart.type === 'speaker'
        ? `<span class="speaker-label">${escapeHtml(textPart.value)}</span>`
        : escapeHtml(textPart.value).replace(/\n/g, '<br>')).join('')
    }
    const math = katex.renderToString(part.value, { throwOnError: false })
    return `<span class="live-math-token" data-source="${escapeHtml(part.source)}" contenteditable="false"><span class="math-piece">${math}</span></span>&#8203;`
  }).join('')
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function readRichText(root: Node): string {
  let text = ''
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) text += (node.textContent ?? '').replace(/\u200B/g, '')
    else if (node instanceof HTMLElement && node.dataset.source !== undefined) text += node.dataset.source
    else if (node instanceof HTMLBRElement) text += '\n'
    else text += readRichText(node)
  })
  return text
}

function moveCaretOutsideMath(root: HTMLElement | null) {
  if (!root) return
  const selection = window.getSelection()
  if (!selection?.rangeCount) return
  const anchor = selection.anchorNode
  const element = anchor instanceof Element ? anchor : anchor?.parentElement
  const token = element?.closest<HTMLElement>('[data-source]')
  if (!token || !root.contains(token)) return
  const range = document.createRange()
  let boundary: Node | null = token.nextSibling
  let placedAfter: Node = token
  let boundaryOffset: number | null = null
  while (boundary?.nodeType === Node.TEXT_NODE) {
    const content = boundary.textContent ?? ''
    const leadingSpace = content.match(/^[\u200B\s]*/)?.[0].length ?? 0
    if (leadingSpace === 0) break
    placedAfter = boundary
    boundaryOffset = leadingSpace
    if (leadingSpace < content.length) break
    boundary = boundary.nextSibling
  }
  if (boundaryOffset !== null && placedAfter.nodeType === Node.TEXT_NODE) range.setStart(placedAfter, boundaryOffset)
  else range.setStartAfter(placedAfter)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

function readSelectionOffsets(root: HTMLElement) {
  const selection = window.getSelection()
  if (!selection?.rangeCount) {
    const end = readRichText(root).length
    return { start: end, end }
  }
  const range = selection.getRangeAt(0).cloneRange()
  const offsetAt = (node: Node, offset: number) => {
    const before = document.createRange()
    before.selectNodeContents(root)
    before.setEnd(node, offset)
    return readRichText(before.cloneContents()).length
  }
  return {
    start: offsetAt(range.startContainer, range.startOffset),
    end: offsetAt(range.endContainer, range.endOffset),
  }
}

function restoreCaret(root: HTMLElement, requestedOffset: number) {
  const selection = window.getSelection()
  const range = document.createRange()
  let remaining = requestedOffset
  for (const node of Array.from(root.childNodes)) {
    const length = readRichText(node).length
    if (node instanceof HTMLElement && node.dataset.source !== undefined) {
      if (remaining <= length) {
        range.setStartAfter(node)
        range.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(range)
        return
      }
    } else if (remaining <= length) {
      const textNode = node.nodeType === Node.TEXT_NODE ? node : node.firstChild
      if (textNode?.nodeType === Node.TEXT_NODE) {
        range.setStart(textNode, sourceOffsetToDomOffset(textNode.textContent ?? '', remaining))
        range.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(range)
        return
      }
    }
    remaining -= length
  }
  range.selectNodeContents(root)
  range.collapse(false)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function restoreCaretToEnd(root: HTMLElement) {
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(root)
  range.collapse(false)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function sourceOffsetToDomOffset(text: string, sourceOffset: number) {
  if (sourceOffset <= 0) return text.startsWith('\u200B') ? 1 : 0
  let visibleCharacters = 0
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '\u200B') visibleCharacters += 1
    if (visibleCharacters >= sourceOffset) return index + 1
  }
  return text.length
}
