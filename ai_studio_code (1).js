/**
 * GALAXY TUNNEL - SMART AI TELEGRAM BOT
 * Powered by Cloudflare Workers & Google Gemini AI
 */

// ====== CONFIGURATION ======
const TELEGRAM_BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; // <--- မိမိ Bot Token ထည့်ပါ
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";         // <--- Google AI Studio Gemini API Key ထည့်ပါ (အခမဲ့ရသည်)
const SERVERS_SOURCE_URL = "https://raw.githubusercontent.com/proxzero/galaxy-subdomain/main/servers.txt";
const WEBSITE_URL = "https://vpn.yourdomain.com";    // <--- မိမိ Website URL ထည့်ပါ
// =============================

// GALAXY TUNNEL KNOWLEDGE BASE FOR AI
const SYSTEM_PROMPT = `
သင်သည် "Galaxy Tunnel" (VPN Config Share Hub) ၏ တရားဝင် ဖော်ရွေသော AI Assistant ဖြစ်သည်။
အသုံးပြုသူများကို လေးစားယဉ်ကျေးသော မြန်မာစကားပြေဖြင့် ဖြေကြားပေးရမည်။

Galaxy Tunnel အကြောင်း အချက်အလက်များ:
1. ဝန်ဆောင်မှု: VLESS နှင့် Trojan VPN Protocol များကို အခမဲ့ မျှဝေပေးသော Public Platform ဖြစ်သည်။
2. ပံ့ပိုးပေးသော Apps များ:
   - Android: v2rayNG, Sing-box, NekoBox, Clash Meta
   - iOS: Sing-box, Streisand, Shadowrocket, V2Box
   - Windows: v2rayN, Flclash, Sing-box
3. အဓိက Features များ:
   - Live Ping & Latency Check စစ်ဆေးနိုင်ခြင်း
   - One-Click Copy & QR Code Scan စနစ်
   - Sublink Generator (Subscription Link ဖန်တီး၍ အလိုအလျောက် Server များ Update လုပ်နိုင်ခြင်း)
4. အသုံးပြုနည်း အခြေခံ:
   - Config စာသားကို Copy ယူပြီး သက်ဆိုင်ရာ App (ဥပမာ v2rayNG) ထဲရှိ "+" သင်္ကေတမှတစ်ဆင့် "Import config from Clipboard" နှိပ်၍ ချိတ်ဆက်ရသည်။
   - Subscription Link ကို သုံးလိုပါက Sublink generator မှ ရရှိသော Link ကို App ထဲရှိ Subscription Group ထဲ ထည့်သွင်းရသည်။

စည်းမျဉ်းများ:
- အသုံးပြုသူက Server / Config တောင်းပါက ရနိုင်သော Server အရေအတွက်ကို ပြောပြပြီး /servers ခလုတ်ကို နှိပ်ရန် လမ်းညွှန်ပါ။
- ချိတ်ဆက်မှု Error တက်ပါက (ဥပမာ Handshake error, Timeout) ဖုန်းနာရီ အချိန်မှန်မမှန် စစ်ရန်၊ SNI မူရင်းအတိုင်း ထားရန် အကြံပြုပါ။
- တိုတိုရှင်းရှင်းနှင့် နားလည်လွယ်သော မြန်မာဘာသာဖြင့်သာ အဓိက ဖြေကြားပါ။
`;

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Galaxy Tunnel AI Bot is Running!", { status: 200 });
    }

    try {
      const update = await request.json();

      if (update.message) {
        await handleIncomingMessage(update.message);
      } else if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      console.error("Error processing update:", error);
    }

    return new Response("OK", { status: 200 });
  }
};

// Handle Messages from Users
async function handleIncomingMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  // 1. /start command
  if (text.startsWith("/start")) {
    const welcomeMsg = 
      `🌌 *မင်္ဂလာပါ! Galaxy Tunnel AI Bot မှ ကြိုဆိုပါတယ်ခင်ဗျာ။*\n\n` +
      `ကျွန်တော်ကတော့ Galaxy Tunnel ရဲ့ VPN Config များနှင့် အသုံးပြုနည်းများကို ကူညီဖြေကြားပေးမယ့် AI Assistant ဖြစ်ပါတယ်။\n\n` +
      `⚡ *ဘာတွေလုပ်ဆောင်နိုင်သလဲ:*\n` +
      `• အောက်ပါ Menu ခလုတ်များဖြင့် Server များကို နံပါတ်စဉ်လိုက် ကူးယူနိုင်ခြင်း\n` +
      `• VPN အသုံးပြုနည်းနှင့် Error များကို စကားပြောသလို မေးမြန်းနိုင်ခြင်း\n` +
      `• Web App ကို တိုက်ရိုက်ဖွင့်လှစ် အသုံးပြုနိုင်ခြင်း`;

    const keyboard = [
      [{ text: "⚡ Servers စာရင်းကြည့်ရန်", callback_data: "list_servers" }],
      [
        { text: "📋 All Configs ကူးယူရန်", callback_data: "copy_all" },
        { text: "🌐 Open Web App", web_app: { url: WEBSITE_URL } }
      ]
    ];

    await sendTelegramMessage(chatId, welcomeMsg, keyboard);
    return;
  }

  // 2. /servers command
  if (text.startsWith("/servers") || text.toLowerCase().includes("server")) {
    await sendServerButtons(chatId);
    return;
  }

  // 3. User စာရိုက်ပြီး မေးမြန်းလာသမျှကို Gemini AI ဖြင့် အဖြေထုတ်ပေးခြင်း
  // AI ဖြေနေစဉ် Telegram တွင် "typing..." လို့ ပြသပေးခြင်း
  await sendChatAction(chatId, "typing");

  const servers = await fetchServerList();
  const contextPrompt = `လက်ရှိ Galaxy Tunnel တွင် Server စုစုပေါင်း (${servers.length}) ခု အသင့်ရှိနေပါသည်။\n\nအသုံးပြုသူ မေးခွန်း: "${text}"`;

  const aiReply = await queryGeminiAI(contextPrompt);
  
  const keyboard = [
    [{ text: "⚡ ရရှိနိုင်သော Server များ ကြည့်မည်", callback_data: "list_servers" }],
    [{ text: "🌐 Website သို့ သွားရန်", url: WEBSITE_URL }]
  ];

  await sendTelegramMessage(chatId, aiReply, keyboard);
}

