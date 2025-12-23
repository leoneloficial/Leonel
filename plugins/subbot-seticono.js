import fetch from "node-fetch";
import crypto from "crypto";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

let handler = async (m, { conn }) => {
  if (!global.conns.includes(conn)) return m.reply('Este comando es solo para sub-bots.')
  if (!m.quoted || !/image/.test(m.quoted.mimetype)) return m.reply(`❀ Por favor, responde a una imagen con el comando *seticono* para actualizar la foto del catalogo.`);
  try {
    const media = await m.quoted.download();
    let link = await catbox(media);
    if (!isImageValid(media)) {
      return m.reply(`✦ El archivo enviado no es una imagen válida.`);
    }
    conn.icono = `${link}`;
      await conn.updateProfilePicture(conn.user.jid, media);
      await conn.sendFile(m.chat, media, 'icono.jpg', `❀ Icono actualizado.`, m);
  } catch (error) {
    console.error(error);
    m.reply(`⚠︎ Hubo un error al intentar cambiar el icono.`);
  }
};

const isImageValid = (buffer) => {
  const magicBytes = buffer.slice(0, 4).toString('hex');
  if (magicBytes === 'ffd8ffe0' || magicBytes === 'ffd8ffe1' || magicBytes === 'ffd8ffe2') {
    return true;
  }
  if (magicBytes === '89504e47') {
    return true;
  }
  if (magicBytes === '47494638') {
    return true;
  }
  return false;
};

handler.help = ['seticono'];
handler.tags = ['subbot'];
handler.command = ['seticono'];

export default handler;

async function catbox(content) {
  const { ext, mime } = (await fileTypeFromBuffer(content)) || {};
  const blob = new Blob([content.toArrayBuffer()], { type: mime });
  const formData = new FormData();
  const randomBytes = crypto.randomBytes(5).toString("hex");
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", blob, randomBytes + "." + ext);
  const response = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: formData,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
    },
  });
  return await response.text();
}