import fs from "fs"
import path from "path"
import { jidNormalizedUser } from "@whiskeysockets/baileys"

const handler = async (m, { isAdmin, isROwner }) => {
  const conn = this

  if (global.db.data == null) await global.loadDatabase()

  const senderNumber = (m.sender || "").replace(/[^0-9]/g, "")
  const botPath = path.join("./Sessions/SubBot", senderNumber)

  if (!(isAdmin || isROwner || fs.existsSync(botPath))) {
    return m.reply("𖣣ֶㅤ֯⌗ No tienes permisos esto solo lo pueden usar *admins* *sockets* o el *owner.*")
  }

  const rawChatId = m.chat || m.key?.remoteJid || ""
  const decodedChatId = typeof conn?.decodeJid === "function" ? conn.decodeJid(rawChatId) : rawChatId

  const normalized =
    (decodedChatId || rawChatId || "").endsWith("@g.us")
      ? (decodedChatId || rawChatId)
      : jidNormalizedUser(decodedChatId || rawChatId)

  const chatKeys = [
    rawChatId,
    decodedChatId,
    normalized,
    m.key?.remoteJid,
    m.chat
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)

  if (!global.db.data.chats) global.db.data.chats = {}

  const existing = chatKeys.map(k => global.db.data.chats[k]).find(v => v) || {}
  existing.isBanned = true

  for (const k of chatKeys) global.db.data.chats[k] = existing

  await global.db.write?.().catch(() => {})

  return m.reply("> ⌗ Bot baneado correctamente en este grupo.")
}

handler.help = ["banearbot"]
handler.tags = ["group"]
handler.command = ["banearbot", "banchat"]
handler.group = true

export default handler