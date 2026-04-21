import { useState, useRef } from "react";

const MAGASINS = [
  "ARGENTON SUR CREUSE","AUBIGNY S/NERE","BARBEZIEUX","BELLAC","BERGERAC","BERGERAC 2",
  "BLERE","BRESSUIRE","CHALAIS","CHALLANS","CHANTONNAY","CHATEAU RENAULT",
  "CHATELLERAULT","CHATILLON S/INDRE","CHINON","COGNAC","CONFOLENS",
  "CONTRES","CREYSSE","CUSSAC","EGLETONS","FERRIERES","FONTENAY LE COMTE",
  "ISSOUDUN","JARD SUR MER","JARDRES","JARNAC","JONZAC","LA CHATRE","LA FLOTTE EN RE",
  "LA GUERINIERE","LA SOUTERRAINE","LA VILLE AUX DAMES","LALINDE","LE FENOUILLER",
  "LES HERBIERS","LOCHES","LUCON","LUSSAC LES CHATEAUX","MARENNES",
  "MONTPON MENESTEROL","NONTRON","NOYERS SUR CHER","ORVAL","POCE SUR CISSE",
  "PONS","RIBERAC","ROCHECHOUART","ROCHEFORT","ROCHEFORT SUR MER","ROMORANTIN",
  "ROYAN","SAINT FLORENT SUR CHER","SAINT JEAN D'ANGELY","SAINTE MAURE DE TOURAINE",
  "SAINTES","SANCOINS","SAVIGNE","SELLES SUR CHER","SURGERES",
  "TERRASSON","THOUARS","UZERCHE","VENDOME","VIERZON","YZEURES/CREUSE"
];

const CATEGORIES = ["Tête de rayon","Mise en avant","Merchandising","Vitrine","Promotion","Autre"];
const CAT_COLORS = {
  "Tête de rayon":"#e74c3c","Mise en avant":"#e67e22","Merchandising":"#27ae60",
  "Vitrine":"#2980b9","Promotion":"#8e44ad","Autre":"#7f8c8d"
};

const MOD_CODE = "BRICO2026";

const fmt = (ts) => new Date(ts).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});

const compress = (dataUrl, maxPx=600, q=0.5) => new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    if (w > h && w > maxPx) { h = Math.round(h*maxPx/w); w = maxPx; }
    else if (h > maxPx) { w = Math.round(w*maxPx/h); h = maxPx; }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(img,0,0,w,h);
    resolve(c.toDataURL("image/jpeg", q));
  };
  img.src = dataUrl;
});

// Données de démonstration
const DEMO_POSTS = [
  {
    id:"demo1", magasin:"ROCHEFORT", category:"Tête de rayon",
    comment:"Belle mise en scène poêles à bois pour la saison",
    image:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=60",
    ts: Date.now()-3600000*2, likes:["CHALLANS","SAINTES"], comments:[
      {magasin:"CHALLANS", text:"Très belle présentation, on va s'en inspirer !", ts:Date.now()-3000000},
      {magasin:"SAINTES", text:"Top ! Quel chiffre de vente sur ce rayon ?", ts:Date.now()-1800000}
    ]
  },
  {
    id:"demo2", magasin:"CHALLANS", category:"Mise en avant",
    comment:"Tête de gondole chauffage électrique — résultats +18% vs N-1",
    image:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=60",
    ts: Date.now()-3600000*5, likes:["ROCHEFORT"], comments:[]
  }
];

