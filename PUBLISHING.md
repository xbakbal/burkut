# Burkut — npm Publish Rehberi

Bu dosya, Burkut paketlerini npm'de yayınlamak için adım adım kılavuzdur.

---

## Kavramlar (Hızlı Özet)

| Terim | Anlamı |
|-------|--------|
| **npm registry** | Tüm npm paketlerinin bulunduğu merkezi depo (`registry.npmjs.org`) |
| **Scoped package** | `@burkut/mcp` gibi bir org altında gruplanmış paket |
| **Semver** | `0.1.0-beta.6` formatı: `major.minor.patch-prerelease.sayı` |
| **Tag** | Version'a verilen isim. `latest` = stabil, `beta` = beta |
| **workspace:*** | pnpm'in monorepo içi bağımlılık syntax'ı. Publish sırasında gerçek versiyona çevrilir |

---

## Mevcut Paketler

```
@burkut/core   → Spec engine (parser, validator, task graph)
@burkut/mcp    → MCP server (kullanıcıların yüklediği paket)
```

## Versiyon Stratejisi

```
0.1.0-beta.x   ← beta sürüm (şu an buradayız)
0.1.0          ← ilk stabil sürüm
```

Beta ile publish edilince:
- `npx @burkut/mcp` → en son `latest` tag'i arar (henüz yok)
- `npx @burkut/mcp@beta` → beta sürümü çalıştırır

Kullanıcıların `npx -y @burkut/mcp` komutuyla sorunsuz kullanabilmesi için **stabil sürüm yayınlanmalı**.

---

## İlk Kez Publish (Kurulum)

### npm Login

```bash
npm whoami   # xbakbal çıkmalı
npm login    # giriş yapmak için
```

### @burkut Organizasyonu

npmjs.com'da `@burkut` scope'u hazır olmalı.

---

## Publish Öncesi Kontrol

```bash
# 1. Build
pnpm build

# 2. Test
pnpm test
# Beklenen: 67+ test geçmeli

# 3. Dry-run (ne yayınlanacak?)
cd packages/core && npm pack --dry-run
cd ../mcp && npm pack --dry-run
# Kontrol: src/, tsconfig.json YOK olmalı
# Olması gereken: dist/, README.md, LICENSE, package.json
```

---

## Publish Komutları

### Beta Olarak Publish

Sırası önemli: `core` önce (mcp buna bağımlı).

```bash
pnpm -r publish --tag beta --no-git-checks --access public --force
```

### Yeni Beta Versiyonu

```bash
# Her 2 paketin package.json'ında "version" alanını artır
# Örn: beta.6 → beta.7

pnpm build && pnpm test
pnpm -r publish --tag beta --no-git-checks --access public --force
```

### Stabil Sürüm

```bash
# Her 2 paketin "version" alanını "0.1.0" yap
pnpm build && pnpm test
pnpm -r publish --no-git-checks --access public --force
```

---

## Sorun Giderme

### "There are no new packages that should be published"
pnpm versiyonu zaten yayınlanmış sanıyor. `--force` ekle.

### "Cannot publish over existing version"
Aynı versiyonu tekrar publish edemezsin. Versiyon numarasını artır.

### OTP hatası (non-interactive terminal)
Komutu doğrudan kendi terminalinde çalıştır:
```bash
cd "/path/to/burkut"
pnpm -r publish --tag beta --no-git-checks --access public --force
```

### "workspace:* cannot be resolved"
`pnpm publish` bunu otomatik çözer. `npm publish` değil, `pnpm -r publish` kullan.

---

## Rutin Publish (Özet)

```bash
# 1. Versiyonları artır (her iki package.json'da)
# 2. Build + test
pnpm build && pnpm test
# 3. Publish
pnpm -r publish --tag beta --no-git-checks --access public --force
# 4. Doğrula
npm view @burkut/mcp dist-tags
```

---

## Yayınlanan İçerik

```
dist/          ← build edilmiş JS (kaynak YOK)
README.md
LICENSE
package.json
```

`.npmignore` ve `"files"` field bunu garantiler.
