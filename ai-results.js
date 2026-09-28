let aiPatient='',aiViewedAsset=null,aiShowOverlay=false;
const aiReasons={fewer_than_4_unique_levels:'少於 4 個可信且唯一的椎體',level_order_conflict:'椎體順序矛盾',non_upright_or_non_lateral_candidate:'投照或排列不符候選條件',duplicate_level_predictions:'同節段重複辨識，整張隔離',required_endplates_not_fitted:'所需終板無法擬合'};
const aiLevels=['C2-7','C3-4','C4-5','C5-6','C6-7'];
function aiMeasurementView(){
 const a=db.aiMeasurements;if(!a)return panel('AI 試測尚未載入','請重新登入以載入新版本。');const s=a.summary;
 if(!aiPatient)aiPatient=db.patients.find(p=>p.studies.length)?.id;
 const p=db.patients.find(p=>p.id===aiPatient),rows=a.images.filter(r=>r.patient===aiPatient),pairs=a.studies.filter(r=>r.patient===aiPatient&&r.ROM&&Object.keys(r.ROM).length);
 const study=new Map((p?.studies||[]).map(s=>[s.id,s]));
 return title('AI SCREENING · UNREVIEWED DRAFTS','全部影像 AI 試測','每張均有處理狀態；以下為分割模型衍生角度候選，尚未經人工裁定，不能當成正式研究結果。')+
 `<div class="cards">${metric('已處理影像',s.processed,`${s.totalImages} 張來源；執行錯誤 ${s.errors}`)}${metric('有角度候選',s.geometryCandidateImages,`${s.patientsWithAngle} 位至少一張；非正式可測率`)}${metric('F/E 配對候選',s.romCandidateStudies,`${s.patientsWithROM} 位；姿勢仍待人工核對`)}${metric('正式確認／HO',0,'尚未雙評讀；HO 未分級，並非 Grade 0')}</div>`+
 `<div class="note"><b>這批是 AI 初稿。</b>模型曾在術後金屬附近漏抓或錯標節段；幾何檢核通過仍可能有錯。Cobb 欄為無符號終板候選夾角；ROM 僅依同次明載 F/E 的兩張影像計算角度差。每項都可打開原片查看 AI 輪廓與終板線。所有可測節段均列出，<b>不代表該節段就是 ADR</b>。</div>`+
 panel('處理覆蓋與失敗原因',`<p>${s.detectedImages} 張有椎體辨識；${s.globalAngleImages} 張有 C2–7 角度候選；${s.segmentalROMValues} 個節段／訪視 ROM 候選。未通過者保留影像及原因，不補數值。</p><div class="scroll"><table><thead><tr><th>檢核標記（可重疊）</th><th>影像數</th></tr></thead><tbody>${Object.entries(s.flags).map(([k,n])=>`<tr><td>${aiReasons[k]||esc(k)}</td><td>${n}</td></tr>`).join('')}</tbody></table></div>`)+
 panel('逐病人角度與原片',`<div class="toolbar"><label for="ai-patient">病例</label><select id="ai-patient">${db.patients.map(p=>`<option value="${p.id}" ${p.id===aiPatient?'selected':''}>${p.id} · ${esc(unique(p.operations.flatMap(o=>o.brands)).join('/'))}</option>`).join('')}</select>${p?caseButton(p.id):''}</div><p class="muted">${rows.length} 張處理紀錄。度數為 AI 候選，不顯示者是缺測。打開影像後用「AI 輪廓／終板」切換原片，方便核對。</p><div class="scroll"><table><thead><tr><th>日期／原片</th><th>檢查類型</th>${aiLevels.map(l=>`<th>${l} 候選角 °</th>`).join('')}<th>狀態</th></tr></thead><tbody>${rows.map(r=>`<tr><td><button data-ai-image="${r.asset}">${study.get(r.study)?.date||'日期缺'} · 影像 ${(study.get(r.study)?.frames.findIndex(f=>f.asset===r.asset)??0)+1} ↗</button></td><td>${esc(study.get(r.study)?.description)}</td>${aiLevels.map(l=>`<td>${num(r.measurements[l]?.degrees)}</td>`).join('')}<td>${r.flags.map(k=>aiReasons[k]||k).map(esc).join('；')||(r.geometryCandidate?'角度候選 · 待核對':'未產生角度')}</td></tr>`).join('')||'<tr><td colspan="8">無已取得影像</td></tr>'}</tbody></table></div>`)+
 panel('同次屈曲／伸展配對的 ROM 草稿',`<p class="muted">只納入名稱同時含 flex 與 ext、預期且取得恰兩張、兩張均通過幾何條件的研究。這是檢查名稱支持的配對，尚未逐片確認姿勢、方向及活動充分性。</p><div class="scroll"><table><thead><tr><th>日期</th>${aiLevels.map(l=>`<th>${l} ROM 候選 °</th>`).join('')}<th>兩張來源</th></tr></thead><tbody>${pairs.map(s=>`<tr><td>${s.date}</td>${aiLevels.map(l=>`<td>${num(s.ROM[l])}</td>`).join('')}<td>${s.frames.map((f,i)=>`<button data-ai-image="${f}">片 ${i+1} ↗</button>`).join(' ')}</td></tr>`).join('')||'<tr><td colspan="7">本病例沒有符合配對與幾何條件的候選。不能推定 ROM 為零。</td></tr>'}</tbody></table></div>`)+
 panel('清理後 cohort 的品牌覆蓋',`<p class="muted">沿用紀錄分析的 334 位 index 候選。計數是有 AI 草稿的病人数，非品牌療效；兩年仍固定 18–30 月窗口。核對原手術節段後，這 2 位量到的皆非植入節段；植入節段兩年 ROM 仍缺測。</p><div class="scroll"><table><thead><tr><th>品牌</th><th>原 cohort N</th><th>有角度草稿</th><th>有 ROM 配對草稿</th><th>两年任一範圍 ROM 草稿</th></tr></thead><tbody>${a.brands.map(b=>`<tr><td>${esc(b.brand)}</td><td>${b.patients}</td><td>${b.anglePatients}</td><td>${b.romPatients}</td><td>${b.window24Patients}</td></tr>`).join('')}</tbody></table></div><details><summary>展開两年窗口的 ${a.window24.length} 位 AI 配對候選</summary><div class="scroll"><table><thead><tr><th>病例</th><th>品牌／日期</th>${aiLevels.map(l=>`<th>${l} ROM 候選 °</th>`).join('')}</tr></thead><tbody>${a.window24.map(r=>`<tr><td><button data-ai-patient="${r.patient}">${r.patient} ↗</button></td><td>${esc(r.brand)}<br>${r.date}</td>${aiLevels.map(l=>`<td>${num(r.ROM[l])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`)+
 panel('方法、來源與研究限制',`<ul>${a.limitations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>模型：<a href="${a.model.repo}" target="_blank" rel="noreferrer">Cervical Spine Segmentation App 的 YOLO11s-seg 權重</a>；Ultralytics ${a.model.ultralytics}、${a.model.device}、輸入 ${a.model.inputSize} px。原片來源 hash 均核對；模型權重未放上 GitHub。</p><p class="muted">模型 commit ${a.model.commit}<br>模型 SHA-256：<small style="overflow-wrap:anywhere">${a.model.sha256}</small><br>來源快照：${a.sourceSnapshot}<br>試測整理：${a.generatedAt}</p><p><b>下一步：</b>先核對椎體標籤、ADR 節段、終板與姿勢，再形成經兩位評讀者確認的資料表。HO 仍需專門判讀，沒有自動填入分級。</p>`);
}
function wireAI(){
 if($('#ai-patient'))$('#ai-patient').onchange=e=>{aiPatient=e.target.value;render()};
 $$('[data-ai-patient]').forEach(b=>b.onclick=()=>{aiPatient=b.dataset.aiPatient;render();$('#ai-patient')?.focus()});
 $$('[data-ai-image]').forEach(b=>b.onclick=()=>{aiShowOverlay=true;const r=db.aiMeasurements.images.find(x=>x.asset===b.dataset.aiImage);openViewer(b.dataset.aiImage,r.patient+' · AI 輪廓與終板草稿')});
}
$('#toggle-ai').onclick=()=>{aiShowOverlay=!aiShowOverlay;draw()};
function drawAIOverlay(){
 if(!aiShowOverlay||!aiViewedAsset||!db?.aiMeasurements)return;
 const r=db.aiMeasurements.images.find(x=>x.asset===aiViewedAsset);if(!r)return;
 const point=p=>({x:offset.x+p[0]*viewImg.width*scale,y:offset.y+p[1]*viewImg.height*scale});
 ctx.save();ctx.lineWidth=2*devicePixelRatio;ctx.font=`${13*devicePixelRatio}px sans-serif`;
 for(const [i,o]of r.overlay.entries()){
  ctx.strokeStyle=['#ffe755','#ffb347','#7dff81','#64eaff','#ff8ae8','#ff6666'][Number(o.level.replace('C',''))-2]||'#fff';ctx.fillStyle=ctx.strokeStyle;
  const points=o.polygon.map(point);if(!points.length)continue;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.stroke();ctx.fillText(o.level+' '+o.confidence.toFixed(2),points[0].x,points[0].y-5);
 }
 ctx.strokeStyle='#ffffff';ctx.lineWidth=3*devicePixelRatio;
 for(const v of Object.values(r.endplates))for(const name of ['upper','lower']){if(!v[name])continue;const [a,b]=v[name].map(point);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 ctx.restore();
}
