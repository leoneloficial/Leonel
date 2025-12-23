import WebSocket from "ws"

const handler = async (m, { conn }) => {
  const botname = conn.botName || conn.botname || global.botname || "Bot"
  const chat = global.db.data.chats[m.chat] ||= {}

  const subBots = [
    ...new Set(
      (global.conns || [])
        .filter(
          (c) =>
            c?.user?.jid &&
            c?.ws?.socket &&
            c.ws.socket.readyState !== WebSocket.CLOSED
        )
        .map((c) => c.user.jid)
    ),
  ]

  if (
    global.conn?.user?.jid &&
    !subBots.includes(global.conn.user.jid)
  ) {
    subBots.push(global.conn.user.jid)
  }

  const who = m.mentionedJid?.[0] || m.quoted?.sender || null

  if (!who) {
    return conn.reply(
      m.chat,
      `❀ Por favor, menciona un bot secundario para establecerlo como Bot primario del grupo.`,
      m
    )
  }

  if (!subBots.includes(who)) {
    return conn.reply(
      m.chat,
      `ꕥ El usuario mencionado no es un Socket válido de *${botname}*.`,
      m
    )
  }

  if (chat.primaryBot === who) {
    return conn.reply(
      m.chat,
      `ꕥ @${who.split("@")[0]} ya está configurado como Bot primario.`,
      m,
      { mentions: [who] }
    )
  }

  chat.primaryBot = who
  await global.db.write?.().catch(() => {})

  return conn.reply(
    m.chat,
    `❀ @${who.split("@")[0]} ha sido establecido como Bot primario del grupo.\n> Ahora los comandos se ejecutarán desde ese bot.`,
    m,
    { mentions: [who] }
  )
}

handler.help = ["setprimary"]
handler.tags = ["grupo"]
handler.command = ["setprimary"]

export default handler
