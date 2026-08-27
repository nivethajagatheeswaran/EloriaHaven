import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

interface Props { onNavigate: (page: string) => void; dark: boolean; t: any }

type Dot = [number, number]
interface KolamPattern {
  name: string
  dots: Dot[]
  paths: string
  viewBox: string
  spacing: number
}

// Generates an authentic sikku-kolam style pattern: dots arranged in a
// rotated diamond lattice (like traditional pulli kolam grids), with a
// teardrop/petal loop woven around every dot — matching the classic
// "N dot" kolam convention rather than a square grid of bulging arcs.
function buildDiamondKolam(size: number, spacing: number, dotsCountLabel: (n: number) => string): KolamPattern {
  const dots: Dot[] = []
  const half = Math.floor(size / 2)
  const rowCounts: number[] = []
  for (let r = -half; r <= half; r++) rowCounts.push(size - Math.abs(r))

  const originX = spacing * (size / 2 + 1)
  const originY = spacing * (rowCounts.length / 2 + 0.5)

  rowCounts.forEach((count, rIdx) => {
    const rowY = originY + (rIdx - (rowCounts.length - 1) / 2) * (spacing * 0.72)
    const rowWidth = (count - 1) * spacing
    for (let c = 0; c < count; c++) {
      const x = originX - rowWidth / 2 + c * spacing
      dots.push([x, rowY])
    }
  })

  const r = spacing * 0.34
  let path = ''
  dots.forEach(([x, y]) => {
    path += `M${x},${y - r * 1.6} C ${x - r},${y - r * 0.6} ${x - r},${y + r * 0.6} ${x},${y} C ${x + r},${y - r * 0.6} ${x + r},${y - r * 0.6} ${x},${y - r * 1.6} Z `
  })
  rowCounts.forEach((count, rIdx) => {
    const before = rowCounts.slice(0, rIdx).reduce((a, b) => a + b, 0)
    const rowDots = dots.slice(before, before + count)
    for (let i = 0; i < rowDots.length - 1; i++) {
      const [x1, y1] = rowDots[i]
      const [x2, y2] = rowDots[i + 1]
      const mx = (x1 + x2) / 2
      path += `M${x1},${y1} Q ${mx},${y1 - spacing * 0.4} ${x2},${y2} `
      path += `M${x1},${y1} Q ${mx},${y1 + spacing * 0.4} ${x2},${y2} `
    }
  })

  const xs = dots.map(d => d[0])
  const ys = dots.map(d => d[1])
  const pad = spacing * 0.8
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`

  return { name: dotsCountLabel(dots.length), dots, paths: path, viewBox, spacing }
}

const PATTERNS = (t: any): KolamPattern[] => {
  const label = (n: number) => `${n} ${t.dotsLabel}`
  return [
    buildDiamondKolam(3, 55, label),
    buildDiamondKolam(4, 50, label),
    buildDiamondKolam(5, 48, label),
    buildDiamondKolam(6, 44, label),
    buildDiamondKolam(7, 40, label),
    buildDiamondKolam(8, 36, label),
  ]
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern) } catch { /* ignore unsupported */ }
  }
}

export default function KolamPage({ onNavigate, dark, t }: Props) {
  const { addTreeAction } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedPattern, setSelectedPattern] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [strokeCount, setStrokeCount] = useState(0)
  const connectedDotsRef = useRef<Set<number>>(new Set())
  const patterns = PATTERNS(t)
  const pat = patterns[selectedPattern]

  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    connectedDotsRef.current = new Set()
    setStrokeCount(0)
  }, [selectedPattern, started])

  const getPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    }
  }

  const canvasToViewBox = (pos: { x: number; y: number }, canvas: HTMLCanvasElement) => {
    const [vx, vy, vw, vh] = pat.viewBox.split(' ').map(Number)
    return {
      x: vx + (pos.x / canvas.width) * vw,
      y: vy + (pos.y / canvas.height) * vh,
    }
  }

  const checkDotProximity = (pos: { x: number; y: number }, canvas: HTMLCanvasElement) => {
    const vbPos = canvasToViewBox(pos, canvas)
    const hitRadius = pat.spacing * 0.32
    pat.dots.forEach(([dx, dy], i) => {
      if (connectedDotsRef.current.has(i)) return
      const dist = Math.hypot(vbPos.x - dx, vbPos.y - dy)
      if (dist <= hitRadius) {
        connectedDotsRef.current.add(i)
        vibrate(15)
      }
    })
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const pos = getPos(e, canvas)
    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#7c6fff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    checkDotProximity(pos, canvas)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    checkDotProximity(pos, canvas)
  }

  const endDraw = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setStrokeCount(s => s + 1)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      setStrokeCount(0)
      connectedDotsRef.current = new Set()
    }
  }

  const handleDone = () => {
    setCompleted(true)
    addTreeAction('kolam')
    vibrate([20, 40, 20])
  }

  if (completed) return (
    <div style={{ minHeight:'100vh', background: dark ? '#0d1a0d':'linear-gradient(175deg,#fffbee,#fdf5d8)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200}} style={{fontSize:64,marginBottom:16}}>🌸</motion.div>
      <div style={{fontSize:22,fontWeight:700,color:dark?'#e8f5e9':'#1a2e1a',marginBottom:6}}>{t.beautifulTitle}</div>
      <div style={{fontSize:14,color:dark?'#a5d6a7':'#5a9e6f',marginBottom:8}}>{t.completedKolam}</div>
      <div style={{fontSize:13,color:'#5a9e6f',marginBottom:28}}>{t.flowersBloomed}</div>
      <motion.button whileTap={{scale:0.97}} onClick={()=>onNavigate('relax')} style={{background:'linear-gradient(135deg,#c9a227cc,#c9a227)',color:'#fff',border:'none',borderRadius:12,padding:'13px 32px',fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:10}}>{t.backToRelaxBtn}</motion.button>
      <motion.button whileTap={{scale:0.97}} onClick={()=>{setCompleted(false);setStarted(false);setStrokeCount(0)}} style={{background:'transparent',color:'#c9a227',border:'0.5px solid #c9a227',borderRadius:12,padding:'12px 32px',fontSize:14,fontWeight:500,cursor:'pointer'}}>{t.tryAgainBtn}</motion.button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background: dark?'#0d1a0d':'linear-gradient(175deg,#fffbee 0%,#fdf5d8 55%,#fffdf5 100%)', transition:'background 0.8s ease' }}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'72px 20px 32px'}}>
        <motion.button whileTap={{scale:0.95}} onClick={()=>onNavigate('relax')} style={{background:'none',border:'none',fontSize:14,color:dark?'#a09ec0':'#8880c0',cursor:'pointer',fontWeight:500,marginBottom:20,display:'block'}}>‹ {t.backToRelaxBtn}</motion.button>

        <div style={{fontSize:22,fontWeight:700,color:dark?'#fff8e1':'#1a1a0d',marginBottom:4,letterSpacing:'-0.02em'}}>{t.kolamTitle}</div>
        <div style={{fontSize:13,color:dark?'#ffd54f':'#c9a227',marginBottom:20}}>{t.kolamSubtitle}</div>

        {!started ? (
          <>
            <div style={{fontSize:12,fontWeight:600,color:dark?'#e0e0e0':'#2d2d2d',marginBottom:10}}>{t.choosePattern}</div>
            <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
              {patterns.map((p,i) => (
                <motion.button key={i} whileTap={{scale:0.95}} onClick={()=>setSelectedPattern(i)} style={{flex:'1 0 30%',padding:'8px 4px',borderRadius:20,fontSize:11,fontWeight:selectedPattern===i?600:400,border:'0.5px solid',borderColor:selectedPattern===i?'#c9a227':'rgba(200,196,240,0.4)',background:selectedPattern===i?'rgba(201,162,39,0.12)':'transparent',color:selectedPattern===i?'#c9a227':dark?'#a09ec0':'#8880c0',cursor:'pointer'}}>
                  {p.name}
                </motion.button>
              ))}
            </div>
            <div style={{background:dark?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.85)',borderRadius:16,padding:16,marginBottom:16,border:'0.5px solid rgba(201,162,39,0.3)'}}>
              <svg viewBox={pat.viewBox} width="100%" height={180} style={{display:'block'}}>
                <path d={pat.paths} fill="none" stroke="#7c6fff" strokeWidth={1.6} opacity={0.6} strokeLinecap="round"/>
                {pat.dots.map(([cx,cy],i) => (
                  <circle key={i} cx={cx} cy={cy} r={2.6} fill="#c9a227" opacity={0.75}/>
                ))}
              </svg>
              <div style={{textAlign:'center',fontSize:10,color:dark?'#a09ec0':'#a09ec0',marginTop:4}}>{t.traceGlowing}</div>
            </div>
            <motion.button whileTap={{scale:0.97}} onClick={()=>setStarted(true)} style={{width:'100%',background:'linear-gradient(135deg,#d4a017,#c9a227)',color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(201,162,39,0.3)'}}>
              {t.startTracing}
            </motion.button>
          </>
        ) : (
          <>
            <div style={{fontSize:12,color:dark?'#ffd54f':'#c9a227',marginBottom:12,textAlign:'center'}}>{t.drawOverPattern}</div>
            <div style={{position:'relative',borderRadius:16,overflow:'hidden',border:'0.5px solid rgba(201,162,39,0.3)',background:dark?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.9)',marginBottom:16}}>
              {/* Faded guide layer — sits beneath the drawing canvas so the
                  original pattern is always visible as a soft hint while tracing */}
              <svg viewBox={pat.viewBox} width="100%" height={200} style={{position:'absolute',top:0,left:0,pointerEvents:'none'}}>
                <path d={pat.paths} fill="none" stroke="#7c6fff" strokeWidth={1.6} strokeDasharray="1 6" strokeLinecap="round" opacity={0.32}/>
                {pat.dots.map(([cx,cy],i) => (
                  <circle key={i} cx={cx} cy={cy} r={2.6} fill="#c9a227" opacity={0.45}/>
                ))}
              </svg>
              <canvas
                ref={canvasRef} width={480} height={200}
                style={{display:'block',width:'100%',height:200,touchAction:'none',position:'relative'}}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <motion.button whileTap={{scale:0.97}} onClick={clearCanvas} style={{flex:1,padding:10,borderRadius:10,border:'0.5px solid rgba(200,196,240,0.4)',background:'transparent',color:dark?'#a09ec0':'#8880c0',fontSize:12,cursor:'pointer',fontWeight:500}}>{t.clearBtn}</motion.button>
              <motion.button whileTap={{scale:0.97}} onClick={handleDone} style={{flex:2,padding:10,borderRadius:10,background:'linear-gradient(135deg,#d4a017,#c9a227)',color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600}}>{t.doneBtn}</motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}