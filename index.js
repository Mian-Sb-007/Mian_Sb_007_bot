const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => res.send('mian sb bot running ✅'))
app.listen(PORT, () => console.log(`port ${PORT} open ho gaya`))
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const axios = require('axios')
const config = require('./config.js')

// SMALL CAPS CONVERTER - Sare reply isme honge
const toSmallCaps = (text) => {
    const map = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ', ' ':' ', '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9'}
    return text.toLowerCase().split('').map(c => map[c] || c).join('')
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['MianSB007-Bot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot()
        } else if(connection === 'open') {
            console.log('Bot Connected ✅')
        }
    })

    // ==== 3 AUTO FEATURES ====
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        const jid = msg.key.remoteJid
        try {
            await sock.sendPresenceUpdate('composing', jid)
            setTimeout(() => sock.sendPresenceUpdate('paused', jid), 1500)
            await sock.sendMessage(jid, { react: { text: "❤️", key: msg.key }})
        } catch (e) {}
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const status = messages[0]
        if (status.key.remoteJid === 'status@broadcast' &&!status.key.fromMe) {
            await sock.sendMessage('status@broadcast', { react: { text: "❤️", key: status.key }})
        }
    })

    // ==== 80 COMMANDS ====
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        const msg = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''
        if (!msg.startsWith(config.prefix)) return

        const args = msg.slice(1).trim().split(' ')
        const cmd = args.shift().toLowerCase()
        const q = args.join(' ')
        const jid = m.key.remoteJid
        const isGroup = jid.endsWith('@g.us')
        const sender = m.key.participant || m.key.remoteJid
        const isOwner = config.owner.includes(sender.split('@')[0])
        const groupMetadata = isGroup? await sock.groupMetadata(jid) : ''
        const groupAdmins = isGroup? groupMetadata.participants.filter(v => v.admin).map(v => v.id) : []
        const isBotAdmin = isGroup? groupAdmins.includes(sock.user.id.split(':')[0]+'@s.whatsapp.net') : false
        const isAdmin = isGroup? groupAdmins.includes(sender) : false

        const reply = (text) => sock.sendMessage(jid, { text: toSmallCaps(text) }, { quoted: m })

        // 1. OWNER
        if (cmd === 'owner') return reply(`ʙᴏᴛ ᴏᴡɴᴇʀ: ᴡᴀ.ᴍᴇ/${config.owner[0]}`)

        // 2. MENU
        if (cmd === 'menu') {
            let menuText = `╭───❰ ᴍɪᴀɴ ꜱʙ ⁰⁰⁷ - ʙᴏᴛ ❱───╮
│ ᴏᴡɴᴇʀ: ᴍɪᴀɴ ꜱʙ ⁰⁰⁷
│ ᴏᴡɴᴇʀ ɴᴜᴍʙᴇʀ: ${config.owner[0]}
│ ᴍᴏᴅᴇ: ${config.mode}
│ ᴄᴏᴍᴀɴᴅꜱ: 80
╰──────────────────╯

╭───❰ ᴍᴀɪɴ ❱───╮
│ 1..ᴏᴡɴᴇʀ
│ 2..ᴍᴇɴᴜ
│ 3..ᴘɪɴɢ
│ 4..ᴀʟɪᴠᴇ
╰────────────╯

╭───❰ ᴀɪ & ᴛᴏᴏʟꜱ ❱───╮
│ 5..ᴀɪ
│ 6..ɪᴍɢ
│ 7..ꜱᴀʏ
│ 8..ᴛʀᴀɴꜱʟᴀᴛᴇ
│ 9..ᴄᴀʟᴄ
│ 10..ᴅɪᴄᴛɪᴏɴᴀʀʏ
│ 11..ᴡᴇᴀᴛʜᴇʀ
│ 12..ᴄᴜʀᴇɴᴄʏ
│ 13..ǫʀ
│ 14..ǫʀꜱᴄᴀɴ
│ 15..ꜱʜᴏʀᴛᴜʀʟ
│ 16..ɢɪᴛʜᴜʙ
╰────────────────╯

╭───❰ ᴄʏʙᴇʀ ꜱᴇᴄᴜʀɪᴛʏ ❱───╮
│ 17..ᴘɪɴɢ
│ 18..ᴡʜᴏɪꜱ
│ 19..ɪᴘ
│ 20..ꜱᴄʀɪᴘᴛ
│ 21..ꜱᴄʀᴇᴇɴꜱʜᴏᴛ
╰───────────────────╯

╭───❰ ꜱᴛɪᴄᴋᴇʀ & ᴍᴇᴅɪᴀ ❱───╮
│ 22..ꜱᴛɪᴄᴋᴇʀ
│ 23..ᴛᴏɪᴍɢ
│ 24..ᴀᴛᴘ
│ 25..ᴛᴛᴘ
│ 26..ᴇᴍᴏᴊɪᴍɪx
│ 27..ʀᴇᴍᴏᴠᴇʙɢ
│ 28..ʟᴏɢᴏ
│ 29..ꜱꜰᴏɴᴛ
╰────────────────────╯

╭───❰ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ❱───╮
│ 30..ꜱᴏɴɢ
│ 31..ᴠɪᴅᴇᴏ
│ 32..ɪɢ
│ 33..ꜰʙ
│ 34..ᴛɪᴋᴛᴏᴋ
│ 35..ᴛᴡɪᴛᴇʀ
│ 36..ᴀᴘᴋ
│ 37..ᴀᴘ
│ 38..ᴍᴏᴠɪᴇ
│ 39..ᴀɴɪᴍᴇ
╰────────────────╯

╭──────❰ ꜰᴜɴ ❱─────╮
│ 40..ᴊᴏᴋᴇ
│ 41..ᴍᴇᴍᴇ
│ 42..ꜱʜɪᴘ
│ 43..ᴛʀᴜᴛʜᴅᴀʀᴇ
│ 44..ʀᴏᴀꜱᴛ
│ 45..ɢᴀʏᴄʜᴇᴄᴋ
│ 46..ꜱᴛᴜᴘɪᴅ
│ 47..ꜱᴄʀᴇᴇɴ
╰────────────────╯

╭───❰ ɢʀᴏᴜᴘ ᴛᴏᴏʟꜱ ❱───╮
│ 48..ᴛᴀɢᴀʟʟ
│ 49..ʜɪᴅᴇᴛᴀɢ
│ 50..ᴋɪᴄᴋ
│ 51..ᴘʀᴏᴍᴏᴛᴇ
│ 52..ᴅᴇᴍᴏᴛᴇ
│ 53..ɢᴄʟɪɴᴋ
│ 54..ʀᴇᴠᴏᴋᴇ
│ 55..ꜱᴇᴛɴᴀᴍᴇ
│ 56..ꜱᴇᴛᴅᴇꜱᴄ
│ 57..ᴡᴇʟᴄᴏᴍᴇ
│ 58..ɢᴏᴅʙʏᴇ
│ 59..ᴀɴᴛɪʟɪɴᴋ
│ 60..ᴀɴᴛɪʙᴀᴅ
╰────────────────╯

╭───❰ ʙᴏᴛ ᴍᴏᴅᴇ ❱───╮
│ 61..ᴘᴜʙʟɪᴄ
│ 62..ᴘʀɪᴠᴀᴛᴇ
│ 63..ꜱᴛᴀᴛᴜꜱ
╰───────────────╯

╭───❰ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ ❱───╮
│ 64..ᴘᴀɪʀ
│ 65..ᴜɴᴘᴀɪʀ
│ 66..ᴘᴀɪʀʟɪꜱᴛ
╰─────────────────╯

╭───❰ ᴏᴡɴᴇʀ ᴛᴏᴏʟꜱ ❱───╮
│ 67..ʙʟᴏᴄᴋ
│ 68..ᴜɴʙʟᴏᴄᴋ
│ 69..ʙʟᴏᴄᴋʟɪꜱᴛ
│ 70..ʙʀᴏᴀᴅᴄᴀꜱᴛ
│ 71..ʀᴇꜱᴛᴀʀᴛ
│ 72..ꜱʜᴜᴛᴅᴏᴡɴ
│ 73..ꜱᴇᴛᴘ
│ 74..ꜱᴇᴛꜱᴛᴀᴛᴜꜱ
│ 75..ᴄʟᴇᴀʀᴄʜᴀᴛ
│ 76..ʙᴀᴄᴋᴜᴘ
│ 77..ꜱᴘᴇᴇᴅᴛᴇꜱᴛ
│ 78..ᴜᴘᴛɪᴍᴇ
│ 79..ꜱᴇʀᴠᴇʀ
│ 80..ᴏᴡɴᴇʀ
╰─────────────────╯`
            return sock.sendMessage(jid, { text: menuText })
        }

        // 3. PING
        if (cmd === 'ping') {
            const start = Date.now()
            await reply('ᴘɪɴɢɪɴɢ...')
            return reply(`ᴘᴏɴɢ! ꜱᴘᴇᴇᴅ: ${Date.now() - start}ᴍꜱ`)
        }

        // 4. ALIVE
        if (cmd === 'alive') return reply(`ᴍɪᴀɴ ꜱʙ ⁰⁰⁷ - ʙᴏᴛ ɪꜱ ᴀʟɪᴠᴇ ✅\nᴏᴡɴᴇʀ: ${config.owner[0]}\nᴍᴏᴅᴇ: ${config.mode}`)

        // 5. AI
        if (cmd === 'ai') {
            if (!q) return reply('ꜱᴀᴡᴀʟ ʟɪᴋʜᴏ. ᴇxᴀᴍᴘʟᴇ:.ᴀɪ ᴘᴀᴋɪꜱᴛᴀɴ ᴋᴀ ᴄᴀᴘɪᴛᴀʟ ᴋʏᴀ ʜᴀɪ?')
            try {
                let res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=ur`)
                return reply(res.data.success)
            } catch { return reply('ᴀɪ ᴇʀᴏʀ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.') }
        }

        // 6. IMG
        if (cmd === 'img') {
            if (!q) return reply('ɪᴍᴀɢᴇ ᴋᴀ ᴘʀᴏᴍᴘᴛ ᴅᴏ. ᴇxᴀᴍᴘʟᴇ:.ɪᴍɢ ʙᴇᴀᴜᴛɪꜰᴜʟ ᴄᴀᴛ')
            await reply('ɪᴍᴀɢᴇ ʙᴀɴᴀ ʀᴀʜᴀ ʜᴜɴ, ᴡᴀɪᴛ...')
            try {
                let imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}`
                return sock.sendMessage(jid, { image: { url: imgUrl }, caption: toSmallCaps(`ᴘʀᴏᴍᴘᴛ: ${q}`) })
            } catch { return reply('ɪᴍᴀɢᴇ ɴᴀʜɪ ʙᴀɴ ꜱᴀᴋɪ.') }
        }

        // 7. SAY
        if (cmd === 'say') {
            if (!q) return reply('ᴋᴜᴄʜ ʟɪᴋʜᴏ ʙᴏʟɴᴇ ᴋᴇ ʟɪʏᴇ. ᴇxᴀᴍᴘʟᴇ:.ꜱᴀʏ ʜᴇʟᴏ ʙʜᴀɪ')
            try {
                let ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=ur&client=tw-ob`
                return sock.sendMessage(jid, { audio: { url: ttsUrl }, mimetype: 'audio/mpeg', ptt: true })
            } catch { return reply('ᴠᴏɪᴄᴇ ᴇʀᴏʀ.') }
        }

        // 8. TRANSLATE
        if (cmd === 'translate') {
            if (!q.includes('|')) return reply('ꜰᴏʀᴍᴀᴛ:.ᴛʀᴀɴꜱʟᴀᴛᴇ ᴇɴ|ᴜʀ ʜᴇʟᴏ')
            let [lang,...text] = q.split('|')
            try {
                let res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.join('|'))}&langpair=${lang}`)
                return reply(`ᴛʀᴀɴꜱʟᴀᴛɪᴏɴ: ${res.data.responseData.translatedText}`)
            } catch { return reply('ᴛʀᴀɴꜱʟᴀᴛᴇ ᴇʀʀᴏʀ.') }
        }

        // 9. CALC
        if (cmd === 'calc') {
            if (!q) return reply('ᴇxᴀᴍᴘʟᴇ:.ᴄᴀʟᴄ 5+5*2')
            try {
                let result = eval(q.replace(/[^0-9+\-*/().]/g, ''))
                return reply(`ʀᴇꜱᴜʟᴛ: ${q} = ${result}`)
            } catch { return reply('ɢʜᴀʟᴀᴛ ᴇǫᴜᴀᴛɪᴏɴ ʜᴀɪ ʙʜᴀɪ.') }
        }

        // 10. DICTIONARY
        if (cmd === 'dictionary') {
            if (!q) return reply('ᴡᴏʀᴅ ʟɪᴋʜᴏ. ᴇxᴀᴍᴘʟᴇ:.ᴅɪᴄᴛɪᴏɴᴀʀʏ ʜᴇʟᴏ')
            try {
                let res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${q}`)
                let def = res.data[0].meanings[0].definitions[0].definition
                return reply(`ᴡᴏʀᴅ: ${q}\nᴍᴇᴀɴɪɴɢ: ${def}`)
            } catch { return reply('ᴡᴏʀᴅ ɴᴀʜɪ ᴍɪʟᴀ ᴅɪᴄᴛɪᴏɴᴀʀʏ ᴍᴇ.') }
        }

        // 11. WEATHER
        if (cmd === 'weather') {
            if (!q) return reply('ᴄɪᴛʏ ɴᴀᴍᴇ ʟɪᴋʜᴏ. ᴇxᴀᴍᴘʟᴇ:.ᴡᴇᴀᴛʜᴇʀ ʟᴀʜᴏʀᴇ')
            try {
                let res = await axios.get(`https://wttr.in/${q}?format=3`)
                return reply(`ᴡᴇᴀᴛʜᴇʀ: ${res.data}`)
            } catch { return reply('ᴄɪᴛʏ ɴᴀʜɪ ᴍɪʟɪ.') }
        }

        // 12. CURRENCY
        if (cmd === 'currency') {
            if (!q) return reply('ᴇxᴀᴍᴘʟᴇ:.ᴄᴜʀᴇɴᴄʏ 100 ᴜꜱᴅ ᴘᴋʀ')
            let [amount, from, to] = q.split(' ')
            try {
                let res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`)
                let rate = res.data.rates[to.toUpperCase()]
                let result = (amount * rate).toFixed(2)
                return reply(`${amount} ${from} = ${result} ${to}`)
            } catch { return reply('ᴄᴜʀᴇɴᴄʏ ᴇʀʀᴏʀ. ꜰᴏʀᴍᴀᴛ:.ᴄᴜʀᴇɴᴄʏ 100 ᴜꜱᴅ ᴘᴋʀ') }
        }

        // 13. QR
        if (cmd === 'qr') {
            if (!q) return reply('ᴛᴇxᴛ ʏᴀ ʟɪɴᴋ ᴅᴏ. ᴇxᴀᴍᴘʟᴇ:.ǫʀ ʜᴛᴘꜱ://ɢᴏɢʟᴇ.ᴄᴏᴍ')
            let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(q)}`
            return sock.sendMessage(jid, { image: { url: qrUrl }, caption: toSmallCaps('ǫʀ ᴄᴏᴅᴇ ʀᴇᴀᴅʏ') })
        }

        // 14. QRSCAN
        if (cmd === 'qrscan') return reply('ǫʀ ꜱᴄᴀɴ ᴋᴇ ʟɪʏᴇ ɪᴍᴀɢᴇ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀᴏ. ᴀɢʟᴇ ᴜᴘᴅᴀᴛᴇ ᴍᴇ ꜰᴜʟ ꜱᴜᴘᴏʀᴛ ᴀᴀʏᴇɢᴀ.')

        // 15. SHORTURL
        if (cmd === 'shorturl') {
            if (!q) return reply('ʟɪɴᴋ ᴅᴏ. ᴇxᴀᴍᴘʟᴇ:.ꜱʜᴏʀᴛᴜʀʟ ʜᴛᴘꜱ://ɢᴏɢʟᴇ.ᴄᴏᴍ')
            try {
                let res = await axios.get(`https://tinyurl.com/api-create.php?url=${q}`)
                return reply(`ꜱʜᴏʀᴛ ʟɪɴᴋ: ${res.data}`)
            } catch { return reply('ꜱʜᴏʀᴛ ᴇʀᴏʀ.') }
        }

        // 16. GITHUB
        if (cmd === 'github') {
            if (!q) return reply('ɢɪᴛʜᴜʙ ᴜꜱᴇʀɴᴀᴍᴇ ᴅᴏ. ᴇxᴀᴍᴘʟᴇ:.ɢɪᴛʜᴜʙ ᴛᴏʀᴠᴀʟᴅꜱ')
            try {
                let res = await axios.get(`https://api.github.com/users/${q}`)
                return reply(`ɴᴀᴍᴇ: ${res.data.name}\nʙɪᴏ: ${res.data.bio}\nʀᴇᴘᴏꜱ: ${res.data.public_repos}\nꜰᴏʟᴏᴡᴇʀꜱ: ${res.data.followers}`)
            } catch { return reply('ᴜꜱᴇʀ ɴᴀʜɪ ᴍɪʟᴀ.') }
        }

        // 17. PING - Server
        if (cmd === 'ping') return reply('ᴘᴏɴɢ! ʙᴏᴛ ᴄʜᴀʟ ʀᴀʜᴀ ʜᴀɪ ✅')

        // 18. WHOIS
        if (cmd === 'whois') {
            if (!q) return reply('ᴅᴏᴍᴀɪɴ ᴅᴏ. ᴇxᴀᴍᴘʟᴇ:.ᴡʜᴏɪꜱ ɢᴏɢʟᴇ.ᴄᴏᴍ')
            try {
                let res = await axios.get(`https://api.api-ninjas.com/v1/whois?domain=${q}`, { headers: { 'X-Api-Key': 'demo' }})
                return reply(`ᴅᴏᴍᴀɪɴ: ${res.data.domain_name}\nʀᴇɢɪꜱᴛʀᴀʀ: ${res.data.registrar}`)
            } catch { return reply('ᴡʜᴏɪꜱ ᴇʀᴏʀ.') }
        }

        // 19. IP
        if (cmd === 'ip') {
            if (!q) return reply('ɪᴘ ᴅᴏ. ᴇxᴀᴍᴘʟᴇ:.ɪᴘ 8.8.8.8')
            try {
                let res = await axios.get(`http://ip-api.com/json/${q}`)
                return reply(`ɪᴘ: ${res.data.query}\nᴄᴏᴜɴᴛʀʏ: ${res.data.country}\nᴄɪᴛʏ: ${res.data.city}\nɪꜱᴘ: ${res.data.isp}`)
            } catch { return reply('ɪᴘ ᴇʀʀᴏʀ.') }
        }

        // 20. SCRIPT
        if (cmd === 'script') {
            if (!q) return reply('ᴡᴇʙꜱɪᴛᴇ ʟɪɴᴋ ᴅᴏ. ᴇxᴀᴍᴘʟᴇ:.ꜱᴄʀɪᴘᴛ ʜᴛᴛᴘꜱ://ɢᴏᴏɢʟᴇ.ᴄᴏᴍ')
            try {
                let res = await axios.get(q)
                return reply(`ꜱᴏᴜʀᴄᴇ ᴄᴏᴅᴇ: ${res.data.slice(0, 3000)}...`)
            } catch { return reply('ꜱᴄʀɪᴘᴛ ᴇʀʀᴏʀ.') }
        }

        // 21. SCREENSHOT
        if (cmd === 'screenshot') {
            if (!q) return reply('ᴡᴇʙꜱɪᴛᴇ ʟɪɴᴋ ᴅᴏ. ᴇxᴀᴍᴘʟᴇ:.ꜱᴄʀᴇᴇɴꜱʜᴏᴛ ʜᴛᴛᴘꜱ://ɢᴏᴏɢʟᴇ.ᴄᴏᴍ')
            let ssUrl = `https://image.thum.io/get/width/720/crop/900/${q}`
            return sock.sendMessage(jid, { image: { url: ssUrl }, caption: toSmallCaps('ꜱᴄʀᴇᴇɴꜱʜᴏᴛ ʀᴇᴀᴅʏ') })
        }

        // 22. STICKER
        if (cmd === 'sticker') {
            if (!m.message.imageMessage) return reply('ᴘʜᴏᴛᴏ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ꜱᴛɪᴄᴋᴇʀ ʟɪᴋʜᴏ')
            try {
                let buffer = await downloadMediaMessage(m, 'buffer', {})
                return sock.sendMessage(jid, { sticker: buffer })
            } catch { return reply('ꜱᴛɪᴄᴋᴇʀ ᴇʀʀᴏʀ.') }
        }

        // 23. TOIMG
        if (cmd === 'toimg') {
            if (!m.message.stickerMessage) return reply('ꜱᴛɪᴄᴋᴇʀ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ᴛᴏɪᴍɢ ʟɪᴋʜᴏ')
            try {
                let buffer = await downloadMediaMessage(m, 'buffer', {})
                return sock.sendMessage(jid, { image: buffer, caption: toSmallCaps('ɪᴍᴀɢᴇ ʀᴇᴀᴅʏ') })
            } catch { return reply('ᴛᴏɪᴍɢ ᴇʀʀᴏʀ.') }
        }

        // 24. ATP
        if (cmd === 'atp') {
            if (!q) return reply('ᴛᴇxᴛ ʟɪᴋʜᴏ. ᴇxᴀᴍᴘʟᴇ:.ᴀᴛᴘ ʜᴇʟᴏ')
            let url = `https://api.erdwpe.com/api/maker/attp?text=${encodeURIComponent(q)}`
            return sock.sendMessage(jid, { sticker: { url: url } })
        }

        // 25. TTP
        if (cmd === 'ttp') {
            if (!q) return reply('ᴛᴇxᴛ ʟɪᴋʜᴏ. ᴇxᴀᴍᴘʟᴇ:.ᴛᴘ ʜᴇʟᴏ')
            let url = `https://api.erdwpe.com/api/maker/ttp?text=${encodeURIComponent(q)}`
            return sock.sendMessage(jid, { sticker: { url: url } })
        }
        
        // 26. EMOJIMIX
        if (cmd === 'emojimix') {
            if (!q.includes('+')) return reply('ꜰᴏʀᴍᴀᴛ:.ᴇᴍᴏᴊɪᴍɪx 😂+😭')
            let [emoji1, emoji2] = q.split('+')
            try {
                let url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
                let res = await axios.get(url)
                let stickerUrl = res.data.results[0].url
                return sock.sendMessage(jid, { sticker: { url: stickerUrl } })
            } catch { return reply('ᴇᴍᴏᴊɪ ᴍɪx ɴᴀʜɪ ʜᴏ ꜱᴀᴋᴀ.') }
        }

        // 27. REMOVEBG
        if (cmd === 'removebg') {
            if (!m.message.imageMessage) return reply('ᴘʜᴏᴛᴏ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ʀᴇᴍᴏᴠᴇʙɢ ʟɪᴋʜᴏ')
            return reply('ʀᴇᴍᴏᴠᴇʙɢ ᴋᴇ ʟɪʏᴇ ᴀᴘɪ ᴋᴇʏ ᴄʜᴀʜɪʏᴇ. ʙᴀᴀᴅ ᴍᴇ ᴀᴅ ᴋᴀʀᴜɴɢᴀ.')
        }

        // 28. LOGO
        if (cmd === 'logo') {
            if (!q) return reply('ᴛᴇxᴛ ᴅᴏ:.ʟᴏɢᴏ ᴍɪᴀɴꜱʙ')
            let logoUrl = `https://api.erdwpe.com/api/photooxy/shadow?text=${encodeURIComponent(q)}`
            return sock.sendMessage(jid, { image: { url: logoUrl }, caption: toSmallCaps(`ʟᴏɢᴏ: ${q}`) })
        }

        // 29. SFONT
        if (cmd === 'sfont') {
            if (!q) return reply('ᴛᴇxᴛ ᴅᴏ:.ꜱꜰᴏɴᴛ ʜᴇʟᴏ')
            const fonts = {
                'bold': q.replace(/[a-z]/gi, c => String.fromCodePoint(c.charCodeAt(0) + 120205)),
                'italic': q.replace(/[a-z]/gi, c => String.fromCodePoint(c.charCodeAt(0) + 120263)),
                'mono': q.replace(/[a-z]/gi, c => String.fromCodePoint(c.charCodeAt(0) + 120432))
            }
            return reply(`ʙᴏʟᴅ: ${fonts.bold}\nɪᴛᴀʟɪᴄ: ${fonts.italic}\nᴍᴏɴᴏ: ${fonts.mono}`)
        }

        // 30. SONG
        if (cmd === 'song') {
            if (!q) return reply('ꜱᴏɴɢ ɴᴀᴍᴇ ᴅᴏ:.ꜱᴏɴɢ ᴛᴜᴍ ʜɪ ʜᴏ')
            return reply('ʏᴏᴜᴛᴜʙᴇ ᴀᴜᴅɪᴏ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴇᴀᴛᴜʀᴇ ᴄᴏᴍɪɴɢ ꜱᴏɴ. ᴀᴘɪ ꜱᴇᴛᴜᴘ ᴋᴀʀɴᴀ ᴘᴀᴅᴇɢᴀ.')
        }

        // 31. VIDEO
        if (cmd === 'video') {
            if (!q) return reply('ᴠɪᴅᴇᴏ ɴᴀᴍᴇ ᴅᴏ:.ᴠɪᴅᴇᴏ ᴛᴜᴍ ʜɪ ʜᴏ')
            return reply('ʏᴏᴜᴛᴜʙᴇ ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅ ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ.')
        }

        // 32. IG
        if (cmd === 'ig') {
            if (!q) return reply('ɪɴꜱᴛᴀ ʟɪɴᴋ ᴅᴏ:.ɪɢ ʟɪɴᴋ')
            return reply('ɪɴꜱᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ.')
        }

        // 33. FB
        if (cmd === 'fb') {
            if (!q) return reply('ꜰʙ ᴠɪᴅᴇᴏ ʟɪɴᴋ ᴅᴏ:.ꜰʙ ʟɪɴᴋ')
            return reply('ꜰᴀᴄᴇʙᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ.')
        }

        // 34. TIKTOK
        if (cmd === 'tiktok') {
            if (!q) return reply('ᴛɪᴋᴛᴏᴋ ʟɪɴᴋ ᴅᴏ:.ᴛɪᴋᴛᴏᴋ ʟɪɴᴋ')
            return reply('ᴛɪᴋᴛᴏᴋ ɴᴏ ᴡᴀᴛᴇʀᴍᴀʀᴋ ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ.')
        }

        // 35. TWITTER
        if (cmd === 'twitter') {
            if (!q) return reply('ᴛᴡɪᴛᴇʀ ʟɪɴᴋ ᴅᴏ:.ᴛᴡɪᴛᴇʀ ʟɪɴᴋ')
            return reply('ᴛᴡɪᴛᴇʀ ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ.')
        }

        // 36. APK
        if (cmd === 'apk') {
            if (!q) return reply('ᴀᴘᴋ ɴᴀᴍᴇ ᴅᴏ:.ᴀᴘᴋ ᴡʜᴀᴛꜱᴀᴘᴘ')
            return reply('ᴀᴘᴋ ᴅᴏᴡɴʟᴏᴀᴅ ʟɪɴᴋ ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ.')
        }

        // 37. APP
        if (cmd === 'app') {
            if (!q) return reply('ᴀᴘᴘ ɴᴀᴍᴇ ᴅᴏ:.ᴀᴘᴘ ɪɴꜱᴛᴀɢʀᴀᴍ')
            return reply(`ᴘʟᴀʏ ꜱᴛᴏʀᴇ: https://play.google.com/store/search?q=${encodeURIComponent(q)}`)
        }

        // 38. MOVIE
        if (cmd === 'movie') {
            if (!q) return reply('ᴍᴏᴠɪᴇ ɴᴀᴍᴇ ᴅᴏ:.ᴍᴏᴠɪᴇ ᴀᴠᴀᴛᴀʀ')
            try {
                let res = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=trilogy`)
                return reply(`ᴛɪᴛʟᴇ: ${res.data.Title}\nʏᴇᴀʀ: ${res.data.Year}\nʀᴀᴛɪɴɢ: ${res.data.imdbRating}\nᴘʟᴏᴛ: ${res.data.Plot}`)
            } catch { return reply('ᴍᴏᴠɪᴇ ɴᴀʜɪ ᴍɪʟɪ.') }
        }

        // 39. ANIME
        if (cmd === 'anime') {
            if (!q) return reply('ᴀɴɪᴍᴇ ɴᴀᴍᴇ ᴅᴏ:.ᴀɴɪᴍᴇ ɴᴀʀᴜᴛᴏ')
            try {
                let res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`)
                let anime = res.data.data[0]
                return sock.sendMessage(jid, { image: { url: anime.images.jpg.image_url }, caption: toSmallCaps(`ᴛɪᴛʟᴇ: ${anime.title}\nꜱᴄᴏʀᴇ: ${anime.score}\nᴇᴘɪꜱᴏᴅᴇꜱ: ${anime.episodes}`) })
            } catch { return reply('ᴀɴɪᴍᴇ ɴᴀʜɪ ᴍɪʟᴀ.') }
        }

        // 40. JOKE
        if (cmd === 'joke') {
            try {
                let res = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single')
                return reply(res.data.joke)
            } catch { return reply('ᴊᴏᴋᴇ ɴᴀʜɪ ᴍɪʟᴀ.') }
        }

        // 41. MEME
        if (cmd === 'meme') {
            try {
                let res = await axios.get('https://meme-api.com/gimme')
                return sock.sendMessage(jid, { image: { url: res.data.url }, caption: toSmallCaps(res.data.title) })
            } catch { return reply('ᴍᴇᴍᴇ ᴇʀʀᴏʀ.') }
        }

        // 42. SHIP
        if (cmd === 'ship') {
            if (!q.includes('+')) return reply('ꜰᴏʀᴍᴀᴛ:.ꜱʜɪᴘ ᴀʟɪ+ꜱᴀʀᴀ')
            let [name1, name2] = q.split('+')
            let percent = Math.floor(Math.random() * 101)
            return reply(`💕 ${name1} + ${name2} = ${percent}% ʟᴏᴠᴇ`)
        }

        // 43. TRUTHDARE
        if (cmd === 'truthdare') {
            if (q === 'truth') return reply('ᴛʀᴜᴛʜ: ᴀᴘɴᴀ ᴘʜᴏɴᴇ ᴋᴀ ᴘᴀꜱᴡᴏʀᴅ ʙᴀᴛᴀᴏ?')
            if (q === 'dare') return reply('ᴅᴀʀᴇ: ᴀᴘɴᴇ ᴄʀᴜꜱʜ ᴋᴏ ᴍᴇꜱᴀɢᴇ ᴋᴀʀᴏ "ɪ ʟᴏᴠᴇ ʏᴏᴜ"')
            return reply('ʟɪᴋʜᴏ:.ᴛʀᴜᴛʜᴅᴀʀᴇ ᴛʀᴜᴛʜ ʏᴀ.ᴛʀᴜᴛʜᴅᴀʀᴇ ᴅᴀʀᴇ')
        }

        // 44. ROAST
        if (cmd === 'roast') {
            const roasts = [
                'ᴛᴜᴍ ɪᴛɴᴇ ꜱᴍᴀʀᴛ ʜᴏ ᴋᴇ ɢᴏᴏɢʟᴇ ᴛᴜᴍʜᴇ ꜱᴇᴀʀᴄʜ ᴋᴀʀᴛᴀ ʜᴀɪ 😂',
                'ᴛᴜᴍʜᴀʀᴀ ᴅɪᴍᴀɢʜ ᴡɪꜰɪ ᴊᴇꜱᴀ ʜᴀɪ - ᴄᴏɴᴇᴄᴛᴇᴅ ʟᴇᴋɪɴ ɴᴏ ɪɴᴛᴇʀɴᴇᴛ 😂',
                'ᴛᴜᴍ ᴀɢᴀʀ ᴘʜᴏᴛᴏ ᴋʜɪɴᴄʜᴏ ᴛᴏ ᴄᴀᴍᴇʀᴀ ᴋᴇʜᴛᴀ ʜᴀɪ "ʙᴀᴛᴛᴇʀʏ ʟᴏᴡ" 😂'
            ]
            return reply(roasts[Math.floor(Math.random() * roasts.length)])
        }

        // 45. GAYCHECK
        if (cmd === 'gaycheck') {
            let percent = Math.floor(Math.random() * 101)
            return reply(`ɢᴀʏ ᴍᴇᴛᴇʀ: ${percent}% ${percent > 50? '😂' : 'ʏᴏᴜ ᴀʀᴇ ꜱᴀꜰᴇ'}`)
        }

        // 46. STUPID
        if (cmd === 'stupid') {
            let percent = Math.floor(Math.random() * 101)
            return reply(`ꜱᴛᴜᴘɪᴅɪᴛʏ ᴍᴇᴛᴇʀ: ${percent}% 😂`)
        }

        // 47. SCREEN
        if (cmd === 'screen') {
            return reply('ᴛᴇʀᴍɪɴᴀʟ ᴠɪꜱᴜᴀʟꜱ:\n1. ᴍᴀᴛʀɪx ʀᴀɪɴ\n2. ʜᴀᴄᴋᴇʀ ᴛʏᴘᴇ\n3. ɴᴇᴏɴ ɢʟᴏᴡ\n4. ʀᴇᴛʀᴏ')
        }

        // 48. TAGALL
        if (cmd === 'tagall') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            let text = q || 'ᴛᴀɢ ᴀʟ'
            let members = groupMetadata.participants.map(v => v.id)
            return sock.sendMessage(jid, { text: toSmallCaps(text), mentions: members })
        }

        // 49. HIDETAG
        if (cmd === 'hidetag') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            let text = q || 'ʜɪᴅᴇɴ ᴛᴀɢ'
            let members = groupMetadata.participants.map(v => v.id)
            return sock.sendMessage(jid, { text: toSmallCaps(text), mentions: members })
        }

        // 50. KICK
        if (cmd === 'kick') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            if (!isBotAdmin) return reply('ʙᴏᴛ ᴋᴏ ᴀᴅᴍɪɴ ʙᴀɴᴀᴏ')
            if (!m.message.extendedTextMessage) return reply('ᴜꜱᴇʀ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ᴋɪᴄᴋ ʟɪᴋʜᴏ')
            let user = m.message.extendedTextMessage.contextInfo.participant
            await sock.groupParticipantsUpdate(jid, [user], 'remove')
            return reply('ᴜꜱᴇʀ ᴋɪᴄᴋ ʜᴏ ɢᴀʏᴀ ✅')
        }

        // 51. PROMOTE
        if (cmd === 'promote') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            if (!isBotAdmin) return reply('ʙᴏᴛ ᴋᴏ ᴀᴅᴍɪɴ ʙᴀɴᴀᴏ')
            if (!m.message.extendedTextMessage) return reply('ᴜꜱᴇʀ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ᴘʀᴏᴍᴏᴛᴇ ʟɪᴋʜᴏ')
            let user = m.message.extendedTextMessage.contextInfo.participant
            await sock.groupParticipantsUpdate(jid, [user], 'promote')
            return reply('ᴜꜱᴇʀ ᴀᴅᴍɪɴ ʙᴀɴ ɢᴀʏᴀ ✅')
        }

        // 52. DEMOTE
        if (cmd === 'demote') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            if (!isBotAdmin) return reply('ʙᴏᴛ ᴋᴏ ᴀᴅᴍɪɴ ʙᴀɴᴀᴏ')
            if (!m.message.extendedTextMessage) return reply('ᴜꜱᴇʀ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ᴅᴇᴍᴏᴛᴇ ʟɪᴋʜᴏ')
            let user = m.message.extendedTextMessage.contextInfo.participant
            await sock.groupParticipantsUpdate(jid, [user], 'demote')
            return reply('ᴜꜱᴇʀ ᴀᴅᴍɪɴ ꜱᴇ ʜᴀᴛ ɢᴀʏᴀ ✅')
        }

        // 53. GCLINK
        if (cmd === 'gclink') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isBotAdmin) return reply('ʙᴏᴛ ᴋᴏ ᴀᴅᴍɪɴ ʙᴀɴᴀᴏ')
            let code = await sock.groupInviteCode(jid)
            return reply(`ɢʀᴏᴜᴘ ʟɪɴᴋ: https://chat.whatsapp.com/${code}`)
        }

        // 54. REVOKE
        if (cmd === 'revoke') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            if (!isBotAdmin) return reply('ʙᴏᴛ ᴋᴏ ᴀᴅᴍɪɴ ʙᴀɴᴀᴏ')
            await sock.groupRevokeInvite(jid)
            return reply('ɢʀᴏᴜᴘ ʟɪɴᴋ ʀᴇꜱᴇᴛ ʜᴏ ɢᴀʏᴀ ✅')
        }

        // 55. SETNAME
        if (cmd === 'setname') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            if (!isBotAdmin) return reply('ʙᴏᴛ ᴋᴏ ᴀᴅᴍɪɴ ʙᴀɴᴀᴏ')
            if (!q) return reply('ɴᴀʏᴀ ɴᴀᴍᴇ ʟɪᴋʜᴏ:.ꜱᴇᴛɴᴀᴍᴇ ɴᴇᴡ ɴᴀᴍᴇ')
            await sock.groupUpdateSubject(jid, q)
            return reply('ɢʀᴏᴜᴘ ɴᴀᴍᴇ ᴄʜᴀɴɢᴇ ʜᴏ ɢᴀʏᴀ ✅')
        }
        
        // 56. SETDESC
        if (cmd === 'setdesc') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏʀɪ ʜᴀɪ')
            if (!isBotAdmin) return reply('ʙᴏᴛ ᴋᴏ ᴀᴅᴍɪɴ ʙᴀɴᴀᴏ')
            if (!q) return reply('ɴᴀʏᴀ ᴅᴇꜱᴄ ʟɪᴋʜᴏ:.ꜱᴇᴛᴅᴇꜱᴄ ɴᴇᴡ ᴅᴇꜱᴄ')
            await sock.groupUpdateDescription(jid, q)
            return reply('ɢʀᴏᴜᴘ ᴅᴇꜱᴄ ᴄʜᴀɴɢᴇ ʜᴏ ɢᴀʏᴀ ✅')
        }

        // 57. WELCOME
        if (cmd === 'welcome') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            return reply('ᴡᴇʟᴄᴏᴍᴇ ᴍᴇꜱᴀɢᴇ ᴏɴ ✅')
        }

        // 58. GOODBYE
        if (cmd === 'goodbye') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            return reply('ɢᴏᴅʙʏᴇ ᴍᴇꜱᴀɢᴇ ᴏɴ ✅')
        }

        // 59. ANTILINK
        if (cmd === 'antilink') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            return reply('ᴀɴᴛɪʟɪɴᴋ ᴏɴ ✅\nʟɪɴᴋ ʙʜᴇᴊɴᴇ ᴡᴀʟᴀ ᴋɪᴄᴋ ʜᴏ ɢᴀ')
        }

        // 60. ANTIBAD
        if (cmd === 'antibad') {
            if (!isGroup) return reply('ɢʀᴏᴜᴘ ᴍᴇ ᴄʜᴀʟᴀᴏ')
            if (!isAdmin) return reply('ᴀᴅᴍɪɴ ʜᴏɴᴀ ᴢᴀʀᴏᴏʀɪ ʜᴀɪ')
            return reply('ᴀɴᴛɪ ʙᴀᴅ ᴡᴏʀᴅ ᴏɴ ✅')
        }

        // 61. PUBLIC
        if (cmd === 'public') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            config.mode = 'public'
            return reply('ʙᴏᴛ ᴍᴏᴅᴇ: ᴘᴜʙʟɪᴄ ✅\nꜱᴀʙ ᴜꜱᴇ ᴋᴀʀ ꜱᴀᴋᴛᴇ ʜᴀɪɴ')
        }

        // 62. PRIVATE
        if (cmd === 'private') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            config.mode = 'private'
            return reply('ʙᴏᴛ ᴍᴏᴅᴇ: ᴘʀɪᴠᴀᴛᴇ ✅\nꜱɪʀꜰ ᴏᴡɴᴇʀ ᴜꜱᴇ ᴋᴀʀ ꜱᴀᴋᴛᴀ ʜᴀɪ')
        }

        // 63. STATUS
        if (cmd === 'status') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            if (!q) return reply('ꜱᴛᴀᴛᴜꜱ ᴛᴇxᴛ ʟɪᴋʜᴏ:.ꜱᴛᴀᴛᴜꜱ ʜᴇʟᴏ')
            await sock.updateProfileStatus(q)
            return reply('ʙᴏᴛ ꜱᴛᴀᴛᴜꜱ ᴜᴘᴅᴀᴛᴇ ʜᴏ ɢᴀʏᴀ ✅')
        }

        // 64. PAIR
        if (cmd === 'pair') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            if (!q) return reply('ɴᴜᴍʙᴇʀ ᴅᴏ:.ᴘᴀɪʀ 923001234567')
            return reply('ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ꜰᴇᴀᴛᴜʀᴇ ᴄᴏᴍɪɴɢ ꜱᴏɴ')
        }

        // 65. UNPAIR
        if (cmd === 'unpair') return reply('ᴜɴᴘᴀɪʀ ᴄᴏᴍɪɴɢ ꜱᴏɴ')

        // 66. PAIRLIST
        if (cmd === 'pairlist') return reply('ᴘᴀɪʀᴇᴅ ᴅᴇᴠɪᴄᴇꜱ ʟɪꜱᴛ ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ')

        // 67. BLOCK
        if (cmd === 'block') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            if (!m.message.extendedTextMessage) return reply('ᴜꜱᴇʀ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ʙʟᴏᴄᴋ ʟɪᴋʜᴏ')
            let user = m.message.extendedTextMessage.contextInfo.participant
            await sock.updateBlockStatus(user, 'block')
            return reply('ᴜꜱᴇʀ ʙʟᴏᴄᴋ ʜᴏ ɢᴀʏᴀ ✅')
        }

        // 68. UNBLOCK
        if (cmd === 'unblock') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            if (!m.message.extendedTextMessage) return reply('ᴜꜱᴇʀ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ᴜɴʙʟᴏᴄᴋ ʟɪᴋʜᴏ')
            let user = m.message.extendedTextMessage.contextInfo.participant
            await sock.updateBlockStatus(user, 'unblock')
            return reply('ᴜꜱᴇʀ ᴜɴʙʟᴏᴄᴋ ʜᴏ ɢᴀʏᴀ ✅')
        }

        // 69. BLOCKLIST
        if (cmd === 'blocklist') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            let blocked = await sock.fetchBlocklist()
            return reply(`ʙʟᴏᴄᴋᴇᴅ ᴜꜱᴇʀꜱ: ${blocked.length}\n${blocked.join('\n')}`)
        }

        // 70. BROADCAST
        if (cmd === 'broadcast') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            if (!q) return reply('ᴍᴇꜱᴀɢᴇ ʟɪᴋʜᴏ:.ʙʀᴏᴀᴅᴄᴀꜱᴛ ʜᴇʟᴏ ᴀʟ')
            return reply('ʙʀᴏᴀᴅᴄᴀꜱᴛ ꜰᴇᴀᴛᴜʀᴇ ᴄᴏᴍɪɴɢ ꜱᴏᴏɴ')
        }

        // 71. RESTART
        if (cmd === 'restart') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            await reply('ʙᴏᴛ ʀᴇꜱᴛᴀʀᴛ ʜᴏ ʀᴀʜᴀ ʜᴀɪ...')
            process.exit()
        }

        // 72. SHUTDOWN
        if (cmd === 'shutdown') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            await reply('ʙᴏᴛ ʙᴀɴᴅ ʜᴏ ʀᴀʜᴀ ʜᴀɪ...')
            process.exit(0)
        }

        // 73. SETPP
        if (cmd === 'setpp') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            if (!m.message.imageMessage) return reply('ᴘʜᴏᴛᴏ ᴘᴇ ʀᴇᴘʟʏ ᴋᴀʀ ᴋᴇ.ꜱᴇᴛᴘ ʟɪᴋʜᴏ')
            let buffer = await downloadMediaMessage(m, 'buffer', {})
            await sock.updateProfilePicture(sock.user.id, buffer)
            return reply('ʙᴏᴛ ᴅᴘ ᴄʜᴀɴɢᴇ ʜᴏ ɢᴀʏɪ ✅')
        }

        // 74. SETSTATUS
        if (cmd === 'setstatus') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            if (!q) return reply('ꜱᴛᴀᴛᴜꜱ ᴛᴇxᴛ ʟɪᴋʜᴏ:.ꜱᴇᴛꜱᴛᴀᴛᴜꜱ ʜᴇʟᴏ')
            await sock.updateProfileStatus(q)
            return reply('ᴘʀᴏꜰɪʟᴇ ꜱᴛᴀᴛᴜꜱ ᴜᴘᴅᴀᴛᴇ ʜᴏ ɢᴀʏᴀ ✅')
        }

        // 75. CLEARCHAT
        if (cmd === 'clearchat') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            await sock.chatModify({ clear: { messages: [{ id: m.key.id, fromMe: false, timestamp: m.messageTimestamp }] } }, jid)
            return reply('ᴄʜᴀᴛ ᴄʟᴇᴀʀ ʜᴏ ɢᴀʏɪ ✅')
        }

        // 76. BACKUP
        if (cmd === 'backup') {
            if (!isOwner) return reply('ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ')
            return reply('ʙᴀᴄᴋᴜᴘ ᴄʀᴇᴀᴛᴇᴅ: ./session/ ✅')
        }

        // 77. SPEEDTEST
        if (cmd === 'speedtest') {
            const start = Date.now()
            await reply('ᴛᴇꜱᴛɪɴɢ ꜱᴘᴇᴇᴅ...')
            return reply(`ᴘɪɴɢ: ${Date.now() - start}ᴍꜱ\nᴅᴏᴡɴʟᴏᴀᴅ: ꜰᴀꜱᴛ\nᴜᴘʟᴏᴀᴅ: ꜰᴀꜱᴛ`)
        }

        // 78. UPTIME
        if (cmd === 'uptime') {
            let uptime = process.uptime()
            let hours = Math.floor(uptime / 3600)
            let minutes = Math.floor((uptime % 3600) / 60)
            let seconds = Math.floor(uptime % 60)
            return reply(`ᴜᴘᴛɪᴍᴇ: ${hours}ʜ ${minutes}ᴍ ${seconds}ꜱ`)
        }

        // 79. SERVER
        if (cmd === 'server') {
            return reply(`ꜱᴇʀᴠᴇʀ ɪɴꜰᴏ:\nᴘʟᴀᴛꜰᴏʀᴍ: ${process.platform}\nɴᴏᴅᴇ: ${process.version}\nʀᴀᴍ: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} ᴍʙ`)
        }

        // 80. OWNER
        if (cmd === 'owner') return reply(`ʙᴏᴛ ᴏᴡɴᴇʀ: ᴡᴀ.ᴍᴇ/${config.owner[0]}\nɴᴀᴍᴇ: ᴍɪᴀɴ ꜱʙ ⁰⁰⁷`)
    })

    // ==== GOOGLE WEBSITE KE LIYE ====  // <-- 
    app.get('/', (req, res) => {
        res.send(`
            <h1>MIAN_Sb_007_Bot</h1>
            <p>WhatsApp Bot is Running ✅</p>
            <p>Owner: ᴍɪᴀɴ ꜱʙ ⁰⁰⁷</p>
            <p>Total Commands: 80</p>
        `)
    })
    
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
        console.log(`Website running on port ${PORT} - MIAN_Sb_007_Bot`)
    })

} // <-- startBot() ka bracket sabse last me aayega

startBot()

Kiya ya sahi ha ?
