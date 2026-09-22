import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Home, Settings, ClipboardCheck, Plus, Upload, FileText, Trash2, Search, Moon, Sun } from 'lucide-react';
import { supabase, STORAGE_BUCKET } from './lib/supabase';

const uid = () => crypto.randomUUID?.() || String(Date.now());
const loadCourses = () => { try { return JSON.parse(localStorage.getItem('novistudy-courses') || '[]'); } catch { return []; } };

export default function App(){
  const [courses,setCourses]=useState(loadCourses);
  const [active,setActive]=useState(null);
  const [query,setQuery]=useState('');
  const [dark,setDark]=useState(localStorage.getItem('novistudy-theme')==='dark');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  useEffect(()=>localStorage.setItem('novistudy-courses',JSON.stringify(courses)),[courses]);
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('novistudy-theme',dark?'dark':'light')},[dark]);
  const shown=useMemo(()=>courses.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())),[courses,query]);
  function addCourse(){const name=prompt('اسم المقرر'); if(!name?.trim()) return; const c={id:uid(),name:name.trim(),files:[]};setCourses(v=>[...v,c]);setActive(c.id)}
  async function uploadFile(e){
    const file=e.target.files?.[0]; if(!file||!active)return; setBusy(true);setMessage('');
    try{
      if(!supabase) throw new Error('أضف متغيرات Supabase إلى إعدادات الاستضافة أولاً.');
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error('يجب تسجيل الدخول أولاً حتى تعمل سياسة التخزين الآمنة.');
      const path=`${user.id}/${active}/${Date.now()}-${file.name}`;
      const {error}=await supabase.storage.from(STORAGE_BUCKET).upload(path,file,{upsert:false}); if(error) throw error;
      setCourses(v=>v.map(c=>c.id===active?{...c,files:[...c.files,{name:file.name,path,size:file.size}]}:c)); setMessage('تم رفع الملف بنجاح.');
    }catch(err){setMessage(err.message||'تعذر رفع الملف.')}finally{setBusy(false);e.target.value=''}
  }
  function removeCourse(id){if(confirm('حذف المقرر من هذه الواجهة؟')){setCourses(v=>v.filter(c=>c.id!==id));if(active===id)setActive(null)}}
  const current=courses.find(c=>c.id===active);
  return <div className="app" dir="rtl">
    <aside><div className="brand"><span>⚛︎</span><b>NoviStudy</b></div><nav><button><Home/>الرئيسية</button><button className="selected"><BookOpen/>المقررات</button><button><ClipboardCheck/>الاختبارات</button><button><Settings/>الإعدادات</button></nav><div className="student">طالب <span>ط</span></div></aside>
    <main><header><div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="البحث في المقررات والملفات..."/></div><button className="icon" onClick={()=>setDark(v=>!v)}>{dark?<Sun/>:<Moon/>}</button></header>
      <section className="hero"><div><h1>المقررات الدراسية</h1><p>أنشئ مجلدًا لكل مقرر وارفع ملفاتك الدراسية.</p></div><button className="primary" onClick={addCourse}><Plus/> إضافة مقرر</button></section>
      {message&&<div className="notice">{message}</div>}
      {!courses.length?<div className="empty"><BookOpen/><h2>لا توجد مقررات بعد</h2><p>ابدأ بإضافة أول مقرر دراسي.</p><button className="primary" onClick={addCourse}><Plus/> إضافة مقرر</button></div>:
      <div className="workspace"><div className="courses">{shown.map(c=><article key={c.id} className={active===c.id?'active':''} onClick={()=>setActive(c.id)}><div className="folder">📘</div><div><h3>{c.name}</h3><p>{c.files.length} ملف</p></div><button className="trash" onClick={e=>{e.stopPropagation();removeCourse(c.id)}}><Trash2/></button></article>)}</div>
      <div className="files">{current?<><div className="filehead"><div><h2>{current.name}</h2><p>ملفات المقرر</p></div><label className="primary upload"><Upload/>{busy?'جارٍ الرفع...':'رفع ملف'}<input type="file" onChange={uploadFile} disabled={busy}/></label></div>{!current.files.length?<div className="miniEmpty"><FileText/><p>لا توجد ملفات في هذا المقرر.</p></div>:current.files.map(f=><div className="file" key={f.path}><FileText/><span>{f.name}</span><small>{Math.ceil(f.size/1024)} KB</small></div>)}</>:<div className="miniEmpty"><BookOpen/><p>اختر مقررًا لعرض ملفاته.</p></div>}</div></div>}
    </main>
  </div>
}