export default function App() {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [view, setView] = useState("feed");
  const [selectedPost, setSelectedPost] = useState(null);
  const [filter, setFilter] = useState("Tous");
  const [magasinFilter, setMagasinFilter] = useState("Tous");
  const [magasin, setMagasin] = useState("");
  const [comment, setComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [notif, setNotif] = useState({msg:"",ok:true});
  const [isMod, setIsMod] = useState(false);
  const [modInput, setModInput] = useState("");
  const [showModLogin, setShowModLogin] = useState(false);
  const fileRef = useRef();

  const notify = (msg, ok=true) => { setNotif({msg,ok}); setTimeout(()=>setNotif({msg:"",ok:true}),3000); };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compress(ev.target.result);
      setPreview(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = () => {
    if (!magasin || !preview) return;
    const post = {
      id: Date.now().toString(), magasin, category, comment,
      image: preview, ts: Date.now(), likes: [], comments: []
    };
    setPosts(prev => [post, ...prev]);
    setPreview(null); setComment(""); setUploading(false); setView("feed");
    notify("✅ Photo partagée avec succès !");
  };

  const handleLike = (postId) => {
    if (!magasin) { notify("Sélectionnez votre magasin", false); return; }
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const likes = p.likes.includes(magasin) ? p.likes.filter(l=>l!==magasin) : [...p.likes, magasin];
      const updated = {...p, likes};
      if (selectedPost?.id === postId) setSelectedPost(updated);
      return updated;
    }));
  };

  const handleComment = (postId) => {
    if (!magasin || !newComment.trim()) return;
    const nc = {magasin, text:newComment.trim(), ts:Date.now()};
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const updated = {...p, comments:[...p.comments, nc]};
      if (selectedPost?.id === postId) setSelectedPost(updated);
      return updated;
    }));
    setNewComment("");
  };

  const handleDelete = (postId) => {
    if (!isMod) return;
    if (!window.confirm("Supprimer cette photo ?")) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedPost?.id === postId) setView("feed");
    notify("🗑️ Photo supprimée");
  };

  const handleModLogin = () => {
    if (modInput === MOD_CODE) {
      setIsMod(true);
      setShowModLogin(false);
      setModInput("");
      notify("✅ Mode modérateur activé");
    } else {
      notify("❌ Code incorrect", false);
    }
  };

  const filtered = posts.filter(p =>
    (filter==="Tous" || p.category===filter) &&
    (magasinFilter==="Tous" || p.magasin===magasinFilter)
  );

  return (
    <div style={{fontFamily:"'Segoe UI',sans-serif",background:"#f4f6f8",minHeight:"100vh"}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#1a3a5c 0%,#2471a3 100%)",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 16px rgba(0,0,0,0.25)"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{padding:"14px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:10,letterSpacing:2,textTransform:"uppercase"}}>Bricomarché · Centre-Ouest</div>
              <div style={{color:"#fff",fontSize:17,fontWeight:700,marginTop:1}}>📸 Bonnes Pratiques</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{ setSelectedPost(null); setView("feed"); }} style={{background:view==="feed"?"rgba(255,255,255,0.22)":"transparent",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:18,padding:"6px 14px",cursor:"pointer",fontSize:13}}>Galerie</button>
              <button onClick={()=>{ setSelectedPost(null); setView("upload"); }} style={{background:"#f39c12",border:"none",color:"#fff",borderRadius:18,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>+ Partager</button>
            </div>
          </div>
          {showModLogin && (
            <div style={{background:"rgba(0,0,0,0.35)",padding:"8px 16px",display:"flex",alignItems:"center",gap:8}}>
              <input value={modInput} onChange={e=>setModInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleModLogin()} placeholder="Code modérateur..." type="password" style={{flex:1,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"4px 10px",fontSize:12}}/>
              <button onClick={handleModLogin} style={{background:"#f39c12",border:"none",color:"#fff",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>OK</button>
              <button onClick={()=>setShowModLogin(false)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12}}>✕</button>
            </div>
          )}
          <div style={{background:"rgba(0,0,0,0.18)",padding:"8px 16px 10px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:"rgba(255,255,255,0.7)",fontSize:12,flexShrink:0}}>🏪</span>
            <select value={magasin} onChange={e=>setMagasin(e.target.value)} style={{flex:1,background:"rgba(255,255,255,0.13)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff",borderRadius:8,padding:"4px 8px",fontSize:12}}>
              <option value="" style={{color:"#333"}}>-- Choisissez votre magasin --</option>
              {MAGASINS.map(m=><option key={m} value={m} style={{color:"#333"}}>{m}</option>)}
            </select>
            {magasin && <span style={{fontSize:16}}>✅</span>}
            <button onClick={()=>isMod?setIsMod(false):setShowModLogin(v=>!v)} style={{background:isMod?"#e74c3c":"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"3px 8px",cursor:"pointer",fontSize:10,flexShrink:0}}>
              {isMod?"🔓 MOD":"🔐"}
            </button>
          </div>
        </div>
      </div>

      {/* NOTIF */}
      {notif.msg && (
        <div style={{position:"fixed",top:105,left:"50%",transform:"translateX(-50%)",background:notif.ok?"#1e8449":"#922b21",color:"#fff",padding:"10px 22px",borderRadius:24,zIndex:999,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.3)",maxWidth:"85%",textAlign:"center"}}>
          {notif.msg}
        </div>
      )}

      <div style={{maxWidth:680,margin:"0 auto",padding:"14px 12px 80px"}}>

        {/* ====== UPLOAD ====== */}
        {view==="upload" && (
          <div style={{background:"#fff",borderRadius:18,padding:22,boxShadow:"0 2px 16px rgba(0,0,0,0.08)"}}>
            <h2 style={{margin:"0 0 18px",color:"#1a3a5c",fontSize:17}}>📤 Partager une bonne pratique</h2>
            {!magasin && <div style={{background:"#fef9e7",border:"1px solid #f39c12",borderRadius:10,padding:12,marginBottom:16,fontSize:13,color:"#7d6608"}}>⚠️ Sélectionnez d'abord votre magasin en haut</div>}

            <div onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${preview?"#27ae60":"#2471a3"}`,borderRadius:14,padding:preview?8:36,textAlign:"center",cursor:"pointer",background:preview?"#f0fff4":"#f5faff",marginBottom:16}}>
              {preview ? (
                <><img src={preview} alt="preview" style={{maxWidth:"100%",maxHeight:250,borderRadius:10,objectFit:"contain"}}/><div style={{color:"#27ae60",fontSize:12,marginTop:6}}>✓ Appuyer pour changer</div></>
              ) : (
                <><div style={{fontSize:44}}>📷</div><div style={{color:"#2471a3",fontWeight:700,fontSize:15,marginTop:8}}>Choisir une photo</div><div style={{color:"#aaa",fontSize:12,marginTop:4}}>Galerie ou appareil photo</div></>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:700,color:"#444",display:"block",marginBottom:8}}>Catégorie</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {CATEGORIES.map(c=>(
                  <button key={c} onClick={()=>setCategory(c)} style={{padding:"6px 14px",borderRadius:20,border:`2px solid ${category===c?CAT_COLORS[c]:"#e0e0e0"}`,background:category===c?CAT_COLORS[c]:"#fff",color:category===c?"#fff":"#555",fontSize:12,cursor:"pointer",fontWeight:category===c?700:400}}>{c}</button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:13,fontWeight:700,color:"#444",display:"block",marginBottom:8}}>Commentaire <span style={{fontWeight:400,color:"#aaa"}}>(optionnel)</span></label>
              <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Décrivez votre initiative..." style={{width:"100%",border:"1px solid #ddd",borderRadius:10,padding:"10px 12px",fontSize:14,resize:"vertical",minHeight:70,boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>

            <button onClick={handlePost} disabled={!magasin||!preview||uploading} style={{width:"100%",padding:15,borderRadius:12,border:"none",background:!magasin||!preview?"#ccc":"linear-gradient(135deg,#1a3a5c,#2471a3)",color:"#fff",fontSize:15,fontWeight:700,cursor:!magasin||!preview?"not-allowed":"pointer"}}>
              {uploading?"⏳ Partage en cours...":"📤 Partager avec la région"}
            </button>
          </div>
        )}

        {/* ====== FEED ====== */}
        {view==="feed" && (
          <>
            <div style={{background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:14,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:10,marginBottom:10}}>
                {["Tous",...CATEGORIES].map(c=>(
                  <button key={c} onClick={()=>setFilter(c)} style={{padding:"5px 13px",borderRadius:18,flexShrink:0,border:`1.5px solid ${filter===c?(CAT_COLORS[c]||"#1a3a5c"):"#e0e0e0"}`,background:filter===c?(CAT_COLORS[c]||"#1a3a5c"):"#fff",color:filter===c?"#fff":"#666",fontSize:12,cursor:"pointer",fontWeight:filter===c?700:400}}>{c}</button>
                ))}
              </div>
              <select value={magasinFilter} onChange={e=>setMagasinFilter(e.target.value)} style={{width:"100%",border:"1px solid #e0e0e0",borderRadius:8,padding:"7px 10px",fontSize:12,color:"#444"}}>
                <option value="Tous">🏪 Tous les magasins</option>
                {MAGASINS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              <div style={{marginTop:8,fontSize:11,color:"#aaa",textAlign:"right"}}>{filtered.length} photo{filtered.length!==1?"s":""}</div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {filtered.map(post=>(
                <div key={post.id} style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
                  <div style={{padding:"12px 14px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:700,color:"#1a3a5c",fontSize:14}}>🏪 {post.magasin}</div>
                      <div style={{fontSize:11,color:"#bbb",marginTop:1}}>{fmt(post.ts)}</div>
                    </div>
                    <span style={{background:CAT_COLORS[post.category]+"22",color:CAT_COLORS[post.category],fontSize:11,padding:"3px 10px",borderRadius:12,fontWeight:700}}>{post.category}</span>
                  </div>
                  <img src={post.image} alt="" onClick={()=>{setSelectedPost(post);setView("detail");}} style={{width:"100%",maxHeight:300,objectFit:"cover",cursor:"pointer",display:"block"}}/>
                  {post.comment && <div style={{padding:"10px 14px 0",fontSize:13,color:"#444"}}><b>{post.magasin}</b> {post.comment}</div>}
                  <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:16,borderTop:"1px solid #f5f5f5",marginTop:8}}>
                    <button onClick={()=>handleLike(post.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:post.likes.includes(magasin)?"#e74c3c":"#bbb",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                      {post.likes.includes(magasin)?"❤️":"🤍"} {post.likes.length}
                    </button>
                    <button onClick={()=>{setSelectedPost(post);setView("detail");}} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:"#bbb",fontSize:14,display:"flex",alignItems:"center",gap:5}}>
                      💬 {post.comments.length}
                    </button>
                    <span style={{marginLeft:"auto",color:"#ccc",fontSize:11}}>Voir les détails →</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ====== DETAIL ====== */}
        {view==="detail" && selectedPost && (
          <div>
            <button onClick={()=>setView("feed")} style={{background:"none",border:"none",color:"#2471a3",cursor:"pointer",fontSize:14,fontWeight:700,marginBottom:12,padding:0}}>← Retour</button>
            <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
              <div style={{padding:"14px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,color:"#1a3a5c",fontSize:15}}>🏪 {selectedPost.magasin}</div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:1}}>{fmt(selectedPost.ts)}</div>
                </div>
                <span style={{background:CAT_COLORS[selectedPost.category]+"22",color:CAT_COLORS[selectedPost.category],fontSize:11,padding:"3px 10px",borderRadius:12,fontWeight:700}}>{selectedPost.category}</span>
              </div>
              <img src={selectedPost.image} alt="" style={{width:"100%",objectFit:"contain",maxHeight:380,display:"block"}}/>
              {selectedPost.comment && <div style={{padding:"12px 16px 0",fontSize:14,color:"#444"}}><b>{selectedPost.magasin}</b> {selectedPost.comment}</div>}
              <div style={{padding:"10px 16px",borderBottom:"1px solid #f5f5f5",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button onClick={()=>handleLike(selectedPost.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:selectedPost.likes.includes(magasin)?"#e74c3c":"#bbb",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                  {selectedPost.likes.includes(magasin)?"❤️":"🤍"} {selectedPost.likes.length} j'aime
                </button>
                {isMod && <button onClick={()=>handleDelete(selectedPost.id)} style={{background:"#fdecea",border:"1px solid #e74c3c",color:"#e74c3c",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑️ Supprimer</button>}
              </div>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontWeight:700,color:"#333",marginBottom:14,fontSize:14}}>💬 {selectedPost.comments.length} commentaire{selectedPost.comments.length!==1?"s":""}</div>
                {selectedPost.comments.length===0 && <div style={{color:"#ccc",fontSize:13,textAlign:"center",padding:"8px 0 14px"}}>Soyez le premier à commenter</div>}
                {selectedPost.comments.map((c,i)=>(
                  <div key={i} style={{marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:"#1a3a5c",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{c.magasin.substring(0,3)}</div>
                    <div style={{background:"#f5f7fa",borderRadius:"0 12px 12px 12px",padding:"8px 12px",flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#1a3a5c"}}>{c.magasin}</div>
                      <div style={{fontSize:13,color:"#444",marginTop:3}}>{c.text}</div>
                      <div style={{fontSize:10,color:"#ccc",marginTop:4}}>{fmt(c.ts)}</div>
                    </div>
                  </div>
                ))}
                {magasin ? (
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <input value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleComment(selectedPost.id)} placeholder="Votre commentaire..." style={{flex:1,border:"1.5px solid #e0e0e0",borderRadius:24,padding:"9px 16px",fontSize:13,outline:"none"}}/>
                    <button onClick={()=>handleComment(selectedPost.id)} style={{background:"#1a3a5c",color:"#fff",border:"none",borderRadius:24,padding:"9px 16px",cursor:"pointer",fontSize:14,fontWeight:700}}>→</button>
                  </div>
                ) : (
                  <div style={{color:"#e67e22",fontSize:13,marginTop:8}}>⚠️ Sélectionnez votre magasin pour commenter</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
