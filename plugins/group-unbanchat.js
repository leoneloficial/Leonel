import fs from "fs"
import path from "path"

const handler = async (m, { isAdmin, isROwner }) => {
  const senderNumber = (m.sender || "").replace(/[^0-9]/g, "")
  const botPath = path.join("./Sessions/SubBot", senderNumber)
  const chatId = m.chat || m.key?.remoteJid || ""

  if (!(isAdmin || isROwner || fs.existsSync(botPath))) {
    return m.reply(`𖣣ֶㅤ֯⌗ No tienes permisos para usar este comando.`, m)
  }

  if (!chatId) return

  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
  global.db.data.chats[chatId].isBanned = false
  await global.db.write?.().catch(() => {})

  m.reply(`˚∩ El bot ha sido desbaneado correctamente.`)
}

handler.help = ["desbanearbot"]
handler.tags = ["group"]
handler.command = ["desbanearbot", "unbanchat"]
handler.group = true

export default handler