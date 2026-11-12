// Exporta el contenido público actual a assets/respaldo.js (respaldo que usa la intranet si Supabase falla).
// Uso: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/export-respaldo.mjs
import { writeFileSync } from 'node:fs';
const url = (process.env.SUPABASE_URL || 'http://127.0.0.1:56321').replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const q = async (p) => { const r = await fetch(`${url}/rest/v1/${p}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }); if (!r.ok) throw new Error(p + ' → ' + r.status); return r.json(); };
const content = {
  settings: Object.fromEntries((await q('site_settings?select=key,value')).map((r) => [r.key, r.value])),
  menu: await q('menu_items?select=id,parent_id,zone,label,kind,target,tool_id,icon,position,visible&order=position'),
  categories: await q('tool_categories?select=id,label,position,visible&order=position'),
  tools: await q('tools?select=id,category_id,name,icon,url,position,visible&order=position'),
  news: await q('news?select=id,title,body,category,image_path,published_on,status,featured_order&featured_order=not.is.null&order=featured_order'),
  events: await q('events?select=id,title,type,person_name,event_month,event_day,event_date,event_time,description,visible,emoji'),
  generatedAt: new Date().toISOString(),
};
writeFileSync(new URL('../assets/respaldo.js', import.meta.url), '/* Generado por scripts/export-respaldo.mjs — no editar a mano */\nwindow.PX_RESPALDO = ' + JSON.stringify(content, null, 1) + ';\n');
console.log('respaldo.js escrito:', content.tools.length, 'herramientas,', content.menu.length, 'menús');
