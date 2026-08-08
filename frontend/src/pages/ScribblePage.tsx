import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'

interface Props { onNavigate: (page: string) => void; dark: boolean }

const COLORS = ['#7c6fff','#e07060','#5a9e6f','#c9a227','#ff85a1','#4fc3f7','#2d2d2d','#ffffff']
const SIZES  = [3, 6, 10, 16]

export default function ScribblePage({ onNavigate, dark }: Props) {
  const { addTreeAction } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState('#7c6fff')
  const [size, setSize] = useState(6)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState(0)
  const [saved, setSaved] = useState(false)
  const [eraser, setEraser] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.fillStyle = dark ? '#1a1a2e' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [dark])

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x:(e.touches[0].clientX-rect.left)*scaleX, y:(e.touches[0].clientY-rect.top)*scaleY }
    }
    return { x:((e as React.MouseEvent).clientX-rect.left)*scaleX, y:((e as React.MouseEvent).clientY-rect.top)*scaleY }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const pos = getPos(e)
    setIsDrawing(true)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = eraser ? (dark?'#1a1a2e':'#ffffff') : color
    ctx.lineWidth = eraser ? size * 3 : size
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.lineTo(getPos(e).x, getPos(e).y)
    ctx.stroke()
  }

  const endDraw = () => {
    setIsDrawing(false)
    setStrokes(s => s + 1)
  }

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.fillStyle = dark ? '#1a1a2e' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setStrokes(0)
  }

  const save = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const link = document.createElement('a')
    link.download = 'eloria-scribble.png'
    link.href = canvas.toDataURL()
    link.click()
    setSaved(true)
    addTreeAction('scribble')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ minHeight:'100vh', background:dark?'linear-gradient(175deg,#1a0a0a,#2a1010)':'linear-gradient(175deg,#fff3ee,#fde8df,#fdf4f0)', transition:'background 0.8s ease' }}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'72px 20px 32px'}}>
        <motion.button whileTap={{scale:0.95}} onClick={()=>onNavigate('relax')} style={{background:'none',border:'none',fontSize:14,color:dark?'#a09ec0':'#8880c0',cursor:'pointer',fontWeight:500,marginBottom:20,display:'block'}}>‹ Relax</motion.button>

        <div style={{fontSize:22,fontWeight:700,color:dark?'#ffe0d0':'#2e1a10',marginBottom:4,letterSpacing:'-0.02em'}}>Scribble Pad</div>
        <div style={{fontSize:13,color:dark?'#ffb347':'#d09060',marginBottom:16}}>Express freely. No rules here.</div>

        {/* Toolbar */}
        <div style={{background:dark?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.85)',borderRadius:12,padding:'10px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',border:'0.5px solid rgba(200,180,150,0.3)'}}>
          {COLORS.map(c => (
            <motion.button key={c} whileTap={{scale:0.85}} onClick={()=>{setColor(c);setEraser(false)}} style={{width:22,height:22,borderRadius:'50%',background:c,border:color===c&&!eraser?`3px solid ${dark?'#fff':'#333'}`:'2px solid rgba(0,0,0,0.1)',cursor:'pointer',flexShrink:0}}/>
          ))}
          <div style={{width:1,height:20,background:'rgba(0,0,0,0.1)',margin:'0 2px'}}/>
          {SIZES.map(s => (
            <motion.button key={s} whileTap={{scale:0.9}} onClick={()=>setSize(s)} style={{width:s*2+8,height:s*2+8,borderRadius:'50%',background:size===s?color:'rgba(0,0,0,0.15)',border:size===s?`2px solid ${color}`:'none',cursor:'pointer',flexShrink:0,minWidth:14,minHeight:14}}/>
          ))}
          <motion.button whileTap={{scale:0.9}} onClick={()=>setEraser(e=>!e)} style={{padding:'4px 10px',borderRadius:8,background:eraser?'rgba(224,112,96,0.15)':'transparent',border:`0.5px solid ${eraser?'#e07060':'rgba(200,180,150,0.4)'}`,color:eraser?'#e07060':dark?'#a09ec0':'#8880c0',fontSize:11,cursor:'pointer',fontWeight:500}}>Eraser</motion.button>
        </div>

        {/* Canvas */}
        <div style={{borderRadius:16,overflow:'hidden',border:`0.5px solid ${dark?'rgba(255,255,255,0.1)':'rgba(200,180,150,0.3)'}`,marginBottom:12,boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
          <canvas
            ref={canvasRef} width={480} height={320}
            style={{display:'block',width:'100%',height:240,touchAction:'none',background:dark?'#1a1a2e':'#ffffff',cursor:eraser?'cell':'crosshair'}}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:8}}>
          <motion.button whileTap={{scale:0.97}} onClick={clear} style={{flex:1,padding:11,borderRadius:10,border:'0.5px solid rgba(200,180,150,0.4)',background:'transparent',color:dark?'#a09ec0':'#8880c0',fontSize:12,cursor:'pointer',fontWeight:500}}>Clear</motion.button>
          <motion.button whileTap={{scale:0.97}} onClick={save} style={{flex:2,padding:11,borderRadius:10,background:saved?'#5a9e6f':'linear-gradient(135deg,#e07060cc,#e07060)',color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600,transition:'background 0.3s'}}>
            {saved ? '✓ Saved to device' : 'Save drawing'}
          </motion.button>
        </div>
        {strokes > 0 && <div style={{textAlign:'center',fontSize:10,color:dark?'#a09ec0':'#a09ec0',marginTop:8}}>🌳 Your scribble will bloom flowers on your Haven Tree when saved</div>}
      </div>
    </div>
  )
}