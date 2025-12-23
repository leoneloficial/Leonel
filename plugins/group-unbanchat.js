import fs from "fs"
import path from "path"

const handler = async (m, { isAdmin, isROwner }) => {
  const conn = this
  const senderNumber = (m.sender || "").replace(/[^0-9]/g, "")
  const botPath = path.join("./Sessions/SubBot", senderNumber)
  const rawChatId = m.chat || m.key?.remoteJid || ""
  const decodedChatId = typeof conn?.decodeJid === "function" ? conn.decodeJid(rawChatId) : rawChatId
  const chatId = decodedChatId || rawChatId

  if (!(isAdmin || isROwner || fs.existsSync(botPath))) {
    return m.reply(`𖣣ֶㅤ֯⌗ No tienes permisos para usar este comando.`, m)
  }

  if (!chatId) return

  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
  global.db.data.chats[chatId].isBanned = false

  const chatKeys = [rawChatId, decodedChatId, m.key?.remoteJid, m.chat].filter(Boolean)
  for (const key of chatKeys) {
    if (key && key !== chatId) {
      global.db.data.chats[key] = global.db.data.chats[chatId]
    }
  }
  await global.db.write?.().catch(() => {})

  m.reply(`˚∩ El bot ha sido desbaneado correctamente.`)
}

handler.help = ["desbanearbot"]
handler.tags = ["group"]
handler.command = ["desbanearbot", "unbanchat"]
handler.group = true

export default handler