const handler = async (m, { conn }) => {
  const chat = global.db.data.chats[m.chat]

  if (!chat.primaryBot) {
    return conn.reply(m.chat, `ꕥ No hay ningún Bot primario establecido en este grupo.`, m)
  }

  const old = chat.primaryBot
  chat.primaryBot = null
  await global.db.write?.().catch(() => {})

  return conn.reply(m.chat, `❀ Se ha eliminado el Bot primario del grupo.\n> Antes era: @${old.split("@")[0]}`, m, { mentions: [old] })
}

handler.help = ["delprimary"]
handler.tags = ["grupo"]
handler.command = ["delprimary"]
handler.group = true
handler.admin = true

export default handler