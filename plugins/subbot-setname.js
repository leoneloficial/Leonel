let handler = async (m, { conn, text }) => {
  if (!global.conns.includes(conn)) return m.reply('Este comando es solo para sub-bots.')
  const names = text.split('/');
  if (names.length !== 2) return m.reply(`${emoji} Por favor, proporciona ambos nombres separados por una barra (/) en el formato: nombre1/nombre2.`);
  conn.botname = names[0].trim();
  const texto1bot = ` • Powered By ${etiqueta}`;
  conn.textbot = `${names[1].trim()}${texto1bot}`;
  m.reply(`${emoji} El nombre del bot ha sido cambiado a: ${conn.botname}\n\n> ${emoji2} El texto del bot ha sido cambiado a: ${conn.textbot}`);
};

handler.help = ['setname'];
handler.tags = ['subbot'];
handler.command = ['setname'];

export default handler;