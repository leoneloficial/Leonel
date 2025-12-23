const handler = async (msg, { conn }) => {
  try {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || msg.key.remoteJid;

    
    await conn.sendMessage(chatId, {
      react: { text: '🐛', key: msg.key }
    });

    
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const citado = context?.participant;
    const objetivo = citado || senderId;

    const esLID = objetivo.endsWith('@lid');
    const tipo = esLID ? 'LID oculto (@lid)' : 'Número visible (@s.whatsapp.net)';
    const numero = objetivo.replace(/[^0-9]/g, '');

    const mensaje = `
✿ *Información del usuario detectado:*

ᰔᩚ Identificador: ${objetivo}
❍ Número: +${numero}
ꕤ Tipo de cuenta: ${tipo}
`.trim();

    await conn.sendMessage(chatId, {
      text: mensaje
    }, { quoted: msg });
  } catch (error) {
    console.error('Error en handler LID:', error);
  }
};

handler.command = ['lid'];
handler.group = true;
handler.private = false;

export default handler;