
let handler = async (m, { conn, usedPrefix, command, args }) => {
  const botname = conn.botname || conn.botName || global.botname || global.namebot || "Bot"
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})

  if (!("isBanned" in chat)) chat.isBanned = false

  const sub = (args[0] || "").toLowerCase()

  if (!sub) {
    const estado = chat.isBanned ? "✗ Desactivado" : "✓ Activado"
    const info =
      `「✦」Un administrador puede activar o desactivar a *${botname}* utilizando:\n\n` +
      `✐ Activar » *${usedPrefix + command} on*\n` +
      `✐ Desactivar » *${usedPrefix + command} off*\n\n` +
      `✧ Estado actual » *${estado}*`
    return conn.reply(m.chat, info, m)
  }

  if (["off", "disable", "desactivar", "0"].includes(sub)) {
    if (chat.isBanned) return conn.reply(m.chat, `《✦》${botname} ya estaba desactivado.`, m)
    chat.isBanned = true
    await global.db.write?.().catch(() => {})
    return conn.reply(m.chat, `❀ Has *desactivado* a ${botname}!`, m)
  }

  if (["on", "enable", "activar", "1"].includes(sub)) {
    if (!chat.isBanned) return conn.reply(m.chat, `《✦》${botname} ya estaba activado.`, m)
    chat.isBanned = false
    await global.db.write?.().catch(() => {})
    return conn.reply(m.chat, `❀ Has *activado* a ${botname}!`, m)
  }

  return conn.reply(
    m.chat,
    `「✦」Uso:\n\n✐ Activar » *${usedPrefix + command} on*\n✐ Desactivar » *${usedPrefix + command} off*`,
    m
  )
}

handler.help = ["bot"]
handler.tags = ["grupo"]
handler.command = ["bot"]
handler.admin = true
handler.group = true

export default handler