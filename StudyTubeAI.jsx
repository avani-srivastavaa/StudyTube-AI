/**
 * ⚠️ DEMO ARTIFACT — UI PREVIEW ONLY, NOT THE FULL APP
 * ─────────────────────────────────────────────────────────────────────────
 * This single file is meant for quick visual preview (e.g. as a Claude.ai
 * Artifact). It calls the Claude API directly from the browser and always
 * analyzes the SAME built-in example transcript — pasting a real YouTube
 * URL here will NOT fetch or analyze that actual video, because real
 * YouTube transcript extraction requires a server (browsers can't call
 * YouTube's caption API directly due to CORS/auth).
 *
 * For the real, production app — real transcript extraction, full-video
 * analysis with no truncation, Supabase auth + persistence — use the
 * `frontend/` + `backend/` folders instead. See README.md.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, Zap, Brain, MessageCircle, Trophy, Star, CheckCircle, XCircle, Send, Award, Flame, RotateCcw, Lightbulb, Clock, ArrowRight, Play, Layers, Copy, ChevronRight, BarChart2, Target, Map, GraduationCap, Download, RefreshCw, Cpu, Shield, Sparkles } from "lucide-react";

// ── Color System ──────────────────────────────────────────────────────────────
const C = {
  bg:'#060110', surface:'#0b0620', glass:'rgba(255,255,255,0.05)',
  border:'rgba(255,255,255,0.08)', borderBright:'rgba(255,255,255,0.15)',
  primary:'#6366f1', primaryL:'#818cf8', primaryDim:'rgba(99,102,241,0.18)',
  purple:'#7c3aed', purpleDim:'rgba(124,58,237,0.18)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,0.15)',
  green:'#10b981', greenDim:'rgba(16,185,129,0.15)',
  gold:'#f59e0b', goldDim:'rgba(245,158,11,0.15)',
  orange:'#f97316', orangeDim:'rgba(249,115,22,0.15)',
  pink:'#ec4899', pinkDim:'rgba(236,72,153,0.15)',
  red:'#ef4444', redDim:'rgba(239,68,68,0.15)',
  text:'#f1f5f9', muted:'#94a3b8', dim:'#475569',
  grad:'linear-gradient(135deg,#6366f1,#7c3aed)',
  gradText:'linear-gradient(135deg,#818cf8,#c084fc,#67e8f9)',
  gradCyan:'linear-gradient(135deg,#06b6d4,#6366f1)',
};

// ── Sample Transcript ─────────────────────────────────────────────────────────
const TRANSCRIPT = `Introduction to Machine Learning - A Complete Guide

Chapter 1: What is Machine Learning?
Machine learning is a branch of artificial intelligence where computers learn to make decisions from data, rather than being explicitly programmed with rules. There are three major paradigms: Supervised Learning (training on labeled data to learn input-output mapping, used in spam detection, image classification, price prediction), Unsupervised Learning (finding hidden patterns in unlabeled data, used in clustering and anomaly detection), and Reinforcement Learning (an agent learning through rewards and penalties, used in game AI and robotics).

Chapter 2: The Machine Learning Pipeline
Every ML project follows a structured workflow: Data Collection and Cleaning (often 70-80% of effort - real data is messy and biased), Feature Engineering (selecting and transforming useful variables), Model Selection (choosing the right algorithm - Linear Regression for continuous values, Logistic Regression for binary classification, Decision Trees for interpretable decisions, Random Forests for robust ensembles, Neural Networks for complex patterns, SVMs for high-dimensional data), Training (minimize loss via gradient descent), Evaluation (cross-validation, proper metrics), Hyperparameter Tuning (grid search, random search), and Deployment.

Chapter 3: Neural Networks and Deep Learning
Neural networks consist of layers of interconnected nodes. Deep learning uses many layers to learn hierarchical representations. CNNs excel at images - detecting edges in early layers, shapes in middle layers, objects in final layers. RNNs and LSTMs handle sequential data. Transformers (behind GPT, BERT) use attention mechanisms. Training uses backpropagation to adjust weights through gradient descent with loss minimization.

Chapter 4: Key Concepts
Overfitting: model memorizes training data, fails on new data. Fix: regularization (L1/L2), dropout, more data, simpler models. Underfitting: model too simple. Fix: more complex model, better features. The Bias-Variance Tradeoff is fundamental. Cross-validation reliably estimates real-world performance. Transfer learning reuses pre-trained models dramatically reducing data and compute requirements. Key metrics: Accuracy, Precision, Recall, F1-Score, AUC-ROC for classification; MSE, MAE, R-squared for regression.

Chapter 5: Ethics and the Future
ML systems can perpetuate and amplify biases in training data. Real examples: facial recognition performing worse on dark-skinned individuals, hiring algorithms discriminating by gender. Explainability is critical for high-stakes decisions in healthcare and finance. The future includes multimodal AI combining vision, language and audio; federated learning for privacy preservation; more efficient training requiring less data; and AI systems capable of more human-like reasoning. Always start with simple models, measure rigorously, and consider the societal implications of your work.`;

const DEMO_VIDEO = { title:"Introduction to Machine Learning - Complete Course", channel:"AI Academy", duration:"2:34:15", views:"1.2M views", id:"NWONeJKn9Kc" };

const LOAD_STEPS = [
  {label:"Extracting Transcript",icon:"📄",sub:"Parsing video captions..."},
  {label:"Understanding Content",icon:"🧠",sub:"Analyzing topics & themes..."},
  {label:"Creating Chapters",icon:"📚",sub:"Organizing into sections..."},
  {label:"Generating Smart Notes",icon:"✍️",sub:"Writing study notes..."},
  {label:"Creating Flashcard Deck",icon:"🃏",sub:"Building recall cards..."},
  {label:"Building Quiz",icon:"❓",sub:"Generating questions..."},
  {label:"Preparing AI Tutor",icon:"🤖",sub:"Initializing Nova..."},
];

const TABS = [
  {id:"notes",label:"Notes",icon:BookOpen,color:C.primary},
  {id:"flashcards",label:"Flashcards",icon:Layers,color:C.purple},
  {id:"quiz",label:"Quiz",icon:Target,color:C.cyan},
  {id:"chat",label:"AI Tutor",icon:MessageCircle,color:C.green},
  {id:"mindmap",label:"Mind Map",icon:Map,color:C.pink},
  {id:"interview",label:"Interview",icon:Award,color:C.gold},
  {id:"exam",label:"Exam Mode",icon:GraduationCap,color:C.orange},
  {id:"progress",label:"Progress",icon:BarChart2,color:C.primaryL},
];

const STUDY_MODES = [
  {id:"explorer",icon:"🗺️",label:"Explorer Mode",desc:"Unlock all features. Explore notes, cards, quiz, and chat at your own pace.",color:C.primary},
  {id:"exam",icon:"📝",label:"Exam Mode",desc:"Focused on quiz & flashcards. Track your score to exam-ready standard.",color:C.cyan},
  {id:"interview",icon:"💼",label:"Interview Mode",desc:"Practice with interview-style questions and model answers.",color:C.gold},
  {id:"revision",icon:"⚡",label:"Quick Revision",desc:"Rapid-fire notes summary and key points only. Perfect for last-minute prep.",color:C.green},
];

// ── Utilities ─────────────────────────────────────────────────────────────────
function extractVideoId(url){const m=url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);return m?m[1]:null;}
function safeJSON(t){try{return JSON.parse(t.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim());}catch{return null;}}
async function ai(prompt,max=1000){const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:max,messages:[{role:"user",content:prompt}]})});const d=await r.json();return d?.content?.[0]?.text||"";}
async function aiChat(history,system){const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system,messages:history})});const d=await r.json();return d?.content?.[0]?.text||"I'm having trouble connecting. Please try again!";}

// ── Base Components ───────────────────────────────────────────────────────────
function GradText({children,style={}}){return<span style={{background:C.gradText,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",...style}}>{children}</span>;}
function Spin({color=C.primary,size=40}){return<div style={{width:size,height:size,border:`3px solid ${color}33`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/>;}
function Pill({children,color=C.primary}){return<span style={{background:`${color}22`,color,border:`1px solid ${color}44`,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:600,letterSpacing:0.5}}>{children}</span>;}

function GlassCard({children,style={},onClick}){
  const[h,sH]=useState(false);
  return<div onClick={onClick} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
    style={{background:h&&onClick?"rgba(255,255,255,0.07)":C.glass,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:`1px solid ${h&&onClick?C.borderBright:C.border}`,borderRadius:16,padding:20,transition:"all 0.2s",cursor:onClick?"pointer":"default",...style}}>{children}</div>;
}

function XPBar({xp,level}){return(
  <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{background:C.goldDim,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"3px 10px",display:"flex",alignItems:"center",gap:5}}>
      <Star size={12} style={{color:C.gold}}/><span style={{color:C.gold,fontSize:12,fontWeight:700}}>Lv {level}</span>
    </div>
    <div style={{flex:1,background:C.border,borderRadius:100,height:5,overflow:"hidden"}}>
      <div style={{width:`${xp%100}%`,height:"100%",background:C.grad,borderRadius:100,transition:"width 0.8s ease"}}/>
    </div>
    <span style={{color:C.muted,fontSize:12,whiteSpace:"nowrap"}}>{xp} XP</span>
  </div>
);}

// ── Particles ─────────────────────────────────────────────────────────────────
function Particles(){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;const ctx=c.getContext("2d");let raf;
    const resize=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight;};resize();
    window.addEventListener("resize",resize);
    const pts=Array.from({length:55},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*1.5+.5}));
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>c.width)p.vx*=-1;if(p.y<0||p.y>c.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle="rgba(99,102,241,0.5)";ctx.fill();});
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<110){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(99,102,241,${.12*(1-d/110)})`;ctx.lineWidth=.5;ctx.stroke();}}
      raf=requestAnimationFrame(draw);
    };
    draw();return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[]);
  return<canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}/>;
}

// ── Nova Mascot ───────────────────────────────────────────────────────────────
const NOVA_TIPS = [
  "💡 Try the Flashcards tab for active recall — it's proven to boost retention by 80%!",
  "🏆 Complete the Quiz to earn +50 XP and unlock the Quiz Champion badge!",
  "🧠 Use the Mind Map to see how all concepts connect visually.",
  "💬 Ask me anything in AI Tutor — I've read the entire video for you!",
  "⚡ Interview Mode prepares you for real technical questions on this topic.",
  "📖 Export your notes to PDF and study offline anytime.",
  "🔥 Study streaks boost your XP multiplier! Come back tomorrow.",
  "🎯 Exam Mode generates the most likely exam questions from this video.",
];

function Nova({xp,tab}){
  const[open,setOpen]=useState(false);
  const[tipIdx,setTipIdx]=useState(0);
  const[bounce,setBounce]=useState(false);

  useEffect(()=>{const t=setInterval(()=>setTipIdx(i=>(i+1)%NOVA_TIPS.length),8000);return()=>clearInterval(t);},[]);
  useEffect(()=>{setBounce(true);setTimeout(()=>setBounce(false),600);},[xp]);

  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:1000,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
      {open&&(
        <div style={{background:"#0d0820",border:`1px solid ${C.purple}55`,borderRadius:16,padding:16,width:260,backdropFilter:"blur(20px)",animation:"fadeUp 0.3s ease",boxShadow:`0 20px 60px rgba(124,58,237,0.3)`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🌟</div>
            <div><div style={{fontWeight:700,fontSize:13,color:C.text}}>Nova</div><div style={{fontSize:10,color:C.green}}>● Your AI Study Coach</div></div>
          </div>
          <p style={{color:C.muted,fontSize:13,lineHeight:1.7,margin:"0 0 12px"}}>{NOVA_TIPS[tipIdx]}</p>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setTipIdx(i=>(i+1)%NOVA_TIPS.length)} style={{flex:1,background:C.primaryDim,border:`1px solid ${C.primary}44`,borderRadius:8,padding:"6px 0",color:C.primaryL,fontSize:12,cursor:"pointer",fontWeight:600}}>Next Tip ✨</button>
          </div>
        </div>
      )}
      <button onClick={()=>setOpen(o=>!o)} style={{width:52,height:52,borderRadius:"50%",background:C.grad,border:"none",cursor:"pointer",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px rgba(99,102,241,0.5)`,animation:bounce?"bounce 0.5s ease":"none",transition:"transform 0.2s",transform:open?"scale(1.1)":"scale(1)"}}>
        {open?"✕":"🌟"}
      </button>
    </div>
  );
}

// ── Mode Selector ─────────────────────────────────────────────────────────────
function ModeSelector({onSelect}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(6,1,16,0.95)",backdropFilter:"blur(20px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:560,width:"100%",animation:"fadeUp 0.4s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:12}}>🌟</div>
          <h2 style={{fontSize:26,fontWeight:900,color:C.text,marginBottom:8}}>Choose Your <GradText>Study Mode</GradText></h2>
          <p style={{color:C.muted,fontSize:14}}>Select how you'd like to learn today. You can always switch later.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {STUDY_MODES.map(m=>(
            <GlassCard key={m.id} onClick={()=>onSelect(m.id)}
              style={{border:`1px solid ${m.color}33`,cursor:"pointer",transition:"all 0.2s",padding:20}}>
              <div style={{fontSize:28,marginBottom:10}}>{m.icon}</div>
              <div style={{fontSize:15,fontWeight:700,color:m.color,marginBottom:6}}>{m.label}</div>
              <p style={{color:C.muted,fontSize:12,lineHeight:1.6,margin:0}}>{m.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────
function NotesTab({notes,onEarn}){
  const[copied,setCopied]=useState(false);
  const earned=useRef(false);
  useEffect(()=>{if(notes&&!earned.current){onEarn(25);earned.current=true;}},[notes]);

  const exportTxt=()=>{
    const content=`# ${notes?.title||"Study Notes"}\n\n## Overview\n${notes?.overview}\n\n## Key Points\n${(notes?.keyPoints||[]).map(p=>`• ${p}`).join("\n")}\n\n${(notes?.sections||[]).map(s=>`## ${s.heading}\n${s.content}\n${(s.bullets||[]).map(b=>`  • ${b}`).join("\n")}`).join("\n\n")}`;
    const blob=new Blob([content],{type:"text/plain"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="study-notes.txt";a.click();
  };

  if(!notes)return<div style={{textAlign:"center",padding:60}}><Spin/><p style={{color:C.muted,marginTop:16}}>Generating your smart notes...</p></div>;

  return(
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div><h2 style={{fontSize:20,fontWeight:800,marginBottom:6}}>{notes.title||"Study Notes"}</h2><Pill color={C.primary}>📖 {(notes.sections||[]).length} Sections</Pill></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{navigator.clipboard.writeText(notes.overview||"");setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",color:C.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6}}>{copied?<><CheckCircle size={12} style={{color:C.green}}/>Copied!</>:<><Copy size={12}/>Copy</>}</button>
          <button onClick={exportTxt} style={{background:C.primaryDim,border:`1px solid ${C.primary}44`,borderRadius:8,padding:"7px 12px",color:C.primaryL,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6}}><Download size={12}/>Export</button>
        </div>
      </div>

      <GlassCard style={{marginBottom:14,borderLeft:`3px solid ${C.cyan}`}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><Lightbulb size={13} style={{color:C.cyan}}/><span style={{fontSize:11,fontWeight:700,color:C.cyan,letterSpacing:1}}>OVERVIEW</span></div>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.8,margin:0}}>{notes.overview}</p>
      </GlassCard>

      {notes.keyPoints?.length>0&&(
        <GlassCard style={{marginBottom:14,borderLeft:`3px solid ${C.gold}`}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><Star size={13} style={{color:C.gold}}/><span style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:1}}>KEY POINTS</span></div>
          {notes.keyPoints.map((pt,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.gold,marginTop:8,flexShrink:0}}/>
              <span style={{color:C.text,fontSize:14,lineHeight:1.7}}>{pt}</span>
            </div>
          ))}
        </GlassCard>
      )}

      {(notes.sections||[]).map((sec,i)=>(
        <GlassCard key={i} style={{marginBottom:10}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:10,color:C.primaryL}}>{sec.heading}</h3>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.8,marginBottom:sec.bullets?.length?12:0}}>{sec.content}</p>
          {sec.bullets?.map((b,j)=>(
            <div key={j} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
              <ChevronRight size={13} style={{color:C.primary,marginTop:4,flexShrink:0}}/>
              <span style={{color:C.muted,fontSize:13,lineHeight:1.6}}>{b}</span>
            </div>
          ))}
        </GlassCard>
      ))}
    </div>
  );
}

// ── Flashcards Tab ────────────────────────────────────────────────────────────
function FlashcardsTab({cards,onEarn}){
  const[idx,setIdx]=useState(0);const[flip,setFlip]=useState(false);const[mastered,setMastered]=useState(new Set());const earned=useRef(false);
  if(!cards?.length)return<div style={{textAlign:"center",padding:60}}><Spin color={C.purple}/><p style={{color:C.muted,marginTop:16}}>Creating your flashcard deck...</p></div>;
  const card=cards[idx];
  const next=()=>{setFlip(false);setIdx((idx+1)%cards.length);};
  const mark=()=>{const nm=new Set(mastered);nm.add(idx);setMastered(nm);if(!earned.current&&nm.size>=Math.ceil(cards.length*.5)){onEarn(30);earned.current=true;}next();};
  return(
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h2 style={{fontSize:20,fontWeight:800,marginBottom:4}}>Flashcards</h2><span style={{color:C.muted,fontSize:13}}>{mastered.size}/{cards.length} mastered</span></div>
        <Pill color={C.purple}>🃏 {cards.length} Cards</Pill>
      </div>
      <div style={{display:"flex",gap:3,marginBottom:24,flexWrap:"wrap"}}>
        {cards.map((_,i)=><div key={i} onClick={()=>{setIdx(i);setFlip(false);}} style={{width:26,height:5,borderRadius:3,background:mastered.has(i)?C.green:i===idx?C.purple:C.border,cursor:"pointer",transition:"background 0.2s"}}/>)}
      </div>
      <div onClick={()=>setFlip(!flip)} style={{cursor:"pointer",perspective:1000,marginBottom:18,height:220}}>
        <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transform:`rotateY(${flip?180:0}deg)`,transition:"transform 0.55s ease"}}>
          <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",background:`linear-gradient(135deg,${C.surface},rgba(124,58,237,0.15))`,border:`1px solid ${C.purple}44`,borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
            <div style={{fontSize:10,fontWeight:700,color:C.purple,letterSpacing:2,marginBottom:16}}>QUESTION — TAP TO FLIP</div>
            <p style={{fontSize:17,fontWeight:600,color:C.text,textAlign:"center",lineHeight:1.5}}>{card.front}</p>
          </div>
          <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",transform:"rotateY(180deg)",background:`linear-gradient(135deg,${C.surface},rgba(16,185,129,0.15))`,border:`1px solid ${C.green}44`,borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
            <div style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:2,marginBottom:16}}>ANSWER</div>
            <p style={{fontSize:15,color:C.text,textAlign:"center",lineHeight:1.7}}>{card.back}</p>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={()=>{setIdx((idx-1+cards.length)%cards.length);setFlip(false);}} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 18px",color:C.muted,cursor:"pointer",fontSize:13}}>← Prev</button>
        {flip&&<button onClick={mark} style={{background:C.greenDim,border:`1px solid ${C.green}44`,borderRadius:10,padding:"9px 18px",color:C.green,cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Got it!</button>}
        <button onClick={()=>setFlip(!flip)} style={{background:C.purpleDim,border:`1px solid ${C.purple}44`,borderRadius:10,padding:"9px 18px",color:C.purple,cursor:"pointer",fontSize:13}}>{flip?"Hide":"Show Answer"}</button>
        <button onClick={next} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 18px",color:C.muted,cursor:"pointer",fontSize:13}}>Next →</button>
      </div>
      <p style={{textAlign:"center",color:C.dim,fontSize:12,marginTop:12}}>{idx+1} of {cards.length}</p>
    </div>
  );
}

// ── Quiz Tab ──────────────────────────────────────────────────────────────────
function QuizTab({questions,onEarn}){
  const[qi,setQi]=useState(0);const[sel,setSel]=useState(null);const[ans,setAns]=useState({});const[done,setDone]=useState(false);const earned=useRef(false);
  if(!questions?.length)return<div style={{textAlign:"center",padding:60}}><Spin color={C.cyan}/><p style={{color:C.muted,marginTop:16}}>Building your quiz...</p></div>;
  const q=questions[qi];const score=Object.entries(ans).filter(([i,a])=>questions[i]?.correct===a).length;const pct=Math.round(score/questions.length*100);
  const choose=opt=>{if(sel!==null)return;setSel(opt);setAns({...ans,[qi]:opt});};
  const nextQ=()=>{if(qi<questions.length-1){setQi(qi+1);setSel(ans[qi+1]??null);}else{setDone(true);if(!earned.current){onEarn(pct>=70?50:20);earned.current=true;}}};

  if(done){
    const g=pct>=90?{e:"🏆",l:"Outstanding!",c:C.gold}:pct>=70?{e:"🎉",l:"Great Job!",c:C.green}:{e:"💪",l:"Keep Practicing",c:C.cyan};
    return(
      <div style={{textAlign:"center",animation:"fadeUp 0.4s ease",padding:"32px 0"}}>
        <div style={{fontSize:56,marginBottom:12}}>{g.e}</div>
        <h2 style={{fontSize:26,fontWeight:900,marginBottom:6}}><GradText>{g.l}</GradText></h2>
        <div style={{fontSize:44,fontWeight:900,color:g.c,marginBottom:6}}>{pct}%</div>
        <p style={{color:C.muted,marginBottom:28}}>{score}/{questions.length} correct</p>
        <button onClick={()=>{setQi(0);setSel(null);setAns({});setDone(false);earned.current=false;}} style={{background:C.grad,border:"none",color:"#fff",padding:"11px 24px",borderRadius:10,cursor:"pointer",fontWeight:700,marginBottom:32}}>Retake Quiz</button>
        <div style={{textAlign:"left"}}>
          {questions.map((q,i)=>{const ok=ans[i]===q.correct;return(
            <GlassCard key={i} style={{marginBottom:8,borderLeft:`3px solid ${ok?C.green:C.red}`,padding:14}}>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{fontSize:14}}>{ok?"✅":"❌"}</span>
                <div><p style={{color:C.text,fontSize:13,fontWeight:600,marginBottom:4}}>{q.question}</p>
                {!ok&&<p style={{color:C.muted,fontSize:12}}>Correct: <span style={{color:C.green}}>{q.correct}</span></p>}
                {q.explanation&&<p style={{color:C.dim,fontSize:11,marginTop:4}}>{q.explanation}</p>}</div>
              </div>
            </GlassCard>
          );})}
        </div>
      </div>
    );
  }

  return(
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontSize:20,fontWeight:800}}>Quiz Challenge</h2><Pill color={C.cyan}>{qi+1}/{questions.length}</Pill></div>
      <div style={{background:C.border,borderRadius:100,height:4,marginBottom:24,overflow:"hidden"}}><div style={{width:`${qi/questions.length*100}%`,height:"100%",background:C.gradCyan,transition:"width 0.3s"}}/></div>
      <GlassCard style={{marginBottom:18,borderLeft:`3px solid ${C.cyan}`}}><p style={{fontSize:16,fontWeight:600,color:C.text,lineHeight:1.6,margin:0}}>{q.question}</p></GlassCard>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {q.options.map((opt,i)=>{
          const isSel=sel===opt,isOk=q.correct===opt,show=sel!==null;
          let bg=C.glass,brd=C.border,col=C.text;
          if(show&&isOk){bg=C.greenDim;brd=C.green+"66";col=C.green;}
          else if(show&&isSel&&!isOk){bg=C.redDim;brd=C.red+"66";col=C.red;}
          else if(isSel){bg=C.primaryDim;brd=C.primary+"66";}
          return(
            <button key={i} onClick={()=>choose(opt)} style={{background:bg,border:`1px solid ${brd}`,borderRadius:12,padding:"13px 16px",color:col,textAlign:"left",cursor:sel?"default":"pointer",fontSize:14,fontWeight:isSel||(show&&isOk)?600:400,display:"flex",alignItems:"center",gap:10,transition:"all 0.2s"}}>
              <span style={{width:24,height:24,borderRadius:"50%",background:`${brd}`,border:`1px solid ${brd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{String.fromCharCode(65+i)}</span>
              <span style={{flex:1}}>{opt}</span>
              {show&&isOk&&<CheckCircle size={15} style={{color:C.green,flexShrink:0}}/>}
              {show&&isSel&&!isOk&&<XCircle size={15} style={{color:C.red,flexShrink:0}}/>}
            </button>
          );
        })}
      </div>
      {sel&&(
        <div style={{animation:"fadeUp 0.3s ease"}}>
          {q.explanation&&<p style={{color:C.muted,fontSize:13,padding:"12px 0",lineHeight:1.7}}>💡 {q.explanation}</p>}
          <button onClick={nextQ} style={{background:C.grad,border:"none",color:"#fff",padding:"12px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14,width:"100%",marginTop:6}}>{qi<questions.length-1?"Next Question →":"See Results →"}</button>
        </div>
      )}
    </div>
  );
}

// ── Mind Map Tab ──────────────────────────────────────────────────────────────
function countLeaves(n){if(!n.children?.length)return 1;return n.children.reduce((s,c)=>s+countLeaves(c),0);}
function layoutTree(node,x,sy,ey,levelW=170){
  const leaves=countLeaves(node),y=(sy+ey)/2;
  const out={...node,x,y,leaves,children:[]};
  if(node.children?.length){let cy=sy;node.children.forEach(c=>{const cl=countLeaves(c),h=(cl/leaves)*(ey-sy);out.children.push(layoutTree(c,x+levelW,cy,cy+h,levelW));cy+=h;});}
  return out;
}
function flatTree(node,nodes=[],edges=[]){
  nodes.push(node);
  (node.children||[]).forEach(c=>{edges.push({from:node,to:c});flatTree(c,nodes,edges);});
  return{nodes,edges};
}

const BRANCH_COLORS=[C.primary,C.cyan,C.green,C.gold,C.pink,C.orange,C.purple];

function MindMapTab({mindmap,onEarn}){
  const[scale,setScale]=useState(1);const[drag,setDrag]=useState({x:0,y:0});const[dragging,setDragging]=useState(false);const[start,setStart]=useState(null);const earned=useRef(false);
  useEffect(()=>{if(mindmap&&!earned.current){onEarn(20);earned.current=true;}},[mindmap]);

  if(!mindmap)return<div style={{textAlign:"center",padding:60}}><Spin color={C.pink}/><p style={{color:C.muted,marginTop:16}}>Generating your mind map...</p></div>;

  const H=420,W=700;
  const laid=layoutTree(mindmap,60,20,H-20,180);
  const{nodes,edges}=flatTree(laid);

  // Assign colors based on top-level branch
  const colorMap={};
  (laid.children||[]).forEach((c,i)=>{
    const col=BRANCH_COLORS[i%BRANCH_COLORS.length];
    colorMap[c.label]=col;
    const setColor=(n,color)=>{colorMap[n.label]=color;(n.children||[]).forEach(ch=>setColor(ch,color));};
    setColor(c,col);
  });
  colorMap[mindmap.label||mindmap.root||"Root"]=C.primaryL;

  const getColor=label=>colorMap[label]||C.primaryL;

  return(
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h2 style={{fontSize:20,fontWeight:800,marginBottom:4}}>Mind Map</h2><p style={{color:C.muted,fontSize:13,margin:0}}>Visual knowledge tree — drag to pan, zoom to explore</p></div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setScale(s=>Math.min(s+0.2,2))} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.muted,cursor:"pointer",fontSize:14}}>+</button>
          <button onClick={()=>setScale(1)} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.muted,cursor:"pointer",fontSize:12}}>Reset</button>
          <button onClick={()=>setScale(s=>Math.max(s-0.2,0.5))} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.muted,cursor:"pointer",fontSize:14}}>−</button>
        </div>
      </div>
      <div style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden",position:"relative",height:H}}
        onMouseDown={e=>{setDragging(true);setStart({x:e.clientX-drag.x,y:e.clientY-drag.y});}}
        onMouseMove={e=>{if(dragging&&start)setDrag({x:e.clientX-start.x,y:e.clientY-start.y});}}
        onMouseUp={()=>{setDragging(false);setStart(null);}}
        onMouseLeave={()=>{setDragging(false);setStart(null);}}>
        <svg width="100%" height="100%" style={{cursor:dragging?"grabbing":"grab"}}>
          <g transform={`translate(${drag.x},${drag.y}) scale(${scale})`}>
            {edges.map((e,i)=>{
              const mx=(e.from.x+e.to.x)/2;
              const col=getColor(e.to.label);
              return<path key={i} d={`M${e.from.x},${e.from.y} C${mx},${e.from.y} ${mx},${e.to.y} ${e.to.x},${e.to.y}`} fill="none" stroke={col} strokeWidth={1.5} strokeOpacity={0.5}/>;
            })}
            {nodes.map((n,i)=>{
              const col=getColor(n.label);const isRoot=i===0;
              const label=n.label||n.root||"";
              const w=Math.max(label.length*7+20,80);const h=isRoot?38:30;
              return(
                <g key={i} transform={`translate(${n.x-w/2},${n.y-h/2})`}>
                  <rect width={w} height={h} rx={isRoot?10:8} fill={isRoot?"rgba(99,102,241,0.25)":col+"22"} stroke={col} strokeWidth={isRoot?2:1.5} strokeOpacity={0.7}/>
                  <text x={w/2} y={h/2+1} textAnchor="middle" dominantBaseline="middle" fill={isRoot?C.primaryL:col} fontSize={isRoot?13:11} fontWeight={isRoot?700:600} fontFamily="system-ui,sans-serif">{label}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>
        {(laid.children||[]).map((c,i)=><Pill key={i} color={BRANCH_COLORS[i%BRANCH_COLORS.length]}>{c.label}</Pill>)}
      </div>
    </div>
  );
}

// ── AI Tutor Tab ──────────────────────────────────────────────────────────────
function ChatTab({transcript,onEarn}){
  const[msgs,setMsgs]=useState([{role:"assistant",content:"Hi! I'm Nova 🌟 I've read the entire video and I'm ready to help. Ask me anything — explanations, examples, practice questions, or a quick summary!"}]);
  const[inp,setInp]=useState("");const[loading,setLoading]=useState(false);const bottom=useRef(null);const earned=useRef(false);
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const SYSTEM=`You are Nova, an enthusiastic AI study tutor. You have deep knowledge from this video transcript:\n\n${transcript}\n\nBe friendly, clear, and educational. Use bullet points when helpful. Give concrete examples. If asked something not in the transcript, help from general knowledge but note it.`;
  const send=async()=>{
    if(!inp.trim()||loading)return;
    const um={role:"user",content:inp.trim()};const nm=[...msgs,um];
    setMsgs(nm);setInp("");setLoading(true);
    if(!earned.current){onEarn(15);earned.current=true;}
    try{const r=await aiChat(nm.map(m=>({role:m.role,content:m.content})),SYSTEM);setMsgs([...nm,{role:"assistant",content:r}]);}
    catch{setMsgs([...nm,{role:"assistant",content:"Sorry, connection error. Please try again!"}]);}
    setLoading(false);
  };
  const suggs=["Summarize in 5 bullet points","What's overfitting?","Give me 3 practice questions","Explain gradient descent simply"];
  return(
    <div style={{display:"flex",flexDirection:"column",height:"58vh",animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",animation:"bounce 2s ease infinite",fontSize:16}}>🌟</div>
          <div><div style={{fontWeight:700,fontSize:14}}>Nova — AI Tutor</div><div style={{fontSize:11,color:C.green}}>● Online · RAG-Powered</div></div>
        </div>
        <Pill color={C.green}>Context-Aware</Pill>
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingRight:2}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"fadeUp 0.3s ease"}}>
            <div style={{maxWidth:"82%",padding:"11px 15px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?C.grad:C.glass,border:m.role==="user"?"none":`1px solid ${C.border}`,color:C.text,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{m.content}</div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:5,padding:"11px 15px",background:C.glass,border:`1px solid ${C.border}`,borderRadius:"16px 16px 16px 4px",width:"fit-content"}}>
          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.primary,animation:`bounce 1.2s ease ${i*.2}s infinite`}}/>)}
        </div>}
        <div ref={bottom}/>
      </div>
      {msgs.length<=1&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"10px 0"}}>
          {suggs.map(s=><button key={s} onClick={()=>setInp(s)} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:20,padding:"5px 12px",color:C.muted,cursor:"pointer",fontSize:12}}>{s}</button>)}
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:8,background:C.glass,border:`1px solid ${C.borderBright}`,borderRadius:12,padding:"5px 5px 5px 14px",backdropFilter:"blur(12px)"}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask Nova anything about the video..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:13,fontFamily:"inherit"}}/>
        <button onClick={send} disabled={loading||!inp.trim()} style={{background:inp.trim()?C.grad:C.border,border:"none",color:"#fff",width:36,height:36,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",flexShrink:0}}><Send size={14}/></button>
      </div>
    </div>
  );
}

// ── Interview Prep Tab ────────────────────────────────────────────────────────
function InterviewTab({interview,onEarn}){
  const[open,setOpen]=useState(null);const earned=useRef(false);
  const[loading,setLoading]=useState(false);const[items,setItems]=useState(interview);

  useEffect(()=>{if(items?.length&&!earned.current){onEarn(20);earned.current=true;}},[items]);

  const generate=async()=>{
    setLoading(true);
    try{
      const r=await ai(`Generate 6 interview questions based on this transcript.\n\nTranscript:\n${TRANSCRIPT}\n\nReturn ONLY a JSON array (no markdown):\n[{"level":"Easy|Medium|Hard","type":"Conceptual|Technical|Scenario","question":"...","answer":"detailed model answer","tip":"interviewer tip"}]\n\nCover different aspects and difficulty levels.`);
      const p=safeJSON(r);if(Array.isArray(p))setItems(p);
    }catch(e){console.error(e);}
    setLoading(false);
  };

  if(loading)return<div style={{textAlign:"center",padding:60}}><Spin color={C.gold}/><p style={{color:C.muted,marginTop:16}}>Generating interview questions...</p></div>;
  if(!items?.length)return(
    <div style={{textAlign:"center",padding:60}}>
      <div style={{fontSize:40,marginBottom:16}}>💼</div>
      <h3 style={{color:C.text,fontSize:18,fontWeight:700,marginBottom:8}}>Interview Prep Mode</h3>
      <p style={{color:C.muted,fontSize:14,marginBottom:24,lineHeight:1.7}}>Practice real interview questions generated from this video. Get model answers and expert tips.</p>
      <button onClick={generate} style={{background:C.grad,border:"none",color:"#fff",padding:"12px 28px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14}}>Generate Interview Questions</button>
    </div>
  );

  const levelColor={Easy:C.green,Medium:C.gold,Hard:C.red};
  const typeColor={Conceptual:C.primary,Technical:C.cyan,Scenario:C.purple};

  return(
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{fontSize:20,fontWeight:800,marginBottom:4}}>Interview Prep</h2><p style={{color:C.muted,fontSize:13,margin:0}}>{items.length} questions across difficulty levels</p></div>
        <button onClick={generate} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",color:C.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6}}><RefreshCw size={12}/>Regenerate</button>
      </div>
      {items.map((q,i)=>(
        <GlassCard key={i} onClick={()=>setOpen(open===i?null:i)} style={{marginBottom:10,cursor:"pointer",transition:"all 0.2s"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:28,height:28,borderRadius:8,background:C.primaryDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.primaryL,flexShrink:0}}>{i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                <Pill color={levelColor[q.level]||C.cyan}>{q.level}</Pill>
                <Pill color={typeColor[q.type]||C.primary}>{q.type}</Pill>
              </div>
              <p style={{color:C.text,fontSize:14,fontWeight:600,lineHeight:1.5,margin:0}}>{q.question}</p>
              {open===i&&(
                <div style={{marginTop:14,animation:"fadeUp 0.3s ease"}}>
                  <div style={{background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:10,padding:14,marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.green,letterSpacing:1,marginBottom:8}}>MODEL ANSWER</div>
                    <p style={{color:C.muted,fontSize:13,lineHeight:1.8,margin:0}}>{q.answer}</p>
                  </div>
                  {q.tip&&(
                    <div style={{background:C.goldDim,border:`1px solid ${C.gold}33`,borderRadius:10,padding:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:1,marginBottom:6}}>💡 INTERVIEWER TIP</div>
                      <p style={{color:C.muted,fontSize:12,lineHeight:1.7,margin:0}}>{q.tip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <ChevronRight size={16} style={{color:C.dim,transform:`rotate(${open===i?90:0}deg)`,transition:"transform 0.2s",flexShrink:0,marginTop:6}}/>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ── Exam Mode Tab ─────────────────────────────────────────────────────────────
function ExamTab({exam,onEarn}){
  const[loading,setLoading]=useState(false);const[sheet,setSheet]=useState(exam);const earned=useRef(false);
  useEffect(()=>{if(sheet&&!earned.current){onEarn(20);earned.current=true;}},[sheet]);

  const generate=async()=>{
    setLoading(true);
    try{
      const r=await ai(`Generate an exam revision sheet from this transcript.\n\nTranscript:\n${TRANSCRIPT}\n\nReturn ONLY valid JSON (no markdown):\n{"title":"...","examTips":["tip1","tip2","tip3"],"sections":[{"heading":"...","mustKnow":["concept1","concept2"],"likelyQuestions":["Q1?","Q2?"],"quickFacts":["fact1","fact2"]}],"lastMinute":["last minute point 1","last minute point 2","last minute point 3","last minute point 4","last minute point 5"]}\n\nGenerate 3-4 sections.`);
      const p=safeJSON(r);if(p)setSheet(p);
    }catch(e){console.error(e);}
    setLoading(false);
  };

  if(loading)return<div style={{textAlign:"center",padding:60}}><Spin color={C.orange}/><p style={{color:C.muted,marginTop:16}}>Generating exam revision sheet...</p></div>;
  if(!sheet)return(
    <div style={{textAlign:"center",padding:60}}>
      <div style={{fontSize:40,marginBottom:16}}>📝</div>
      <h3 style={{color:C.text,fontSize:18,fontWeight:700,marginBottom:8}}>Exam Revision Mode</h3>
      <p style={{color:C.muted,fontSize:14,marginBottom:24,lineHeight:1.7}}>Generate a focused revision sheet with must-know concepts, likely exam questions, and last-minute tips.</p>
      <button onClick={generate} style={{background:`linear-gradient(135deg,${C.orange},${C.gold})`,border:"none",color:"#fff",padding:"12px 28px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14}}>Generate Revision Sheet</button>
    </div>
  );

  return(
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h2 style={{fontSize:20,fontWeight:800,marginBottom:4}}>{sheet.title||"Exam Revision Sheet"}</h2><Pill color={C.orange}>⚡ Exam Mode</Pill></div>
        <button onClick={generate} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",color:C.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6}}><RefreshCw size={12}/>Refresh</button>
      </div>

      {sheet.examTips?.length>0&&(
        <GlassCard style={{marginBottom:14,borderLeft:`3px solid ${C.orange}`,background:C.orangeDim}}>
          <div style={{fontSize:11,fontWeight:700,color:C.orange,letterSpacing:1,marginBottom:10}}>📋 EXAM TIPS</div>
          {sheet.examTips.map((t,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:6}}><span style={{color:C.orange}}>→</span><span style={{color:C.muted,fontSize:13,lineHeight:1.6}}>{t}</span></div>)}
        </GlassCard>
      )}

      {(sheet.sections||[]).map((s,i)=>(
        <GlassCard key={i} style={{marginBottom:12}}>
          <h3 style={{fontSize:15,fontWeight:700,color:C.primaryL,marginBottom:14}}>{s.heading}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.cyan,letterSpacing:1,marginBottom:8}}>MUST KNOW</div>
              {s.mustKnow?.map((c,j)=><div key={j} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:C.cyan,fontSize:12,marginTop:2}}>✓</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{c}</span></div>)}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:1,marginBottom:8}}>LIKELY QUESTIONS</div>
              {s.likelyQuestions?.map((q,j)=><div key={j} style={{color:C.muted,fontSize:12,lineHeight:1.6,marginBottom:5,padding:"4px 8px",background:C.goldDim,borderRadius:6}}>❓ {q}</div>)}
            </div>
          </div>
          {s.quickFacts?.length>0&&(
            <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
              <div style={{fontSize:11,fontWeight:700,color:C.green,letterSpacing:1,marginBottom:8}}>⚡ QUICK FACTS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{s.quickFacts.map((f,j)=><span key={j} style={{background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:6,padding:"3px 10px",fontSize:11,color:C.green}}>{f}</span>)}</div>
            </div>
          )}
        </GlassCard>
      ))}

      {sheet.lastMinute?.length>0&&(
        <GlassCard style={{background:`linear-gradient(135deg,rgba(249,115,22,0.1),rgba(245,158,11,0.1))`,border:`1px solid ${C.orange}44`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.orange,letterSpacing:1,marginBottom:12}}>🔥 LAST MINUTE — MOST IMPORTANT</div>
          {sheet.lastMinute.map((p,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:10,padding:"8px 12px",background:"rgba(0,0,0,0.2)",borderRadius:8}}>
              <span style={{color:C.orange,fontWeight:700,fontSize:14,flexShrink:0}}>{i+1}.</span>
              <span style={{color:C.text,fontSize:14,lineHeight:1.6}}>{p}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

// ── Progress Tab ──────────────────────────────────────────────────────────────
function ProgressTab({xp,badges,startTime}){
  const level=Math.floor(xp/100)+1;
  const mins=Math.floor((Date.now()-startTime)/60000);
  const allBadges=[
    {id:"first",icon:"🎬",label:"First Video",earned:true,desc:"Analyzed your first video"},
    {id:"notes",icon:"📖",label:"Note Taker",earned:badges.has("notes"),desc:"Generated study notes"},
    {id:"cards",icon:"🃏",label:"Card Master",earned:badges.has("flashcards"),desc:"Mastered flashcards"},
    {id:"quiz",icon:"🏆",label:"Quiz Champion",earned:badges.has("quiz"),desc:"Completed a quiz"},
    {id:"chat",icon:"💬",label:"Seeker",earned:badges.has("chat"),desc:"Used the AI tutor"},
    {id:"map",icon:"🗺️",label:"Explorer",earned:badges.has("mindmap"),desc:"Explored the mind map"},
    {id:"interview",icon:"💼",label:"Pro Prepper",earned:badges.has("interview"),desc:"Practiced interviews"},
    {id:"exam",icon:"📝",label:"Exam Ready",earned:badges.has("exam"),desc:"Generated exam revision"},
  ];
  const earned=allBadges.filter(b=>b.earned);

  return(
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <h2 style={{fontSize:20,fontWeight:800,marginBottom:20}}>Your Progress</h2>
      <GlassCard style={{marginBottom:14,background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(124,58,237,0.08))",border:`1px solid ${C.primary}33`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Total XP Earned</div>
            <div style={{fontSize:40,fontWeight:900,background:C.gradText,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{xp} XP</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff",margin:"0 auto 4px"}}>{level}</div>
            <div style={{fontSize:10,color:C.muted}}>Level</div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:100,height:7,overflow:"hidden"}}>
          <div style={{width:`${xp%100}%`,height:"100%",background:C.grad,borderRadius:100,transition:"width 1s ease"}}/>
        </div>
        <p style={{color:C.dim,fontSize:11,marginTop:6}}>{100-(xp%100)} XP to Level {level+1}</p>
      </GlassCard>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
        {[
          {label:"Badges",value:earned.length,icon:"🏅",color:C.gold},
          {label:"Features",value:badges.size+1,icon:"✅",color:C.green},
          {label:"Min Studied",value:mins,icon:"⏱",color:C.cyan},
          {label:"Level",value:level,icon:"⭐",color:C.primary},
        ].map(({label,value,icon,color})=>(
          <GlassCard key={label} style={{textAlign:"center",padding:14}}>
            <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
            <div style={{fontSize:22,fontWeight:900,color}}>{value}</div>
            <div style={{fontSize:11,color:C.dim,marginTop:2}}>{label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Progress by section */}
      <GlassCard style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Activity Completion</div>
        {TABS.filter(t=>t.id!=="progress").map(t=>{
          const done=t.id==="notes"?true:badges.has(t.id);
          return(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <t.icon size={14} style={{color:t.color,flexShrink:0}}/>
              <span style={{color:C.muted,fontSize:13,flex:1}}>{t.label}</span>
              <div style={{width:100,height:5,background:C.border,borderRadius:100,overflow:"hidden"}}>
                <div style={{width:done?"100%":"0%",height:"100%",background:t.color,borderRadius:100,transition:"width 1s ease"}}/>
              </div>
              <span style={{fontSize:11,color:done?t.color:C.dim,width:24,textAlign:"right"}}>{done?"✓":"–"}</span>
            </div>
          );
        })}
      </GlassCard>

      <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>Achievements</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
        {allBadges.map(b=>(
          <GlassCard key={b.id} style={{textAlign:"center",padding:"14px 10px",opacity:b.earned?1:0.4,border:`1px solid ${b.earned?C.gold+"44":C.border}`}}>
            <div style={{fontSize:26,marginBottom:6,filter:b.earned?"none":"grayscale(1)"}}>{b.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:b.earned?C.text:C.dim,marginBottom:3}}>{b.label}</div>
            <div style={{fontSize:10,color:b.earned?C.gold:C.dim}}>{b.earned?"✓ Earned":"Locked"}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({videoData,notes,flashcards,quiz,mindmap,transcript,xp,onEarnXP,badges,startTime}){
  const[tab,setTab]=useState("notes");const vid=videoData||DEMO_VIDEO;
  const[modeChosen,setModeChosen]=useState(false);const[mode,setMode]=useState("explorer");

  const handleMode=m=>{
    setMode(m);setModeChosen(true);
    const modeTab={explorer:"notes",exam:"quiz",interview:"interview",revision:"notes"};
    setTab(modeTab[m]||"notes");
  };

  const visibleTabs=mode==="exam"?["notes","flashcards","quiz","progress"]:mode==="interview"?["notes","interview","chat","progress"]:mode==="revision"?["notes","mindmap","progress"]:TABS.map(t=>t.id);

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"system-ui,sans-serif"}}>
      {!modeChosen&&<ModeSelector onSelect={handleMode}/>}

      {/* Topbar */}
      <div style={{background:`${C.surface}cc`,backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"13px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:26,height:26,borderRadius:7,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center"}}><Zap size={12} style={{color:"#fff"}}/></div>
          <span style={{fontWeight:800,fontSize:15,background:C.gradText,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>StudyTube AI</span>
        </div>
        <div style={{flex:1,maxWidth:280,margin:"0 16px"}}><XPBar xp={xp} level={Math.floor(xp/100)+1}/></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:C.goldDim,borderRadius:8,padding:"4px 10px"}}>
            <Flame size={12} style={{color:C.gold}}/><span style={{fontSize:12,color:C.gold,fontWeight:700}}>1 Streak</span>
          </div>
          <Pill color={STUDY_MODES.find(m2=>m2.id===mode)?.color||C.primary}>{STUDY_MODES.find(m2=>m2.id===mode)?.icon} {STUDY_MODES.find(m2=>m2.id===mode)?.label}</Pill>
        </div>
      </div>

      <div style={{maxWidth:820,margin:"0 auto",padding:"20px 16px"}}>
        {/* Video Card */}
        <GlassCard style={{marginBottom:16,display:"flex",gap:14,alignItems:"center"}}>
          <img src={`https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`} alt="" onError={e=>{e.target.style.display="none";}} style={{width:96,height:66,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <h2 style={{fontSize:14,fontWeight:700,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vid.title}</h2>
            <div style={{display:"flex",gap:12,color:C.muted,fontSize:12,flexWrap:"wrap"}}>
              <span>📺 {vid.channel}</span><span>⏱ {vid.duration}</span><span>👁 {vid.views}</span>
            </div>
          </div>
          <Pill color={C.green}>✓ Analyzed</Pill>
        </GlassCard>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:18,overflowX:"auto",paddingBottom:4}}>
          {TABS.filter(t=>visibleTabs.includes(t.id)).map(({id,label,icon:Icon,color})=>(
            <button key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:10,border:`1px solid ${tab===id?color+"55":"transparent"}`,background:tab===id?`${color}18`:C.glass,color:tab===id?color:C.muted,cursor:"pointer",fontSize:12,fontWeight:tab===id?700:400,whiteSpace:"nowrap",transition:"all 0.2s",flexShrink:0}}>
              <Icon size={12}/>{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div key={tab}>
          {tab==="notes"&&<NotesTab notes={notes} onEarn={p=>{onEarnXP(p);badges.add("notes");}}/>}
          {tab==="flashcards"&&<FlashcardsTab cards={flashcards} onEarn={p=>{onEarnXP(p);badges.add("flashcards");}}/>}
          {tab==="quiz"&&<QuizTab questions={quiz} onEarn={p=>{onEarnXP(p);badges.add("quiz");}}/>}
          {tab==="chat"&&<ChatTab transcript={transcript} onEarn={p=>{onEarnXP(p);badges.add("chat");}}/>}
          {tab==="mindmap"&&<MindMapTab mindmap={mindmap} onEarn={p=>{onEarnXP(p);badges.add("mindmap");}}/>}
          {tab==="interview"&&<InterviewTab interview={null} onEarn={p=>{onEarnXP(p);badges.add("interview");}}/>}
          {tab==="exam"&&<ExamTab exam={null} onEarn={p=>{onEarnXP(p);badges.add("exam");}}/>}
          {tab==="progress"&&<ProgressTab xp={xp} badges={badges} startTime={startTime}/>}
        </div>
      </div>

      <Nova xp={xp} tab={tab}/>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
function HomePage({onStart}){
  const[url,setUrl]=useState("");const[err,setErr]=useState("");
  const handleStart=()=>{if(!url.trim()){setErr("Please paste a YouTube URL to continue");return;}onStart(url.trim());};
  const features=[
    {icon:BookOpen,title:"Smart Notes",desc:"AI-generated hierarchical notes with key points and chapter summaries",color:C.primary},
    {icon:Layers,title:"Flashcards",desc:"Auto-created flip cards with mastery tracking and rapid-fire mode",color:C.purple},
    {icon:Target,title:"Quiz Generator",desc:"MCQs, true/false, and scenario questions with instant scoring",color:C.cyan},
    {icon:MessageCircle,title:"AI Tutor",desc:"Ask anything — Nova has read the entire video and knows it deeply",color:C.green},
    {icon:Map,title:"Mind Maps",desc:"Interactive visual knowledge trees showing how concepts connect",color:C.pink},
    {icon:Award,title:"Interview Prep",desc:"Practice real-world interview questions with model answers",color:C.gold},
    {icon:GraduationCap,title:"Exam Mode",desc:"Last-minute revision sheets with must-know facts and likely questions",color:C.orange},
    {icon:Trophy,title:"Gamification",desc:"Earn XP, unlock badges, and track streaks as you learn",color:"#ec4899"},
  ];
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"system-ui,-apple-system,sans-serif",overflowX:"hidden"}}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:2px}
        input::placeholder{color:#475569}
      `}</style>
      {/* Nav */}
      <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 32px",borderBottom:`1px solid ${C.border}`,backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100,background:"rgba(6,1,16,0.8)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center"}}><Zap size={16} style={{color:"#fff"}}/></div>
          <span style={{fontWeight:900,fontSize:18,background:C.gradText,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>StudyTube AI</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Pill color={C.green}>✨ AI-Powered</Pill>
          <Pill color={C.gold}>🏆 Gamified</Pill>
          <Pill color={C.cyan}>🆓 Free</Pill>
        </div>
      </nav>

      {/* Hero */}
      <div style={{position:"relative",textAlign:"center",padding:"72px 32px 56px",overflow:"hidden"}}>
        <Particles/>
        <div style={{position:"absolute",top:-80,left:"15%",width:450,height:450,background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:40,right:"5%",width:320,height:320,background:"radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",animation:"fadeUp 0.8s ease"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:C.primaryDim,border:`1px solid ${C.primary}44`,borderRadius:100,padding:"6px 16px",marginBottom:24}}>
            <Sparkles size={13} style={{color:C.primary}}/><span style={{fontSize:12,color:C.primaryL,fontWeight:600}}>Powered by Claude AI · 8 Learning Features</span>
          </div>
          <h1 style={{fontSize:"clamp(28px,5vw,58px)",fontWeight:900,lineHeight:1.1,marginBottom:18,letterSpacing:-2}}>
            Transform YouTube Videos<br/><GradText>Into Interactive Learning</GradText>
          </h1>
          <p style={{color:C.muted,fontSize:17,maxWidth:520,margin:"0 auto 44px",lineHeight:1.8}}>
            Paste any YouTube lecture, tutorial, or podcast. Get AI-generated notes, flashcards, quizzes, mind maps, and your own AI tutor — in under 30 seconds.
          </p>
          <div style={{maxWidth:580,margin:"0 auto",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",gap:8,background:C.glass,border:`1px solid ${err?C.red:C.borderBright}`,borderRadius:14,padding:"5px 5px 5px 16px",backdropFilter:"blur(20px)"}}>
              <input value={url} onChange={e=>{setUrl(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&handleStart()} placeholder="Paste YouTube URL — e.g. https://youtube.com/watch?v=..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:14,padding:"9px 0",fontFamily:"inherit"}}/>
              <button onClick={handleStart} style={{background:C.grad,border:"none",color:"#fff",padding:"10px 22px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap"}}><Zap size={14}/>Start Learning</button>
            </div>
            {err&&<p style={{color:C.red,fontSize:13,margin:0}}>⚠ {err}</p>}
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={()=>onStart("demo")} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"8px 18px",borderRadius:10,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:7}}><Play size={13}/>Try Demo Video</button>
            </div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:40,marginTop:56,animation:"fadeUp 1s ease 0.3s both",flexWrap:"wrap"}}>
          {[["8","AI Features"],["< 30s","Setup Time"],["100%","Free to Try"],["Claude","Powered"]].map(([v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:900,background:C.gradText,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{v}</div>
              <div style={{fontSize:12,color:C.dim,marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{padding:"48px 32px",maxWidth:1060,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <h2 style={{fontSize:28,fontWeight:800,marginBottom:8}}>Everything You Need to<br/><GradText>Master Any Topic</GradText></h2>
          <p style={{color:C.muted,fontSize:14}}>8 AI-powered features that work together to create your perfect study experience</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          {features.map(({icon:Icon,title,desc,color})=>(
            <div key={title} style={{background:C.glass,border:`1px solid ${C.border}`,borderRadius:14,padding:20,backdropFilter:"blur(12px)",transition:"all 0.25s",cursor:"default"}}>
              <div style={{width:40,height:40,borderRadius:10,background:`${color}20`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}><Icon size={18} style={{color}}/></div>
              <h3 style={{fontSize:14,fontWeight:700,marginBottom:7}}>{title}</h3>
              <p style={{color:C.muted,fontSize:13,lineHeight:1.7,margin:0}}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{padding:"40px 32px",background:"rgba(99,102,241,0.04)",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:760,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontSize:26,fontWeight:800,marginBottom:36}}>How It Works</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:28}}>
            {[{n:"01",t:"Paste URL",d:"Drop any YouTube video link — lectures, tutorials, podcasts, interviews",icon:"🔗"},
              {n:"02",t:"AI Analyzes",d:"Claude reads the full transcript, understands context, and structures knowledge",icon:"🧠"},
              {n:"03",t:"Learn Smarter",d:"Access notes, quizzes, flashcards, mind maps, and your personal AI tutor",icon:"🚀"}
            ].map(({n,t,d,icon})=>(
              <div key={n} style={{textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:12}}>{icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:C.primary,letterSpacing:2,marginBottom:10}}>{n}</div>
                <h3 style={{fontSize:17,fontWeight:700,marginBottom:8}}>{t}</h3>
                <p style={{color:C.muted,fontSize:13,lineHeight:1.7}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{textAlign:"center",padding:"36px 20px",color:C.dim,fontSize:12}}>
        StudyTube AI · Built with Claude · Turn learning into an adventure
      </div>
    </div>
  );
}

// ── Loading Page ──────────────────────────────────────────────────────────────
function LoadingPage({step,videoTitle}){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:24}}>
      <div style={{width:"100%",maxWidth:500,textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:C.grad,margin:"0 auto 28px",display:"flex",alignItems:"center",justifyContent:"center",animation:"spin 3s linear infinite",boxShadow:`0 0 40px rgba(99,102,241,0.5)`}}>
          <Brain size={32} style={{color:"#fff",animation:"spin 3s linear infinite reverse"}}/>
        </div>
        <h2 style={{color:C.text,fontSize:22,fontWeight:800,marginBottom:6}}>Analyzing Your Video</h2>
        <p style={{color:C.muted,fontSize:13,marginBottom:32,lineHeight:1.7}}>
          {videoTitle||"Your video"}<br/>
          <span style={{color:C.dim,fontSize:12}}>Claude is reading the transcript and building your complete study pack...</span>
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:8,textAlign:"left"}}>
          {LOAD_STEPS.map((s,i)=>{const done=i<step,active=i===step;return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:11,background:done?C.greenDim:active?C.primaryDim:C.glass,border:`1px solid ${done?C.green+"44":active?C.primary+"44":C.border}`,transition:"all 0.4s",animation:active?"fadeUp 0.3s ease":"none"}}>
              <div style={{fontSize:18,width:26,textAlign:"center"}}>{done?"✅":active?"⏳":s.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:done?C.green:active?C.text:C.dim}}>{s.label}</div>
                {active&&<div style={{fontSize:11,color:C.muted,marginTop:2,animation:"pulse 1.5s ease infinite"}}>{s.sub}</div>}
              </div>
              {active&&<div style={{width:14,height:14,border:`2px solid ${C.primary}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>}
            </div>
          );})}
        </div>
        <div style={{marginTop:28,background:C.border,borderRadius:100,height:4,overflow:"hidden"}}>
          <div style={{width:`${step/LOAD_STEPS.length*100}%`,height:"100%",background:C.grad,borderRadius:100,transition:"width 0.6s ease"}}/>
        </div>
        <p style={{color:C.dim,fontSize:11,marginTop:10}}>{Math.round(step/LOAD_STEPS.length*100)}% complete</p>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function StudyTubeAI(){
  const[view,setView]=useState("home");
  const[videoData,setVideoData]=useState(null);
  const[step,setStep]=useState(0);
  const[notes,setNotes]=useState(null);
  const[flashcards,setFlashcards]=useState([]);
  const[quiz,setQuiz]=useState([]);
  const[mindmap,setMindmap]=useState(null);
  const[xp,setXP]=useState(0);
  const badges=useRef(new Set());
  const startTime=useRef(Date.now());

  const earnXP=useCallback(pts=>setXP(p=>p+pts),[]);

  const startLearning=async url=>{
    const vid=extractVideoId(url);
    setVideoData(vid?{...DEMO_VIDEO,id:vid}:DEMO_VIDEO);
    setView("loading");setStep(0);startTime.current=Date.now();

    const interval=setInterval(()=>setStep(p=>{if(p>=LOAD_STEPS.length-1){clearInterval(interval);return p;}return p+1;}),1050);

    try{
      const[nr,fr,qr,mr]=await Promise.all([
        ai(`Analyze this educational transcript and generate comprehensive study notes.\n\nTranscript:\n${TRANSCRIPT}\n\nReturn ONLY valid JSON (no markdown):\n{"title":"short title","overview":"2-3 sentence overview","keyPoints":["point1","point2","point3","point4","point5"],"sections":[{"heading":"heading","content":"2-3 sentences","bullets":["bullet1","bullet2","bullet3"]}]}\n\nGenerate 4-5 sections with substantive content.`),
        ai(`Create 10 educational flashcards from this transcript.\n\nTranscript:\n${TRANSCRIPT}\n\nReturn ONLY a JSON array (no markdown):\n[{"front":"clear question or concept name","back":"detailed explanation with an example if possible"}]\n\nMix conceptual and applied questions.`),
        ai(`Create 7 multiple-choice quiz questions from this transcript.\n\nTranscript:\n${TRANSCRIPT}\n\nReturn ONLY a JSON array (no markdown):\n[{"question":"clear question","options":["A option","B option","C option","D option"],"correct":"exact option text","explanation":"brief explanation why"}]\n\nMix easy/medium/hard. Ensure correct is exactly one of the options strings.`),
        ai(`Create a mind map structure from this transcript.\n\nTranscript:\n${TRANSCRIPT}\n\nReturn ONLY valid JSON (no markdown):\n{"label":"Main Topic","children":[{"label":"Branch 1","children":[{"label":"Sub-topic 1"},{"label":"Sub-topic 2"},{"label":"Sub-topic 3"}]},{"label":"Branch 2","children":[{"label":"Sub-topic 1"},{"label":"Sub-topic 2"}]}]}\n\nCreate 4-5 main branches, each with 2-4 children. Keep labels concise (2-4 words).`),
      ]);
      const pn=safeJSON(nr),pf=safeJSON(fr),pq=safeJSON(qr),pm=safeJSON(mr);
      if(pn)setNotes(pn);
      if(Array.isArray(pf))setFlashcards(pf);
      if(Array.isArray(pq))setQuiz(pq);
      if(pm)setMindmap(pm);
    }catch(e){console.error("Generation error:",e);}

    setTimeout(()=>{clearInterval(interval);setStep(LOAD_STEPS.length-1);setTimeout(()=>{setView("dashboard");setXP(10);},700);},LOAD_STEPS.length*1050+200);
  };

  if(view==="home")return<HomePage onStart={startLearning}/>;
  if(view==="loading")return<LoadingPage step={step} videoTitle={videoData?.title}/>;
  return<Dashboard videoData={videoData} notes={notes} flashcards={flashcards} quiz={quiz} mindmap={mindmap} transcript={TRANSCRIPT} xp={xp} onEarnXP={earnXP} badges={badges.current} startTime={startTime.current}/>;
}
