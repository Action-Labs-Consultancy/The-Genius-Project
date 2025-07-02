import React, { useEffect, useRef } from 'react';
import { useInsightsStore } from './insightsStore';

export default function InsightsPostModal() {
  const { insights, selectedPostId, setShowPostModal, showPostModal } = useInsightsStore();
  const modalRef = useRef();

  useEffect(() => {
    if (!showPostModal || !insights || !selectedPostId) return;
    if (modalRef.current) modalRef.current.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowPostModal(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showPostModal, insights, selectedPostId, setShowPostModal]);

  if (!showPostModal || !insights || !selectedPostId) return null;
  const post = insights.series.perPost.find(p => p.id === selectedPostId);
  if (!post) return null;

  return (
    <div className="post-modal-backdrop" tabIndex={-1} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowPostModal(false)}>
      <div
        className="post-modal"
        ref={modalRef}
        tabIndex={0}
        style={{background:'#181818',color:'#FFD600',borderRadius:16,padding:'2rem 1.5rem',maxWidth:400,width:'95vw',textAlign:'center',boxShadow:'0 8px 32px #0005',border:'2px solid #FFD600',position:'relative'}}
        onClick={e=>e.stopPropagation()}
      >
        <button aria-label="Close" style={{position:'absolute',top:12,right:12,background:'none',border:'none',color:'#FFD600',fontSize:28,cursor:'pointer'}} onClick={()=>setShowPostModal(false)}>×</button>
        <div style={{marginBottom:16}}>
          {post.thumbnailUrl ? <img src={post.thumbnailUrl} alt="" width={96} height={96} style={{borderRadius:12}} /> : <span style={{fontSize:48}}>🖼️</span>}
        </div>
        <div style={{fontWeight:900,fontSize:20,marginBottom:8}}>{post.title}</div>
        <div style={{fontSize:14,marginBottom:8}}>{post.date}</div>
        <div style={{display:'flex',justifyContent:'space-between',margin:'12px 0'}}>
          <div style={{background:'#2196F3',color:'#fff',borderRadius:8,padding:'8px 12px',fontWeight:700}}>Reach<br/>{post.reach}</div>
          <div style={{background:'#FF1744',color:'#fff',borderRadius:8,padding:'8px 12px',fontWeight:700}}>Likes<br/>{post.likes}</div>
          <div style={{background:'#FFD600',color:'#181818',borderRadius:8,padding:'8px 12px',fontWeight:700}}>Comments<br/>{post.comments}</div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',margin:'12px 0'}}>
          <div style={{background:'#8e44ad',color:'#fff',borderRadius:8,padding:'8px 12px',fontWeight:700}}>Shares<br/>{post.shares}</div>
          <div style={{background:'#00E676',color:'#181818',borderRadius:8,padding:'8px 12px',fontWeight:700}}>Saves<br/>{post.saves}</div>
        </div>
      </div>
    </div>
  );
}
