import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN SUPABASE
// Reemplaza estos valores con los de tu proyecto en supabase.com
// ═══════════════════════════════════════════════════════════════════════
const SUPABASE_URL  = "https://yualqthoonzgemssiagf.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YWxxdGhvb256Z2Vtc3NpYWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzI1NzMsImV4cCI6MjA5Njk0ODU3M30.jtS9DjSnSudRigjc_l2Uj_Itm-sPeBHtJHK64T4J6ik";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ═══════════════════════════════════════════════════════════════════════
// CATÁLOGOS
// ═══════════════════════════════════════════════════════════════════════
const MUNICIPIOS_PR = ["Adjuntas","Aguada","Aguadilla","Aguas Buenas","Aibonito","Añasco","Arecibo","Arroyo","Barceloneta","Barranquitas","Bayamón","Cabo Rojo","Caguas","Camuy","Canóvanas","Carolina","Cataño","Cayey","Ceiba","Ciales","Cidra","Coamo","Comerío","Corozal","Culebra","Dorado","Fajardo","Florida","Guánica","Guayama","Guayanilla","Guaynabo","Gurabo","Hatillo","Hormigueros","Humacao","Isabela","Jayuya","Juana Díaz","Juncos","Lajas","Lares","Las Marías","Las Piedras","Loíza","Luquillo","Manatí","Maricao","Maunabo","Mayagüez","Moca","Morovis","Naguabo","Naranjito","Orocovis","Patillas","Peñuelas","Ponce","Quebradillas","Rincón","Río Grande","Sabana Grande","Salinas","San Germán","San Juan","San Lorenzo","San Sebastián","Santa Isabel","Toa Alta","Toa Baja","Trujillo Alto","Utuado","Vega Alta","Vega Baja","Vieques","Villalba","Yabucoa","Yauco"];

const HERRAMIENTAS = [
  { id:"cortadora_gas",  label:"Cortadora gas",      icon:"⛽", cat:"Corte" },
  { id:"cortadora_elec", label:"Cortadora eléctrica", icon:"🔌", cat:"Corte" },
  { id:"cortadora_ride", label:"Ride-on mower",       icon:"🚜", cat:"Corte" },
  { id:"trimer",         label:"Trimmer / Weed eater",icon:"〰️", cat:"Borde" },
  { id:"bordeadora",     label:"Bordeadora manual",   icon:"✂️", cat:"Borde" },
  { id:"soplador_gas",   label:"Soplador gas",        icon:"💨", cat:"Limpieza" },
  { id:"soplador_elec",  label:"Soplador eléctrico",  icon:"🌀", cat:"Limpieza" },
  { id:"rastrillo",      label:"Rastrillo",           icon:"🍂", cat:"Limpieza" },
  { id:"podadora_setos", label:"Podadora setos",      icon:"🌳", cat:"Poda" },
  { id:"motosierra",     label:"Motosierra",          icon:"🪚", cat:"Poda" },
  { id:"camion",         label:"Camión / Trailer",    icon:"🚛", cat:"Transporte" },
];
const EXTRAS = [
  { id:"bordes", label:"Bordes & contornos", precio:15, icon:"✂️" },
  { id:"hojas",  label:"Recoger hojas",      precio:10, icon:"🍂" },
  { id:"soplado",label:"Soplado de áreas",   precio:8,  icon:"💨" },
  { id:"setos",  label:"Poda de setos",      precio:20, icon:"🌳" },
];
const ESTRUCTURA_M2 = { residencial:111, comercial:260, vacant:0 };
const METODOS_PAGO = [
  { id:"ath",    label:"ATH Móvil",  icon:"💳", color:"#0047AB", desc:"Transferencia instantánea" },
  { id:"paypal", label:"PayPal",     icon:"🅿️", color:"#003087", desc:"Paga con tu cuenta PayPal" },
  { id:"cash",   label:"Cash",       icon:"💵", color:"#2d6a4f", desc:"Pago en efectivo al proveedor" },
];
const PR_CENTER = { lat:18.2208, lng:-66.5901 };
const MUNICIPIO_COORDS = {
  "San Juan":{ lat:18.4655, lng:-66.1057 }, "Bayamón":{ lat:18.3794, lng:-66.1636 },
  "Carolina":{ lat:18.3805, lng:-65.9538 }, "Caguas":{ lat:18.2342, lng:-66.0356 },
  "Ponce":{ lat:18.0113, lng:-66.6140 },    "Mayagüez":{ lat:18.2011, lng:-67.1397 },
  "Arecibo":{ lat:18.4721, lng:-66.7154 },  "Guaynabo":{ lat:18.3978, lng:-66.1103 },
  "Toa Baja":{ lat:18.4441, lng:-66.2527 }, "Trujillo Alto":{ lat:18.3622, lng:-65.9766 },
};
function getMunicipioCoords(mun) {
  return MUNICIPIO_COORDS[mun] || { lat: PR_CENTER.lat+(Math.random()-.5)*.8, lng: PR_CENTER.lng+(Math.random()-.5)*1.2 };
}

// ═══════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════
function m2ToSqft(m2) { return m2 * 10.7639; }
function calcularPrecio(sqft) { return Math.min(Math.max(Math.round(sqft * 0.018), 35), 180); }

async function fetchParcelaArea() {
  try {
    const url = `https://sigejp.pr.gov/server/rest/services/crim/crim_parcelas/MapServer/0/query?where=TIPO%3D%27P%27&outFields=OBJECTID%2C%22SHAPE.STArea()%22%2CNUM_CATASTRO&returnGeometry=false&f=json&resultRecordCount=5`;
    const r = await fetch(url);
    const d = await r.json();
    const f = d.features?.find(x => x.attributes["SHAPE.STArea()"] > 0);
    if (f) return { areM2: f.attributes["SHAPE.STArea()"], catastro: f.attributes["NUM_CATASTRO"]||"N/D", fuente:"CRIM" };
  } catch {}
  return { areM2: 560+Math.random()*440, catastro:"Estimado", fuente:"Promedio PR" };
}

