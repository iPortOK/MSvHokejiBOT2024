require('dotenv').config();
const { Client, EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, IntentsBitField } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.MessageContent,
    ],
    partials: [Partials.Channel],
});

let tym1, tym2;
let LOG_CHANNEL_ID;
const votedUsers = new Map();

client.on('ready', async () => {
    console.log(`${client.user.tag} je připraven`);
    client.user.setActivity('iPort', { type: ActivityType.Listening });

    const hlasovani = new SlashCommandBuilder()
        .setName('hlasovani')
        .setDescription('MS v hokeji - hlasování')
        .addChannelOption((option) => option
                .setName('kanal')
                .setDescription('Kanál pro zobrazení embedu')
                .setRequired(true)
        )
        .addStringOption((option) => option
                .setName('tym1')
                .setDescription('Tým 1:')
                .setRequired(true)
        )
        .addStringOption((option) => option
                .setName('tym2')
                .setDescription('Tým 2:')
                .setRequired(true)
        )
        .addChannelOption((option) =>
            option
                .setName('log')
                .setDescription('Kanál pro zobrazení logu')
                .setRequired(true)
        );

    client.application.commands.create(hlasovani);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || !interaction.inGuild()) return;

    const { commandName, options, member } = interaction;

    if (!member.roles.cache.some(role => role.name === 'EmtGen2')) {
        return interaction.reply('Nemáte oprávnění používat tento příkaz.');
    }

    if (commandName === 'hlasovani') {
        try {
            await interaction.deferReply();

            const selectedChannel = interaction.options.getChannel('kanal');
            const selectedLogChannel = options.getChannel('log');
            if (!selectedChannel) {
                return interaction.followUp('Prosím, vyberte kanál pro zobrazení soutěže.');
            }
            if (!selectedLogChannel) {
                return interaction.followUp('Prosím, vyberte kanál pro zobrazení logu.');
            }

            LOG_CHANNEL_ID = selectedLogChannel.id;

            tym1 = interaction.options.getString('tym1');
            tym2 = interaction.options.getString('tym2');

            const embed = new EmbedBuilder()
                .setColor(0xB42228)
                .setTitle(`${tym1} vs. ${tym2}`)
                .setDescription(`Tipni výsledek zápasu a vyhraj Zlatou hokejku!`);

            const confirm = new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('HLASOVAT')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder()
                .addComponents(confirm);

            await selectedChannel.send({ embeds: [embed], components: [row] });
            await interaction.editReply('Embed byl odeslán do zvolené místnosti.');
        } catch (error) {
            console.error('Chyba při odpovídání na interakci:', error);
        }
    }
});

client.on('interactionCreate', async (interaction) => {

    if (interaction.customId === 'confirm') {

        const messageId = interaction.message.id;

        if (votedUsers.has(interaction.user.id) && votedUsers.get(interaction.user.id) === messageId) {
            return interaction.reply({ content: 'Už jsi hlasoval(a) na tomto embedu!', ephemeral: true });
        }
        
        const modal = new ModalBuilder()
        .setCustomId('modal')
        .setTitle('Tipni si výsledek zápasu')

        const tymhlas1 = new TextInputBuilder()
            .setCustomId('tymhlas1')
            .setLabel(`${tym1}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(2);

        const tymhlas2 = new TextInputBuilder()
            .setCustomId('tymhlas2')
            .setLabel(`${tym2}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(2);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tymhlas1),
            new ActionRowBuilder().addComponents(tymhlas2),
        );

        interaction.showModal(modal);

        votedUsers.set(interaction.user.id, messageId);

        return;
    }
});

    client.on('interactionCreate', (interaction) => {
    if (interaction.customId === 'modal') {
        const hlas1 = interaction.fields.getTextInputValue('tymhlas1');
        const hlas2 = interaction.fields.getTextInputValue('tymhlas2');

        const numberRegex = /^\d+$/;
        if (!numberRegex.test(hlas1) || !numberRegex.test(hlas2)) {
            return interaction.reply({ content: 'Prosím, zadejte pouze čísla jako vstupní hodnoty.', ephemeral: true });
        }
    
                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const tvujhlas = new EmbedBuilder()
                        .setColor("#cc0000")
                        .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}` })
                        .setTitle(`si myslí, že zápas skončí takto:`)
                        .addFields(
                            { name: `${tym1}`, value: `${tym2}`, inline: true },
                            { name: `${hlas1}`, value: `${hlas2}`, inline: true }
                        );

                    logChannel.send({ embeds: [tvujhlas] });
                }

                interaction.reply({ content: 'Děkujeme za tvůj tip!', ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);
