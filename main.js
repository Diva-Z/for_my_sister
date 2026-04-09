var v=Object.defineProperty;var E=Object.getOwnPropertyDescriptor;var L=Object.getOwnPropertyNames;var k=Object.prototype.hasOwnProperty;var M=(c,n)=>{for(var e in n)v(c,e,{get:n[e],enumerable:!0})},C=(c,n,e,t)=>{if(n&&typeof n=="object"||typeof n=="function")for(let s of L(n))!k.call(c,s)&&s!==e&&v(c,s,{get:()=>n[s],enumerable:!(t=E(n,s))||t.enumerable});return c};var H=c=>C(v({},"__esModule",{value:!0}),c);var D={};M(D,{default:()=>x});module.exports=H(D);var l=require("obsidian"),S={apiKey:"",baseURL:"https://api.openai.com/v1",model:"gpt-4o-mini",targetLanguage:"\u7B80\u4F53\u4E2D\u6587",systemPrompt:"\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7FFB\u8BD1\uFF0C\u8BF7\u5C06\u7528\u6237\u63D0\u4F9B\u7684\u6587\u5B57\u7FFB\u8BD1\u6210{targetLanguage}\uFF0C\u53EA\u8F93\u51FA\u7FFB\u8BD1\u7ED3\u679C\uFF0C\u4E0D\u8981\u89E3\u91CA\u3002",streaming:!0},y=class{constructor(){this.isVisible=!1;this.el=document.createElement("div"),this.el.addClass("ai-translator-popup"),this.el.style.cssText=`
      position: fixed;
      z-index: 9999;
      max-width: 420px;
      min-width: 200px;
      background: var(--background-primary);
      border: 1px solid var(--background-modifier-border);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      padding: 12px 14px;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-normal);
      display: none;
      word-break: break-word;
      user-select: text;
    `;let n=this.el.createDiv({cls:"ai-translator-header"});n.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--background-modifier-border);
      cursor: move;
      user-select: none;
    `,n.createSpan({text:"\u{1F310} AI \u7FFB\u8BD1"}).style.cssText="font-weight: 600; font-size: 12px; color: var(--text-muted);";let e=n.createEl("button",{text:"\u2715"});e.style.cssText=`
      background: none; border: none; cursor: pointer;
      color: var(--text-muted); font-size: 13px; padding: 0 2px;
    `,e.onclick=()=>this.hide();let t=!1,s=0,o=0;n.addEventListener("mousedown",i=>{i.target.closest("button")||(t=!0,s=i.clientX-this.el.getBoundingClientRect().left,o=i.clientY-this.el.getBoundingClientRect().top,i.preventDefault())}),this.mouseMoveHandler=i=>{if(!t)return;let d=window.innerWidth-this.el.offsetWidth,h=window.innerHeight-this.el.offsetHeight;this.el.style.left=Math.max(0,Math.min(i.clientX-s,d))+"px",this.el.style.top=Math.max(0,Math.min(i.clientY-o,h))+"px"},this.mouseUpHandler=()=>{t=!1},document.addEventListener("mousemove",this.mouseMoveHandler),document.addEventListener("mouseup",this.mouseUpHandler),this.contentEl=this.el.createDiv({cls:"ai-translator-content"}),this.contentEl.style.cssText="min-height: 24px;";let a=this.el.createDiv({cls:"ai-translator-footer"});a.style.cssText=`
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid var(--background-modifier-border);
      display: flex;
      justify-content: flex-end;
    `;let r=a.createEl("button",{text:"\u590D\u5236"});r.style.cssText=`
      background: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      border-radius: 4px;
      padding: 4px 14px;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    `,r.onclick=()=>{var d;let i=(d=this.contentEl.textContent)!=null?d:"";i.trim()&&navigator.clipboard.writeText(i).then(()=>{r.setText("\u5DF2\u590D\u5236 \u2713"),r.style.background="var(--color-green, #4caf50)",setTimeout(()=>{r.setText("\u590D\u5236"),r.style.background="var(--interactive-accent)"},1500)})},document.body.appendChild(this.el),this.mouseDownHandler=i=>{this.isVisible&&!this.el.contains(i.target)&&this.hide()},document.addEventListener("mousedown",this.mouseDownHandler)}show(n,e){this.el.style.visibility="hidden",this.el.style.display="block",this.isVisible=!0,this.el.style.left=n+12+"px",this.el.style.top=e+20+"px",setTimeout(()=>{let t=this.el.getBoundingClientRect(),s=window.innerWidth,o=window.innerHeight,a=n+12,r=e+20;t.right>s-16&&(a=s-t.width-16),t.bottom>o-16&&(r=e-t.height-8),this.el.style.left=Math.max(8,a)+"px",this.el.style.top=Math.max(8,r)+"px",this.el.style.visibility="visible"},0)}hide(){this.el.style.display="none",this.isVisible=!1}setLoading(){this.contentEl.innerHTML='<span style="color:var(--text-muted)">\u7FFB\u8BD1\u4E2D\u2026</span>'}setContent(n){this.contentEl.textContent=n}appendContent(n){var e;this.contentEl.textContent=((e=this.contentEl.textContent)!=null?e:"")+n}setError(n){this.contentEl.innerHTML=`<span style="color:var(--text-error)">\u26A0 ${n}</span>`}destroy(){document.removeEventListener("mousemove",this.mouseMoveHandler),document.removeEventListener("mouseup",this.mouseUpHandler),document.removeEventListener("mousedown",this.mouseDownHandler),this.el.remove()}},x=class extends l.Plugin{constructor(){super(...arguments);this.toolbar=null}async onload(){await this.loadSettings(),this.popup=new y,this.registerEvent(this.app.workspace.on("editor-menu",(e,t,s)=>{let o=t.getSelection();o.trim()&&e.addItem(a=>{a.setTitle("\u{1F310} \u7FFB\u8BD1\u9009\u4E2D\u6587\u5B57").setIcon("languages").onClick(async()=>{let i=s.contentEl.getBoundingClientRect();await this.translate(o,i.left+100,i.top+200)})})})),this.registerDomEvent(document,"mouseup",e=>{e.target.closest(".ai-translator-popup")||e.target.closest(".ai-translator-toolbar")||setTimeout(()=>{let t=window.getSelection();if(!t||t.isCollapsed){this.hideToolbar();return}let s=t.toString().trim();if(!s){this.hideToolbar();return}if(e.target.closest(".cm-editor"))return;let a=t.getRangeAt(0).getBoundingClientRect();this.showToolbar(s,a.left+a.width/2,a.top)},10)}),this.registerDomEvent(document,"mousedown",e=>{e.target.closest(".ai-translator-toolbar")||this.hideToolbar()}),this.addSettingTab(new w(this.app,this)),this.addCommand({id:"translate-selection",name:"\u7FFB\u8BD1\u9009\u4E2D\u6587\u5B57",editorCallback:async e=>{let t=e.getSelection();if(!t.trim()){new l.Notice("\u8BF7\u5148\u9009\u4E2D\u8981\u7FFB\u8BD1\u7684\u6587\u5B57");return}await this.translate(t,window.innerWidth/2,window.innerHeight/2)}})}onunload(){this.hideToolbar(),this.popup.destroy()}showToolbar(e,t,s){this.hideToolbar();let o=document.createElement("div");o.addClass("ai-translator-toolbar"),o.style.cssText=`
      position: fixed;
      z-index: 10000;
      background: var(--background-primary);
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      padding: 4px 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;let a=o.createEl("button",{text:"\u{1F310} \u7FFB\u8BD1"});a.style.cssText=`
      background: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    `,a.onclick=async u=>{u.stopPropagation(),this.hideToolbar(),await this.translate(e,t,s-10)},document.body.appendChild(o),this.toolbar=o;let r=90,i=36,d=Math.max(8,Math.min(t-r/2,window.innerWidth-r-8)),h=s-i-8<8?s+24:s-i-8;o.style.left=d+"px",o.style.top=h+"px"}hideToolbar(){this.toolbar&&(this.toolbar.remove(),this.toolbar=null)}async translate(e,t,s){var a,r,i,d,h,u,m;if(!this.settings.apiKey){new l.Notice("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 API Key");return}this.popup.show(t,s),this.popup.setLoading();let o=this.settings.systemPrompt.replace("{targetLanguage}",this.settings.targetLanguage);try{let p=await fetch(`${this.settings.baseURL}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.settings.apiKey}`},body:JSON.stringify({model:this.settings.model,stream:this.settings.streaming,messages:[{role:"system",content:o},{role:"user",content:e}],max_tokens:2048,temperature:.3})});if(!p.ok){let g=await p.json();throw new Error((r=(a=g==null?void 0:g.error)==null?void 0:a.message)!=null?r:`HTTP ${p.status}`)}if(this.settings.streaming)await this.handleStream(p);else{let g=await p.json();this.popup.setContent((u=(h=(d=(i=g.choices)==null?void 0:i[0])==null?void 0:d.message)==null?void 0:h.content)!=null?u:"\uFF08\u65E0\u7ED3\u679C\uFF09")}}catch(p){this.popup.setError((m=p.message)!=null?m:"\u672A\u77E5\u9519\u8BEF")}}async handleStream(e){var r,i,d,h;let t=e.body.getReader(),s=new TextDecoder,o="",a=!0;for(;;){let{done:u,value:m}=await t.read();if(u)break;o+=s.decode(m,{stream:!0});let p=o.split(`
`);o=(r=p.pop())!=null?r:"";for(let g of p){if(!g.startsWith("data: "))continue;let f=g.slice(6).trim();if(f==="[DONE]")return;try{let b=(h=(d=(i=JSON.parse(f).choices)==null?void 0:i[0])==null?void 0:d.delta)==null?void 0:h.content;if(!b)continue;a?(this.popup.setContent(b),a=!1):this.popup.appendContent(b)}catch(T){}}}}async loadSettings(){this.settings=Object.assign({},S,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}},w=class extends l.PluginSettingTab{constructor(e,t){super(e,t);this.plugin=t}display(){let{containerEl:e}=this;e.empty(),e.createEl("h2",{text:"AI \u7FFB\u8BD1\u63D2\u4EF6\u8BBE\u7F6E"}),new l.Setting(e).setName("API Key").setDesc("OpenAI / Claude / DeepSeek \u7B49\u517C\u5BB9\u63A5\u53E3\u7684 API Key").addText(t=>t.setPlaceholder("sk-...").setValue(this.plugin.settings.apiKey).onChange(async s=>{this.plugin.settings.apiKey=s.trim(),await this.plugin.saveSettings()})),new l.Setting(e).setName("API Base URL").setDesc("\u9ED8\u8BA4 OpenAI\uFF0C\u53EF\u66FF\u6362\u4E3A DeepSeek / \u672C\u5730 Ollama \u7B49").addText(t=>t.setPlaceholder("https://api.openai.com/v1").setValue(this.plugin.settings.baseURL).onChange(async s=>{this.plugin.settings.baseURL=s.trim().replace(/\/$/,""),await this.plugin.saveSettings()})),new l.Setting(e).setName("\u6A21\u578B").setDesc("\u4F8B\u5982 gpt-4o-mini / claude-sonnet-4-6 / deepseek-chat").addText(t=>t.setValue(this.plugin.settings.model).onChange(async s=>{this.plugin.settings.model=s.trim(),await this.plugin.saveSettings()})),new l.Setting(e).setName("\u76EE\u6807\u8BED\u8A00").setDesc("\u7FFB\u8BD1\u7684\u76EE\u6807\u8BED\u8A00").addText(t=>t.setValue(this.plugin.settings.targetLanguage).onChange(async s=>{this.plugin.settings.targetLanguage=s.trim(),await this.plugin.saveSettings()})),new l.Setting(e).setName("\u7CFB\u7EDF\u63D0\u793A\u8BCD").setDesc("\u7528 {targetLanguage} \u4F5C\u4E3A\u76EE\u6807\u8BED\u8A00\u5360\u4F4D\u7B26").addTextArea(t=>t.setValue(this.plugin.settings.systemPrompt).onChange(async s=>{this.plugin.settings.systemPrompt=s,await this.plugin.saveSettings()})),new l.Setting(e).setName("\u6D41\u5F0F\u8F93\u51FA").setDesc("\u5F00\u542F\u540E\u7FFB\u8BD1\u7ED3\u679C\u9010\u5B57\u663E\u793A\uFF0C\u5173\u95ED\u5219\u7B49\u5F85\u5B8C\u6574\u7ED3\u679C").addToggle(t=>t.setValue(this.plugin.settings.streaming).onChange(async s=>{this.plugin.settings.streaming=s,await this.plugin.saveSettings()}))}};
