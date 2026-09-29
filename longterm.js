let longCategory='both',longBrand='',longSelected='',longQuery='';
const longLabels={both:'門診＋影像均超過兩年',clinical:'僅門診超過兩年',imaging:'僅影像超過兩年'};
function canonicalProduct(b){return db.productHarmonization?.aliases.includes(b)?db.productHarmonization.canonical:b;}
function applyProductDisplay(){for(const p of db.patients)for(const o of p.operations){o.originalBrands??=[...o.brands];o.brands=unique(o.originalBrands.map(canonicalProduct));}}
function productBrands(o){return unique(o.brands.map(canonicalProduct));}
function longRows(){return db.longTerm.cases.filter(r=>(longCategory==='all'||r.category===longCategory)&&(!longBrand||r.brand===longBrand)&&(!longQuery||r.patient.toLowerCase().includes(longQuery.toLowerCase())));}
function longButton(pid,label=pid){return `<button data-long-case="${pid}">${esc(label)} ↗</button>`;}
function longStudy(s){return `<details><summary>${s.date} · ${esc(s.description)} · ${s.frames.length} 張${s.dynamic?' · 動態候選':''}</summary><div class="long-images">${s.frames.map((f,i)=>`<button class="long-image" data-asset="${f.asset}" data-label="${s.date} · ${esc(s.description)} · 片 ${i+1}"><span>點此載入原片</span><small>片 ${i+1} · 姿勢待核對</small></button>`).join('')}</div></details>`;}
function longCase(r){
 const p=db.patients.find(p=>p.id===r.patient),o=p.operations.find(o=>o.id===r.operation),focus=db.longTerm.focus.find(x=>x.patient===r.patient);
 const studies=p.studies.filter(s=>s.frames.length&&s.date<=db.snapshot.slice(0,10)).sort((a,b)=>a.date.localeCompare(b.date));
 const late=studies.filter(s=>r.lateStudyIds.includes(s.id));const pre=studies.filter(s=>r.preDynamicIds.includes(s.id));const other=studies.filter(s=>!r.lateStudyIds.includes(s.id)&&!r.preDynamicIds.includes(s.id));
 const near=r.nearestClinicalImaging;
 return `<section class="panel" id="long-case-detail"><div class="case-top"><h2>${r.patient} · 個案討論</h2><span class="badge">${longLabels[r.category]}</span></div>
 <div class="cards">${metric('手術日',r.date,`${num(r.age)} 歲 · ${esc(r.sex)} · ${r.hybrid?'Hybrid 候選':'未標記 Hybrid'}`)}${metric('門診追蹤',num(r.clinicalMonths)+' 月',r.clinicalDate||'缺診療正文')}${metric('影像追蹤',num(r.imagingMonths)+' 月',r.imagingDate||'缺影像')}${metric('長期動態候選',r.lateDynamicIds.length,`最後 ${r.latestDynamicDate||'缺測'}；姿勢待核對`)}</div>
 <p><b>產品：</b>${esc(r.brand)} <small>（原分類：${esc(r.originalBrand)}）</small><br><b>ADR 節段：</b>${esc(r.implantLevels.join('、')||'尚未擷取')} · ${esc(r.levelStatus)}</p>
 <details><summary>手術表原句與來源</summary><blockquote>${esc(r.operationQuote)}</blockquote><p class="muted">${r.sourceRows.map(esc).join('<br>')}</p>${o.reports.length?'<p>同日正文可於完整病例頁核對。</p>':'<p>同日手術正文缺漏，表列資料仍需確認。</p>'}</details>
 ${focus?`<div class="note"><b>${esc(focus.topic)}</b><p>${esc(focus.interpretation)}</p></div>`:''}
 <h3>臨床與影像如何對照</h3><p>${near?`兩年後最近的一組診療正文與影像相距 <b>${near.days} 天</b>：正文 ${near.clinicalDate}，影像 ${near.imagingDate}。時間接近仍不保證正文在評估頸椎。`:'沒有兩年後的診療與影像可同時配對。'}</p>
 <ul>${r.gaps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 <h3>超過兩年的 AI ROM（活動度）草稿</h3><p class="muted">下列每筆依真實量測日判斷是否超過兩週年。其他節段不可替代植入節段；未列出不代表 ROM 為零。</p>
 <div class="scroll"><table><thead><tr><th>日期／術後月</th><th>節段</th><th>ROM °</th><th>與手術的關係</th><th>來源</th></tr></thead><tbody>${r.lateROM.map(x=>`<tr><td>${x.date}<br>${num((new Date(x.date)-new Date(r.date))/86400000/30.4375)} 月</td><td>${x.level}</td><td>${num(x.degrees)}</td><td>${r.levelConfirmed?(r.implantLevels.includes(x.level)?'表列 ADR 節段':'其他節段／全頸椎'):'植入節段尚待核對'}</td><td><button data-ai-image="${x.frameA}">片 A</button> <button data-ai-image="${x.frameB}">片 B</button></td></tr>`).join('')||'<tr><td colspan="5">缺少符合條件的兩年後 AI ROM；請由原片評讀。</td></tr>'}</tbody></table></div>
 <h3>門診原句與完整紀錄</h3><p class="muted">以下為關鍵詞摘錄，保留來源日期與行號；尚未裁定否定語意、事件日期及是否為當次症狀。最新紀錄內的舊病史不當成獨立訪視。</p>
 <details><summary>展開 ${r.evidence.length} 行頸椎／症狀相關摘錄</summary>${r.evidence.map(e=>`<blockquote>${esc(e.quote)}<footer>${e.sourceDate} · 行 ${e.line}</footer></blockquote>`).join('')||'<p>無關鍵詞摘錄，請核對完整紀錄。</p>'}</details>
 ${p.notes.map(n=>`<details><summary>${n.date} · 完整診療來源</summary><pre class="source">${esc(n.text)}</pre></details>`).join('')||'<p>尚無診療正文。</p>'}
 <h3>超過兩年的原片 · ${late.length} 次檢查</h3><p class="muted">同一檢查的影像並排；動態檢查名稱不保證每張前彎／後仰姿勢已正確識別。</p>${late.map(longStudy).join('')||'<p>未取得兩年後影像。</p>'}
 <h3>術前動態候選 · ${pre.length} 次</h3>${pre.map(longStudy).join('')||'<p>術前 90 日內未取得動態候選。</p>'}
 <details><summary>其他術前／早期術後影像 · ${other.length} 次</summary>${other.map(longStudy).join('')}</details>
 <div class="toolbar section-space">${caseButton(r.patient)}<button data-go="ho">HO 分級規則與 AI 查核 →</button></div>${hoCaseForm(r,p)}
 </section>`;
}
function longTermView(){
 if(!db.longTerm)return panel('長期資料尚未載入','請重新登入。');const l=db.longTerm,c=l.counts,rr=longRows();if(!rr.some(r=>r.patient===longSelected))longSelected=rr[0]?.patient;const r=rr.find(x=>x.patient===longSelected);
 return title('LONG-TERM CASE CONFERENCE','超過兩年 · 個案討論','以實際取得紀錄為準，集中手術、門診、原片與待評讀問題。')+
 `<div class="cards">${metric('超過兩年病例',c.total,'清理後 334 位中；人數不重複')}${metric('門診＋影像都有',c.both,'優先個案討論群')}${metric('僅門診達標',c.clinicalOnly,'影像較短或缺漏')}${metric('僅影像達標',c.imagingOnly,'診療正文較短或缺漏')}</div>`+
 `<div class="note"><b>收案規則：</b>${esc(l.definition)}<p>門診超過兩年共 ${c.clinical} 位；影像 ${c.imaging} 位；兩年後動態候選 ${c.dynamic} 位，其中 ${c.preAndLateDynamic} 位另有術前 90 日動態候選。這些是資料可用性，不是已完成的長期量測。</p><p>${l.boundaryExclusions.length} 位的影像恰為兩週年，未列入「超過」兩年。本版不與先前「≥24 月」或「18–30 月窗口」混算。</p></div>`+
 panel('優先討論的 5 個病例',`<div class="long-focus">${l.focus.map(f=>`<article><h3>${longButton(f.patient)}</h3><b>${esc(f.topic)}</b><p>${esc(f.interpretation)}</p></article>`).join('')}</div>`)+
 panel('產品合併與長期組成',`<p>依 Jason 2026-09-29 確認，ProC-VIVO、ProDisc-C、ProDisc-C VIVO II、VIVO II 合併為 <b>ProDisc-C / VIVO II</b>。全體合併後 132 位；原手術文字與原分類保留。</p><div class="bars">${l.brands.map(b=>`<div class="bar-row"><span>${esc(b.brand)}</span><div class="bar-track"><div class="bar-fill" style="width:${b.n/l.cases.length*100}%"></div></div><b>${b.n}</b></div><small>其中 ${b.both} 位門診＋影像均超過兩年</small>`).join('')}</div>`)+
 `<section class="panel"><h2>病例名單</h2><div class="toolbar"><label>追蹤範圍<select id="long-category">${Object.entries({both:longLabels.both,all:'全部超過兩年病例',clinical:longLabels.clinical,imaging:longLabels.imaging}).map(([v,t])=>`<option value="${v}" ${longCategory===v?'selected':''}>${t}</option>`).join('')}</select></label><label>產品<select id="long-brand"><option value="">全部產品</option>${l.brands.map(b=>`<option ${longBrand===b.brand?'selected':''}>${esc(b.brand)}</option>`).join('')}</select></label><label>病例編號<input id="long-query" value="${esc(longQuery)}" placeholder="例如 ADR-164"></label><button id="long-csv">匯出目前名單 CSV</button></div>
 <p id="long-count">${rr.length} 位符合目前篩選；由較長追蹤排序。點病例進入下方詳細討論。</p><div class="scroll"><table><thead><tr><th>病例</th><th>產品／手術日</th><th>門診 月／末次日</th><th>影像 月／末次日</th><th>兩年後動態</th><th>缺漏分類</th></tr></thead><tbody>${rr.map(x=>`<tr class="${x.patient===longSelected?'selected-row':''}"><td>${longButton(x.patient)}</td><td>${esc(x.brand)}<br>${x.date}</td><td>${num(x.clinicalMonths)}<br>${x.clinicalDate||'缺測'}</td><td>${num(x.imagingMonths)}<br>${x.imagingDate||'缺測'}</td><td>${x.lateDynamicIds.length} 次</td><td>${longLabels[x.category]}</td></tr>`).join('')}</tbody></table></div></section>`+(r?longCase(r):panel('沒有符合病例','請調整篩選。'));
}
function hoSuggestion({quality,morphology,motion,attribution}){
 if(quality!=='adequate')return {grade:null,text:'未分級：先確認植入節段、影像品質與姿勢。'};
 if(morphology==='none')return motion==='restricted'||motion==='absent'?{grade:null,text:'未分級：未見 HO 但活動受限，先釐清原因，不能由低 ROM 判高分級。'}:{grade:0,text:'Grade 0 候選：已確認影像未見 HO；仍需獨立評讀。'};
 if(morphology==='outside')return motion==='restricted'||motion==='absent'?{grade:null,text:'未分級：形態與功能需重新核對。'}:{grade:1,text:'Grade I 候選：骨化尚未進入椎間盤空間。'};
 if(morphology==='inside'&&motion==='preserved')return {grade:2,text:'Grade II 候選：进入椎間盤空間，但未顯著阻礙活動。'};
 if(['inside','bridge'].includes(morphology)&&motion==='restricted'&&attribution==='yes')return {grade:3,text:'Grade III 候選：骨化阻礙活動，但仍有部分活動。'};
 if(morphology==='bridge'&&motion==='absent'&&attribution==='yes')return {grade:4,text:'Grade IV 候選：連續骨橋與幾乎／完全無活動共同支持。'};
 return {grade:null,text:'未分級：缺少動態功能、骨橋或骨化限制活動的證據，或形態與功能不一致。'};
}
function hoInputs(){return `<label>影像／節段確認<select name="quality"><option value="unknown">尚未確認</option><option value="adequate">已核對 ADR 節段、姿勢與品質</option></select></label><label>骨化形態<select name="morphology"><option value="unknown">未知／看不清</option><option value="none">未見 HO</option><option value="outside">椎間盤空間外</option><option value="inside">進入椎間盤空間</option><option value="bridge">連續骨橋</option></select></label><label>同節段活動<select name="motion"><option value="unknown">缺動態片／尚未判讀</option><option value="preserved">未顯著受限</option><option value="restricted">受限但仍有活動</option><option value="absent">幾乎／完全無活動</option></select></label><label>骨化限制活動證據<select name="attribution"><option value="unknown">尚未確認</option><option value="yes">動態片支持由骨化／骨刺阻擋</option></select></label>`;}
function hoCaseForm(r,p){
 const st=p.studies.filter(s=>r.lateStudyIds.includes(s.id));return `<section class="note"><h3>HO 分級草稿 · ${r.patient}</h3><p>規則提示只整理你的評讀輸入，不會由 AI 輪廓自行判 HO。保存後仍是待複核草稿，只存本瀏覽器的加密空間；到「原始概覽與草稿」可加密匯出。</p><form id="long-ho-form"><div class="grid2">${hoInputs()}<label>來源檢查<select name="study" required><option value="">請選兩年後檢查</option>${st.map(s=>`<option value="${s.id}">${s.date} · ${esc(s.description)}</option>`).join('')}</select></label><label>實際評讀的 ADR 節段<select name="level" required><option value="">請確認植入位置後選擇</option>${['C2-3','C3-4','C4-5','C5-6','C6-7','C7-T1'].map(l=>`<option>${l}</option>`).join('')}</select></label><label>評讀者<input name="reader" required maxlength="80"></label><label>原片證據與疑義<textarea name="comment" required placeholder="記錄骨化位置、所用片號、活動與判斷理由"></textarea></label></div><p id="long-ho-suggestion" role="status">未分級：請先核對原片。</p><button type="submit">加密保存分級草稿</button><p id="long-ho-status" role="status"></p></form></section>`;
}
function hoReviewView(){const h=db.hoReview;if(!h)return panel('分級規則尚未載入','請重新登入。');return title('HO REVIEW · EVIDENCE & ASSISTANCE','HO 分級規則與 AI 查核',h.intro)+
 panel('0–IV 級怎麼判讀',`<p>${esc(h.protocol)}</p><div class="scroll"><table><thead><tr><th>Grade</th><th>判讀意義</th><th>需要的證據</th></tr></thead><tbody>${h.grades.map(g=>`<tr><td><b>${g.grade}</b></td><td>${esc(g.meaning)}</td><td>${esc(g.need)}</td></tr>`).join('')}</tbody></table></div><p>操作來源：<a href="https://www.ijssurgery.com/content/12/3/352" target="_blank" rel="noreferrer">Nunley 2018 Table 1</a>。本頁為中文摘要。</p><ol>${h.workflow.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><ul>${h.cautions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`)+
 panel('分級規則練習 · 不讀取影像、不保存病人分級',`<p>選形態與活動後顯示待複核候選；缺資料會停在未分級。正式個案請回長期病例頁，連同原片來源保存草稿。</p><form id="ho-rule-demo" class="grid2">${hoInputs()}</form><p id="ho-rule-result" role="status">未分級：先確認植入節段、影像品質與姿勢。</p>`)+
 panel('相似 AI 功能與本次採用判斷',`<p>${esc(h.conclusion)}</p>${h.tools.map(t=>`<article class="long-tool"><h3><a href="${t.url}" target="_blank" rel="noreferrer">${esc(t.name)}</a></h3><p>${esc(t.function)}</p><p>${esc(t.evidence)}</p><p><b>本研究判斷：</b>${esc(t.decision)}</p><small>${esc(t.state)}</small>${t.repo?` · <a href="${t.repo}" target="_blank" rel="noreferrer">作者程式庫</a>`:''}</article>`).join('')}`)+
 panel('本次已改善',`<ul>${h.implemented.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button data-go="longterm">回到超過兩年病例 →</button>`)+
 panel('文獻與查核範圍',`<p>查核日期 ${h.searchedAt}。${esc(h.scope)}</p>${h.sources.map(s=>`<p><a href="${s.url}" target="_blank" rel="noreferrer">${esc(s.title)}</a><br>${esc(s.read)}<br><small>${esc(s.support)}</small></p>`).join('')}`);}
