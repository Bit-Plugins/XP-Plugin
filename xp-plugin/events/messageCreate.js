const { Events } = require('discord.js');
const { botIDs, embedColours } = require('../config')
const locale = require('../locale/en.json')
const SQLite = require("better-sqlite3");
const sql = new SQLite('./plugins/xp-plugin/xp.sqlite');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        const client = message.client
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

        if(message.author.bot) {
            return;
        }

        if(message.guild.id === botIDs.guild) {
            let score;
            score = client.getScore.get(message.author.id, message.guild.id);

            if(!score) {
                score = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, points: 0, level: 0 };
            }

            const cooldowns = new Map();
            const cooldown = cooldowns.get(message.author.id);

            if(cooldown) {
                const remaining = humanizeDuration(cooldown - Datenow());
                return;
            }

            cooldowns.set(message.author.id, Date.now()+7000);
            setTimeout(() => cooldowns.delete(message.author.id, message.guild.id), 7000);

            //Points given can be anything from 1-10
            const oldLevel = score.level
            const pointsToAdd = Math.floor(Math.random() * 10) + 1;

            score.points+=pointsToAdd;
            const curLevel = Math.floor(0.1 * Math.sqrt(score.points));

            if(score.level < curLevel) {
                score.level = curLevel
                client.setScore.run(score);

                const embed = new EmbedBuilder()
                    .setDescription(locale.xp.levelUp.replace('{username}', message.author.displayName).replace('{points}', nFormatter(score.points, 2)).replace('{level}', nFormatter(score.level, 0)))
                    .setColour(embedColours.positive)
                    .setTimestamp()
                message.reply({ embeds: [embed] })
            } else {
                client.setScore.run(score);
            }
        }
    }
}