// ═══════════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════════
const C = { verde:"#1b4332", verde2:"#2d6a4f", verde3:"#40916c", verde4:"#52b788", verde5:"#74c69d", bg:"#f0f7f2", card:"#ffffff", borde:"#d1e8d8", gris:"#8faa94", texto:"#1b2e1f" };
const ST = {
  card:  { background:C.card, borderRadius:20, padding:"16px 18px", marginBottom:14, boxShadow:"0 2px 14px #00000010" },
  label: { display:"block", fontSize:11, fontWeight:700, color:C.verde3, marginBottom:5, textTransform:"uppercase", letterSpacing:.8 },
  input: { width:"100%", boxSizing:"border-box", border:`1.5px solid ${C.borde}`, borderRadius:12, padding:"11px 14px", fontSize:14, color:C.texto, background:"#f8fdf9", outline:"none", fontFamily:"inherit" },
  btnG:  (c=C.verde2) => ({ width:"100%", background:c, color:"#fff", border:"none", borderRadius:14, padding:"14px 0", fontWeight:800, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }),
  sec:   { fontWeight:800, fontSize:15, color:C.texto, marginBottom:10 },
};

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTES COMPARTIDOS
// ═══════════════════════════════════════════════════════════════════════
function Spinner({ size=18, color="#52b788" }) {
  return <div style={{ width:size, height:size, border:`3px solid ${color}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", flexShrink:0 }} />;
}
function Stars({ v=5, size=13 }) {
  return <span style={{ color:"#f4a261", fontWeight:700, fontSize:size }}>★ {Number(v).toFixed(1)}</span>;
}
function BackHeader({ onBack, title, sub, right }) {
  return (
    <div style={{ background:C.verde, padding:"20px 20px 18px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:1100 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:C.verde5, fontSize:22, cursor:"pointer", padding:0, lineHeight:1 }}>←</button>
      <div style={{ flex:1 }}><div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>{title}</div>{sub&&<div style={{ color:C.verde5, fontSize:12 }}>{sub}</div>}</div>
      {right}
    </div>
  );
}
function BellBadge({ count, onClick }) {
  return (
    <button onClick={onClick} style={{ position:"relative", background:"none", border:"none", cursor:"pointer", padding:"4px 6px" }}>
      <span style={{ fontSize:22 }}>🔔</span>
      {count>0&&<span style={{ position:"absolute", top:0, right:0, background:"#e63946", color:"#fff", borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800 }}>{count}</span>}
    </button>
  );
}
function Tag({ label, icon, color=C.verde2 }) {
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:`${color}18`, color, border:`1px solid ${color}33`, borderRadius:8, padding:"3px 9px", fontSize:12, fontWeight:600, marginRight:6, marginBottom:6 }}>{icon} {label}</span>;
}
function FotoAvatar({ url, avatar, size=46, color=C.verde2 }) {
  if (url) return <img src={url} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:`2px solid ${color}33` }}/>;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:Math.round(size*.4), flexShrink:0 }}>{avatar}</div>;
}

// ─── Mapa con Leaflet ───────────────────────────────────────────────
function MapaParcela({ municipio, direccion, lat, lng }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const coords = { lat: lat||getMunicipioCoords(municipio).lat, lng: lng||getMunicipioCoords(municipio).lng };
  useEffect(() => {
    if (!mapRef.current) return;
    const load = async () => {
      if (!window.L) {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id="leaflet-css"; link.rel="stylesheet";
          link.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
          document.head.appendChild(link);
        }
        await new Promise((res,rej)=>{ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      }
      const L = window.L;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current=null; }
      const map = L.map(mapRef.current,{ zoomControl:true, attributionControl:false }).setView([coords.lat,coords.lng],17);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{ maxZoom:19 }).addTo(map);
      const icon = L.divIcon({ className:"", iconSize:[36,36], iconAnchor:[18,36], html:`<div style="background:#1b4332;width:36px;height:36px;border-radius:50% 50% 50% 4px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px #1b433244;transform:rotate(-45deg)"><span style="transform:rotate(45deg)">🌿</span></div>` });
      L.marker([coords.lat,coords.lng],{ icon }).addTo(map).bindPopup(`<b>${direccion}</b><br>${municipio}, Puerto Rico`).openPopup();
      const d=0.00018;
      L.polygon([[coords.lat+d,coords.lng-d],[coords.lat+d,coords.lng+d],[coords.lat-d,coords.lng+d],[coords.lat-d,coords.lng-d]],{ color:"#40916c", fillColor:"#74c69d", fillOpacity:.25, weight:2, dashArray:"6 4" }).addTo(map);
      mapInst.current=map;
    };
    load().catch(console.error);
    return ()=>{ if(mapInst.current){ mapInst.current.remove(); mapInst.current=null; } };
  },[coords.lat,coords.lng,direccion,municipio]);
  return (
    <div style={{ borderRadius:18, overflow:"hidden", marginBottom:14, border:`2px solid ${C.borde}`, boxShadow:"0 4px 16px #0002", position:"relative", zIndex:0, isolation:"isolate" }}>
      <div style={{ background:"linear-gradient(90deg,#1b4332,#2d6a4f)", padding:"10px 16px", display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>📍</span>
        <div><div style={{ color:"#fff", fontWeight:700, fontSize:13 }}>{direccion}</div><div style={{ color:C.verde5, fontSize:11 }}>{municipio}, Puerto Rico</div></div>
      </div>
      <div ref={mapRef} style={{ height:200 }} />
    </div>
  );
}

// ─── Panel notificaciones ────────────────────────────────────────────
function PanelNotifs({ notifs, onClose, onMarcarLeidas }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"#000a" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", top:0, right:0, width:"min(360px,100vw)", height:"100dvh", background:C.bg, boxShadow:"-4px 0 24px #0003", display:"flex", flexDirection:"column" }}>
        <div style={{ background:C.verde, padding:"20px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>Notificaciones</div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <button onClick={onMarcarLeidas} style={{ background:"none", border:"none", color:C.verde5, fontSize:12, cursor:"pointer", fontWeight:600 }}>Marcar leídas</button>
            <button onClick={onClose} style={{ background:"none", border:"none", color:C.verde5, fontSize:22, cursor:"pointer" }}>×</button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
          {notifs.length===0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:C.gris }}><div style={{ fontSize:40, marginBottom:10 }}>🔕</div><div style={{ fontWeight:600 }}>Sin notificaciones</div></div>
          ) : notifs.map(n=>(
            <div key={n.id} style={{ background:n.leida?"#fff":"#d8f3dc", borderRadius:14, padding:"12px 14px", marginBottom:8, borderLeft:`3px solid ${n.leida?C.borde:C.verde3}` }}>
              <div style={{ fontWeight:700, fontSize:14, color:C.texto, marginBottom:2 }}>{n.titulo}</div>
              <div style={{ fontSize:13, color:"#4a5a4e", lineHeight:1.4 }}>{n.cuerpo}</div>
              <div style={{ fontSize:11, color:C.gris, marginTop:4 }}>{new Date(n.created_at).toLocaleTimeString("es-PR",{ hour:"2-digit", minute:"2-digit" })}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Modal pago ─────────────────────────────────────────────────────
function ModalPago({ total, onPagar, onCerrar }) {
  const [metodo, setMetodo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [exito, setExito] = useState(false);
  async function pagar() {
    if (!metodo) return;
    setProcesando(true);
    await new Promise(r=>setTimeout(r,1800));
    setProcesando(false); setExito(true);
    await new Promise(r=>setTimeout(r,1000));
    onPagar(metodo);
  }
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"#000b", display:"flex", alignItems:"flex-end" }}>
      <div style={{ background:C.bg, borderRadius:"24px 24px 0 0", width:"100%", maxWidth:430, margin:"0 auto", padding:"8px 0 32px" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 4px" }}><div style={{ width:36, height:4, borderRadius:2, background:C.borde }} /></div>
        <div style={{ padding:"0 20px" }}>
          <div style={{ fontWeight:900, fontSize:20, color:C.texto, marginBottom:4 }}>Confirmar pago</div>
          <div style={{ fontSize:28, fontWeight:900, color:C.verde2, marginBottom:18 }}>${total} USD</div>
          {METODOS_PAGO.map(m=>(
            <div key={m.id} onClick={()=>setMetodo(m.id)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:16, border:`2px solid ${metodo===m.id?m.color:C.borde}`, background:metodo===m.id?`${m.color}0e`:"#fff", cursor:"pointer", marginBottom:10 }}>
              <span style={{ fontSize:28 }}>{m.icon}</span>
              <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:15, color:C.texto }}>{m.label}</div><div style={{ fontSize:12, color:C.gris }}>{m.desc}</div></div>
              {metodo===m.id&&<span style={{ color:m.color, fontSize:20, fontWeight:900 }}>✓</span>}
            </div>
          ))}
          {exito ? (
            <div style={{ background:"#d8f3dc", borderRadius:14, padding:"14px 16px", textAlign:"center", marginTop:8 }}><div style={{ fontSize:32 }}>✅</div><div style={{ fontWeight:800, color:C.verde2, marginTop:4 }}>Pago procesado</div></div>
          ) : (
            <button onClick={pagar} disabled={!metodo||procesando} style={{ ...ST.btnG(metodo?C.verde2:"#aaa"), marginTop:8, opacity:!metodo?0.6:1 }}>
              {procesando?<><Spinner color="#fff"/>Procesando…</>:`Pagar $${total}`}
            </button>
          )}
          {!procesando&&!exito&&<button onClick={onCerrar} style={{ width:"100%", background:"none", border:"none", color:C.gris, fontSize:14, cursor:"pointer", padding:"10px 0", marginTop:4 }}>Cancelar</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Modal reseña ────────────────────────────────────────────────────
function ModalReseña({ titulo, onEnviar, onCerrar }) {
  const [stars, setStars] = useState(5);
  const [texto, setTexto] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"#000a", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:"24px 22px", width:"100%", maxWidth:360 }}>
        <div style={{ fontWeight:900, fontSize:17, color:C.texto, marginBottom:14 }}>{titulo}</div>
        <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:16 }}>
          {[1,2,3,4,5].map(n=><span key={n} onClick={()=>setStars(n)} style={{ fontSize:38, cursor:"pointer", filter:n<=stars?"none":"grayscale(1) opacity(.3)" }}>★</span>)}
        </div>
        <textarea value={texto} onChange={e=>setTexto(e.target.value)} placeholder="¿Cómo fue tu experiencia?" rows={3} style={{ ...ST.input, resize:"none", lineHeight:1.5, marginBottom:12 }}/>
        <button onClick={()=>texto.trim()&&onEnviar({ stars, texto })} style={{ ...ST.btnG(), opacity:texto.trim()?1:.5, marginBottom:8 }}>Publicar reseña</button>
        <button onClick={onCerrar} style={{ width:"100%", background:"none", border:"none", color:C.gris, fontSize:14, cursor:"pointer", padding:"6px 0" }}>Ahora no</button>
      </div>
    </div>
  );
}

// ─── Chat en tiempo real ─────────────────────────────────────────────
function ChatPanel({ solicitudId, userId, userName, otroId, otroNombre, onClose }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    sb.from("mensajes").select("*")
      .eq("solicitud_id", solicitudId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setMensajes(data); });
    const ch = sb.channel(`chat-${solicitudId}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"mensajes", filter:`solicitud_id=eq.${solicitudId}` },
        payload => setMensajes(prev => [...prev, payload.new]))
      .subscribe();
    return () => sb.removeChannel(ch);
  }, [solicitudId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [mensajes]);

  async function enviar() {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    await sb.from("mensajes").insert({
      solicitud_id: solicitudId,
      emisor_id: userId,
      emisor_nombre: userName,
      receptor_id: otroId,
      contenido: texto.trim(),
    });
    setTexto("");
    setEnviando(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", flexDirection:"column" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, maxWidth:500, margin:"0 auto", width:"100%" }}>
        <div style={{ background:C.verde, padding:"20px 18px 18px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.verde5, fontSize:22, cursor:"pointer", padding:0 }}>←</button>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:16 }}>{otroNombre}</div>
            <div style={{ color:C.verde5, fontSize:12 }}>Chat en tiempo real</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10 }}>
          {mensajes.length===0 && (
            <div style={{ textAlign:"center", color:C.gris, padding:"50px 0" }}>
              <div style={{ fontSize:40, marginBottom:8 }}>💬</div>
              <div style={{ fontWeight:600 }}>Inicia la conversacion</div>
              <div style={{ fontSize:13, marginTop:4 }}>Los mensajes llegan en tiempo real</div>
            </div>
          )}
          {mensajes.map(m => {
            const esMio = m.emisor_id === userId;
            return (
              <div key={m.id} style={{ display:"flex", justifyContent:esMio?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"78%", background:esMio?C.verde2:"#fff", color:esMio?"#fff":C.texto, borderRadius:esMio?"18px 18px 4px 18px":"18px 18px 18px 4px", padding:"10px 14px", boxShadow:"0 2px 8px #0001" }}>
                  {!esMio && <div style={{ fontSize:11, fontWeight:700, color:C.verde3, marginBottom:3 }}>{m.emisor_nombre}</div>}
                  <div style={{ fontSize:14, lineHeight:1.45 }}>{m.contenido}</div>
                  <div style={{ fontSize:10, opacity:.55, marginTop:4, textAlign:"right" }}>
                    {new Date(m.created_at).toLocaleTimeString("es-PR",{ hour:"2-digit", minute:"2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>
        <div style={{ padding:"10px 14px", background:"#fff", borderTop:`1px solid ${C.borde}`, display:"flex", gap:10, alignItems:"flex-end", flexShrink:0 }}>
          <textarea
            value={texto}
            onChange={e=>setTexto(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); enviar(); } }}
            placeholder="Escribe un mensaje..."
            rows={1}
            style={{ ...ST.input, flex:1, resize:"none", lineHeight:1.5 }}
          />
          <button onClick={enviar} disabled={!texto.trim()||enviando}
            style={{ background:C.verde2, border:"none", borderRadius:12, padding:"10px 16px", color:"#fff", fontWeight:900, cursor:"pointer", fontSize:18, opacity:(!texto.trim()||enviando)?.45:1, flexShrink:0 }}>
            {enviando ? <Spinner size={16} color="#fff"/> : "→"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PhotoBox ────────────────────────────────────────────────────────
function PhotoBox({ label, photo, onCapture, disabled }) {
  const ref = useRef();
  return (
    <div style={{ flex:1 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.verde3, marginBottom:6, textTransform:"uppercase" }}>{label}</div>
      {photo ? (
        <div style={{ background:"#d8f3dc", borderRadius:14, height:110, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:4 }}>
          <span style={{ fontSize:34 }}>🖼️</span><span style={{ fontSize:11, color:C.verde2, fontWeight:600 }}>Foto ✓</span>
        </div>
      ) : (
        <div onClick={()=>!disabled&&ref.current?.click()} style={{ background:disabled?"#f5f5f5":"#f0f7f2", border:`2px dashed ${disabled?"#ccc":C.verde4}`, borderRadius:14, height:110, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6, cursor:disabled?"not-allowed":"pointer", opacity:disabled?.5:1 }}>
          <span style={{ fontSize:28 }}>📷</span><span style={{ fontSize:12, color:C.verde3, fontWeight:600 }}>Tomar foto</span>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>e.target.files[0]&&onCapture(e.target.files[0])}/>
    </div>
  );
}

// ─── Perfil modal proveedor ──────────────────────────────────────────
function PerfilModal({ p, precio, onSelect, onClose }) {
  const [resenas, setResenas] = useState([]);
  useEffect(()=>{
    sb.from("resenas").select("*").eq("receptor_id", p.id).order("created_at",{ ascending:false }).limit(10)
      .then(({ data })=>data&&setResenas(data));
  },[p.id]);
  const cats = [...new Set((p.herramientas||[]).map(id=>HERRAMIENTAS.find(h=>h.id===id)?.cat).filter(Boolean))];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"#000a" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.bg, borderRadius:"24px 24px 0 0", position:"absolute", bottom:0, left:0, right:0, maxHeight:"85dvh", overflowY:"auto", paddingBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}><div style={{ width:40, height:4, borderRadius:2, background:C.borde }}/></div>
        <div style={{ padding:"0 20px 14px", borderBottom:`1px solid ${C.borde}` }}>
          <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:10 }}>
            <FotoAvatar url={p.foto_url} avatar={p.avatar} size={56} color={p.color||C.verde2}/>
            <div><div style={{ fontWeight:800, fontSize:18, color:C.texto }}>{p.nombre}</div><Stars v={p.rating||0}/> <span style={{ fontSize:12, color:C.gris }}>({p.total_resenas||0} reseñas)</span></div>
          </div>
          <p style={{ margin:0, fontSize:14, color:"#4a5a4e" }}>{p.bio}</p>
        </div>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.borde}` }}>
          <div style={ST.sec}>🔧 Equipos & herramientas</div>
          {cats.map(cat=>(
            <div key={cat} style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.gris, textTransform:"uppercase", marginBottom:6 }}>{cat}</div>
              {(p.herramientas||[]).map(id=>{ const h=HERRAMIENTAS.find(x=>x.id===id); return h?.cat===cat?<Tag key={id} label={h.label} icon={h.icon} color={p.color||C.verde2}/>:null; })}
            </div>
          ))}
        </div>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.borde}` }}>
          <div style={ST.sec}>⭐ Reseñas ({resenas.length})</div>
          {resenas.map((r,i)=>(
            <div key={i} style={{ borderBottom:`1px solid ${C.borde}`, paddingBottom:10, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontWeight:700, fontSize:13 }}>{r.autor_nombre||"Cliente"}</span><span style={{ fontSize:11, color:C.gris }}>{new Date(r.created_at).toLocaleDateString("es-PR")}</span></div>
              <Stars v={r.stars} size={12}/><p style={{ margin:"4px 0 0", fontSize:13, color:"#4a5a4e" }}>{r.texto}</p>
            </div>
          ))}
          {resenas.length===0&&<p style={{ color:C.gris, fontSize:14 }}>Aún sin reseñas.</p>}
        </div>
        <div style={{ padding:"14px 20px 0" }}>
          <button onClick={()=>{onSelect(p);onClose();}} style={ST.btnG(p.color||C.verde2)}>Seleccionar · ${precio}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Historial de pedidos ────────────────────────────────────────────
function PantallaHistorial({ user, onBack }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    sb.from("solicitudes").select("*").eq("cliente_id", user.id)
      .order("created_at", { ascending:false })
      .then(({ data }) => { if (data) setPedidos(data); setLoading(false); });
  }, [user.id]);
  const EST = {
    pendiente:  { bg:"#fff3cd", color:"#856404", label:"Pendiente" },
    en_proceso: { bg:"#cfe2ff", color:"#084298", label:"En proceso" },
    completado: { bg:"#d1e7dd", color:"#0a3622", label:"Completado" },
    cancelado:  { bg:"#f8d7da", color:"#842029", label:"Cancelado" },
  };
  return (
    <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:"system-ui" }}>
      <BackHeader onBack={onBack} title="Mis pedidos" sub="Historial de servicios"/>
      <div style={{ padding:"18px 18px" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner size={36}/></div>
        ) : pedidos.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:C.gris }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:16 }}>Sin pedidos aún</div>
            <div style={{ fontSize:13, marginTop:6 }}>Tus servicios aparecerán aquí</div>
          </div>
        ) : pedidos.map(p => {
          const est = EST[p.estado] || EST.pendiente;
          return (
            <div key={p.id} style={{ ...ST.card, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.texto }}>📍 {p.direccion}</div>
                  <div style={{ fontSize:12, color:C.gris, marginTop:2 }}>{p.municipio} · {new Date(p.created_at).toLocaleDateString("es-PR",{ day:"2-digit", month:"short", year:"numeric" })}</div>
                </div>
                <span style={{ background:est.bg, color:est.color, borderRadius:8, padding:"3px 10px", fontSize:11, fontWeight:700, flexShrink:0, marginLeft:8 }}>{est.label}</span>
              </div>
              <div style={{ height:1, background:C.borde, margin:"8px 0" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13 }}>
                <span style={{ color:C.gris }}>Proveedor: <span style={{ color:C.texto, fontWeight:600 }}>{p.proveedor_nombre||"—"}</span></span>
                <span style={{ fontWeight:900, color:C.verde2, fontSize:16 }}>${p.precio_total}</span>
              </div>
              {p.area_cesped_sqft>0 && <div style={{ fontSize:11, color:C.verde3, marginTop:4 }}>🌿 {p.area_cesped_sqft?.toLocaleString()} ft² de césped</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reputación del cliente ──────────────────────────────────────────
function PantallaReputacion({ user, onBack }) {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    sb.from("resenas").select("*").eq("receptor_id", user.id).eq("tipo", "proveedor")
      .order("created_at", { ascending:false })
      .then(({ data }) => { if (data) setResenas(data); setLoading(false); });
  }, [user.id]);
  const promedio = resenas.length ? (resenas.reduce((a,r)=>a+r.stars,0)/resenas.length).toFixed(1) : null;
  return (
    <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:"system-ui" }}>
      <BackHeader onBack={onBack} title="Mi reputación" sub="Reseñas de proveedores"/>
      <div style={{ padding:"18px 18px" }}>
        {promedio&&(
          <div style={{ background:`linear-gradient(135deg,${C.verde},${C.verde2})`, borderRadius:20, padding:"18px 20px", color:"#fff", marginBottom:14, textAlign:"center" }}>
            <div style={{ fontSize:40, fontWeight:900, lineHeight:1 }}>{promedio} ★</div>
            <div style={{ fontSize:13, opacity:.8, marginTop:4 }}>Promedio de {resenas.length} reseña{resenas.length!==1?"s":""}</div>
          </div>
        )}
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner size={36}/></div>
        ) : resenas.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:C.gris }}>
            <div style={{ fontSize:48, marginBottom:12 }}>⭐</div>
            <div style={{ fontWeight:700, fontSize:16 }}>Aún sin reseñas</div>
            <div style={{ fontSize:13, marginTop:6 }}>Las reseñas de proveedores aparecerán aquí después de cada servicio</div>
          </div>
        ) : resenas.map((r,i) => (
          <div key={i} style={{ ...ST.card, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
              <span style={{ fontWeight:700, fontSize:14, color:C.texto }}>🌿 {r.autor_nombre||"Proveedor"}</span>
              <span style={{ fontSize:11, color:C.gris }}>{new Date(r.created_at).toLocaleDateString("es-PR",{ day:"2-digit", month:"short", year:"numeric" })}</span>
            </div>
            <Stars v={r.stars}/>
            <p style={{ margin:"6px 0 0", fontSize:13, color:"#4a5a4e", lineHeight:1.45 }}>{r.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PANTALLA AUTH — OTP POR EMAIL (via Supabase)
// ═══════════════════════════════════════════════════════════════════════

// Estos dos componentes DEBEN estar fuera de PantallaAuth.
// Si los defines adentro, React los destruye y recrea en cada tecla → el input pierde el foco.
function AuthHeader() {
  return (
    <div style={{ background:`linear-gradient(160deg,${C.verde} 0%,${C.verde3} 60%,${C.verde5} 100%)`, padding:"56px 28px 48px", textAlign:"center", position:"relative" }}>
      <div style={{ fontSize:64, marginBottom:10 }}>🌱</div>
      <h1 style={{ color:"#fff", fontSize:34, fontWeight:900, margin:0, letterSpacing:-1 }}>GardenPR</h1>
      <p style={{ color:"#b7e4c7", marginTop:8, fontSize:15 }}>Corte de césped · Al toque · Puerto Rico</p>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:28, background:C.bg, borderRadius:"50% 50% 0 0 / 100% 100% 0 0" }}/>
    </div>
  );
}

function FormPerfilAuth({ nombre, setNombre, rol, setRol, municipio, setMunicipio, error, setError, loading, onSubmit, btnLabel }) {
  return (
    <>
      <label style={ST.label}>¿Cómo te llamas?</label>
      <input value={nombre} onChange={e=>{setNombre(e.target.value);setError("");}} placeholder="Tu nombre completo" style={{ ...ST.input, marginBottom:12 }}/>
      <label style={ST.label}>Soy</label>
      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        {[["cliente","🏡 Cliente"],["proveedor","🌿 Proveedor"]].map(([v,l])=>(
          <button key={v} onClick={()=>setRol(v)} style={{ flex:1, padding:"11px 8px", borderRadius:12, border:`2px solid ${rol===v?C.verde2:C.borde}`, background:rol===v?"#d8f3dc":"#f8fdf9", color:rol===v?C.verde:C.gris, fontWeight:rol===v?800:500, cursor:"pointer", fontSize:13 }}>{l}</button>
        ))}
      </div>
      <label style={ST.label}>Municipio</label>
      <select value={municipio} onChange={e=>setMunicipio(e.target.value)} style={{ ...ST.input, marginBottom:8 }}>
        {MUNICIPIOS_PR.map(m=><option key={m}>{m}</option>)}
      </select>
      {error&&<div style={{ color:"#e63946", fontSize:12, marginBottom:8 }}>{error}</div>}
      <button onClick={onSubmit} disabled={loading||!nombre.trim()} style={{ ...ST.btnG(), marginTop:6 }}>
        {loading?<><Spinner color="#fff"/>Guardando…</> : btnLabel}
      </button>
    </>
  );
}

function PantallaAuth({ onAuth, recoveryMode, onRecoveryDone }) {
  // paso 1=login 2=registro 3=completar perfil 4=recuperar contraseña 5=nueva contraseña
  const [paso, setPaso] = useState(recoveryMode ? 5 : 1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("cliente");
  const [municipio, setMunicipio] = useState("San Juan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [enviado, setEnviado] = useState(false);

  function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  async function enviarRecovery() {
    if (!emailValido(email)) { setError("Email inválido"); return; }
    setLoading(true); setError("");
    const { error: e } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
    if (e) { setError(e.message); setLoading(false); return; }
    setEnviado(true);
    setLoading(false);
  }

  async function actualizarPassword() {
    if (newPassword.length < 6) { setError("Mínimo 6 caracteres"); return; }
    if (newPassword !== newPassword2) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); setError("");
    const { error: e } = await sb.auth.updateUser({ password: newPassword });
    if (e) { setError(e.message); setLoading(false); return; }
    onRecoveryDone?.();
    setLoading(false);
  }

  async function guardarPerfil(uid) {
    const avatar = nombre.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const { error: ep } = await sb.from("profiles").insert({
      id: uid, role: rol, nombre: nombre.trim(),
      telefono: null, municipio, avatar, color: "#2d6a4f",
    });
    if (ep) { setError("Error: " + ep.message); return false; }
    return true;
  }

  async function entrar() {
    if (!emailValido(email)) { setError("Email inválido"); return; }
    if (password.length < 6) { setError("Contraseña mínimo 6 caracteres"); return; }
    setLoading(true); setError("");
    const { data, error: e } = await sb.auth.signInWithPassword({ email, password });
    if (e) { setError("Email o contraseña incorrectos"); setLoading(false); return; }
    const { data: perfil } = await sb.from("profiles").select("*").eq("id", data.user.id).single();
    if (perfil) {
      onAuth({ ...perfil, uid: data.user.id });
    } else {
      setUserId(data.user.id);
      setPaso(3);
    }
    setLoading(false);
  }

  async function registrar() {
    if (!nombre.trim()) { setError("Ingresa tu nombre"); return; }
    if (!emailValido(email)) { setError("Email inválido"); return; }
    if (password.length < 6) { setError("Contraseña mínimo 6 caracteres"); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); setError("");
    const { data, error: e } = await sb.auth.signUp({ email, password });
    if (e) {
      setError(e.message.includes("already registered") ? "Este email ya tiene cuenta. Usa Entrar." : "Error: " + e.message);
      if (e.message.includes("already registered")) setPaso(1);
      setLoading(false); return;
    }
    const uid = data.user.id;
    const ok = await guardarPerfil(uid);
    if (!ok) { setLoading(false); return; }
    const { data: perfil } = await sb.from("profiles").select("*").eq("id", uid).single();
    onAuth({ ...perfil, uid });
    setLoading(false);
  }

  async function completarPerfil() {
    if (!nombre.trim()) { setError("Ingresa tu nombre"); return; }
    setLoading(true); setError("");
    const ok = await guardarPerfil(userId);
    if (!ok) { setLoading(false); return; }
    const { data: perfil } = await sb.from("profiles").select("*").eq("id", userId).single();
    onAuth({ ...perfil, uid: userId });
    setLoading(false);
  }

  if (paso===1) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <AuthHeader/>
      <div style={{ flex:1, padding:"28px 24px", display:"flex", flexDirection:"column" }}>
        <div style={{ fontWeight:800, fontSize:20, color:C.texto, marginBottom:4 }}>Bienvenido</div>
        <div style={{ color:C.gris, fontSize:14, marginBottom:20 }}>Entra con tu email y contraseña.</div>
        <label style={ST.label}>Email</label>
        <input value={email} onChange={e=>{setEmail(e.target.value.trim());setError("");}} placeholder="tucorreo@gmail.com" type="email" style={{ ...ST.input, marginBottom:12 }} inputMode="email"/>
        <label style={ST.label}>Contraseña</label>
        <input value={password} onChange={e=>{setPassword(e.target.value);setError("");}} placeholder="Mínimo 6 caracteres" type="password" style={{ ...ST.input, marginBottom:8 }}/>
        {error&&<div style={{ color:"#e63946", fontSize:12, marginBottom:8 }}>{error}</div>}
        <button onClick={entrar} disabled={loading} style={ST.btnG()}>
          {loading?<><Spinner color="#fff"/>Entrando…</>:"Entrar →"}
        </button>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button onClick={()=>{setPaso(4);setError("");setEnviado(false);}} style={{ background:"none", border:"none", color:C.gris, fontSize:13, cursor:"pointer" }}>¿Olvidaste tu contraseña?</button>
        </div>
        <div style={{ textAlign:"center", marginTop:10 }}>
          <span style={{ color:C.gris, fontSize:14 }}>¿Primera vez? </span>
          <button onClick={()=>{setPaso(2);setError("");}} style={{ background:"none", border:"none", color:C.verde3, fontSize:14, cursor:"pointer", fontWeight:700 }}>Crear cuenta →</button>
        </div>
      </div>
    </div>
  );

  if (paso===4) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <AuthHeader/>
      <div style={{ flex:1, padding:"28px 24px", display:"flex", flexDirection:"column" }}>
        {!enviado ? <>
          <div style={{ fontWeight:800, fontSize:20, color:C.texto, marginBottom:4 }}>Recuperar contraseña</div>
          <div style={{ color:C.gris, fontSize:14, marginBottom:20 }}>Te enviamos un link al correo para crear una nueva.</div>
          <label style={ST.label}>Tu email</label>
          <input value={email} onChange={e=>{setEmail(e.target.value.trim());setError("");}} placeholder="tucorreo@gmail.com" type="email" style={{ ...ST.input, marginBottom:8 }} inputMode="email"/>
          {error&&<div style={{ color:"#e63946", fontSize:12, marginBottom:8 }}>{error}</div>}
          <button onClick={enviarRecovery} disabled={loading} style={ST.btnG()}>
            {loading?<><Spinner color="#fff"/>Enviando…</>:"Enviar link →"}
          </button>
        </> : <>
          <div style={{ fontSize:60, textAlign:"center", marginBottom:16 }}>📬</div>
          <div style={{ fontWeight:800, fontSize:20, color:C.texto, marginBottom:8, textAlign:"center" }}>Revisa tu correo</div>
          <div style={{ color:C.gris, fontSize:14, textAlign:"center", lineHeight:1.6 }}>Te enviamos un link a <strong>{email}</strong>. Ábrelo y sigue las instrucciones para crear tu nueva contraseña.</div>
        </>}
        <button onClick={()=>{setPaso(1);setError("");setEnviado(false);}} style={{ background:"none", border:"none", color:C.verde3, fontSize:14, cursor:"pointer", marginTop:20, fontWeight:600 }}>← Volver</button>
      </div>
    </div>
  );

  if (paso===5) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <AuthHeader/>
      <div style={{ flex:1, padding:"28px 24px", display:"flex", flexDirection:"column" }}>
        <div style={{ fontWeight:800, fontSize:20, color:C.texto, marginBottom:4 }}>Nueva contraseña</div>
        <div style={{ color:C.gris, fontSize:14, marginBottom:20 }}>Elige una contraseña segura de al menos 6 caracteres.</div>
        <label style={ST.label}>Nueva contraseña</label>
        <input value={newPassword} onChange={e=>{setNewPassword(e.target.value);setError("");}} placeholder="Mínimo 6 caracteres" type="password" style={{ ...ST.input, marginBottom:12 }}/>
        <label style={ST.label}>Confirmar contraseña</label>
        <input value={newPassword2} onChange={e=>{setNewPassword2(e.target.value);setError("");}} placeholder="Repite la contraseña" type="password" style={{ ...ST.input, marginBottom:8 }}/>
        {error&&<div style={{ color:"#e63946", fontSize:12, marginBottom:8 }}>{error}</div>}
        <button onClick={actualizarPassword} disabled={loading} style={ST.btnG()}>
          {loading?<><Spinner color="#fff"/>Guardando…</>:"Guardar contraseña →"}
        </button>
      </div>
    </div>
  );

  if (paso===2) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <AuthHeader/>
      <div style={{ flex:1, padding:"28px 24px", display:"flex", flexDirection:"column" }}>
        <div style={{ fontWeight:800, fontSize:20, color:C.texto, marginBottom:4 }}>Crea tu cuenta</div>
        <div style={{ color:C.gris, fontSize:14, marginBottom:20 }}>Solo tarda un minuto.</div>
        <label style={ST.label}>Email</label>
        <input value={email} onChange={e=>{setEmail(e.target.value.trim());setError("");}} placeholder="tucorreo@gmail.com" type="email" style={{ ...ST.input, marginBottom:12 }} inputMode="email"/>
        <label style={ST.label}>Contraseña</label>
        <input value={password} onChange={e=>{setPassword(e.target.value);setError("");}} placeholder="Mínimo 6 caracteres" type="password" style={{ ...ST.input, marginBottom:12 }}/>
        <label style={ST.label}>Confirmar contraseña</label>
        <input value={password2} onChange={e=>{setPassword2(e.target.value);setError("");}} placeholder="Repite la contraseña" type="password" style={{ ...ST.input, marginBottom:16 }}/>
        <FormPerfilAuth nombre={nombre} setNombre={setNombre} rol={rol} setRol={setRol} municipio={municipio} setMunicipio={setMunicipio} error={error} setError={setError} loading={loading} onSubmit={registrar} btnLabel="Crear cuenta →"/>
        <button onClick={()=>{setPaso(1);setError("");}} style={{ background:"none", border:"none", color:C.verde3, fontSize:14, cursor:"pointer", marginTop:12, fontWeight:600 }}>← Ya tengo cuenta</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <AuthHeader/>
      <div style={{ flex:1, padding:"28px 24px", display:"flex", flexDirection:"column" }}>
        <div style={{ fontWeight:800, fontSize:20, color:C.texto, marginBottom:4 }}>Completa tu perfil</div>
        <div style={{ color:C.gris, fontSize:14, marginBottom:20 }}>Ya tienes cuenta. Solo falta tu información.</div>
        <FormPerfilAuth nombre={nombre} setNombre={setNombre} rol={rol} setRol={setRol} municipio={municipio} setMunicipio={setMunicipio} error={error} setError={setError} loading={loading} onSubmit={completarPerfil} btnLabel="Empezar →"/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PANTALLA CLIENTE
// ═══════════════════════════════════════════════════════════════════════
function PantallaCliente({ user, onLogout }) {
  const [vista, setVista] = useState("home");
  const [municipio, setMunicipio] = useState(user.municipio||"San Juan");
  const [direccion, setDireccion] = useState("");
  const [tipoProp, setTipoProp] = useState("residencial");
  const [loading, setLoading] = useState(false);
  const [parcela, setParcela] = useState(null);
  const [areaTotalSqft, setAreaTotalSqft] = useState(0);
  const [areaCespedSqft, setAreaCespedSqft] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [extras, setExtras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [proveedorSel, setProveedorSel] = useState(null);
  const [perfilModal, setPerfilModal] = useState(null);
  const [pagoModal, setPagoModal] = useState(false);
  const [reseñaModal, setReseñaModal] = useState(false);
  const [reseñaEnviada, setReseñaEnviada] = useState(false);
  const [metodoPago, setMetodoPago] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [coords, setCoords] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [vistaHistorial, setVistaHistorial] = useState(false);
  const [chatNoLeidos, setChatNoLeidos] = useState(0);
  const [cancelando, setCancelando] = useState(false);
  const [vistaReputacion, setVistaReputacion] = useState(false);

  // Cargar proveedores desde Supabase
  useEffect(()=>{
    sb.from("profiles").select("*").eq("role","proveedor")
      .then(({ data })=>{
        if (data) setProveedores(data.map(p=>({ ...p, distancia:`${(0.5+Math.random()*3).toFixed(1)} mi`, eta:`${10+Math.floor(Math.random()*25)} min` })));
      });
  },[]);

  // Suscripción a notificaciones en tiempo real (Supabase Realtime)
  useEffect(()=>{
    // Cargar notificaciones existentes
    sb.from("notificaciones").select("*").eq("usuario_id", user.id).order("created_at",{ ascending:false }).limit(20)
      .then(({ data })=>data&&setNotifs(data));
    // Escuchar nuevas notificaciones
    const channel = sb.channel(`notifs-${user.id}`)
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"notificaciones", filter:`usuario_id=eq.${user.id}` },
        payload=>setNotifs(prev=>[payload.new, ...prev]))
      .subscribe();
    return ()=>sb.removeChannel(channel);
  },[user.id]);

  const precioExtras = extras.reduce((a,id)=>{ const e=EXTRAS.find(x=>x.id===id); return a+(e?e.precio:0); },0);
  const precioTotal = precio + precioExtras;
  const nNoLeidas = notifs.filter(n=>!n.leida).length;

  async function buscarParcela() {
    if (!direccion.trim()) return;
    setLoading(true); setParcela(null);
    const info = await fetchParcelaArea();
    const totalM2 = info.areM2;
    const cespedM2 = Math.max(totalM2 - (ESTRUCTURA_M2[tipoProp]||0), 0);
    setAreaTotalSqft(m2ToSqft(totalM2));
    setAreaCespedSqft(m2ToSqft(cespedM2));
    setPrecio(calcularPrecio(m2ToSqft(cespedM2)));
    setParcela(info);
    const c = getMunicipioCoords(municipio);
    setCoords({ lat:c.lat+(Math.random()-.5)*.01, lng:c.lng+(Math.random()-.5)*.01 });
    setLoading(false);
  }

  async function confirmarSolicitud(metodoPagoId) {
    setMetodoPago(metodoPagoId);
    // Crear solicitud en Supabase
    const { data: sol, error } = await sb.from("solicitudes").insert({
      cliente_id: user.id,
      cliente_nombre: user.nombre,
      cliente_tel: user.telefono,
      proveedor_id: proveedorSel.id,
      proveedor_nombre: proveedorSel.nombre,
      direccion,
      municipio,
      tipo_prop: tipoProp,
      area_total_sqft: Math.round(areaTotalSqft),
      area_cesped_sqft: Math.round(areaCespedSqft),
      precio_base: precio,
      precio_total: precioTotal,
      extras,
      metodo_pago: metodoPagoId,
      estado: "pendiente",
    }).select().single();

    if (!error && sol) {
      setSolicitudActual(sol);
      // Notificar al proveedor
      await sb.from("notificaciones").insert([
        { usuario_id: proveedorSel.id, tipo:"nueva_solicitud", titulo:"🌿 Nueva solicitud", cuerpo:`${direccion}, ${municipio} · $${precioTotal}`, data: sol },
        { usuario_id: user.id, tipo:"confirmacion", titulo:"✅ Servicio confirmado", cuerpo:`${proveedorSel.nombre} recibirá tu solicitud · ETA ${proveedorSel.eta}`, data: sol },
      ]);
    }
    setPagoModal(false);
    setVista("confirmado");
  }

  async function marcarLeidas() {
    await sb.from("notificaciones").update({ leida:true }).eq("usuario_id", user.id).eq("leida", false);
    setNotifs(prev=>prev.map(n=>({ ...n, leida:true })));
  }

  async function cancelarServicio() {
    if (!solicitudActual) return;
    await sb.from("solicitudes").update({ estado:"cancelado" }).eq("id", solicitudActual.id);
    if (proveedorSel?.id) {
      await sb.from("notificaciones").insert({
        usuario_id: proveedorSel.id, tipo:"cancelado",
        titulo:"❌ Servicio cancelado",
        cuerpo:`${user.nombre} canceló la solicitud en ${direccion}.`,
        data: solicitudActual
      });
    }
    setCancelando(false);
    setSolicitudActual(null);
    setVista("home");
    setParcela(null);
    setDireccion("");
    setExtras([]);
    setReseñaEnviada(false);
  }

  // Auto-marcar al abrir paneles
  useEffect(()=>{ if (showNotifs) marcarLeidas(); },[showNotifs]);
  useEffect(()=>{ if (showChat) setChatNoLeidos(0); },[showChat]);

  // Badge chat: escuchar mensajes nuevos dirigidos al cliente
  useEffect(()=>{
    if (!solicitudActual) return;
    const ch = sb.channel(`chat-badge-cli-${user.id}`)
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"mensajes", filter:`receptor_id=eq.${user.id}` },
        ()=>setChatNoLeidos(n=>n+1))
      .subscribe();
    return ()=>sb.removeChannel(ch);
  },[solicitudActual?.id, user.id]);

  // ── Vista historial / reputación
  if (vistaHistorial) return <PantallaHistorial user={user} onBack={()=>setVistaHistorial(false)}/>;
  if (vistaReputacion) return <PantallaReputacion user={user} onBack={()=>setVistaReputacion(false)}/>;

  // ── Vista confirmado
  if (vista==="confirmado") {
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:"system-ui" }}>
        <BackHeader onBack={()=>{setVista("home");setParcela(null);setDireccion("");setProveedorSel(null);setExtras([]);setReseñaEnviada(false);}} title="Confirmado" sub="GardenPR" right={<BellBadge count={nNoLeidas} onClick={()=>setShowNotifs(true)}/>}/>
        <div style={{ padding:"20px 18px", display:"flex", flexDirection:"column", alignItems:"center" }}>
          <div style={{ fontSize:60, marginBottom:10 }}>✅</div>
          <h2 style={{ color:C.verde, fontWeight:900, fontSize:22, margin:"0 0 6px", textAlign:"center" }}>¡Servicio confirmado!</h2>
          <p style={{ color:C.verde3, textAlign:"center", marginBottom:20, lineHeight:1.5 }}><strong>{proveedorSel?.nombre}</strong> recibió tu solicitud · ETA {proveedorSel?.eta}</p>
          {coords&&<div style={{ width:"100%", maxWidth:380 }}><MapaParcela municipio={municipio} direccion={direccion} lat={coords.lat} lng={coords.lng}/></div>}
          <div style={{ ...ST.card, width:"100%", maxWidth:380 }}>
            <Row label="Dirección" val={`${direccion}, ${municipio}`}/>
            <Row label="Área de césped" val={`${areaCespedSqft.toFixed(0)} ft²`} bold/>
            <div style={{ height:1, background:C.borde, margin:"8px 0" }}/>
            <Row label="Servicio base" val={`$${precio}`}/>
            {extras.map(id=>{ const e=EXTRAS.find(x=>x.id===id); return e?<Row key={id} label={e.label} val={`+$${e.precio}`}/>:null; })}
            <div style={{ height:1, background:C.borde, margin:"8px 0" }}/>
            <Row label="Pago" val={METODOS_PAGO.find(m=>m.id===metodoPago)?.label||"—"}/>
            <Row label="Total" val={`$${precioTotal}`} bold/>
          </div>
          {!reseñaEnviada
            ?<button onClick={()=>setReseñaModal(true)} style={{ ...ST.btnG("#f4a261"), maxWidth:380, marginBottom:10 }}>⭐ Dejar reseña al proveedor</button>
            :<div style={{ background:"#fff3e0", borderRadius:14, padding:"12px 18px", textAlign:"center", maxWidth:380, width:"100%", marginBottom:10, color:"#e67700", fontWeight:700 }}>✓ Reseña publicada — ¡Gracias!</div>
          }
          {solicitudActual&&<div style={{ position:"relative", maxWidth:380, width:"100%", marginBottom:10 }}>
            <button onClick={()=>setShowChat(true)} style={{ ...ST.btnG(C.verde3), width:"100%" }}>💬 Chat con {proveedorSel?.nombre}</button>
            {chatNoLeidos>0&&<span style={{ position:"absolute", top:-8, right:-8, background:"#e03131", color:"#fff", borderRadius:"50%", minWidth:20, height:20, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", pointerEvents:"none" }}>{chatNoLeidos}</span>}
          </div>}
          {solicitudActual&&!cancelando&&<button onClick={()=>setCancelando(true)} style={{ ...ST.btnG("#e03131"), maxWidth:380, marginBottom:10, background:"none", color:"#e03131", border:"2px solid #e03131" }}>❌ Cancelar servicio</button>}
          {cancelando&&<div style={{ maxWidth:380, width:"100%", marginBottom:10, background:"#fff5f5", border:"2px solid #e03131", borderRadius:14, padding:"16px 18px" }}>
            <div style={{ fontWeight:700, color:"#e03131", marginBottom:14, textAlign:"center", fontSize:15 }}>¿Seguro que quieres cancelar?</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={cancelarServicio} style={{ ...ST.btnG("#e03131"), flex:1 }}>Sí, cancelar</button>
              <button onClick={()=>setCancelando(false)} style={{ flex:1, background:"none", border:"2px solid #ccc", borderRadius:14, padding:"14px 0", fontWeight:700, cursor:"pointer", fontSize:15 }}>No</button>
            </div>
          </div>}
        </div>
        {reseñaModal&&<ModalReseña titulo={`Califica a ${proveedorSel?.nombre}`} onEnviar={async ({ stars, texto })=>{
          await sb.from("resenas").insert({ solicitud_id:solicitudActual?.id, autor_id:user.id, receptor_id:proveedorSel.id, stars, texto });
          setReseñaEnviada(true); setReseñaModal(false);
        }} onCerrar={()=>setReseñaModal(false)}/>}
        {showNotifs&&<PanelNotifs notifs={notifs} onClose={()=>setShowNotifs(false)} onMarcarLeidas={marcarLeidas}/>}
        {showChat&&solicitudActual&&<ChatPanel solicitudId={solicitudActual.id} userId={user.id} userName={user.nombre} otroId={proveedorSel?.id} otroNombre={proveedorSel?.nombre||"Proveedor"} onClose={()=>setShowChat(false)}/>}
      </div>
    );
  }

  // ── Vista principal (solicitar)
  return (
    <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:"system-ui" }}>
      <BackHeader title={`Hola, ${user.nombre.split(" ")[0]}`} sub="Solicitar corte de césped" right={<div style={{display:"flex",gap:4,alignItems:"center"}}><button onClick={()=>setVistaHistorial(true)} style={{background:"none",border:"none",color:C.verde5,fontSize:20,cursor:"pointer",padding:"4px 6px"}}>📋</button><button onClick={()=>setVistaReputacion(true)} title="Mi reputación" style={{background:"none",border:"none",color:C.verde5,fontSize:20,cursor:"pointer",padding:"4px 6px"}}>⭐</button><BellBadge count={nNoLeidas} onClick={()=>setShowNotifs(true)}/><button onClick={onLogout} title="Cerrar sesión" style={{background:"none",border:"none",color:C.verde5,fontSize:20,cursor:"pointer",padding:"4px 6px"}}>🚪</button></div>}/>
      <div style={{ padding:"18px 18px" }}>
        <div style={ST.card}>
          <label style={ST.label}>Municipio</label>
          <select value={municipio} onChange={e=>setMunicipio(e.target.value)} style={{ ...ST.input, marginBottom:12 }}>
            {MUNICIPIOS_PR.map(m=><option key={m}>{m}</option>)}
          </select>
          <label style={ST.label}>Tipo de propiedad</label>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {[["residencial","🏠 Residencial"],["comercial","🏢 Comercial"],["vacant","🌾 Solar vacío"]].map(([v,l])=>(
              <button key={v} onClick={()=>setTipoProp(v)} style={{ flex:1, padding:"9px 4px", borderRadius:10, border:`2px solid ${tipoProp===v?C.verde2:C.borde}`, background:tipoProp===v?"#d8f3dc":"#f8fdf9", color:tipoProp===v?C.verde:C.gris, fontWeight:tipoProp===v?800:500, cursor:"pointer", fontSize:11 }}>{l}</button>
            ))}
          </div>
          <label style={ST.label}>Dirección</label>
          <input value={direccion} onChange={e=>setDireccion(e.target.value)} placeholder="Ej: Calle Magnolia 42, Urb. El Monte" style={{ ...ST.input, marginBottom:14 }} onKeyDown={e=>e.key==="Enter"&&buscarParcela()}/>
          <button onClick={buscarParcela} disabled={loading||!direccion.trim()} style={{ ...ST.btnG(loading?"#aaa":C.verde2), opacity:(!direccion.trim()||loading)?.6:1 }}>
            {loading?<><Spinner color="#fff"/>Consultando catastro…</>:"Calcular área de césped →"}
          </button>
        </div>

        {parcela&&coords&&(
          <>
            <MapaParcela municipio={municipio} direccion={direccion} lat={coords.lat} lng={coords.lng}/>
            <div style={{ background:`linear-gradient(135deg,${C.verde},${C.verde2})`, borderRadius:20, padding:"18px 20px", color:"#fff", marginBottom:14, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-8, bottom:-8, fontSize:80, opacity:.1 }}>🌿</div>
              <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:2, opacity:.65, marginBottom:10 }}>{parcela.fuente} · {parcela.catastro!=="Estimado"?`#${parcela.catastro}`:"Estimado"}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                <StatBox label="Parcela total" val={areaTotalSqft.toFixed(0)} unit="ft²"/>
                <StatBox label="Estructura -" val={m2ToSqft(ESTRUCTURA_M2[tipoProp]).toFixed(0)} unit="ft²" dim/>
                <StatBox label="Área de césped" val={areaCespedSqft.toFixed(0)} unit="ft²" hi/>
                <StatBox label="Precio base" val={`$${precio}`} unit="USD" hi/>
              </div>
            </div>

            <div style={ST.card}>
              <div style={ST.sec}>Servicios adicionales</div>
              {EXTRAS.map(e=>(
                <div key={e.id} onClick={()=>setExtras(p=>p.includes(e.id)?p.filter(x=>x!==e.id):[...p,e.id])} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:12, marginBottom:6, background:extras.includes(e.id)?"#d8f3dc":"#f8fdf9", border:`1.5px solid ${extras.includes(e.id)?C.verde4:C.borde}`, cursor:"pointer" }}>
                  <span style={{ fontSize:14, color:C.texto }}>{e.icon} {e.label}</span>
                  <span style={{ fontWeight:700, color:C.verde3 }}>+${e.precio}</span>
                </div>
              ))}
            </div>

            <div style={ST.sec}>Proveedores disponibles</div>
            {proveedores.map(p=>(
              <div key={p.id} style={{ ...ST.card, padding:"14px 16px", marginBottom:10, border:`2px solid ${proveedorSel?.id===p.id?(p.color||C.verde2):C.borde}`, background:proveedorSel?.id===p.id?`${p.color||C.verde2}0d`:"#fff", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }} onClick={()=>setProveedorSel(p)}>
                  <FotoAvatar url={p.foto_url} avatar={p.avatar} size={46} color={p.color||C.verde2}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.texto }}>{p.nombre}</div>
                    <div style={{ display:"flex", gap:8, marginTop:2 }}><Stars v={p.rating||0}/><span style={{ fontSize:12, color:C.gris }}>({p.total_resenas||0}) · 📍 {p.distancia}</span></div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontWeight:900, fontSize:22, color:p.color||C.verde2 }}>${precioTotal}</div>
                    <div style={{ fontSize:11, color:C.gris }}>ETA {p.eta}</div>
                  </div>
                </div>
                <button onClick={()=>setPerfilModal(p)} style={{ marginTop:10, width:"100%", background:"none", border:`1.5px solid ${p.color||C.verde2}`, color:p.color||C.verde2, borderRadius:10, padding:"8px 0", fontWeight:700, fontSize:13, cursor:"pointer" }}>Ver perfil & reseñas →</button>
              </div>
            ))}

            {proveedorSel&&(
              <button onClick={()=>setPagoModal(true)} style={{ ...ST.btnG(), marginTop:4, marginBottom:20 }}>
                Confirmar con {proveedorSel.nombre} · ${precioTotal}
              </button>
            )}
          </>
        )}
      </div>
      {perfilModal&&<PerfilModal p={perfilModal} precio={precioTotal} onSelect={p=>setProveedorSel(p)} onClose={()=>setPerfilModal(null)}/>}
      {pagoModal&&<ModalPago total={precioTotal} onPagar={confirmarSolicitud} onCerrar={()=>setPagoModal(false)}/>}
      {showNotifs&&<PanelNotifs notifs={notifs} onClose={()=>setShowNotifs(false)} onMarcarLeidas={marcarLeidas}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PANTALLA PROVEEDOR
// ═══════════════════════════════════════════════════════════════════════
function PantallaProveedor({ user, onLogout }) {
  const [sub, setSub] = useState("dashboard");
  const [activo, setActivo] = useState(false);
  const [completados, setCompletados] = useState([]);
  const [gananciaHoy, setGananciaHoy] = useState(0);
  const [trabajoActivo, setTrabajoActivo] = useState(null);
  const [reseñaModal, setReseñaModal] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [miPerfil, setMiPerfil] = useState({ ...user });
  const [bioEdit, setBioEdit] = useState(user.bio||"");
  const [herramientasEdit, setHerramientasEdit] = useState(user.herramientas||[]);
  const [guardado, setGuardado] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [chatNoLeidos, setChatNoLeidos] = useState(0);
  const [resenasPropias, setResenasPropias] = useState([]);

  useEffect(()=>{
    if (sub !== "perfil") return;
    sb.from("resenas").select("*").eq("receptor_id", user.id)
      .order("created_at", { ascending:false }).limit(20)
      .then(({ data })=>data&&setResenasPropias(data.filter(r=>r.tipo!=="proveedor")));
  },[sub, user.id]);

  async function subirFoto(file) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/profile.${ext}`;
    const { error: upErr } = await sb.storage.from('avatars').upload(path, file, { upsert:true });
    if (upErr) { alert('Error subiendo foto: ' + upErr.message); return; }
    const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path);
    await sb.from('profiles').update({ foto_url: publicUrl }).eq('id', user.id);
    setMiPerfil(p => ({ ...p, foto_url: publicUrl }));
  }

  // Notificaciones en tiempo real
  useEffect(()=>{
    sb.from("notificaciones").select("*").eq("usuario_id", user.id).order("created_at",{ ascending:false }).limit(20)
      .then(({ data })=>data&&setNotifs(data));
    const ch = sb.channel(`notifs-prov-${user.id}`)
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"notificaciones", filter:`usuario_id=eq.${user.id}` },
        payload=>setNotifs(prev=>[payload.new,...prev]))
      .subscribe();
    return ()=>sb.removeChannel(ch);
  },[user.id]);

  // Solicitudes del área
  useEffect(()=>{
    if (!activo) return;
    sb.from("solicitudes").select("*").eq("estado","pendiente").eq("municipio", miPerfil.municipio)
      .then(({ data })=>data&&setSolicitudes(data));
    const ch = sb.channel(`solicitudes-${user.id}`)
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"solicitudes", filter:`municipio=eq.${miPerfil.municipio}` },
        payload=>setSolicitudes(prev=>[payload.new,...prev]))
      .subscribe();
    return ()=>sb.removeChannel(ch);
  },[activo, miPerfil.municipio, user.id]);

  const nNoLeidas = notifs.filter(n=>!n.leida).length;

  async function aceptar(s) {
    await sb.from("solicitudes").update({ estado:"en_proceso", proveedor_id:user.id, proveedor_nombre:user.nombre }).eq("id", s.id);
    await sb.from("notificaciones").insert({ usuario_id:s.cliente_id, tipo:"aceptado", titulo:"🌿 Proveedor en camino", cuerpo:`${user.nombre} aceptó tu solicitud y está en camino.`, data:s });
    setTrabajoActivo({ ...s, fotoAntes:null, fotoDespues:null });
    setSolicitudes(prev=>prev.filter(x=>x.id!==s.id));
    setSub("trabajo");
  }

  async function completar() {
    if (!trabajoActivo.fotoAntes||!trabajoActivo.fotoDespues) return;
    await sb.from("solicitudes").update({ estado:"completado" }).eq("id", trabajoActivo.id);
    await sb.from("notificaciones").insert({ usuario_id:trabajoActivo.cliente_id, tipo:"completado", titulo:"✅ Trabajo completado", cuerpo:`${user.nombre} completó el corte. ¡Revisa tu propiedad!`, data:trabajoActivo });
    await sb.from("profiles").update({ servicios: (miPerfil.servicios||0)+1 }).eq("id", user.id);
    setCompletados(p=>[{ ...trabajoActivo, estado:"completado" },...p]);
    setGananciaHoy(g=>g+trabajoActivo.precio_total);
    setReseñaModal(true);
  }

  async function guardarPerfil() {
    await sb.from("profiles").update({ bio:bioEdit, herramientas:herramientasEdit }).eq("id", user.id);
    setMiPerfil(p=>({ ...p, bio:bioEdit, herramientas:herramientasEdit }));
    setGuardado(true);
    setTimeout(()=>setGuardado(false), 2000);
  }

  async function marcarLeidas() {
    await sb.from("notificaciones").update({ leida:true }).eq("usuario_id", user.id).eq("leida", false);
    setNotifs(prev=>prev.map(n=>({ ...n, leida:true })));
  }

  // Auto-marcar al abrir paneles
  useEffect(()=>{ if (showNotifs) marcarLeidas(); },[showNotifs]);
  useEffect(()=>{ if (showChat) setChatNoLeidos(0); },[showChat]);

  // Badge chat: escuchar mensajes nuevos dirigidos al proveedor
  useEffect(()=>{
    if (!trabajoActivo) return;
    const ch = sb.channel(`chat-badge-prov-${user.id}`)
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"mensajes", filter:`receptor_id=eq.${user.id}` },
        ()=>setChatNoLeidos(n=>n+1))
      .subscribe();
    return ()=>sb.removeChannel(ch);
  },[trabajoActivo?.id, user.id]);

  // Detectar cancelación del cliente en tiempo real
  useEffect(()=>{
    if (!trabajoActivo) return;
    const ch = sb.channel(`cancel-watch-${trabajoActivo.id}`)
      .on("postgres_changes",{ event:"UPDATE", schema:"public", table:"solicitudes", filter:`id=eq.${trabajoActivo.id}` },
        payload=>{
          if (payload.new?.estado==="cancelado") {
            setTrabajoActivo(null);
            setSub("dashboard");
            setNotifs(prev=>[{ id:Date.now(), titulo:"❌ Servicio cancelado", cuerpo:"El cliente canceló la solicitud.", leida:false, created_at:new Date().toISOString() },...prev]);
          }
        })
      .subscribe();
    return ()=>sb.removeChannel(ch);
  },[trabajoActivo?.id]);

  const Bell = <BellBadge count={nNoLeidas} onClick={()=>setShowNotifs(true)}/>;

  // ── Sub: trabajo activo
  if (sub==="trabajo"&&trabajoActivo) {
    const listo = trabajoActivo.fotoAntes&&trabajoActivo.fotoDespues;
    const c = getMunicipioCoords(trabajoActivo.municipio);
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:"system-ui" }}>
        <BackHeader onBack={()=>setSub("dashboard")} title="Trabajo en curso" sub={`${trabajoActivo.direccion}, ${trabajoActivo.municipio}`} right={<div style={{display:"flex",gap:4,alignItems:"center"}}><div style={{position:"relative",display:"inline-flex"}}><button onClick={()=>setShowChat(true)} style={{background:"none",border:"none",color:C.verde5,fontSize:22,cursor:"pointer",padding:"4px 6px"}}>💬</button>{chatNoLeidos>0&&<span style={{position:"absolute",top:0,right:0,background:"#e03131",color:"#fff",borderRadius:"50%",minWidth:16,height:16,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",pointerEvents:"none"}}>{chatNoLeidos}</span>}</div>{Bell}</div>}/>
        <div style={{ padding:"18px 18px" }}>
          <MapaParcela municipio={trabajoActivo.municipio} direccion={trabajoActivo.direccion} lat={c.lat+(Math.random()-.5)*.005} lng={c.lng+(Math.random()-.5)*.005}/>
          <div style={{ background:`linear-gradient(135deg,${C.verde},${C.verde3})`, borderRadius:20, padding:"16px 20px", color:"#fff", marginBottom:14 }}>
            <div style={{ fontWeight:800, fontSize:17, marginBottom:8 }}>📍 {trabajoActivo.direccion}, {trabajoActivo.municipio}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              <StatBox label="Área total" val={trabajoActivo.area_total_sqft||"—"} unit="ft²"/>
              <StatBox label="Césped" val={trabajoActivo.area_cesped_sqft||"—"} unit="ft²" hi/>
              <StatBox label="Pago" val={`$${trabajoActivo.precio_total}`} unit="USD" hi/>
            </div>
          </div>
          <div style={ST.card}>
            <div style={ST.sec}>📸 Evidencia fotográfica</div>
            <p style={{ fontSize:13, color:C.gris, margin:"0 0 14px", lineHeight:1.5 }}>Ambas fotos son requeridas para completar el trabajo y recibir pago.</p>
            <div style={{ display:"flex", gap:12 }}>
              <PhotoBox label="Antes del corte" photo={trabajoActivo.fotoAntes} onCapture={f=>setTrabajoActivo(p=>({...p,fotoAntes:f}))}/>
              <PhotoBox label="Después del corte" photo={trabajoActivo.fotoDespues} onCapture={f=>setTrabajoActivo(p=>({...p,fotoDespues:f}))} disabled={!trabajoActivo.fotoAntes}/>
            </div>
          </div>
          <button onClick={completar} disabled={!listo} style={{ ...ST.btnG(listo?C.verde2:"#aaa") }}>
            {listo?`Completar trabajo · $${trabajoActivo.precio_total}`:"Se requieren ambas fotos"}
          </button>
        </div>
        {reseñaModal&&<ModalReseña titulo="¿Cómo fue el cliente?" onEnviar={async ({ stars, texto })=>{ await sb.from("resenas").insert({ solicitud_id:trabajoActivo.id, autor_id:user.id, autor_nombre:user.nombre, receptor_id:trabajoActivo.cliente_id, stars, texto, tipo:"proveedor" }); setReseñaModal(false); setTrabajoActivo(null); setSub("dashboard"); }} onCerrar={()=>{ setReseñaModal(false); setTrabajoActivo(null); setSub("dashboard"); }}/>}
        {showNotifs&&<PanelNotifs notifs={notifs} onClose={()=>setShowNotifs(false)} onMarcarLeidas={marcarLeidas}/>}
        {showChat&&trabajoActivo&&<ChatPanel solicitudId={trabajoActivo.id} userId={user.id} userName={user.nombre} otroId={trabajoActivo.cliente_id} otroNombre={trabajoActivo.cliente_nombre||"Cliente"} onClose={()=>setShowChat(false)}/>}
      </div>
    );
  }

  // ── Sub: perfil
  if (sub==="perfil") {
    const cats = [...new Set(HERRAMIENTAS.map(h=>h.cat))];
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:"system-ui" }}>
        <BackHeader onBack={()=>setSub("dashboard")} title="Mi perfil" sub="Visible para clientes" right={Bell}/>
        <div style={{ padding:"18px 18px" }}>
          <div style={{ ...ST.card, display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <FotoAvatar url={miPerfil.foto_url} avatar={miPerfil.avatar} size={64} color={miPerfil.color||C.verde2}/>
              <label style={{ position:"absolute", bottom:0, right:0, cursor:"pointer", display:"flex" }}>
                <div style={{ background:C.verde2, border:"2px solid #fff", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, pointerEvents:"none" }}>📷</div>
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>e.target.files[0]&&subirFoto(e.target.files[0])}/>
              </label>
            </div>
            <div><div style={{ fontWeight:800, fontSize:17, color:C.texto }}>{miPerfil.nombre}</div><Stars v={miPerfil.rating||0}/><span style={{ fontSize:12, color:C.gris }}> ({miPerfil.total_resenas||0} reseñas)</span><div style={{ fontSize:11, color:C.verde3, marginTop:2 }}>Toca 📷 para cambiar tu foto</div></div>
          </div>
          <div style={ST.card}>
            <label style={ST.label}>Descripción de tu negocio</label>
            <textarea value={bioEdit} onChange={e=>setBioEdit(e.target.value)} rows={3} style={{ ...ST.input, resize:"none", lineHeight:1.5 }}/>
          </div>
          <div style={ST.card}>
            <div style={ST.sec}>🔧 Mis herramientas y equipos</div>
            {cats.map(cat=>(
              <div key={cat} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.gris, textTransform:"uppercase", marginBottom:6 }}>{cat}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {HERRAMIENTAS.filter(h=>h.cat===cat).map(h=>{ const sel=herramientasEdit.includes(h.id); return (
                    <button key={h.id} onClick={()=>setHerramientasEdit(p=>sel?p.filter(x=>x!==h.id):[...p,h.id])} style={{ padding:"7px 10px", borderRadius:10, border:`2px solid ${sel?C.verde2:C.borde}`, background:sel?"#d8f3dc":"#f8fdf9", color:sel?C.verde:C.gris, fontWeight:sel?700:400, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:4 }}>
                      {h.icon} {h.label}{sel&&<span style={{ color:C.verde2, marginLeft:2 }}>✓</span>}
                    </button>
                  ); })}
                </div>
              </div>
            ))}
          </div>
          <button onClick={guardarPerfil} style={ST.btnG(guardado?"#52b788":C.verde2)}>
            {guardado?"✓ Perfil guardado":"Guardar perfil"}
          </button>
          <div style={{ height:14 }}/>
          <div style={ST.card}>
            <div style={ST.sec}>⭐ Reseñas de clientes ({resenasPropias.length})</div>
            {resenasPropias.length===0 ? (
              <div style={{ textAlign:"center", padding:"18px 0", color:C.gris }}>
                <div style={{ fontSize:32, marginBottom:8 }}>⭐</div>
                <div style={{ fontSize:13 }}>Aún no tienes reseñas. Aparecerán aquí después de cada servicio completado.</div>
              </div>
            ) : resenasPropias.map((r,i)=>(
              <div key={i} style={{ borderBottom:i<resenasPropias.length-1?`1px solid ${C.borde}`:"none", paddingBottom:i<resenasPropias.length-1?12:0, marginBottom:i<resenasPropias.length-1?12:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:C.texto }}>{r.autor_nombre||"Cliente"}</span>
                  <span style={{ fontSize:11, color:C.gris }}>{new Date(r.created_at).toLocaleDateString("es-PR",{ day:"2-digit", month:"short" })}</span>
                </div>
                <Stars v={r.stars} size={12}/>
                <p style={{ margin:"4px 0 0", fontSize:13, color:"#4a5a4e", lineHeight:1.4 }}>{r.texto}</p>
              </div>
            ))}
          </div>
        </div>
        {showNotifs&&<PanelNotifs notifs={notifs} onClose={()=>setShowNotifs(false)} onMarcarLeidas={marcarLeidas}/>}
      </div>
    );
  }

  // ── Sub: dashboard
  return (
    <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:"system-ui" }}>
      <div style={{ background:"#1b2e1f", padding:"20px 20px 18px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:1100 }}>
        <button onClick={onLogout} title="Cerrar sesión" style={{ background:"none", border:"none", color:C.verde5, fontSize:20, cursor:"pointer", padding:0 }}>🚪</button>
        <div style={{ flex:1 }}><div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>{miPerfil.nombre}</div><div style={{ color:C.verde5, fontSize:12 }}>Panel proveedor · GardenPR</div></div>
        <BellBadge count={nNoLeidas} onClick={()=>setShowNotifs(true)}/>
        <div onClick={()=>setActivo(a=>!a)} style={{ background:activo?"#52b788":"#4a5568", borderRadius:20, padding:"6px 14px", cursor:"pointer" }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:12 }}>{activo?"● En línea":"○ Fuera"}</span>
        </div>
      </div>
      <div style={{ padding:"18px 18px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
          <StatCard label="Hoy" val={`$${gananciaHoy}`} color={C.verde2} icon="💵"/>
          <StatCard label="Trabajos" val={completados.length} color={C.verde3} icon="✂️"/>
          <StatCard label="Rating" val={miPerfil.rating?`${miPerfil.rating}★`:"—"} color={C.verde4} icon="⭐"/>
        </div>
        <button onClick={()=>setSub("perfil")} style={{ width:"100%", background:"#fff", border:`2px solid ${C.borde}`, borderRadius:16, padding:"14px 18px", display:"flex", alignItems:"center", gap:12, marginBottom:14, cursor:"pointer" }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:miPerfil.color||C.verde2, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16 }}>{miPerfil.avatar}</div>
          <div style={{ flex:1, textAlign:"left" }}><div style={{ fontWeight:700, fontSize:14, color:C.texto }}>Mi perfil & herramientas</div><div style={{ fontSize:12, color:C.gris }}>{herramientasEdit.length} equipos · {miPerfil.total_resenas||0} reseñas</div></div>
          <span style={{ color:C.verde3, fontSize:18 }}>→</span>
        </button>
        {activo ? (
          <>
            <div style={ST.sec}>Solicitudes en tu área</div>
            {solicitudes.length===0?(
              <div style={{ ...ST.card, textAlign:"center", color:C.gris, padding:"28px 18px" }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🔍</div>
                <div style={{ fontWeight:600 }}>Sin solicitudes activas</div>
                <div style={{ fontSize:13, marginTop:4 }}>Las nuevas solicitudes en {miPerfil.municipio} aparecerán aquí en tiempo real.</div>
              </div>
            ):solicitudes.map(s=>(
              <div key={s.id} style={ST.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:C.texto }}>📍 {s.direccion}</div>
                    <div style={{ fontSize:12, color:C.gris, marginTop:2 }}>{s.municipio} · {new Date(s.created_at).toLocaleTimeString("es-PR",{ hour:"2-digit", minute:"2-digit" })}</div>
                    <div style={{ fontSize:12, color:C.verde3, marginTop:3 }}>🌿 {s.area_cesped_sqft?.toLocaleString()||"—"} ft² de césped</div>
                  </div>
                  <div style={{ fontWeight:900, fontSize:26, color:C.verde2 }}>${s.precio_total}</div>
                </div>
                <button onClick={()=>aceptar(s)} style={ST.btnG()}>Aceptar trabajo</button>
              </div>
            ))}
            {completados.length>0&&(
              <>
                <div style={{ ...ST.sec, marginTop:8 }}>Completados hoy</div>
                {completados.map((t,i)=>(
                  <div key={i} style={{ background:"#d8f3dc", borderRadius:14, padding:"12px 16px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div><div style={{ fontWeight:600, fontSize:13, color:C.verde }}>{t.direccion}, {t.municipio}</div><div style={{ fontSize:11, color:C.verde3, marginTop:2 }}>✓ Completado</div></div>
                    <div style={{ fontWeight:800, color:C.verde2, fontSize:18 }}>${t.precio_total}</div>
                  </div>
                ))}
              </>
            )}
          </>
        ):(
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.gris }}>
            <div style={{ fontSize:48, marginBottom:12 }}>💤</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Estás fuera de línea</div>
            <div style={{ fontSize:13, marginTop:6 }}>Activa el toggle para recibir solicitudes</div>
          </div>
        )}
      </div>
      {showNotifs&&<PanelNotifs notifs={notifs} onClose={()=>setShowNotifs(false)} onMarcarLeidas={marcarLeidas}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
function StatBox({ label, val, unit, hi, dim }) {
  return (
    <div style={{ background:hi?"#ffffff22":"#ffffff0f", borderRadius:12, padding:"10px 12px" }}>
      <div style={{ fontSize:9, opacity:.6, letterSpacing:.5, marginBottom:3, textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontSize:hi?24:20, fontWeight:900, color:hi?"#95d5b2":dim?"#ff8fa388":"#fff", lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:10, opacity:.55 }}>{unit}</div>
    </div>
  );
}
function StatCard({ label, val, color, icon }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"14px 10px", textAlign:"center", boxShadow:"0 2px 10px #0001" }}>
      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
      <div style={{ fontWeight:900, fontSize:17, color }}>{val}</div>

      <div style={{ fontSize:11, color:C.gris, marginTop:2 }}>{label}</div>
    </div>
  );
}
function Row({ label, val, bold, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:14 }}>
      <span style={{ color:C.gris, fontWeight:bold?700:400 }}>{label}</span>
      <span style={{ fontWeight:bold?900:600, color:color||(bold?C.verde:C.texto) }}>{val}</span>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════
// PANTALLA DE CARGA
// ════════════════════════════════════════════════════════════════════════
function PantallaCarga() {
  const hojas = [
    { cx:105, cy:62, dx:-42, rot:260, dur:2.2, delay:0.0  },
    { cx:142, cy:82, dx:36,  rot:-230, dur:1.9, delay:0.5  },
    { cx:72,  cy:72, dx:-28, rot:340, dur:2.5, delay:1.1  },
    { cx:128, cy:52, dx:28,  rot:-310, dur:2.0, delay:0.3  },
    { cx:88,  cy:92, dx:-32, rot:200, dur:1.8, delay:1.4  },
    { cx:115, cy:68, dx:22,  rot:280, dur:2.3, delay:0.7  },
    { cx:78,  cy:58, dx:-18, rot:-210, dur:2.1, delay:1.7  },
    { cx:132, cy:88, dx:34,  rot:320, dur:1.7, delay:1.0  },
    { cx:95,  cy:44, dx:-14, rot:180, dur:2.4, delay:0.2  },
    { cx:118, cy:100,dx:26,  rot:-270, dur:2.0, delay:1.9 },
  ];

  return (
    <div style={{ minHeight:"100dvh", background:"#f0f7f2", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"system-ui" }}>
      <style>{`
        @keyframes caer {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; }
          70%  { opacity: 0.7; }
          100% { transform: translate(var(--dx),170px) rotate(var(--rot)) scale(0.6); opacity:0; }
        }
        @keyframes mecerse {
          0%,100% { transform: rotate(-2deg); }
          50%     { transform: rotate(2deg);  }
        }
        .hoja-c {
          position:absolute; font-size:16px; user-select:none;
          animation: caer var(--dur) ease-in var(--del) infinite;
          pointer-events:none;
        }
        .arbol-c { animation: mecerse 4s ease-in-out infinite; transform-origin: 100px 225px; }
        @keyframes pulsar { 0%,100%{opacity:.5} 50%{opacity:1} }
        .cargando-txt { animation: pulsar 1.6s ease-in-out infinite; }
      `}</style>
      <div style={{ position:"relative", width:200, height:250, marginBottom:8 }}>
        <svg className="arbol-c" viewBox="0 0 200 250" width="200" height="250">
          <rect x="88" y="172" width="24" height="66" rx="7" fill="#6b4423"/>
          <rect x="93" y="172" width="8" height="66" rx="4" fill="#8B5E3C" opacity="0.35"/>
          <ellipse cx="76" cy="234" rx="18" ry="7" fill="#5c3a1e"/>
          <ellipse cx="124" cy="234" rx="18" ry="7" fill="#5c3a1e"/>
          <ellipse cx="100" cy="237" rx="40" ry="8" fill="#00000015"/>
          <ellipse cx="100" cy="132" rx="68" ry="57" fill="#1b4332"/>
          <ellipse cx="68"  cy="118" rx="48" ry="42" fill="#2d6a4f"/>
          <ellipse cx="132" cy="114" rx="45" ry="40" fill="#2d6a4f"/>
          <ellipse cx="100" cy="88"  rx="44" ry="42" fill="#40916c"/>
          <ellipse cx="70"  cy="100" rx="34" ry="30" fill="#40916c"/>
          <ellipse cx="130" cy="96"  rx="32" ry="29" fill="#40916c"/>
          <ellipse cx="98"  cy="72"  rx="30" ry="28" fill="#52b788"/>
          <ellipse cx="78"  cy="88"  rx="22" ry="20" fill="#52b788" opacity="0.85"/>
          <ellipse cx="120" cy="84"  rx="21" ry="19" fill="#52b788" opacity="0.85"/>
          <ellipse cx="88"  cy="60"  rx="14" ry="12" fill="#74c69d" opacity="0.55"/>
          <ellipse cx="114" cy="68"  rx="11" ry="10" fill="#74c69d" opacity="0.45"/>
          <ellipse cx="72"  cy="82"  rx="9"  ry="8"  fill="#95d5b2" opacity="0.35"/>
        </svg>
        {hojas.map((h,i)=>(
          <div key={i} className="hoja-c" style={{
            top: h.cy - 10, left: h.cx - 9,
            "--dx": `${h.dx}px`,
            "--rot": `${h.rot}deg`,
            "--dur": `${h.dur}s`,
            "--del": `${h.delay}s`,
          }}>{i%3===0?"🍂":"🍃"}</div>
        ))}
      </div>

      <div style={{ color:"#2d6a4f", fontWeight:900, fontSize:24, letterSpacing:-0.5 }}>GardenPR</div>
      <div className="cargando-txt" style={{ color:"#888", fontSize:13, marginTop:6 }}>Cargando…</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = React.useState(null);
  const [recoveryMode, setRecoveryMode] = React.useState(false);
  const [cargando, setCargando] = React.useState(true);

  React.useEffect(()=>{
    const t0 = Date.now();
    const done = () => {
      const espera = Math.max(0, 1200 - (Date.now()-t0));
      setTimeout(()=>setCargando(false), espera);
    };
    sb.auth.getSession().then(({ data:{ session } })=>{
      if (session?.user) {
        sb.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data })=>{ if (data) setUser(data); done(); });
      } else { done(); }
    });
    const { data:{ subscription } } = sb.auth.onAuthStateChange((event, session)=>{
      if (event==="SIGNED_OUT") { setUser(null); setRecoveryMode(false); }
      if (event==="PASSWORD_RECOVERY") { setUser(null); setRecoveryMode(true); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  async function handleLogout() {
    await sb.auth.signOut();
    setUser(null);
    setRecoveryMode(false);
  }

  if (cargando) return <PantallaCarga/>;
  if (recoveryMode) return <PantallaAuth onAuth={setUser} recoveryMode onRecoveryDone={()=>{ setRecoveryMode(false); }}/>;
  if (!user) return <PantallaAuth onAuth={setUser}/>;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f0f7f2; }
        select, input, textarea, button { font-family: inherit; }
        select { appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23888' d='M0 0l6 8 6-8z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:36px; }
      `}</style>
      {user.role==="proveedor"
        ? <PantallaProveedor user={user} onLogout={handleLogout}/>
        : <PantallaCliente user={user} onLogout={handleLogout}/>
      }
    </>
  );
}
