// ============================================================
//  DISCORD WELCOME CARD — CANVAS TEMPLATE
//  discord.js v14 + @napi-rs/canvas
//
//  INSTALL:
//    npm install discord.js @napi-rs/canvas dotenv
//
//  RUN:
//    node -r dotenv/config welcomeCard.template.js
//
//  .env file:
//    DISCORD_TOKEN=your_token_here
//
//  This file is a template. Every section is labelled:
//    [ADD]    — how to add something new
//    [EDIT]   — how to change an existing thing
//    [REMOVE] — how to delete something cleanly
// ============================================================

const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const path = require("path");

// ============================================================
//  SECTION 1 — LAYER REGISTRY
//  This is the single place that controls WHAT gets drawn
//  and in WHAT ORDER (lowest index = drawn first = furthest back).
//
//  [ADD]    Add a new object to the array with a unique `id`.
//  [REMOVE] Delete the object entirely, or set enabled: false.
//  [EDIT]   Change any value inside an object.
//
//  Layer order matters — later layers paint over earlier ones.
// ============================================================
const LAYERS = [
  // ── 0: Background image ────────────────────────────────────
  // Your pre-built PNG. Always keep this first (index 0).
  {
    id: "background",
    type: "image",       // handled by the IMAGE drawer
    enabled: true,
    src: path.join(__dirname, "assets", "background.png"),
    x: 0,
    y: 0,
    // [EDIT] Change width/height to crop or stretch the background.
    //        Set both to null to auto-fill the full canvas.
    width: null,
    height: null,
  },

  // ── 1: Avatar (circular, with border ring) ─────────────────
  {
    id: "avatar",
    type: "avatar",      // handled by the AVATAR drawer
    enabled: true,
    // [EDIT] Move the avatar by changing cx/cy.
    cx: 120,             // centre X in px
    cy: 150,             // centre Y in px
    radius: 70,          // circle radius in px
    border: {
      enabled: true,
      color: "#00ff88",  // [EDIT] Ring colour
      width: 4,          // [EDIT] Ring thickness in px
    },
    // [ADD] A second ring — duplicate the border block and draw
    //       it at radius + outerGap in the AVATAR drawer below.
  },

  // ── 2: Corner brackets around avatar ──────────────────────
  {
    id: "avatar_brackets",
    type: "brackets",    // handled by the BRACKETS drawer
    enabled: true,
    // [EDIT] These are automatically centred on the avatar.
    //        Change padding to push brackets further out.
    anchorId: "avatar",  // reads cx/cy/radius from the avatar layer
    padding: 14,         // px gap between circle edge and bracket
    armLength: 20,       // px length of each L arm
    color: "#00ff88",
    lineWidth: 2,
    // [REMOVE] Set enabled: false — bracket drawer is skipped.
  },

  // ── 3: Static label under avatar ──────────────────────────
  {
    id: "node_label",
    type: "text",        // handled by the TEXT drawer
    enabled: true,
    value: "— NODE —",   // [EDIT] Change the label text here.
    x: 120,              // [EDIT] X position (centre, because align below)
    y: 248,              // [EDIT] Y position
    font: "14px monospace",
    color: "#777777",
    align: "center",     // left | center | right
    // [REMOVE] Set enabled: false.
  },

  // ── 4: Terminal line block ─────────────────────────────────
  //  Each entry in `lines[]` becomes one row of text.
  //  Dynamic tokens: {username} {tag} {memberCount} {servername}
  //
  //  [ADD]    Push a new object into lines[].
  //  [REMOVE] Delete a line object from lines[].
  //  [EDIT]   Change text/color per line individually.
  {
    id: "terminal_lines",
    type: "linelist",    // handled by the LINELIST drawer
    enabled: true,
    x: 230,              // [EDIT] Left edge of the text block
    y: 90,               // [EDIT] Top of the first line
    lineGap: 38,         // [EDIT] Vertical spacing between lines in px
    font: "17px monospace",
    lines: [
      { text: "> INITIALIZING CONNECTION...", color: "#00ff88" },
      { text: "> HANDSHAKE COMPLETE",         color: "#00ff88" },
      { text: "> PACKET INTEGRITY: OK",       color: "#00ff88" },
      // [EDIT] Change colour per-line — overrides the block default.
      { text: "> USER: {username}",           color: "#00ff88" },
      { text: "> AUTH GRANTED — {username}",  color: "#00ff88" },
      // [ADD] New line example:
      // { text: "> SERVER: {servername}",    color: "#ffaa00" },
    ],
  },

  // ── 5: Username label (bottom-left) ───────────────────────
  {
    id: "username_label",
    type: "text",
    enabled: true,
    value: "{username}",  // [EDIT] Use any token or plain string.
    x: 30,
    y: 268,
    font: "bold 22px monospace",
    color: "#ffffff",
    align: "left",
  },

  // ── 6: Member count badge (bottom-right) ──────────────────
  {
    id: "member_badge",
    type: "text",
    enabled: true,
    value: "Member #{memberCount}",
    // [EDIT] xAnchor:"right" means x is measured from the RIGHT edge.
    //        Change to "left" and set a normal x value if you prefer.
    xAnchor: "right",
    x: 30,               // padding from the right edge when xAnchor:"right"
    y: 268,
    font: "16px monospace",
    color: "#aaaaaa",
    align: "right",
  },

  // ── [ADD] Example: a second image/icon overlay ─────────────
  // Uncomment to add a badge/logo in the top-right corner.
  // {
  //   id: "corner_logo",
  //   type: "image",
  //   enabled: true,
  //   src: path.join(__dirname, "assets", "logo.png"),
  //   x: 820,
  //   y: 10,
  //   width: 60,
  //   height: 60,
  // },

  // ── [ADD] Example: a filled rectangle (divider bar) ────────
  // {
  //   id: "divider",
  //   type: "rect",
  //   enabled: true,
  //   x: 220,
  //   y: 250,
  //   width: 650,
  //   height: 2,
  //   color: "#00ff8844",  // supports alpha via 8-digit hex
  // },

  // ── [ADD] Example: progress / XP bar ──────────────────────
  // {
  //   id: "xp_bar_bg",
  //   type: "rect",
  //   enabled: false,
  //   x: 230, y: 260, width: 400, height: 10, color: "#333333",
  // },
  // {
  //   id: "xp_bar_fill",
  //   type: "rect",
  //   enabled: false,
  //   x: 230, y: 260, width: 120,  // change width dynamically for fill %
  //   height: 10, color: "#00ff88",
  // },
];

