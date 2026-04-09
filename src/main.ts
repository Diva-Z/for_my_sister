import {
  App,
  Editor,
  MarkdownView,
  Menu,
  Plugin,
  PluginSettingTab,
  Setting,
  Notice,
} from "obsidian";

// ─── 设置接口 ───────────────────────────────────────────────
interface AITranslatorSettings {
  apiKey: string;
  baseURL: string;
  model: string;
  targetLanguage: string;
  systemPrompt: string;
  streaming: boolean;
}

const DEFAULT_SETTINGS: AITranslatorSettings = {
  apiKey: "",
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  targetLanguage: "简体中文",
  systemPrompt:
    "你是一位专业翻译，请将用户提供的文字翻译成{targetLanguage}，只输出翻译结果，不要解释。",
  streaming: true,
};

// ─── 悬浮翻译框 ──────────────────────────────────────────────
class TranslationPopup {
  private el: HTMLDivElement;
  private contentEl: HTMLDivElement;
  private isVisible = false;
  // 保存监听器引用，方便销毁时移除
  private mouseMoveHandler: (e: MouseEvent) => void;
  private mouseUpHandler: () => void;
  private mouseDownHandler: (e: MouseEvent) => void;

  constructor() {
    this.el = document.createElement("div");
    this.el.addClass("ai-translator-popup");
    this.el.style.cssText = `
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
    `;

    // ── 标题栏（可拖拽）──
    const header = this.el.createDiv({ cls: "ai-translator-header" });
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--background-modifier-border);
      cursor: move;
      user-select: none;
    `;
    header.createSpan({ text: "🌐 AI 翻译" }).style.cssText =
      "font-weight: 600; font-size: 12px; color: var(--text-muted);";

    const closeBtn = header.createEl("button", { text: "✕" });
    closeBtn.style.cssText = `
      background: none; border: none; cursor: pointer;
      color: var(--text-muted); font-size: 13px; padding: 0 2px;
    `;
    closeBtn.onclick = () => this.hide();

    // ── 拖拽逻辑 ──
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    header.addEventListener("mousedown", (e: MouseEvent) => {
      // 点关闭按钮时不触发拖拽
      if ((e.target as HTMLElement).closest("button")) return;
      isDragging = true;
      dragOffsetX = e.clientX - this.el.getBoundingClientRect().left;
      dragOffsetY = e.clientY - this.el.getBoundingClientRect().top;
      e.preventDefault();
    });

    this.mouseMoveHandler = (e: MouseEvent) => {
      if (!isDragging) return;
      const maxX = window.innerWidth - this.el.offsetWidth;
      const maxY = window.innerHeight - this.el.offsetHeight;
      this.el.style.left = Math.max(0, Math.min(e.clientX - dragOffsetX, maxX)) + "px";
      this.el.style.top = Math.max(0, Math.min(e.clientY - dragOffsetY, maxY)) + "px";
    };

    this.mouseUpHandler = () => { isDragging = false; };

    document.addEventListener("mousemove", this.mouseMoveHandler);
    document.addEventListener("mouseup", this.mouseUpHandler);

    // ── 翻译内容区 ──
    this.contentEl = this.el.createDiv({ cls: "ai-translator-content" });
    this.contentEl.style.cssText = "min-height: 24px;";

    // ── 底部复制按钮 ──
    const footer = this.el.createDiv({ cls: "ai-translator-footer" });
    footer.style.cssText = `
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid var(--background-modifier-border);
      display: flex;
      justify-content: flex-end;
    `;
    const copyBtn = footer.createEl("button", { text: "复制" });
    copyBtn.style.cssText = `
      background: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      border-radius: 4px;
      padding: 4px 14px;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    `;
    copyBtn.onclick = () => {
      const text = this.contentEl.textContent ?? "";
      if (!text.trim()) return;
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.setText("已复制 ✓");
        copyBtn.style.background = "var(--color-green, #4caf50)";
        setTimeout(() => {
          copyBtn.setText("复制");
          copyBtn.style.background = "var(--interactive-accent)";
        }, 1500);
      });
    };

    document.body.appendChild(this.el);

    // ── 点击外部关闭（合并到一个 mousedown 监听）──
    this.mouseDownHandler = (e: MouseEvent) => {
      if (this.isVisible && !this.el.contains(e.target as Node)) {
        this.hide();
      }
    };
    document.addEventListener("mousedown", this.mouseDownHandler);
  }

  show(x: number, y: number) {
    this.el.style.visibility = "hidden";
    this.el.style.display = "block";
    this.isVisible = true;

    // 先定位，渲染后再修正边界
    this.el.style.left = (x + 12) + "px";
    this.el.style.top = (y + 20) + "px";

    setTimeout(() => {
      const rect = this.el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let left = x + 12;
      let top = y + 20;
      if (rect.right > vw - 16) left = vw - rect.width - 16;
      if (rect.bottom > vh - 16) top = y - rect.height - 8;
      this.el.style.left = Math.max(8, left) + "px";
      this.el.style.top = Math.max(8, top) + "px";
      this.el.style.visibility = "visible";
    }, 0);
  }

  hide() {
    this.el.style.display = "none";
    this.isVisible = false;
  }

  setLoading() {
    this.contentEl.innerHTML = `<span style="color:var(--text-muted)">翻译中…</span>`;
  }

  // 统一用 textContent，避免 setText 和 textContent 混用
  setContent(text: string) {
    this.contentEl.textContent = text;
  }

  appendContent(chunk: string) {
    this.contentEl.textContent = (this.contentEl.textContent ?? "") + chunk;
  }

  setError(msg: string) {
    this.contentEl.innerHTML = `<span style="color:var(--text-error)">⚠ ${msg}</span>`;
  }

  destroy() {
    // 移除所有全局监听器，防止内存泄漏
    document.removeEventListener("mousemove", this.mouseMoveHandler);
    document.removeEventListener("mouseup", this.mouseUpHandler);
    document.removeEventListener("mousedown", this.mouseDownHandler);
    this.el.remove();
  }
}

// ─── 主插件 ──────────────────────────────────────────────────
export default class AITranslatorPlugin extends Plugin {
  settings: AITranslatorSettings;
  popup: TranslationPopup;
  toolbar: HTMLDivElement | null = null;

  async onload() {
    await this.loadSettings();
    this.popup = new TranslationPopup();

    // ── Markdown 编辑器右键菜单 ──
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        const selectedText = editor.getSelection();
        if (!selectedText.trim()) return;
        menu.addItem((item) => {
          item
            .setTitle("🌐 翻译选中文字")
            .setIcon("languages")
            .onClick(async () => {
              const editorEl = (view as MarkdownView).contentEl;
              const rect = editorEl.getBoundingClientRect();
              await this.translate(selectedText, rect.left + 100, rect.top + 200);
            });
        });
      })
    );

    // ── PDF / 其他视图：划词后显示翻译工具条 ──
    this.registerDomEvent(document, "mouseup", (evt: MouseEvent) => {
      if ((evt.target as HTMLElement).closest(".ai-translator-popup")) return;
      if ((evt.target as HTMLElement).closest(".ai-translator-toolbar")) return;

      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          this.hideToolbar();
          return;
        }
        const selectedText = sel.toString().trim();
        if (!selectedText) {
          this.hideToolbar();
          return;
        }
        // 编辑器内用右键菜单，不显示工具条
        if ((evt.target as HTMLElement).closest(".cm-editor")) return;

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        this.showToolbar(selectedText, rect.left + rect.width / 2, rect.top);
      }, 10);
    });

    // ── 点击其他地方隐藏工具条 ──
    this.registerDomEvent(document, "mousedown", (evt: MouseEvent) => {
      if ((evt.target as HTMLElement).closest(".ai-translator-toolbar")) return;
      this.hideToolbar();
    });

    // ── 设置面板 ──
    this.addSettingTab(new AITranslatorSettingTab(this.app, this));

    // ── 快捷键命令 ──
    this.addCommand({
      id: "translate-selection",
      name: "翻译选中文字",
      editorCallback: async (editor: Editor) => {
        const selected = editor.getSelection();
        if (!selected.trim()) {
          new Notice("请先选中要翻译的文字");
          return;
        }
        await this.translate(selected, window.innerWidth / 2, window.innerHeight / 2);
      },
    });
  }

  onunload() {
    this.hideToolbar();   // 清理工具条
    this.popup.destroy(); // 清理悬浮窗及其监听器
  }

  // ─── 划词工具条 ──────────────────────────────────────────
  showToolbar(selectedText: string, centerX: number, topY: number) {
    this.hideToolbar();

    const bar = document.createElement("div");
    bar.addClass("ai-translator-toolbar");
    bar.style.cssText = `
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
    `;

    const btn = bar.createEl("button", { text: "🌐 翻译" });
    btn.style.cssText = `
      background: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    `;
    btn.onclick = async (e) => {
      e.stopPropagation();
      this.hideToolbar();
      await this.translate(selectedText, centerX, topY - 10);
    };

    document.body.appendChild(bar);
    this.toolbar = bar;

    const barWidth = 90;
    const barHeight = 36;
    const x = Math.max(8, Math.min(centerX - barWidth / 2, window.innerWidth - barWidth - 8));
    const y = topY - barHeight - 8 < 8 ? topY + 24 : topY - barHeight - 8;

    bar.style.left = x + "px";
    bar.style.top = y + "px";
  }

  hideToolbar() {
    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }
  }

  // ─── 核心翻译函数 ─────────────────────────────────────────
  async translate(text: string, x: number, y: number) {
    if (!this.settings.apiKey) {
      new Notice("请先在设置中填写 API Key");
      return;
    }

    this.popup.show(x, y);
    this.popup.setLoading();

    const systemPrompt = this.settings.systemPrompt.replace(
      "{targetLanguage}",
      this.settings.targetLanguage
    );

    try {
      const response = await fetch(`${this.settings.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.apiKey}`,
        },
        body: JSON.stringify({
          model: this.settings.model,
          stream: this.settings.streaming,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          max_tokens: 2048,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message ?? `HTTP ${response.status}`);
      }

      if (this.settings.streaming) {
        await this.handleStream(response);
      } else {
        const data = await response.json();
        this.popup.setContent(data.choices?.[0]?.message?.content ?? "（无结果）");
      }
    } catch (err: any) {
      this.popup.setError(err.message ?? "未知错误");
    }
  }

  // ─── 流式响应处理 ─────────────────────────────────────────
  private async handleStream(response: Response) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let firstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 用 buffer 拼接，防止一个 chunk 被截断在两次 read 之间
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // 最后一行可能不完整，留到下次处理
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const chunk = json.choices?.[0]?.delta?.content;
          if (!chunk) continue;
          if (firstChunk) {
            this.popup.setContent(chunk);
            firstChunk = false;
          } else {
            this.popup.appendContent(chunk);
          }
        } catch {
          // 跳过解析失败的行
        }
      }
    }
  }

  // ─── 设置持久化 ──────────────────────────────────────────
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// ─── 设置面板 ────────────────────────────────────────────────
class AITranslatorSettingTab extends PluginSettingTab {
  plugin: AITranslatorPlugin;

  constructor(app: App, plugin: AITranslatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "AI 翻译插件设置" });

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("OpenAI / Claude / DeepSeek 等兼容接口的 API Key")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (v) => {
            this.plugin.settings.apiKey = v.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("API Base URL")
      .setDesc("默认 OpenAI，可替换为 DeepSeek / 本地 Ollama 等")
      .addText((text) =>
        text
          .setPlaceholder("https://api.openai.com/v1")
          .setValue(this.plugin.settings.baseURL)
          .onChange(async (v) => {
            this.plugin.settings.baseURL = v.trim().replace(/\/$/, "");
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("模型")
      .setDesc("例如 gpt-4o-mini / claude-sonnet-4-6 / deepseek-chat")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.model)
          .onChange(async (v) => {
            this.plugin.settings.model = v.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("目标语言")
      .setDesc("翻译的目标语言")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.targetLanguage)
          .onChange(async (v) => {
            this.plugin.settings.targetLanguage = v.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("系统提示词")
      .setDesc("用 {targetLanguage} 作为目标语言占位符")
      .addTextArea((text) =>
        text
          .setValue(this.plugin.settings.systemPrompt)
          .onChange(async (v) => {
            this.plugin.settings.systemPrompt = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("流式输出")
      .setDesc("开启后翻译结果逐字显示，关闭则等待完整结果")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.streaming)
          .onChange(async (v) => {
            this.plugin.settings.streaming = v;
            await this.plugin.saveSettings();
          })
      );
  }
}