import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

interface Props { onNavigate: (page: string) => void; dark: boolean }

// Kolam dot patterns — [cx, cy] coordinates
const PATTERNS = [
  {
    name: 'Simple', dots: [
      [80,60],[120,60],[160,60],
      [60,100],[100,100],[140,100],[180,100],
      [80,140],[120,140],[160,140],
    ] as [number,number][],
    paths: "M80,60 L160,60 M60,100 L180,100 M80,140 L160,140 M80,60 L60,100 L80,140 M120,60 L100,100 L120,140 M160,60 L180,100 L160,140 M120,60 L140,100 M120,140 L100,100",
    viewBox: "40 40 200 120",
  },
  {
    name: 'Flower', dots: [
      [120,80],[120,160],
      [80,120],[160,120],
      [88,88],[152,88],[88,152],[152,152],
      [120,120],
    ] as [number,number][],
    paths: "M120,80 Q152,88 160,120 Q152,152 120,160 Q88,152 80,120 Q88,88 120,80 M120,80 L120,160 M80,120 L160,120 M88,88 L152,152 M152,88 L88,152",
    viewBox: "60 60 120 120",
  },
  {
    name: 'Star', dots: [
      [120,60],[150,105],[200,105],[162,135],[177,180],[120,150],[63,180],[78,135],[40,105],[90,105],
    ] as [number,number][],
    paths: "M120,60 L150,105 L200,105 L162,135 L177,180 L120,150 L63,180 L78,135 L40,105 L90,105 Z",
    viewBox: "30 50 200 140",
  },
]

