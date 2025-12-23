import fs from "fs"
import path from "path"

const handler = async (m, { isAdmin, isROwner }) => {
  const conn = this
  const senderNumber = (m.sender || "").replace(/[^0-9]/g, "")
  const botPath = path.join("./Sessions/SubBot", senderNumber)
  const rawChatId = m.chat || m.key?.remoteJid || ""
  const chatId = typeof conn?.decodeJid === "function" ? conn.decodeJid(rawChatId) : rawChatId

  if (!(isAdmin || isROwner || fs.existsSync(botPath))) {
    return m.reply(`𖣣ֶㅤ֯⌗ No tienes permisos esto solo lo pueden usar *admins* *sockets* o el *owner.*`, m)
  }

  if (!chatId) return

  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
  global.db.data.chats[chatId].isBanned = true
  if (rawChatId && rawChatId !== chatId) {
    global.db.data.chats[rawChatId] = global.db.data.chats[chatId]
  }
  await global.db.write?.().catch(() => {})

  m.reply(`> ⌗ Bot baneado correctamente en este grupo.`)
}

handler.help = ["banearbot"]
handler.tags = ["group"]
handler.command = ["banearbot", "banchat"]
handler.group = true

export default handler