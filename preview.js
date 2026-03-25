// ============================================================
//  WELCOME CARD — LOCAL PREVIEW SIMULATOR
//  Generates welcome.preview.png without a Discord token.
//
//  INSTALL (if you haven't already):
//    npm install @napi-rs/canvas
//
//  RUN:
//    node preview.js
//
//  OUTPUT:
//    welcome.preview.png  ← opens this in any image viewer
//
//  HOW TO USE:
//    1. Edit MOCK at the top to fake any user/server values
//    2. Run the script
//    3. Open welcome.preview.png
//    4. Repeat until you're happy with the style
//    5. Copy your LAYERS changes back into welcomeCard.template.js
// ============================================================

const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const fs   = require("fs");
const path = require("path");

// ============================================================
//  MOCK DATA — replaces real Discord member/guild objects
//  [EDIT] Change these to test different name lengths,
//         member counts, or a different avatar image.
// ============================================================
const MOCK = {
  username:    "mqllpw",
  tag:         "mqllpw#0000",
  memberCount: 65,
  servername:  "The Network",

  // Path to a local avatar image for the preview.
  // Drop any square PNG/JPG here — doesn't have to be a real avatar.
  // [EDIT] Change to any local image, e.g. "./assets/test_avatar.png"
  avatarPath: path.join(__dirname, "assets", "test_avatar.png"),

  // Fallback: if avatarPath doesn't exist the script uses a
  // plain coloured circle so you can still preview layout.
  avatarFallbackColor: "#3a7d44",
};

// ============================================================
//  CANVAS SIZE — match your background image exactly
//  [EDIT] Change width/height to fit your background.png
// ============================================================
const CANVAS = {
  width:  900,
  height: 300,
};

// ============================================================
//  LAYERS — copied from welcomeCard.template.js
//  This is the section you'll be editing for style.
//  See the template file for full [ADD]/[EDIT]/[REMOVE] notes.
// ============================================================
const LAYERS = [
  {
    id: "background",
    type: "image",
    enabled: true,
    src: path.join(__dirname, "assets", "background.png"),
    x: 0, y: 0,
    width: null, height: null,
  },
  {
    id: "avatar",
    type: "avatar",
    enabled: true,
    cx: 120, cy: 150, radius: 70,
    border: { enabled: true, color: "#00ff88", width: 4 },
  },
  {
    id: "avatar_brackets",
    type: "brackets",
    enabled: true,
    anchorId: "avatar",
    padding: 14, armLength: 20,
    color: "#00ff88", lineWidth: 2,
  },
  {
    id: "node_label",
    type: "text",
    enabled: true,
    value: "— NODE —",
    x: 120, y: 248,
    font: "14px monospace",
    color: "#777777",
    align: "center",
  },
  {
    id: "terminal_lines",
    type: "linelist",
    enabled: true,
    x: 230, y: 90,
    lineGap: 38,
    font: "17px monospace",
    lines: [
      { text: "> INITIALIZING CONNECTION...", color: "#00ff88" },
      { text: "> HANDSHAKE COMPLETE",         color: "#00ff88" },
      { text: "> PACKET INTEGRITY: OK",       color: "#00ff88" },
      { text: "> USER: {username}",           color: "#00ff88" },
      { text: "> AUTH GRANTED — {username}",  color: "#00ff88" },
    ],
  },
  {
    id: "username_label",
    type: "text",
    enabled: true,
    value: "{username}",
    x: 30, y: 268,
    font: "bold 22px monospace",
    color: "#ffffff",
    align: "left",
  },
  {
    id: "member_badge",
    type: "text",
    enabled: true,
    value: "Member #{memberCount}",
    xAnchor: "right",
    x: 30, y: 268,
    font: "16px monospace",
    color: "#aaaaaa",
    align: "right",
  },
];

// ============================================================
//  TOKEN RESOLVER — same as the template
// ============================================================
function resolveTokens(str, tokens) {
  return String(str).replace(/\{(\w+)\}/g, (_, key) =>
    key in tokens ? tokens[key] : `{${key}}`
  );
}

// ============================================================
//  DRAWERS — identical to the template drawers,
//  except drawAvatar uses a local file instead of a URL.
// ============================================================

