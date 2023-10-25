const { Events } = require('discord.js');
const { botIDs, embedColours } = require('../config')
const locale = require('../locale/en.json')
const SQLite = require("better-sqlite3");
const sql = new SQLite('./plugins/xp-plugin/xp.sqlite');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const client = interaction.client
        client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
        client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level);");

        function nFormatter(num, digits) {
            const lookup = [
                { value: 1, symbol: "" },
                { value: 1e3, symbol: "k" },
                { value: 1e6, symbol: "M" },
                { value: 1e9, symbol: "G" },
                { value: 1e12, symbol: "T" },
                { value: 1e15, symbol: "P" },
                { value: 1e18, symbol: "E" }
            ];

            const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
            var item = lookup.slice().reverse().find(function(item) {
                return num >= item.value;
            });

            return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
        }

        if(interaction.user.bot) {
            return;
        }

        if(interaction.guild.id === botIDs.guild) {
            let score;
            score = client.getScore.get(interaction.user.id, interaction.guild.id);

            if(!score) {
                score = { id: `${interaction.guild.id}-${interaction.user.id}`, user: interaction.user.id, guild: interaction.guild.id, points: 0, level: 0 };
            }

            const cooldowns = new Map();
            const cooldown = cooldowns.get(interaction.user.id);

            if(cooldown) {
                const remaining = humanizeDuration(cooldown - Datenow());
                return;
            }

            cooldowns.set(interaction.user.id, Date.now()+7000);
            setTimeout(() => cooldowns.delete(interaction.user.id, interaction.guild.id), 7000);

            //Points given can be anything from 1-10
            const oldLevel = score.level
            const pointsToAdd = Math.floor(Math.random() * 10) + 1;

            score.points+=pointsToAdd;
            const curLevel = Math.floor(0.1 * Math.sqrt(score.points));

            if(score.level < curLevel) {
                score.level = curLevel
                client.setScore.run(score);

                const embed = new EmbedBuilder()
                    .setDescription(locale.xp.levelUp.replace('{username}', interaction.user.displayName).replace('{points}', nFormatter(score.points, 2)).replace('{level}', nFormatter(score.level, 0)))
                    .setColour(embedColours.positive)
                    .setTimestamp()
                interaction.channel.send({ embeds: [embed] })
            } else {
                client.setScore.run(score);
            }
        }
    }
}
