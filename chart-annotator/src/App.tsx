import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, Rect, Line, Group, Text, Image as FabricImage } from 'fabric'
import './App.css'

type Bias = 'Bullish' | 'Bearish'
type Tool = 'select' | 'entry' | 'sl' | 'tp1' | 'tp2' | 'tp3' | 'zone_ob' | 'zone_fvg'

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const backgroundImageRef = useRef<FabricImage | null>(null)

  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [bias, setBias] = useState<Bias>('Bullish')

  const [entryMin, setEntryMin] = useState<string>('')
  const [entryMax, setEntryMax] = useState<string>('')
  const [stopLoss, setStopLoss] = useState<string>('')
  const [tp1, setTp1] = useState<string>('')
  const [tp2, setTp2] = useState<string>('')
  const [tp3, setTp3] = useState<string>('')
  const [confidence, setConfidence] = useState<string>('70')
  const [alternate, setAlternate] = useState<string>('If price closes under SL → switch bias')

  const createdObjectsRef = useRef<{
    entry?: Rect & { label?: Text }
    sl?: Line & { label?: Text }
    tp1?: Group
    tp2?: Group
    tp3?: Group
    biasArrow?: Text
  }>({})

  const mobileCanvasWidth = useMemo(() => {
    const max = 1080
    const w = typeof window !== 'undefined' ? window.innerWidth : 1080
    return Math.min(w, max)
  }, [])

  useEffect(() => {
    const fabricCanvas = new Canvas(canvasRef.current as HTMLCanvasElement, {
      selection: true,
      backgroundColor: '#0b0e14',
      preserveObjectStacking: true,
    })
    fabricRef.current = fabricCanvas

    const handleResize = () => {
      if (!containerRef.current || !fabricRef.current) return
      const width = mobileCanvasWidth
      const height = Math.round(width * 16 / 9)
      fabricRef.current.setWidth(width)
      fabricRef.current.setHeight(height)
      fabricRef.current.renderAll()
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const onClick = (opt: any) => {
      const c = fabricRef.current
      if (!c) return
      const pointer = c.getPointer(opt.e)
      const x = pointer.x
      const y = pointer.y
      switch (activeTool) {
        case 'entry':
          addEntryZone(x, y)
          break
        case 'sl':
          addStopLossLine(y)
          break
        case 'tp1':
          addTpFlag('tp1', x, y)
          break
        case 'tp2':
          addTpFlag('tp2', x, y)
          break
        case 'tp3':
          addTpFlag('tp3', x, y)
          break
        case 'zone_ob':
          addZone(x, y, 'OB')
          break
        case 'zone_fvg':
          addZone(x, y, 'FVG')
          break
        default:
          break
      }
    }
    fabricCanvas.on('mouse:down', onClick)

    return () => {
      window.removeEventListener('resize', handleResize)
      fabricCanvas.off('mouse:down', onClick)
      fabricCanvas.dispose()
    }
  }, [activeTool, mobileCanvasWidth])

  useEffect(() => {
    updateLabels()
  }, [entryMin, entryMax, stopLoss, tp1, tp2, tp3])

  useEffect(() => {
    placeBiasArrow()
  }, [bias])

  const loadImageToCanvas = (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const url = reader.result as string
      try {
        const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' } as any)
        const c = fabricRef.current
        if (!c) return
        const targetW = c.getWidth() || mobileCanvasWidth
        const targetH = c.getHeight() || Math.round(mobileCanvasWidth * 16 / 9)

        const naturalW = img.width || (img.getElement() as any)?.width || 1
        const naturalH = img.height || (img.getElement() as any)?.height || 1
        const scale = Math.min(targetW / naturalW, targetH / naturalH)
        img.scale(scale)
        img.set({
          left: (targetW - img.getScaledWidth()) / 2,
          top: (targetH - img.getScaledHeight()) / 2,
          selectable: false,
          evented: false,
        })
        ;(c as any).backgroundImage = img
        c.renderAll()
        backgroundImageRef.current = img
      } catch (e) {
        console.error('Failed to load image', e)
      }
    }
    reader.readAsDataURL(file)
  }

  const addEntryZone = (x: number, y: number) => {
    const c = fabricRef.current
    if (!c) return
    const rect = new Rect({
      left: x - 80,
      top: y - 20,
      width: 160,
      height: 40,
      fill: 'rgba(0, 180, 90, 0.35)',
      stroke: 'rgba(0, 180, 90, 1)',
      strokeWidth: 3,
      rx: 6,
      ry: 6,
    })
    const label = new Text(labelText('ENTRY', entryMin, entryMax), {
      left: x,
      top: y,
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: 22,
      fill: '#d7ffe5',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
    })
    c.add(rect)
    c.add(label)
    ;(createdObjectsRef.current as any).entry = Object.assign(rect, { label })
    c.setActiveObject(rect)
    c.renderAll()
  }

  const addStopLossLine = (y: number) => {
    const c = fabricRef.current
    if (!c) return
    const line = new Line([0, y, (c.getWidth() || 0), y], {
      stroke: '#ff3b30',
      strokeWidth: 4,
      strokeDashArray: [10, 8],
      selectable: true,
    })
    const label = new Text(labelText('SL', stopLoss), {
      left: 8,
      top: y - 18,
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: 22,
      fill: '#ffb3af',
      fontWeight: 'bold',
      originX: 'left',
      originY: 'top',
      backgroundColor: 'rgba(255,59,48,0.1)'
    })
    c.add(line)
    c.add(label)
    ;(createdObjectsRef.current as any).sl = Object.assign(line, { label })
    c.setActiveObject(line)
    c.renderAll()
  }

  const addTpFlag = (which: 'tp1' | 'tp2' | 'tp3', x: number, y: number) => {
    const c = fabricRef.current
    if (!c) return
    const text = which.toUpperCase()
    const price = { tp1, tp2, tp3 }[which]
    const label = new Text(labelText(text, price), {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: 22,
      fill: '#cde6ff',
      fontWeight: 'bold',
      originX: 'left',
      originY: 'center',
    })
    const tag = new Rect({
      width: (label.width || 0) + 16,
      height: (label.height || 0) + 10,
      fill: 'rgba(0, 122, 255, 0.85)',
      rx: 6,
      ry: 6,
      originX: 'left',
      originY: 'center',
    })
    const group = new Group([tag, label], {
      left: x,
      top: y,
      selectable: true,
    })
    label.set({ left: 8 })
    c.add(group)
    ;(createdObjectsRef.current as any)[which] = group
    c.setActiveObject(group)
    c.renderAll()
  }

  const addZone = (x: number, y: number, kind: 'OB' | 'FVG') => {
    const c = fabricRef.current
    if (!c) return
    const color = kind === 'OB' ? 'rgba(255,165,0,0.2)' : 'rgba(255, 255, 0, 0.15)'
    const stroke = kind === 'OB' ? 'rgba(255,165,0,0.9)' : 'rgba(255, 255, 0, 0.85)'
    const rect = new Rect({
      left: x - 90,
      top: y - 24,
      width: 180,
      height: 48,
      fill: color,
      stroke,
      strokeWidth: 2,
      rx: 6,
      ry: 6,
    })
    const label = new Text(kind, {
      left: x,
      top: y,
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: 18,
      fill: '#ffffff',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
    })
    c.add(rect)
    c.add(label)
    c.renderAll()
  }

  const placeBiasArrow = () => {
    const c = fabricRef.current
    if (!c) return
    const centerX = (c.getWidth() || 0) / 2
    const centerY = (c.getHeight() || 0) / 2
    const arrow = new Text(bias === 'Bullish' ? '↑' : '↓', {
      left: centerX,
      top: centerY,
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: 80,
      fill: bias === 'Bullish' ? '#28c76f' : '#ff3b30',
      fontWeight: '900',
      originX: 'center',
      originY: 'center',
    })
    if ((createdObjectsRef.current as any).biasArrow) {
      c.remove((createdObjectsRef.current as any).biasArrow)
    }
    c.add(arrow)
    ;(createdObjectsRef.current as any).biasArrow = arrow
    c.renderAll()
  }

  const updateLabels = () => {
    const c = fabricRef.current
    if (!c) return
    const entry = (createdObjectsRef.current as any).entry as Rect & { label?: Text }
    if (entry && entry.label) {
      entry.label.set('text', labelText('ENTRY', entryMin, entryMax))
    }
    const sl = (createdObjectsRef.current as any).sl as Line & { label?: Text }
    if (sl && sl.label) {
      sl.label.set('text', labelText('SL', stopLoss))
    }
    ;(['tp1', 'tp2', 'tp3'] as const).forEach((key) => {
      const group = (createdObjectsRef.current as any)[key] as Group | undefined
      if (!group) return
      const objects: any[] = (group as any)._objects || []
      const textObj = objects.find((o) => o.type === 'text') as Text | undefined
      if (textObj) {
        const price = key === 'tp1' ? tp1 : key === 'tp2' ? tp2 : tp3
        textObj.set('text', labelText(key.toUpperCase(), price))
      }
    })
    c.renderAll()
  }

  const labelText = (label: string, a?: string, b?: string) => {
    if (a && b) return `${label} ${a} - ${b}`
    if (a) return `${label} ${a}`
    return label
  }

  const clearAll = () => {
    const c = fabricRef.current
    if (!c) return
    const bg = backgroundImageRef.current
    c.clear()
    if (bg) {
      ;(c as any).backgroundImage = bg
      c.renderAll()
    }
    createdObjectsRef.current = {}
    placeBiasArrow()
  }

  const exportPng = async () => {
    const c = fabricRef.current
    if (!c) return
    const prevSelection = (c as any).selection
    c.discardActiveObject()
    ;(c as any).selection = false
    c.renderAll()

    const dataUrl = c.toDataURL({ format: 'png', multiplier: 1 } as any)

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'annotated_chart.png'
    link.click()

    ;(c as any).selection = prevSelection
    c.renderAll()
  }

  const copySummary = async () => {
    const lines = [
      `Bias: ${bias}`,
      `Entry: ${entryMin || '?'}${entryMax ? ' - ' + entryMax : ''}`,
      `Stop Loss: ${stopLoss || '?'}`,
      'Take Profit',
      `1: ${tp1 || '?'}`,
      'Take Profit',
      `2: ${tp2 || '?'}`,
      'Take Profit',
      `3: ${tp3 || '?'}`,
      `Invalidation: ${stopLoss ? 'Below ' + stopLoss : '?'}`,
      `Confidence: ${confidence || '?'}%`,
      `Alternate: ${alternate}`,
    ]
    const summary = lines.join('\n')
    await navigator.clipboard.writeText(summary)
    alert('Summary copied to clipboard')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">Pro Chart Annotator</div>
        <div className="actions">
          <label className="button">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) loadImageToCanvas(file)
              }}
              style={{ display: 'none' }}
            />
            Upload Chart
          </label>
          <button className="button button-secondary" onClick={clearAll}>Clear</button>
          <button className="button button-primary" onClick={exportPng}>Export PNG</button>
        </div>
      </header>

      <main className="main">
        <div className="canvas-wrap" ref={containerRef}>
          <canvas ref={canvasRef} />
        </div>

        <div className="toolbar">
          <div className="toolbar-row">
            <button
              className={`tool ${activeTool === 'select' ? 'active' : ''}`}
              onClick={() => setActiveTool('select')}
            >Select</button>
            <button
              className={`tool ${activeTool === 'entry' ? 'active' : ''}`}
              onClick={() => setActiveTool('entry')}
            >Entry</button>
            <button
              className={`tool ${activeTool === 'sl' ? 'active' : ''}`}
              onClick={() => setActiveTool('sl')}
            >SL</button>
            <button
              className={`tool ${activeTool === 'tp1' ? 'active' : ''}`}
              onClick={() => setActiveTool('tp1')}
            >TP1</button>
            <button
              className={`tool ${activeTool === 'tp2' ? 'active' : ''}`}
              onClick={() => setActiveTool('tp2')}
            >TP2</button>
            <button
              className={`tool ${activeTool === 'tp3' ? 'active' : ''}`}
              onClick={() => setActiveTool('tp3')}
            >TP3</button>
          </div>
          <div className="toolbar-row">
            <button
              className={`tool ${activeTool === 'zone_ob' ? 'active' : ''}`}
              onClick={() => setActiveTool('zone_ob')}
            >OB</button>
            <button
              className={`tool ${activeTool === 'zone_fvg' ? 'active' : ''}`}
              onClick={() => setActiveTool('zone_fvg')}
            >FVG</button>
            <div className="bias-toggle">
              <span>Bias:</span>
              <button
                className={`bias ${bias === 'Bullish' ? 'on' : ''}`}
                onClick={() => setBias('Bullish')}
              >↑ Bullish</button>
              <button
                className={`bias ${bias === 'Bearish' ? 'on' : ''}`}
                onClick={() => setBias('Bearish')}
              >↓ Bearish</button>
            </div>
          </div>

          <div className="form">
            <div className="form-row">
              <label>Entry</label>
              <input inputMode="decimal" placeholder="min" value={entryMin} onChange={(e) => setEntryMin(e.target.value)} />
              <input inputMode="decimal" placeholder="max" value={entryMax} onChange={(e) => setEntryMax(e.target.value)} />
            </div>
            <div className="form-row">
              <label>SL</label>
              <input inputMode="decimal" placeholder="price" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
            </div>
            <div className="form-row">
              <label>TP1</label>
              <input inputMode="decimal" placeholder="price" value={tp1} onChange={(e) => setTp1(e.target.value)} />
            </div>
            <div className="form-row">
              <label>TP2</label>
              <input inputMode="decimal" placeholder="price" value={tp2} onChange={(e) => setTp2(e.target.value)} />
            </div>
            <div className="form-row">
              <label>TP3</label>
              <input inputMode="decimal" placeholder="price" value={tp3} onChange={(e) => setTp3(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Confidence %</label>
              <input inputMode="numeric" placeholder="70" value={confidence} onChange={(e) => setConfidence(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Alternate</label>
              <input placeholder="If price closes under SL → switch bias" value={alternate} onChange={(e) => setAlternate(e.target.value)} />
            </div>
            <div className="form-actions">
              <button className="button" onClick={copySummary}>Copy Summary</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