export default function KolamPage({ onNavigate, dark }: Props) {
  const { addTreeAction } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedPattern, setSelectedPattern] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [strokeCount, setStrokeCount] = useState(0)
  const pat = PATTERNS[selectedPattern]

  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDraw = () => {
    setIsDrawing(false)
    setStrokeCount(s => {
      const next = s + 1
      if (next >= 5) {
        const s = Math.min(100, 60 + next * 4)
        setScore(s)
        setCompleted(true)
        addTreeAction('kolam')
      }
      return next
    })
  }

  if (completed) return (
    <div style={{ minHeight:'100vh', background: dark ? '#0d1a0d':'linear-gradient(175deg,#fffbee,#fdf5d8)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200}} style={{fontSize:64,marginBottom:16}}>🌸</motion.div>
      <div style={{fontSize:22,fontWeight:700,color:dark?'#e8f5e9':'#1a2e1a',marginBottom:6}}>Beautiful!</div>
      <div style={{fontSize:14,color:dark?'#a5d6a7':'#5a9e6f',marginBottom:8}}>You completed the kolam</div>
      <div style={{fontSize:13,color:'#5a9e6f',marginBottom:28}}>🌳 Flowers bloomed on your Haven Tree</div>
      <motion.button whileTap={{scale:0.97}} onClick={()=>onNavigate('relax')} style={{background:'linear-gradient(135deg,#c9a227cc,#c9a227)',color:'#fff',border:'none',borderRadius:12,padding:'13px 32px',fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:10}}>Back to Relax</motion.button>
      <motion.button whileTap={{scale:0.97}} onClick={()=>{setCompleted(false);setStarted(false);setStrokeCount(0)}} style={{background:'transparent',color:'#c9a227',border:'0.5px solid #c9a227',borderRadius:12,padding:'12px 32px',fontSize:14,fontWeight:500,cursor:'pointer'}}>Try again</motion.button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background: dark?'#0d1a0d':'linear-gradient(175deg,#fffbee 0%,#fdf5d8 55%,#fffdf5 100%)', transition:'background 0.8s ease' }}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'72px 20px 32px'}}>
        <motion.button whileTap={{scale:0.95}} onClick={()=>onNavigate('relax')} style={{background:'none',border:'none',fontSize:14,color:dark?'#a09ec0':'#8880c0',cursor:'pointer',fontWeight:500,marginBottom:20,display:'block'}}>‹ Relax</motion.button>

        <div style={{fontSize:22,fontWeight:700,color:dark?'#fff8e1':'#1a1a0d',marginBottom:4,letterSpacing:'-0.02em'}}>Kolam Therapy</div>
        <div style={{fontSize:13,color:dark?'#ffd54f':'#c9a227',marginBottom:20}}>Focus on the pattern. Let your mind settle.</div>

        {!started ? (
          <>
            <div style={{fontSize:12,fontWeight:600,color:dark?'#e0e0e0':'#2d2d2d',marginBottom:10}}>Choose a pattern</div>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              {PATTERNS.map((p,i) => (
                <motion.button key={i} whileTap={{scale:0.95}} onClick={()=>setSelectedPattern(i)} style={{flex:1,padding:'8px 4px',borderRadius:20,fontSize:11,fontWeight:selectedPattern===i?600:400,border:'0.5px solid',borderColor:selectedPattern===i?'#c9a227':'rgba(200,196,240,0.4)',background:selectedPattern===i?'rgba(201,162,39,0.12)':'transparent',color:selectedPattern===i?'#c9a227':dark?'#a09ec0':'#8880c0',cursor:'pointer'}}>
                  {p.name}
                </motion.button>
              ))}
            </div>
            <div style={{background:dark?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.85)',borderRadius:16,padding:16,marginBottom:16,border:'0.5px solid rgba(201,162,39,0.3)'}}>
              <svg viewBox={pat.viewBox} width="100%" height={180} style={{display:'block'}}>
                {pat.dots.map(([cx,cy],i) => (
                  <circle key={i} cx={cx} cy={cy} r={4} fill="#c9a227" opacity={0.5}/>
                ))}
                <path d={pat.paths} fill="none" stroke="#7c6fff" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.6} strokeLinecap="round"/>
              </svg>
              <div style={{textAlign:'center',fontSize:10,color:dark?'#a09ec0':'#a09ec0',marginTop:4}}>Trace the glowing pattern above</div>
            </div>
            <motion.button whileTap={{scale:0.97}} onClick={()=>setStarted(true)} style={{width:'100%',background:'linear-gradient(135deg,#d4a017,#c9a227)',color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(201,162,39,0.3)'}}>
              Start tracing
            </motion.button>
          </>
        ) : (
          <>
            <div style={{fontSize:12,color:dark?'#ffd54f':'#c9a227',marginBottom:12,textAlign:'center'}}>Draw over the pattern with your finger</div>
            <div style={{position:'relative',borderRadius:16,overflow:'hidden',border:'0.5px solid rgba(201,162,39,0.3)',background:dark?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.9)',marginBottom:16}}>
              <svg viewBox={pat.viewBox} width="100%" height={200} style={{position:'absolute',top:0,left:0,pointerEvents:'none'}}>
                {pat.dots.map(([cx,cy],i) => (
                  <circle key={i} cx={cx} cy={cy} r={4} fill="#c9a227" opacity={0.4}/>
                ))}
                <path d={pat.paths} fill="none" stroke="#7c6fff" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.4} strokeLinecap="round"/>
              </svg>
              <canvas
                ref={canvasRef} width={480} height={200}
                style={{display:'block',width:'100%',height:200,touchAction:'none'}}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <motion.button whileTap={{scale:0.97}} onClick={()=>{const canvas=canvasRef.current;if(canvas){const ctx=canvas.getContext('2d');ctx?.clearRect(0,0,canvas.width,canvas.height);setStrokeCount(0)}}} style={{flex:1,padding:10,borderRadius:10,border:'0.5px solid rgba(200,196,240,0.4)',background:'transparent',color:dark?'#a09ec0':'#8880c0',fontSize:12,cursor:'pointer',fontWeight:500}}>Clear</motion.button>
              <motion.button whileTap={{scale:0.97}} onClick={()=>{setCompleted(true);addTreeAction('kolam')}} style={{flex:2,padding:10,borderRadius:10,background:'linear-gradient(135deg,#d4a017,#c9a227)',color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600}}>Done ✓</motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}