// ============================================================
//  SECTION 2 — CANVAS SETTINGS
//
//  [EDIT] Change width/height to match your background image.
//  [EDIT] Change welcomeChannelId to your real channel ID.
// ============================================================
const CANVAS = {
  width: 900,
  height: 300,
};

const BOT = {
  welcomeChannelId: "YOUR_CHANNEL_ID_HERE",
};

// ============================================================
//  SECTION 3 — FONT REGISTRATION  (optional)
//
//  [ADD] Drop a .ttf into /assets/fonts/ and register it here.
//        Then use its family name in any font string above.
//  [REMOVE] Comment out the GlobalFonts.registerFromPath line.
// ============================================================
// GlobalFonts.registerFromPath(
//   path.join(__dirname, "assets", "fonts", "ShareTechMono-Regular.ttf"),
//   "ShareTechMono"
// );

// ============================================================
//  SECTION 4 — TOKEN RESOLVER
//  Maps {token} placeholders used in text layers to real values.
//
//  [ADD] Add a new key/value pair to the object returned below.
//  [REMOVE] Delete the key — unreplaced tokens just render as-is.
// ============================================================
function buildTokens(member) {
  return {
    username:    member.user.username,
    tag:         member.user.tag,            // e.g. Username#0000 (legacy)
    memberCount: member.guild.memberCount,
    servername:  member.guild.name,
    // [ADD] Example custom token:
    // joindate: new Date().toLocaleDateString("en-US"),
  };
}

function resolveTokens(str, tokens) {
  return String(str).replace(/\{(\w+)\}/g, (_, key) =>
    key in tokens ? tokens[key] : `{${key}}`
  );
}

// ============================================================
//  SECTION 5 — LAYER DRAWERS
//  Each `type` in LAYERS maps to one drawer function here.
//
//  [ADD] Add a new drawer for a custom type at the bottom of
//        this section, then add layers of that type to LAYERS.
//  [REMOVE] If you remove all layers of a type you can delete
//           the drawer too, but it won't break anything if left.
// ============================================================

// ── IMAGE drawer ──────────────────────────────────────────────
async function drawImage(ctx, layer, _tokens, canvas) {
  const img = await loadImage(layer.src);
  const w = layer.width  ?? canvas.width;
  const h = layer.height ?? canvas.height;
  ctx.drawImage(img, layer.x, layer.y, w, h);
}

// ── AVATAR drawer ─────────────────────────────────────────────
async function drawAvatar(ctx, layer, _tokens, _canvas, member) {
  const avatarURL = member.user.displayAvatarURL({
    extension: "png",
    size: 256,
    forceStatic: true,
  });
  const img = await loadImage(avatarURL);
  const { cx, cy, radius } = layer;

  // Clip to circle, draw avatar, restore
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();

  // Border ring
  if (layer.border?.enabled) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + layer.border.width / 2, 0, Math.PI * 2);
    ctx.strokeStyle = layer.border.color;
    ctx.lineWidth = layer.border.width;
    ctx.stroke();
  }
}