async function drawImage(ctx, layer, _t, canvas) {
  if (!fs.existsSync(layer.src)) {
    // If background.png is missing, draw a dark fallback so
    // you can still preview text/avatar positioning.
    console.warn(`[WARN] Background not found: ${layer.src} — using fallback colour`);
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const img = await loadImage(layer.src);
  ctx.drawImage(img, layer.x, layer.y,
    layer.width  ?? canvas.width,
    layer.height ?? canvas.height
  );
}

async function drawAvatar(ctx, layer) {
  const { cx, cy, radius } = layer;

  if (fs.existsSync(MOCK.avatarPath)) {
    // Use local test image
    const img = await loadImage(MOCK.avatarPath);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
  } else {
    // No test image found — draw a solid fallback circle
    console.warn(`[WARN] Avatar not found: ${MOCK.avatarPath} — using fallback colour`);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = MOCK.avatarFallbackColor;
    ctx.fill();
  }

  if (layer.border?.enabled) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + layer.border.width / 2, 0, Math.PI * 2);
    ctx.strokeStyle = layer.border.color;
    ctx.lineWidth   = layer.border.width;
    ctx.stroke();
  }
}

function drawBrackets(ctx, layer, _t, _c, allLayers) {
  const anchor = allLayers.find((l) => l.id === layer.anchorId);
  if (!anchor) return;
  const r = anchor.radius + layer.padding;
  const { cx, cy } = anchor;
  const [l, r2, t, b] = [cx - r, cx + r, cy - r, cy + r];
  const a = layer.armLength;
  ctx.strokeStyle = layer.color;
  ctx.lineWidth   = layer.lineWidth;
  ctx.beginPath();
  ctx.moveTo(l, t + a); ctx.lineTo(l, t); ctx.lineTo(l + a, t);
  ctx.moveTo(r2 - a, t); ctx.lineTo(r2, t); ctx.lineTo(r2, t + a);
  ctx.moveTo(l, b - a); ctx.lineTo(l, b); ctx.lineTo(l + a, b);
  ctx.moveTo(r2 - a, b); ctx.lineTo(r2, b); ctx.lineTo(r2, b - a);
  ctx.stroke();
}

function drawText(ctx, layer, tokens, canvas) {
  ctx.font      = layer.font;
  ctx.fillStyle = layer.color;
  ctx.textAlign = layer.align ?? "left";
  const x = layer.xAnchor === "right" ? canvas.width - layer.x : layer.x;
  ctx.fillText(resolveTokens(layer.value, tokens), x, layer.y);
}

function drawLinelist(ctx, layer, tokens) {
  ctx.textAlign = "left";
  layer.lines.forEach((line, i) => {
    ctx.font      = layer.font;
    ctx.fillStyle = line.color ?? "#ffffff";
    ctx.fillText(
      resolveTokens(line.text, tokens),
      layer.x,
      layer.y + i * layer.lineGap
    );
  });
}

function drawRect(ctx, layer) {
  ctx.fillStyle = layer.color;
  ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
}

const DRAWERS = {
  image:    drawImage,
  avatar:   drawAvatar,
  brackets: drawBrackets,
  text:     drawText,
  linelist: drawLinelist,
  rect:     drawRect,
};

// ============================================================
//  MAIN — renders and saves the PNG
// ============================================================
async function preview() {
  console.log("🎨  Rendering preview...");

  const canvas = createCanvas(CANVAS.width, CANVAS.height);
  const ctx    = canvas.getContext("2d");

  const tokens = {
    username:    MOCK.username,
    tag:         MOCK.tag,
    memberCount: MOCK.memberCount,
    servername:  MOCK.servername,
  };

  for (const layer of LAYERS) {
    if (!layer.enabled) {
      console.log(`  ⏭  Skipped layer: ${layer.id}`);
      continue;
    }
    const draw = DRAWERS[layer.type];
    if (!draw) {
      console.warn(`  ⚠️  No drawer for type "${layer.type}" (id: ${layer.id})`);
      continue;
    }
    console.log(`  ✏️  Drawing layer: ${layer.id} [${layer.type}]`);
    await draw(ctx, layer, tokens, canvas, null, LAYERS);
  }

  const outPath = path.join(__dirname, "welcome.preview.png");
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  console.log(`\n✅  Saved → ${outPath}`);
  console.log("   Open that file in any image viewer to check the result.\n");

  // ── Auto-open the image (best-effort, silently skips if unsupported) ──
  // [REMOVE] Delete this block if you don't want auto-open behaviour.
  try {
    const { execSync } = require("child_process");
    const opener =
      process.platform === "win32"  ? `start "" "${outPath}"` :
      process.platform === "darwin" ? `open "${outPath}"` :
                                      `xdg-open "${outPath}"`;
    execSync(opener);
  } catch (_) { /* silent — auto-open is optional */ }
}

preview().catch((err) => {
  console.error("❌  Preview failed:", err);
  process.exit(1);
});
