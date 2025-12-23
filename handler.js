import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import ws from "ws"
import { jidNormalizedUser } from "@whiskeysockets/baileys"

const { proto } = (await import("@whiskeysockets/baileys")).default

const isNumber = (x) => typeof x === "number" && !isNaN(x)
const delay = (ms) => isNumber(ms) && new Promise((resolve) => setTimeout(resolve, ms))

function loadBotConfig(conn) {
  try {
    const botNumber = (conn.user?.jid || "").split("@")[0].replace(/\D/g, "")
    const configPath = path.join("./Sessions/SubBot", botNumber, "config.json")

    let currentName = global.botname || global.namebot || "Bot"
    let currentBanner =
      global.banner ||
      "https://raw.githubusercontent.com/AdonixServices/Files/main/1754310580366-xco6p1-1754310544013-6cc3a6.jpg"

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath))
        if (config?.name) currentName = config.name
        if (config?.banner) currentBanner = config.banner
      } catch (err) {
        console.log(`No se pudo leer config del bot ${botNumber}:`, err)
      }
    }

    conn.botName = currentName
    conn.botBanner = currentBanner
  } catch (e) {
    console.log("Error fatal al cargar config del subbot:", e)
    conn.botName = global.namebot || "Bot"
    conn.botBanner =
      global.banner ||
      "https://raw.githubusercontent.com/AdonixServices/Files/main/1754310580366-xco6p1-1754310544013-6cc3a6.jpg"
  }
}

function normalizeJid(conn, jid) {
  try {
    if (!jid) return ""
    const decode =
      typeof conn?.decodeJid === "function"
        ? conn.decodeJid.bind(conn)
        : (j) => jidNormalizedUser(j || "")
    return jidNormalizedUser(decode(jid) || jid)
  } catch {
    return jid ? jidNormalizedUser(jid) : ""
  }
}

function getSenderJid(msg) {
  return (
    msg?.sender ||
    msg?.key?.participant ||
    msg?.participant ||
    msg?.message?.extendedTextMessage?.contextInfo?.participant ||
    msg?.message?.imageMessage?.contextInfo?.participant ||
    msg?.message?.videoMessage?.contextInfo?.participant ||
    msg?.message?.documentMessage?.contextInfo?.participant ||
    msg?.message?.audioMessage?.contextInfo?.participant ||
    msg?.message?.stickerMessage?.contextInfo?.participant ||
    msg?.message?.reactionMessage?.key?.participant ||
    msg?.message?.pollUpdateMessage?.pollCreationMessageKey?.participant ||
    ""
  )
}

function getBotJidRaw(conn) {
  return conn?.user?.jid || conn?.user?.id || conn?.user?.user?.jid || conn?.user?.user?.id || ""
}

function isWsOpen(sock) {
  try {
    return !!sock && sock.readyState !== ws.CLOSED
  } catch {
    return false
  }
}

function getPrefixList(conn) {
  const p = conn?.prefix || global.prefix
  if (typeof p === "string") return [p]
  if (Array.isArray(p)) return p.filter((x) => typeof x === "string" && x.length)
  return ["."]
}

function getCommandQuick(conn, text) {
  if (typeof text !== "string" || !text.trim()) return ""
  const prefixes = getPrefixList(conn)
  for (const pref of prefixes) {
    if (text.startsWith(pref)) {
      const noPrefix = text.slice(pref.length).trim()
      return (noPrefix.split(/\s+/)[0] || "").toLowerCase()
    }
  }
  return ""
}