// ── BRACKETS drawer ───────────────────────────────────────────
function drawBrackets(ctx, layer, _tokens, _canvas, _member, allLayers) {
  // Pull position from the layer this anchors to
  const anchor = allLayers.find((l) => l.id === layer.anchorId);
  if (!anchor) return;

  const pad  = layer.padding;
  const arm  = layer.armLength;
  const r    = anchor.radius + pad;
  const cx   = anchor.cx;
  const cy   = anchor.cy;

  const left   = cx - r;
  const right  = cx + r;
  const top    = cy - r;
  const bottom = cy + r;

  ctx.strokeStyle = layer.color;
  ctx.lineWidth   = layer.lineWidth;
  ctx.beginPath();
  // Top-left
  ctx.moveTo(left, top + arm); ctx.lineTo(left, top); ctx.lineTo(left + arm, top);
  // Top-right
  ctx.moveTo(right - arm, top); ctx.lineTo(right, top); ctx.lineTo(right, top + arm);
  // Bottom-left
  ctx.moveTo(left, bottom - arm); ctx.lineTo(left, bottom); ctx.lineTo(left + arm, bottom);
  // Bottom-right
  ctx.moveTo(right - arm, bottom); ctx.lineTo(right, bottom); ctx.lineTo(right, bottom - arm);
  ctx.stroke();
}

// ── TEXT drawer ───────────────────────────────────────────────
function drawText(ctx, layer, tokens, canvas) {
  ctx.font      = layer.font;
  ctx.fillStyle = layer.color;
  ctx.textAlign = layer.align ?? "left";

  const resolvedText = resolveTokens(layer.value, tokens);
  const x = layer.xAnchor === "right"
    ? canvas.width - layer.x   // measure from right edge
    : layer.x;

  ctx.fillText(resolvedText, x, layer.y);
}

// ── LINELIST drawer ───────────────────────────────────────────
function drawLinelist(ctx, layer, tokens) {
  ctx.textAlign = "left";
  layer.lines.forEach((line, i) => {
    ctx.font      = layer.font;
    ctx.fillStyle = line.color ?? layer.color ?? "#ffffff";
    ctx.fillText(
      resolveTokens(line.text, tokens),
      layer.x,
      layer.y + i * layer.lineGap
    );
  });
}

// ── RECT drawer ───────────────────────────────────────────────
// [ADD] Use type:"rect" in a layer to draw filled rectangles.
function drawRect(ctx, layer) {
  ctx.fillStyle = layer.color;
  ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
}

// ── DRAWER DISPATCH MAP ───────────────────────────────────────
// [ADD] Register your new type here: "mytype": myDrawerFunction
const DRAWERS = {
  image:    drawImage,
  avatar:   drawAvatar,
  brackets: drawBrackets,
  text:     drawText,
  linelist: drawLinelist,
  rect:     drawRect,
};

// ============================================================
//  SECTION 6 — RENDER ENGINE
//  Loops over LAYERS in order, calls the right drawer.
//  You should not need to edit this section.
// ============================================================
async function renderCard(member) {
  const canvas = createCanvas(CANVAS.width, CANVAS.height);
  const ctx    = canvas.getContext("2d");
  const tokens = buildTokens(member);

  for (const layer of LAYERS) {
    if (!layer.enabled) continue; // [REMOVE] toggle without deleting

    const draw = DRAWERS[layer.type];
    if (!draw) {
      console.warn(`[WARN] No drawer found for type "${layer.type}" (id: ${layer.id})`);
      continue;
    }

    // All drawers receive the same consistent signature:
    //   (ctx, layer, tokens, canvas, member, allLayers)
    await draw(ctx, layer, tokens, canvas, member, LAYERS);
  }

  return canvas.toBuffer("image/png");
}

// ============================================================
//  SECTION 7 — BOT WIRING
//  Connects the renderer to Discord's guildMemberAdd event.
// ============================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Must also be enabled in Dev Portal
  ],
});

client.on("guildMemberAdd", async (member) => {
  try {
    const channel = member.guild.channels.cache.get(BOT.welcomeChannelId);
    if (!channel) {
      console.warn("Welcome channel not found. Check BOT.welcomeChannelId.");
      return;
    }

    const buffer     = await renderCard(member);
    const attachment = new AttachmentBuilder(buffer, { name: "welcome.png" });

    // [EDIT] Add a text message alongside the image:
    //   await channel.send({ content: `Welcome <@${member.id}>!`, files: [attachment] });
    await channel.send({ files: [attachment] });

    console.log(`✅ Welcome card sent for ${member.user.username}`);
  } catch (err) {
    console.error("❌ Failed to send welcome card:", err);
  }
});

client.once("ready", () => console.log(`✅ Logged in as ${client.user.tag}`));
client.login(process.env.DISCORD_TOKEN);
