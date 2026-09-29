let discussionMetric='all',discussionRole='all';
const discussionFigureURLs=new Map();
function discussionFigure(name){
 if(!discussionFigureURLs.has(name))discussionFigureURLs.set(name,URL.createObjectURL(new Blob([db.discussion.figures[name].svg],{type:'image/svg+xml'})));
 return discussionFigureURLs.get(name);
}
function discussionTable(t){return `<div class="scroll"><table><thead><tr>${t.headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map(x=>`<td>${esc(String(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function discussionPairRows(){
 return db.discussion.pairs.filter(r=>(discussionMetric==='all'||r.metric===discussionMetric)&&(discussionRole==='all'||r.role===discussionRole));
}
function discussionPairTable(){
 const rr=discussionPairRows();
 return `<p class="muted">${rr.length} 個配對，${new Set(rr.map(r=>r.patient)).size} 位病人。同人多節段會重複列出；AI 草稿未經正式評讀。</p><div class="scroll"><table><thead><tr><th>病例／指標／節段</th><th>節段角色</th><th>術前日期／度數</th><th>術後日期／度數</th><th>術後時間</th><th>變化量 Δ</th><th>核對原片</th></tr></thead><tbody>${rr.map(r=>`<tr><td>${caseButton(r.patient)}<br>${esc(r.metric)} · ${esc(r.level)}</td><td>${esc(r.role)}</td><td>${r.preDate}<br><b>${r.pre.toFixed(2)}°</b></td><td>${r.postDate}<br><b>${r.post.toFixed(2)}°</b></td><td>${r.postMonths} 月${r.postMonths<.25?'<br><span class="badge warn">術後 7 天內</span>':''}</td><td>${r.delta>0?'+':''}${r.delta.toFixed(2)}°</td><td>${r.preAssets.map((x,i)=>`<button data-ai-image="${x}">術前 ${i+1}</button>`).join(' ')}<br>${r.postAssets.map((x,i)=>`<button data-ai-image="${x}">術後 ${i+1}</button>`).join(' ')}</td></tr>`).join('')||'<tr><td colspan="7">此條件沒有配對，缺測不代表零。</td></tr>'}</tbody></table></div>`;
}
function discussionView(){
 const d=db.discussion;if(!d)return panel('圖表與詳細解讀','請重新登入以載入完整討論版。');
 return title('DISCUSSION REPORT · EXPLORATORY','圖表與詳細解讀','術前、術後、門診與影像放在一起看。英文名詞附中文說明；圖表、PDF 與原片可互相核對。')+
 `<div class="note">此頁品牌已套用 9/29 合併規則。下方 PDF 是 9/28 固定歷史版，仍含舊產品分組，不含新的長期病例專區；最新內容請以網頁為準。</div><div class="toolbar"><button id="discussion-pdf" class="primary">下載 9/28 歷史版 PDF</button><button id="discussion-csv">下載配對數值 CSV</button><span id="discussion-download-status" role="status"></span></div>`+
 `<div class="cards">${metric('植入節段 ROM',d.counts.implantROMPairs,`${d.counts.implantROMPatients} 位 · 手術表節段核對`)}${metric('全部 ROM 配對',d.counts.romPairs,`${d.counts.romPatients} 位 · 含其他節段／全頸椎`)}${metric('C2–7 Cobb 配對',d.counts.globalCobbPairs,'同病人術前／術後 · 角度草稿')}${metric('圖表／詳細章節',Object.keys(d.figures).length,`${d.sections.length} 節說明 · 與 PDF 共用資料`)}</div>`+
 `<div class="note"><b>怎麼讀：</b>灰藍點＝術前，綠點＝術後；同一條線連同人同節段。Δ＝術後減術前，正值不代表效果較好。每張圖都附追蹤月份與限制，<b>這些是待評讀的 AI 草稿</b>，不是品牌療效排名。Cobb 為無符號夾角，尚不能解讀成前凸改善。</div>`+
 `<div class="discussion-toc" aria-label="報告目錄">${d.sections.map((s,i)=>`<a href="#discussion-${i}">${esc(s.title)}</a>`).join('')}<a href="#discussion-pairs">逐例數值與原片</a></div>`+
 d.sections.map((s,i)=>`<section class="panel discussion-section" id="discussion-${i}"><h2>${esc(s.title)}</h2><p class="discussion-lead">${esc(s.lead)}</p><div class="discussion-prose">${s.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div>${s.figure?`<figure class="discussion-chart"><img src="${discussionFigure(s.figure)}" alt="${esc(s.title+'：'+s.lead)}" loading="lazy"><figcaption>AI 探索草稿 · ${esc(s.lead)} <button data-discussion-chart="${s.figure}">放大圖表 ↗</button></figcaption></figure>`:''}${s.table?discussionTable(s.table):''}</section>`).join('')+
 `<section class="panel discussion-section" id="discussion-pairs"><h2>逐例配對數值與原片</h2><p>同一病人、同一節段：術前 90 日內最近一次，術後最後一次可用草稿。不同指標可能來自不同日期。點原片可查看 AI 輪廓與終板定位。</p><div class="toolbar"><label>量測 <select id="discussion-metric">${['all','ROM','Cobb'].map(x=>`<option value="${x}" ${discussionMetric===x?'selected':''}>${x==='all'?'全部指標':x==='ROM'?'ROM（活動度）':'Cobb（夾角）'}</option>`).join('')}</select></label><label>範圍 <select id="discussion-role">${['all',...new Set(d.pairs.map(r=>r.role))].map(x=>`<option value="${x}" ${discussionRole===x?'selected':''}>${x==='all'?'全部範圍':esc(x)}</option>`).join('')}</select></label></div><div id="discussion-pair-table">${discussionPairTable()}</div></section>`+
 `<p class="muted">來源快照：${esc(d.snapshot)} · 報告版本：${esc(d.version)}。下載檔於登入後在本機解密。</p><dialog id="discussion-figure-dialog"><div class="viewer-head"><b>圖表放大 · AI 探索草稿</b><button id="discussion-figure-close">關閉 ✕</button></div><div class="discussion-figure-scroll"><img id="discussion-figure-large" alt="放大研究圖表"></div></dialog>`;
}
function downloadDiscussionBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function wireDiscussion(){
 if(tab!=='discussion')return;
 for(const [id,name]of [['discussion-metric','metric'],['discussion-role','role']])$('#'+id).onchange=e=>{if(name==='metric')discussionMetric=e.target.value;else discussionRole=e.target.value;const y=window.scrollY;render();window.scrollTo(0,y)};
 $$('[data-discussion-chart]').forEach(b=>b.onclick=()=>{$('#discussion-figure-large').src=discussionFigure(b.dataset.discussionChart);$('#discussion-figure-dialog').showModal()});
 $('#discussion-figure-close').onclick=()=>$('#discussion-figure-dialog').close();
 $('#discussion-pdf').onclick=async()=>{const b=$('#discussion-pdf');b.disabled=true;$('#discussion-download-status').textContent='正在解密 PDF…';try{const plain=await decrypt(await(await fetchGood('report.bin')).arrayBuffer(),'report.bin');downloadDiscussionBlob(new Blob([plain],{type:'application/pdf'}),'ADR-discussion-report.pdf');$('#discussion-download-status').textContent='PDF 已解密並開始下載。';}catch{$('#discussion-download-status').textContent='PDF 下載失敗，請確認網路後重試。';}finally{b.disabled=false;}};
 $('#discussion-csv').onclick=()=>{const cols=['patient','metric','level','role','brand','opDate','preDate','postDate','preDays','postMonths','pre','post','delta'];const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';const csv='\uFEFF'+[cols,...discussionPairRows().map(r=>cols.map(k=>r[k]))].map(r=>r.map(quote).join(',')).join('\r\n');downloadDiscussionBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),'ADR-paired-measurements.csv');$('#discussion-download-status').textContent='已匯出目前篩選的配對數值。';};
}
