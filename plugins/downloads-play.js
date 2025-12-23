import fetch from "node-fetch"
import yts from "yt-search"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text?.trim())
      return conn.reply(m.chat, `❀ Por favor, ingresa el nombre de la música a descargar.`, m)

    await m.react("🕒")

    const videoMatch = text.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
    )
    const query = videoMatch ? "https://youtu.be/" + videoMatch[1] : text

    const search = await yts(query)
    const result = videoMatch
      ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all?.[0]
      : search.all?.[0]

    if (!result) throw "ꕥ No se encontraron resultados."

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result
    if (seconds > 2700) throw "⚠ El contenido supera el límite de duración (45 minutos)."

    const vistas = formatViews(views)
    const info =
      `「✦」Descargando *<${title}>*\n\n` +
      `> ❑ Canal » *${author?.name || "Desconocido"}*\n` +
      `> ♡ Vistas » *${vistas}*\n` +
      `> ✧︎ Duración » *${timestamp || "No disponible"}*\n` +
      `> ☁︎ Publicado » *${ago || "No disponible"}*\n` +
      `> ➪ Link » ${url}\n` +
      `> ✿ API » Adonix`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

    if (["play", "yta", "ytmp3", "playaudio"].includes(command)) {
      const audio = await getAud(url)
      if (!audio?.url) throw "⚠ No se pudo obtener el audio."

     /* m.reply(`> ❀ *Audio procesado. Servidor:* \`${audio.api}\``) /*

      if (command === "ytmp3") {
        await conn.sendMessage(
          m.chat,
          { audio: { url: audio.url }, fileName: `${title}.mp3`, mimetype: "audio/mpeg" },
          { quoted: m }
        )
      } else {
        await conn.sendMessage(
          m.chat,
          {
            document: { url: audio.url },
            fileName: `${title}.mp3`,
            mimetype: "audio/mpeg",
            caption: `> ❀ ${title}`
          },
          { quoted: m }
        )
      }

      await m.react("✔️")
      return
    }

    if (["play2", "ytv", "ytmp4", "mp4"].includes(command)) {
      const video = await getVid(url)
      if (!video?.url) throw "⚠ No se pudo obtener el video."

     /* m.reply(`> ❀ *Vídeo procesado. Servidor:* \`${video.api}\``) /*

      if (command === "ytmp4") {
        await conn.sendMessage(
          m.chat,
          { video: { url: video.url }, mimetype: "video/mp4", caption: `> ❀ ${title}` },
          { quoted: m }
        )
      } else {
        await conn.sendMessage(
          m.chat,
          {
            document: { url: video.url },
            fileName: `${title}.mp4`,
            mimetype: "video/mp4",
            caption: `> ❀ ${title}`
          },
          { quoted: m }
        )
      }

      await m.react("✔️")
      return
    }
  } catch (e) {
    await m.react("✖️")
    return conn.reply(
      m.chat,
      typeof e === "string"
        ? e
        : "⚠︎ Se ha producido un problema.\n> Usa *" +
            usedPrefix +
            "report* para informarlo.\n\n" +
            (e?.message || e),
      m
    )
  }
}

handler.command = handler.help = ["play", "yta", "ytmp3", "play2", "ytv", "ytmp4", "playaudio", "mp4"]
handler.tags = ["descargas"]
handler.group = true

export default handler

async function getAud(url) {
  const endpoint = `${global.APIs.adonix.url}/download/ytaudio?apikey=${global.APIs.adonix.key}&url=${encodeURIComponent(
    url
  )}`
  const res = await fetchJson(endpoint)
  const link = res?.data?.url
  return link ? { url: link, api: "Adonix" } : null
}

async function getVid(url) {
  const endpoint = `${global.APIs.adonix.url}/download/ytvideo?apikey=${global.APIs.adonix.key}&url=${encodeURIComponent(
    url
  )}`
  const res = await fetchJson(endpoint)
  const link = res?.data?.url
  return link ? { url: link, api: "Adonix" } : null
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const r = await fetch(url, { signal: controller.signal })
    return await r.json()
  } finally {
    clearTimeout(timeout)
  }
}

function formatViews(views) {
  if (views === undefined) return "No disponible"
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B (${views.toLocaleString()})`
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M (${views.toLocaleString()})`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k (${views.toLocaleString()})`
  return views.toString()
}