async function getGroupContext(conn, m, chatId, isGroupChat) {
  const senderRaw = m?.sender || getSenderJid(m) || m?.key?.participant || ""
  const sender = senderRaw

  const decode =
    typeof conn?.decodeJid === "function"
      ? conn.decodeJid.bind(conn)
      : (jid) => jidNormalizedUser(jid || "")

  if (!isGroupChat) {
    return {
      groupMetadata: null,
      participants: [],
      userGroup: {},
      botGroup: {},
      isRAdmin: false,
      isAdmin: false,
      isBotAdmin: false,
      sender,
    }
  }

  const cached = conn?.chats?.[chatId]?.metadata || null
  const fresh = cached || (await conn.groupMetadata(chatId).catch(() => null))
  const groupMetadata = fresh || {}

  const rawParticipants = (groupMetadata?.participants || []) || []
  const participants = rawParticipants.map((p) => {
    const jid = p?.jid || p?.id || p?.participant || p?.user || ""
    return {
      id: jid,
      jid,
      lid: p?.lid,
      admin: p?.admin,
    }
  })

  const senderDecoded = jidNormalizedUser(decode(sender))
  const botDecoded = jidNormalizedUser(decode(getBotJidRaw(conn)))

  const userGroup = participants.find((u) => jidNormalizedUser(decode(u.jid)) === senderDecoded) || {}
  const botGroup = participants.find((u) => jidNormalizedUser(decode(u.jid)) === botDecoded) || {}

  const userAdmin = userGroup?.admin
  const botAdmin = botGroup?.admin

  const isUserSuper = userAdmin === "superadmin" || userAdmin === true
  const isRAdmin = isUserSuper || false
  const isAdmin = isUserSuper || userAdmin === "admin"

  const isBotAdmin = botAdmin === "superadmin" || botAdmin === "admin" || botAdmin === true

  return {
    groupMetadata,
    participants,
    userGroup,
    botGroup,
    isRAdmin: Boolean(isRAdmin),
    isAdmin: Boolean(isAdmin),
    isBotAdmin: Boolean(isBotAdmin),
    sender,
  }
}

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || []
  this.uptime = this.uptime || Date.now()

  if (!chatUpdate?.messages?.length) return
  const rawMsg = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!rawMsg) return

  if (global.db.data == null) await global.loadDatabase()

  loadBotConfig(this)

  let m = null
  let chatId = ""
  let isGroupChat = false

  try {
    m = smsg(this, rawMsg) || rawMsg
    if (!m) return
    m.exp = 0

    chatId = m?.chat || rawMsg?.key?.remoteJid || m?.key?.remoteJid || ""
    isGroupChat = typeof chatId === "string" && chatId.endsWith("@g.us")

    if (typeof m.text !== "string") m.text = ""

    try {
      let user = global.db.data.users[m.sender]
      if (typeof user !== "object") global.db.data.users[m.sender] = {}
      if (user) {
        if (!("name" in user)) user.name = m.name
        if (!("exp" in user) || !isNumber(user.exp)) user.exp = 0
        if (!("coin" in user) || !isNumber(user.coin)) user.coin = 0
        if (!("bank" in user) || !isNumber(user.bank)) user.bank = 0
        if (!("level" in user) || !isNumber(user.level)) user.level = 0
        if (!("health" in user) || !isNumber(user.health)) user.health = 100
        if (!("genre" in user)) user.genre = ""
        if (!("birth" in user)) user.birth = ""
        if (!("marry" in user)) user.marry = ""
        if (!("description" in user)) user.description = ""
        if (!("packstickers" in user)) user.packstickers = null
        if (!("premium" in user)) user.premium = false
        if (!("premiumTime" in user)) user.premiumTime = 0
        if (!("banned" in user)) user.banned = false
        if (!("bannedReason" in user)) user.bannedReason = ""
        if (!("commands" in user) || !isNumber(user.commands)) user.commands = 0
        if (!("afk" in user) || !isNumber(user.afk)) user.afk = -1
        if (!("afkReason" in user)) user.afkReason = ""
        if (!("warn" in user) || !isNumber(user.warn)) user.warn = 0
      } else {
        global.db.data.users[m.sender] = {
          name: m.name,
          exp: 0,
          coin: 0,
          bank: 0,
          level: 0,
          health: 100,
          genre: "",
          birth: "",
          marry: "",
          description: "",
          packstickers: null,
          premium: false,
          premiumTime: 0,
          banned: false,
          bannedReason: "",
          commands: 0,
          afk: -1,
          afkReason: "",
          warn: 0,
        }
      }

      let chat = global.db.data.chats[chatId]
      if (typeof chat !== "object") global.db.data.chats[chatId] = {}
      if (chat) {
        if (!("isBanned" in chat)) chat.isBanned = false
        if (!("isMute" in chat)) chat.isMute = false
        if (!("welcome" in chat)) chat.welcome = false
        if (!("sWelcome" in chat)) chat.sWelcome = ""
        if (!("sBye" in chat)) chat.sBye = ""
        if (!("detect" in chat)) chat.detect = true
        if (!("primaryBot" in chat)) chat.primaryBot = null
        if (!("modoadmin" in chat)) chat.modoadmin = false
        if (!("antiLink" in chat)) chat.antiLink = true
        if (!("nsfw" in chat)) chat.nsfw = false
        if (!("economy" in chat)) chat.economy = true
        if (!("gacha" in chat)) chat.gacha = true
      } else {
        global.db.data.chats[chatId] = {
          isBanned: false,
          isMute: false,
          welcome: false,
          sWelcome: "",
          sBye: "",
          detect: true,
          primaryBot: null,
          modoadmin: false,
          antiLink: true,
          nsfw: false,
          economy: true,
          gacha: true,
        }
      }

      let settings = global.db.data.settings[this.user.jid]
      if (typeof settings !== "object") global.db.data.settings[this.user.jid] = {}
      if (settings) {
        if (!("self" in settings)) settings.self = false
        if (!("jadibotmd" in settings)) settings.jadibotmd = true
      } else {
        global.db.data.settings[this.user.jid] = { self: false, jadibotmd: true }
      }
    } catch (e) {
      console.error(e)
    }

    const user = global.db.data.users[m.sender]
    try {
      const actual = user.name || ""
      const nuevo = m.pushName || (await this.getName(m.sender))
      if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) user.name = nuevo
    } catch {}

    const chat = global.db.data.chats[chatId]
    const settings = global.db.data.settings[this.user.jid]

    const isROwner = [...global.owner.map((n) => n)]
      .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
      .includes(m.sender)

    const isOwner = isROwner || m.fromMe

    const isPrems =
      isROwner ||
      global.prems.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender) ||
      user.premium === true

    const isOwners = [this.user.jid, ...global.owner.map((n) => n + "@s.whatsapp.net")].includes(m.sender)

    if (isGroupChat && chat?.isBanned && !isROwner) {
      const cmdQuick = getCommandQuick(this, m.text)
      const allowedWhenBanned = new Set(["bot", "banchat", "banearbot", "unbanchat", "desbanearbot", "setprimary", "delprimary"])
      if (!cmdQuick) return
      if (!allowedWhenBanned.has(cmdQuick)) return
    }

    if (opts["queque"] && m.text && !isPrems) {
      const queque = this.msgqueque
      const time = 1000 * 5
      const previousID = queque[queque.length - 1]
      queque.push(m.id || m.key.id)
      const iv = setInterval(async () => {
        if (queque.indexOf(previousID) === -1) {
          clearInterval(iv)
          return
        }
        await delay(time)
      }, time)
    }

    if (m.isBaileys) return

    m.exp += Math.ceil(Math.random() * 10)

    const ctx = await getGroupContext(this, m, chatId, isGroupChat)

    const groupMetadata = ctx.groupMetadata || {}
    const participants = ctx.participants || []
    const userGroup = ctx.userGroup || {}
    const botGroup = ctx.botGroup || {}

    const isRAdmin = ctx.isRAdmin || false
    const isAdmin = ctx.isAdmin || false
    const isBotAdmin = ctx.isBotAdmin || false

    const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins")

    for (const name in global.plugins) {
      const plugin = global.plugins[name]
      if (!plugin || plugin.disabled) continue

      const __filename = join(___dirname, name)

      if (!opts["restrict"]) if (plugin.tags && plugin.tags.includes("admin")) continue

      const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
      const pluginPrefix = plugin.customPrefix || this.prefix || global.prefix

      const match = (
        pluginPrefix instanceof RegExp
          ? [[pluginPrefix.exec(m.text), pluginPrefix]]
          : Array.isArray(pluginPrefix)
          ? pluginPrefix.map((prefix) => {
              const regex = prefix instanceof RegExp ? prefix : new RegExp(strRegex(prefix))
              return [regex.exec(m.text), regex]
            })
          : typeof pluginPrefix === "string"
          ? [[new RegExp(strRegex(pluginPrefix)).exec(m.text), new RegExp(strRegex(pluginPrefix))]]
          : [[[], new RegExp()]]
      ).find((p) => p[1])

      if (typeof plugin.before === "function") {
        const res = await plugin.before.call(this, m, {
          match,
          conn: this,
          participants,
          groupMetadata,
          userGroup,
          botGroup,
          isROwner,
          isOwner,
          isRAdmin,
          isAdmin,
          isBotAdmin,
          isPrems,
          chatUpdate,
          __dirname: ___dirname,
          __filename,
          user,
          chat,
          settings,
        })
        if (res) continue
      }

      if (typeof plugin !== "function") continue

      let usedPrefix
      if ((usedPrefix = (match?.[0] || "")[0])) {
        const noPrefix = m.text.replace(usedPrefix, "")
        let [command, ...args] = noPrefix.trim().split(" ").filter((v) => v)
        args = args || []
        let _args = noPrefix.trim().split(" ").slice(1)
        let text = _args.join(" ")
        command = (command || "").toLowerCase()

        const fail = plugin.fail || global.dfail

        const isAccept =
          plugin.command instanceof RegExp
            ? plugin.command.test(command)
            : Array.isArray(plugin.command)
            ? plugin.command.some((cmd) => (cmd instanceof RegExp ? cmd.test(command) : cmd === command))
            : typeof plugin.command === "string"
            ? plugin.command === command
            : false

        global.comando = command

        if (!isOwners && settings.self) return
        if (
          m.id?.startsWith("NJX-") ||
          (m.id?.startsWith("BAE5") && m.id.length === 16) ||
          (m.id?.startsWith("B24E") && m.id.length === 20)
        )
          return

        const bypassPrimaryCommands = new Set(["delprimary", "setprimary", "banchat", "banearbot", "unbanchat", "desbanearbot", "bot"])

        if (chat?.primaryBot && chat.primaryBot !== this.user.jid && !bypassPrimaryCommands.has(command)) {
          const primary = normalizeJid(this, chat.primaryBot)
          const primaryConn = (global.conns || []).find(
            (c) => c?.user?.jid && normalizeJid(this, c.user.jid) === primary && c?.ws?.socket && isWsOpen(c.ws.socket)
          )

          const primaryInGroup = !!participants.find((p) => normalizeJid(this, p.id) === primary)

          if (primary === normalizeJid(this, global.conn?.user?.jid)) {
            throw false
          }

          if (primaryConn && primaryInGroup) {
            throw false
          }

          if (primaryConn && !primaryInGroup) {
            chat.primaryBot = null
            await global.db.write?.().catch(() => {})
          } else if (!primaryConn) {
            chat.primaryBot = null
            await global.db.write?.().catch(() => {})
          }
        }

        if (!isAccept) continue

        m.plugin = name

        await this.sendPresenceUpdate("composing", chatId)
        global.db.data.users[m.sender].commands++

        if (
          !isOwners &&
          !isGroupChat &&
          !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(m.text)
        )
          return

        const adminMode = chat.modoadmin || false
        const needsAdmin = Boolean(plugin.botAdmin || plugin.admin || plugin.group)

        if (adminMode && !isOwner && isGroupChat && !isAdmin && needsAdmin) return

        if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
          fail("owner", m, this)
          continue
        }
        if (plugin.rowner && !isROwner) {
          fail("rowner", m, this)
          continue
        }
        if (plugin.owner && !isOwner) {
          fail("owner", m, this)
          continue
        }
        if (plugin.premium && !isPrems) {
          fail("premium", m, this)
          continue
        }
        if (plugin.group && !isGroupChat) {
          fail("group", m, this)
          continue
        }
        if (plugin.botAdmin && !isBotAdmin) {
          fail("botAdmin", m, this)
          continue
        }
        if (plugin.admin && !isAdmin) {
          fail("admin", m, this)
          continue
        }

        m.isCommand = true
        m.exp += plugin.exp ? parseInt(plugin.exp) : 10

        const extra = {
          match,
          usedPrefix,
          noPrefix,
          _args,
          args,
          command,
          text,
          conn: this,
          participants,
          groupMetadata,
          userGroup,
          botGroup,
          isROwner,
          isOwner,
          isRAdmin,
          isAdmin,
          isBotAdmin,
          isPrems,
          chatUpdate,
          __dirname: ___dirname,
          __filename,
          user,
          chat,
          settings,
        }

        try {
          await plugin.call(this, m, extra)
        } catch (err) {
          m.error = err
          console.error(err)
        } finally {
          if (typeof plugin.after === "function") {
            try {
              await plugin.after.call(this, m, extra)
            } catch (err) {
              console.error(err)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    if (opts["queque"] && m?.text) {
      const mid = m?.id || m?.key?.id || rawMsg?.key?.id
      const idx = this.msgqueque.indexOf(mid)
      if (idx !== -1) this.msgqueque.splice(idx, 1)
    }

    try {
      const sender = (m?.sender || getSenderJid(rawMsg) || "").toString()
      const u = global.db.data.users[sender]
      if (sender && u) u.exp += m?.exp || 0
    } catch {}

    try {
      if (!opts["noprint"]) {
        const printable = {
          ...(m || {}),
          chat: chatId || (m?.chat || rawMsg?.key?.remoteJid || ""),
          sender: (m?.sender || getSenderJid(rawMsg) || ""),
        }
        if (printable.sender && printable.chat) await (await import("./lib/print.js")).default(printable, this)
      }
    } catch (err) {
      console.warn(err)
      try {
        console.log(rawMsg?.message)
      } catch {}
    }
  }
}

global.dfail = (type, m, conn) => {
  const msg = {
    rowner: `『✦』El comando *${global.comando || ""}* solo puede ser usado por los creadores del bot.`,
    premium: `『✦』El comando *${global.comando || ""}* solo puede ser usado por los usuarios premium.`,
    group: `『✦』El comando *${global.comando || ""}* solo puede ser usado en grupos.`,
    admin: `『✦』El comando *${global.comando || ""}* solo puede ser usado por los administradores del grupo.`,
    botAdmin: `『✦』Para ejecutar el comando *${global.comando || ""}* debo ser administrador del grupo.`,
  }[type]
  if (msg) return conn.reply(m.chat, msg, m, rcanal).then(() => m.react("✖️"))
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.magenta("Se actualizo 'handler.js'"))
  if (global.reloadHandler) console.log(await global.reloadHandler())
})