function wireLongTerm(){
 if(tab==='ho')$('#ho-rule-demo').onchange=()=>{$('#ho-rule-result').textContent=hoSuggestion(Object.fromEntries(new FormData($('#ho-rule-demo')))).text;};
 if(tab!=='longterm')return;
 $('#long-category').onchange=e=>{longCategory=e.target.value;render()};$('#long-brand').onchange=e=>{longBrand=e.target.value;render()};$('#long-query').onchange=e=>{longQuery=e.target.value.trim();render()};
 $$('[data-long-case]').forEach(b=>b.onclick=()=>{longSelected=b.dataset.longCase;if(!longRows().some(x=>x.patient===longSelected)){longCategory='all';longBrand='';longQuery='';}render();$('#long-case-detail')?.scrollIntoView({block:'start'})});
 $('#long-csv').onclick=()=>{const cols=['patient','brand','originalBrand','date','anniversary2','category','clinicalDate','clinicalMonths','imagingDate','imagingMonths'];const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';downloadDiscussionBlob(new Blob(['\uFEFF'+[cols,...longRows().map(r=>cols.map(k=>r[k]))].map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'ADR-longterm-cases.csv');};
 loadImages();
 const f=$('#long-ho-form');if(!f)return;
 f.onchange=()=>{$('#long-ho-suggestion').textContent=hoSuggestion(Object.fromEntries(new FormData(f))).text;};
 f.onsubmit=async e=>{e.preventDefault();const fields=Object.fromEntries(new FormData(f)),suggestion=hoSuggestion(fields),r=db.longTerm.cases.find(x=>x.patient===longSelected),p=db.patients.find(x=>x.id===longSelected),s=p.studies.find(x=>x.id===fields.study);try{
 if(suggestion.grade===null)throw Error('證據不足或矛盾，保持未分級。');if(!s||!r.lateStudyIds.includes(s.id))throw Error('需要本病例兩年後的來源檢查。');if(suggestion.grade>=2&&(!s.dynamic||s.frames.length<2))throw Error('本版 II–IV 草稿須連結已核對的動態檢查。');
 if(r.levelConfirmed&&!r.implantLevels.includes(fields.level))throw Error('所選位置不是目前已核對的 ADR 節段。');
 const newDraft={patient:p.id,operation:r.operation,study:s.id,date:s.date,level:fields.level,reader:fields.reader.trim(),rom:null,cobb:null,globalCobb:null,ho:suggestion.grade,comment:'[HO 規則提示草稿；未獨立複核] '+fields.comment,at:new Date().toISOString(),sourceHash:p.sourceHash,hoEvidence:{protocol:db.hoReview.version,quality:fields.quality,morphology:fields.morphology,motion:fields.motion,attribution:fields.attribution,assets:s.frames.map(x=>x.asset)}};
 const existing=drafts.find(x=>draftId(x)===draftId(newDraft));if(existing)throw Error('同評讀者／節段／檢查已有草稿；請至完整病例頁核對，避免覆寫原量測。');await persistDrafts([...drafts,newDraft]);$('#long-ho-status').textContent='已加密保存待複核草稿；未當作正式分級。';
 }catch(err){$('#long-ho-status').textContent='未保存：'+err.message;}};
}
