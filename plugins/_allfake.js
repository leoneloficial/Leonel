import pkg from "@whiskeysockets/baileys"
import fs from "fs"
import fetch from "node-fetch"
import axios from "axios"
import moment from "moment-timezone"

const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = pkg

var handler = (m) => m

handler.all = async function (m) {
  const conn = this

  const botname = conn.botName || global.botname || global.namebot || "Bot"
  const icono = conn.icono || global.icono

  global.canalIdM = ["120363324350463849@newsletter", "120363324350463849@newsletter"]
  global.canalNombreM = ["»  ⊹˚୨ •(=^●ω●^=)• ❀ canal - oficial ❀", "»  ⊹˚୨ •(=^●ω●^=)• ❀ canal - oficial ❀"]

  global.channelRD = await getRandomChannel()

  const d = new Date(Date.now() + 3600000)
  const locale = "es"

  global.d = d
  global.locale = locale
  global.dia = d.toLocaleDateString(locale, { weekday: "long" })
  global.fecha = d.toLocaleDateString("es", { day: "numeric", month: "numeric", year: "numeric" })
  global.mes = d.toLocaleDateString("es", { month: "long" })
  global.año = d.toLocaleDateString("es", { year: "numeric" })
  global.tiempo = d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  })

  const canal = "https://whatsapp.com/channel/0029VbAc6cS002TEZ4r5261E"
  const comunidad = "https://chat.whatsapp.com/I0dMp2fEle7L6RaWBmwlAa"
  const git = "https://github.com/The-King-Destroy"
  const github = "https://github.com/The-King-Destroy/Yuki_Suou-Bot"
  const correo = "thekingdestroy507@gmail.com"

  global.redes = pickRandom([canal, comunidad, git, github, correo])

  global.nombre = m.pushName || "Anónimo"
  global.packsticker = `\n👑 Usuario: ${global.nombre}\n🤍 Bot: ${botname}\n🐋 Fecha: ${global.fecha}\n🕐 Hora: ${moment.tz("America/Caracas").format("HH:mm:ss")}`
  global.packsticker2 = ``

  const senderNum = (m.sender || "").split("@")[0]

  global.fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo",
    },
    message: {
      contactMessage: {
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${senderNum}:${senderNum}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      },
    },
    participant: "0@s.whatsapp.net",
  }

  const dev = global.dev || global.developer || "Dev"

  let thumb = null
  try {
    if (icono && /^https?:\/\//i.test(icono)) thumb = await (await fetch(icono)).buffer()
  } catch {}

  global.rcanal = {
    contextInfo: {
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: global.channelRD.id,
        serverMessageId: "",
        newsletterName: global.channelRD.name,
      },
      externalAdReply: {
        title: botname,
        body: dev,
        mediaUrl: null,
        description: null,
        previewType: "PHOTO",
        thumbnail: thumb,
        sourceUrl: global.redes,
        mediaType: 1,
        renderLargerThumbnail: false,
      },
      mentionedJid: null,
    },
  }
}

export default handler

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

async function getRandomChannel() {
  const ids = global.canalIdM || []
  const names = global.canalNombreM || []
  const randomIndex = Math.floor(Math.random() * ids.length)

  const id = ids[randomIndex]
  const name = names[randomIndex] || ""

  return { id, name }
}