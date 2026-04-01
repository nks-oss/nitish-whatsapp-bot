const VERIFY_TOKEN = "nitishkumarbot2024";
const WA_TOKEN = process.env.WA_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const sessions = {};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN)
      return res.status(200).send(challenge);
    return res.status(403).send("Forbidden");
  }
  if (req.method === "POST") {
    const messages = req.body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (messages?.length > 0) {
      const msg = messages[0];
      const from = msg.from;
      const text = msg.type === "text" ? msg.text.body.trim().toLowerCase()
        : msg.type === "interactive"
        ? (msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || "")
        : "";
      await handleMessage(from, text);
    }
    return res.status(200).send("OK");
  }
  return res.status(405).send("Method Not Allowed");
}

async function handleMessage(from, text) {
  if (!sessions[from]) sessions[from] = { state: "start" };
  const s = sessions[from];
  if (["hi","hello","hey","menu","0","start"].includes(text) || s.state === "start") {
    s.state = "main"; await sendMainMenu(from); return;
  }
  switch (s.state) {
    case "main": await handleMenu(from, text, s); break;
    case "awaiting_name":
      s.name = text; s.state = "awaiting_phone";
      await sendText(from, `Thanks *${cap(text)}*! 😊\n\nPlease share your *10-digit WhatsApp number*:`);
      break;
    case "awaiting_phone":
      const ph = text.replace(/\D/g,"");
      if (ph.length < 10) { await sendText(from, "❌ Please enter a valid 10-digit number."); }
      else {
        s.state = "done";
        await sendText(from, `✅ *Booking Confirmed!*\n\nHi *${cap(s.name||"Friend")}*, Nitish will contact you on *${ph}* shortly.\n\n_Thank you!_ 🙏\n\nType *menu* to go back.`);
      }
      break;
    default:
      await sendText(from, "Type *hi* or *menu* to see all options.");
  }
}

async function sendMainMenu(to) {
  await sendButtons(to,
    "👋 *Namaste! Welcome to Nitish Kumar's Business Bot*\n\n_How can I help you today?_",
    [{ id:"financial",title:"1️⃣ Financial" },{ id:"building",title:"2️⃣ BuilTech" },{ id:"trust",title:"3️⃣ Trust / NGOs" }]
  );
  await sendButtons(to, "More options:", [
    { id:"consult",title:"4️⃣ Consultation" },
    { id:"talk",title:"5️⃣ Talk to Nitish" }
  ]);
}

async function handleMenu(from, text, s) {
  switch(text) {
    case "financial":
      await sendText(from, `💰 *Financial Services*\n\n✅ Life Insurance\n✅ Health Insurance\n✅ Retirement Planning\n✅ Mutual Funds & SIP\n✅ Emergency Fund Planning\n\n🎯 *FREE Financial Health Checkup:*\n👉 https://nks-oss.github.io/Financial-Health-Checkup/`);
      await sendButtons(from,"What next?", [{id:"consult",title:"📞 Book Consultation"},{id:"talk",title:"💬 Talk to Nitish"},{id:"menu",title:"🏠 Main Menu"}]);
      break;
    case "building":
      await sendButtons(from,"🏗️ *Building Material Services*\n\nChoose a category:",
        [{id:"paints",title:"🎨 (a) Paints"},{id:"others",title:"🧱 (b) Other Materials"},{id:"menu",title:"🏠 Main Menu"}]);
      break;
    case "paints":
      await sendText(from, `🎨 *Paint Solutions*\n\n✅ Interior & Exterior Paints\n✅ Waterproofing Coatings\n✅ Industrial Coatings\n✅ Heat Resistant Paints\n✅ Epoxy Flooring\n\n🎯 *Find the RIGHT Paint Solution:*\n👉 https://nks-oss.github.io/Paint-Leads/`);
      await sendButtons(from,"What next?",[{id:"consult",title:"📞 Get Quote"},{id:"talk",title:"💬 Talk to Nitish"},{id:"menu",title:"🏠 Main Menu"}]);
      break;
    case "others":
      await sendText(from,`🧱 *Other Building Materials*\n\n✅ Cement & Sand\n✅ Steel & TMT Bars\n✅ Tiles & Flooring\n✅ Electrical & Plumbing\n✅ Construction Tools\n\n_Best prices for bulk orders in Bihar_`);
      await sendButtons(from,"What next?",[{id:"consult",title:"📞 Request Quote"},{id:"talk",title:"💬 Talk to Nitish"},{id:"menu",title:"🏠 Main Menu"}]);
      break;
    case "trust":
      await sendText(from,`🕊️ *adGi Trust*\n_Founded & Led by Nitish Kumar_\n\n📜 80G Certified — Donations Tax Deductible\n📜 12A Certified — Registered Non-Profit\n\n🌱 *Mission:* Empowering communities through education, health & financial literacy across Bihar.\n\n✅ Financial Literacy Programs\n✅ Health Awareness Camps\n✅ Educational Support\n✅ CSR Partnerships\n✅ Fundraising & Donation Management`);
      await sendButtons(from,"What next?",[{id:"consult",title:"🤝 Partner with adGi"},{id:"talk",title:"💬 Talk to Nitish"},{id:"menu",title:"🏠 Main Menu"}]);
      break;
    case "consult":
      s.state = "awaiting_name";
      await sendText(from,`📅 *Book a FREE Consultation*\n\nPlease tell me your *full name*:`);
      break;
    case "talk":
      await sendText(from,`💬 *Connecting to Nitish Kumar...*\n\n📱 *+91 85410 80080*\n📍 Patna, Bihar\n🕐 Mon–Sat, 9AM–7PM\n\nSend a direct WhatsApp message to connect.\n\nType *menu* to go back.`);
      break;
    case "menu": case "0":
      s.state = "main"; await sendMainMenu(from); break;
    default:
      await sendText(from,"Please choose from the menu.\nType *menu* to see all options.");
  }
}

async function sendText(to, body) {
  await callWA({ messaging_product:"whatsapp", to, type:"text", text:{ body } });
}

async function sendButtons(to, body, buttons) {
  await callWA({
    messaging_product:"whatsapp", to, type:"interactive",
    interactive:{
      type:"button", body:{ text: body },
      action:{ buttons: buttons.map(b=>({ type:"reply", reply:{ id:b.id, title:b.title.substring(0,20) } })) }
    }
  });
}

async function callWA(payload) {
  const r = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,{
    method:"POST",
    headers:{ "Authorization":`Bearer ${WA_TOKEN}`, "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  const d = await r.json();
  if (!r.ok) console.error("WA Error:", d);
  return d;
}

function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
