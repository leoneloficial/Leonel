import fs from "fs"
import path from "path"
import { jidNormalizedUser } from "@whiskeysockets/baileys"

const handler = async (m, { isAdmin, isROwner }) => {
  const conn = this

  if (global.db.data == null) await global.loadDatabase()

  const senderNumber = (m.sender || "").replace(/[^0-9]/g, "")
  const botPath = path.join("./Sessions/SubBot", senderNumber)

  const rawChatId = m.chat || m.key?.remoteJid || ""
  const decodedChatId =
    typeof conn?.decodeJid === "function" ? conn.decodeJid(rawChatId) : rawChatId

  const chatId = jidNormalizedUser(decodedChatId || rawChatId)

  if (!(isAdmin || isROwner || fs.existsSync(botPath))) {
    return m.reply(
      `𖣣ֶㅤ֯⌗ No tienes permisos esto solo lo pueden usar *admins* *sockets* o el *owner.*`
    )
  }

  if (!chatId) return

  if (!global.db.data.chats) global.db.data.chats = {}
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}

  global.db.data.chats[chatId].isBanned = true

  const chatKeys = [rawChatId, decodedChatId, m.key?.remoteJid, m.chat, chatId]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)

  for (const key of chatKeys) {
    if (key) global.db.data.chats[key] = global.db.data.chats[chatId]
  }

  await global.db.write?.().catch(() => {})

  m.reply(`> ⌗ Bot baneado correctamente en este grupo.`)
}

handler.help = ["banearbot"]
handler.tags = ["group"]
handler.command = ["banearbot", "banchat"]
handler.group = true

export default handler