// Handle Button Clicks
async function handleCallbackQuery(cb) {
  const chatId = cb.message.chat.id;
  const data = cb.data;

  const servers = await fetchServerList();

  if (data === "list_servers") {
    await sendServerButtons(chatId);
  } else if (data.startsWith("srv_")) {
    const index = parseInt(data.replace("srv_", ""), 10);
    const serverConfig = servers[index];

    if (serverConfig) {
      const reply = 
        `⚡ *Server ${index + 1} Config:*\n\n` +
        `\`\`\`\n${serverConfig}\n\`\`\`\n` +
        `👆 _စာသားအကွက်ပေါ် တစ်ချက်နှိပ်ရုံဖြင့် Copy ကူးယူနိုင်ပါသည်_`;

      await sendTelegramMessage(chatId, reply);
    }
  } else if (data === "copy_all") {
    const allText = servers.join("\n\n");
    await sendTelegramMessage(chatId, `📋 *All Configs (${servers.length}):*\n\n\`\`\`\n${allText}\n\`\`\``);
  }

  // Telegram loading indicator ပျောက်သွားစေရန်
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: cb.id })
  });
}

// Send Server list as inline buttons
async function sendServerButtons(chatId) {
  const servers = await fetchServerList();
  
  if (servers.length === 0) {
    await sendTelegramMessage(chatId, "⚠️ လတ်တလော Server စာရင်း ဆွဲယူမရသေးပါခင်ဗျာ။ ခေတ္တစောင့်ဆိုင်းပေးပါ။");
    return;
  }

  const keyboard = [];
  for (let i = 0; i < servers.length; i += 2) {
    const row = [];
    row.push({ text: `⚡ Server ${i + 1}`, callback_data: `srv_${i}` });
    if (i + 1 < servers.length) {
      row.push({ text: `⚡ Server ${i + 2}`, callback_data: `srv_${i + 1}` });
    }
    keyboard.push(row);
  }

  keyboard.push([
    { text: "📋 Copy All Configs", callback_data: "copy_all" },
    { text: "🌐 Open Web App", web_app: { url: WEBSITE_URL } }
  ]);

  const text = `🌌 *Galaxy Tunnel Server စာရင်း:*\n\nစုစုပေါင်း Server (*${servers.length}*) ခု ရရှိနိုင်ပါသည်။ မိမိ လိုချင်သော Server ကို နှိပ်၍ Config ကူးယူပါ:`;
  await sendTelegramMessage(chatId, text, keyboard);
}

// Fetch servers from GitHub source
async function fetchServerList() {
  try {
    const res = await fetch(SERVERS_SOURCE_URL);
    const text = await res.text();
    return text.split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith("#") && !l.startsWith("//"));
  } catch (e) {
    console.error("Fetch servers error:", e);
    return [];
  }
}

// Query Google Gemini AI API
async function queryGeminiAI(userText) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
    return "ကျွန်တော်ကတော့ Galaxy Tunnel AI Bot ဖြစ်ပါတယ်။ (Gemini API Key ထည့်သွင်းထားခြင်း မရှိသေးပါခင်ဗျာ။)";
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return "ဝမ်းနည်းပါတယ်ခင်ဗျာ၊ အချက်အလက် ဖြေကြားပေးရာတွင် အခက်အခဲလေး ရှိသွားပါသည်။ ထပ်မံမေးမြန်းပေးပါခင်ဗျာ။";
  } catch (err) {
    console.error("Gemini AI error:", err);
    return "AI ဝန်ဆောင်မှုနှင့် ချိတ်ဆက်ရာတွင် အခက်အခဲ ရှိနေပါသည်ခင်ဗျာ။";
  }
}

// Telegram Helpers
async function sendTelegramMessage(chatId, text, inlineKeyboard = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown"
  };
  if (inlineKeyboard) {
    payload.reply_markup = { inline_keyboard: inlineKeyboard };
  }

  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function sendChatAction(chatId, action = "typing") {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: action })
  });
}