import fs from "fs"
import path from "path"

const handler = async (m, { isAdmin, isROwner }) => {
  const conn = this
  if (global.db.data == null) await global.loadDatabase()

  const senderNumber = (m.sender || "").replace(/[^0-9]/g, "")
  const botPath = path.join("./Sessions/SubBot", senderNumber)

  if (!(isAdmin || isROwner || fs.existsSync(botPath))) {
    return m.reply("𖣣ֶㅤ֯⌗ No tienes permisos para usar este comando.")
  }

  const rawChatId = m.chat || m.key?.remoteJid || ""
  const decodedChatId = typeof conn?.decodeJid === "function" ? conn.decodeJid(rawChatId) : rawChatId
  const chatId = (decodedChatId || rawChatId || "").toString()

  if (!global.db.data.chats) global.db.data.chats = {}

  const keys = [rawChatId, decodedChatId, chatId, m.key?.remoteJid, m.chat]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)

  const obj = keys.map(k => global.db.data.chats[k]).find(v => v) || {}
  obj.isBanned = false

  for (const k of keys) global.db.data.chats[k] = obj

  await global.db.write?.().catch(() => {})
  return m.reply("˚∩ El bot ha sido desbaneado correctamente.")
}

handler.help = ["desbanearbot"]
handler.tags = ["group"]
handler.command = ["desbanearbot", "unbanchat"]
handler.group = true

export default handler