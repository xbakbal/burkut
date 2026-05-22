# BURKUT — Spec-Driven Development Platform

## Proje Vizyonu

**Burkut** (Türk mitolojisinde kutsal kartal, yüksekten büyük resmi gören) — herhangi bir AI coding
agent ile çalışan, agent-agnostic spec-driven development MCP server.

MCP (Model Context Protocol) standardı üzerinden çalıştığı için Claude Code, Cursor, OpenCode,
Windsurf, VS Code Copilot, Gemini CLI ve diğer tüm MCP destekleyen agent'larla uyumludur.

---

## Mimari

```
@burkut/core   → Spec engine (parser, validator, graph)
@burkut/mcp    → MCP Server (6 tool: init, new, plan, implement, status, list)
```

---

## Spec Dosya Yapısı

```
.specs/
├── .state.json              ← Global state (spec statüsleri)
├── burkut.config.md         ← Proje context'i (AI bu dosyayı okur)
└── features/
    └── user-auth/
        ├── requirements.md  ← EARS notation
        ├── design.md        ← Mimari, sequence diyagramlar
        └── tasks.md         ← Wave-ordered implementasyon görevleri
```

---

## Workflow

```
Agent → burkut_spec_init       (proje başlat)
Agent → burkut_spec_new        (spec oluştur)
Agent: requirements markdown üretir (EARS notation)
Agent → burkut_spec_plan       (validate + kaydet)
Agent: kullanıcıya sorar → onay
Agent: design markdown üretir
Agent → burkut_spec_plan       (validate + kaydet)
Agent: kullanıcıya sorar → onay
Agent: tasks markdown üretir
Agent → burkut_spec_plan       (validate + kaydet)
Agent: implementasyon yapar (kendi tool'larıyla)
Agent → burkut_spec_implement  (task status güncelle)
Agent → burkut_spec_status     (ilerleme kontrol)
```

---

## MCP Tool'ları

| Tool | Argümanlar | Açıklama |
|------|-----------|----------|
| `burkut_spec_init` | `projectName?` | Proje başlat, .specs/ oluştur |
| `burkut_spec_new` | `name` | Yeni spec oluştur (template dosyalar) |
| `burkut_spec_plan` | `name`, `phase`, `content` | Markdown'u parse et, validate et, kaydet |
| `burkut_spec_implement` | `name`, `taskId`, `status` | Task durumunu güncelle |
| `burkut_spec_status` | — | Tüm spec durumları |
| `burkut_spec_list` | — | Spec listesi |

---

## Kurulum (Kullanıcı)

```json
// Claude Code (.mcp.json), Cursor (.cursor/mcp.json):
{
  "mcpServers": {
    "burkut": { "command": "npx", "args": ["-y", "@burkut/mcp"] }
  }
}

// OpenCode (opencode.json):
{
  "mcp": {
    "burkut": { "type": "local", "command": ["npx", "-y", "@burkut/mcp"] }
  }
}
```

---

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Dil | TypeScript 5.x |
| Monorepo | pnpm workspaces + turborepo |
| MCP SDK | @modelcontextprotocol/sdk |
| Bundler | tsup |
| Test | Vitest |
| Validation | Zod |

---

## Desteklenen Agent'lar

- Claude Code (Anthropic)
- Cursor
- OpenCode
- Windsurf (Codeium)
- VS Code / GitHub Copilot
- Gemini CLI (Google)
- Cline / RooCode
- Claude Desktop
- Herhangi bir MCP client
