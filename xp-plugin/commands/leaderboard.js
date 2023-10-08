const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, Message, ButtonStyle, SlashCommandBuilder } = require('discord.js')
const { embedColours, botIDs } = require('../config');
const SQLite = require("better-sqlite3");
const sql = new SQLite('./xp.sqlite');
const locale = require('../locale/en.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		/*.setNameLocalizations({
			pl: 'pies',
			de: 'hund',
		})*/
		.setDescription('Show the current top XP users.')
		/*.setDescriptionLocalizations({
			pl: 'Rasa psa',
			de: 'Hunderasse',
		})*/
		.setDMPermission(false)
		.addStringOption((option) =>
            option.setName('leaderboard')
			/*.setNameLocalizations({
				pl: 'pies',
				de: 'hund',
			})*/
            .setDescription('Which leaderboard did you wanna use?')
			/*.setDescriptionLocalizations({
				pl: 'Rasa psa',
				de: 'Hunderasse',
			})*/
            .setRequired(true)
            .addChoices(
                { name: 'Top 5', value: 'top5'},
                { name: 'Top 10', value: 'top10'},
                { name: 'Top 15', value: 'top15'},
                { name: 'Top 20', value: 'top20'},
				{ name: 'Top 25', value: 'top25'},
            )
        ),
	async execute(interaction) {
        const client = interaction.client
		const leaderboard = interaction.options.getString('leaderboard')

        const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
	    if (!table['count(*)']) {
	        sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER, level INTEGER);").run();
	        sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
	        sql.pragma("synchronous = 1");
	        sql.pragma("journal_mode = wal");
	    }
	    client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
        client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level);");

        let score;

        score = client.getScore.get(interaction.user.id, interaction.guild.id);

        if(!score) {
            score = { id: `${interaction.guild.id}-${interaction.user.id}`, user: interaction.user.id, guild: interaction.guild.id, points: 0, level: 0 };
        }

        const top5 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 5;").all(interaction.guild.id);
		const top10 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 10;").all(interaction.guild.id);
		const top15 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 15;").all(interaction.guild.id);
		const top20 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 20;").all(interaction.guild.id);
		const top25 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 25;").all(interaction.guild.id);
		let i = 1;

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

		const embed = new EmbedBuilder()
			.setColor(embedColours.main)

		if(leaderboard === 'top5') {
            embed.setTitle(locale.xp.leaderboardTitle.replace('{leaderboardType}', '5'))
            embed.setDescription(locale.xp.leaderboardDescription.replace('{leaderboardType}', '5'))

			for(const data of top5) {
				let user = interaction.guild.members.cache.get(data.user)	

                embed.addFields({ name: i.toString()+')', type: locale.xp.leaderboardFields.replace('{username}', data.user).replace('{points}', nFormatter(data.points, 2)).replace('{level}', nFormatter(data.level, 0)) })
				i++
			}
		}

		if(leaderboard === 'top10') {
			embed.setTitle(locale.xp.leaderboardTitle.replace('{leaderboardType}', '10'))
            embed.setDescription(locale.xp.leaderboardDescription.replace('{leaderboardType}', '10'))

			for(const data of top10) {
				let user = interaction.guild.members.cache.get(data.user)
	
				embed.addFields({ name: i.toString()+')', type: locale.xp.leaderboardFields.replace('{username}', data.user).replace('{points}', nFormatter(data.points, 2)).replace('{level}', nFormatter(data.level, 0)) })

				i++
			}
		}

		if(leaderboard === 'top15') {
			embed.setTitle(locale.xp.leaderboardTitle.replace('{leaderboardType}', '15'))
            embed.setDescription(locale.xp.leaderboardDescription.replace('{leaderboardType}', '15'))

			for(const data of top15) {
				let user = interaction.guild.members.cache.get(data.user)
				embed.addFields({ name: i.toString()+')', type: locale.xp.leaderboardFields.replace('{username}', data.user).replace('{points}', nFormatter(data.points, 2)).replace('{level}', nFormatter(data.level, 0)) })

				i++
			}
		}

		if(leaderboard === 'top20') {
			embed.setTitle(locale.xp.leaderboardTitle.replace('{leaderboardType}', '20'))
            embed.setDescription(locale.xp.leaderboardDescription.replace('{leaderboardType}', '20'))

			for(const data of top20) {
				let user = interaction.guild.members.cache.get(data.user)

				embed.addFields({ name: i.toString()+')', type: locale.xp.leaderboardFields.replace('{username}', data.user).replace('{points}', nFormatter(data.points, 2)).replace('{level}', nFormatter(data.level, 0)) })

				i++
			}
		}

		if(leaderboard === 'top25') {
			embed.setTitle(locale.xp.leaderboardTitle.replace('{leaderboardType}', '25'))
            embed.setDescription(locale.xp.leaderboardDescription.replace('{leaderboardType}', '25'))

			for(const data of top25) {
				let user = interaction.guild.members.cache.get(data.user)
				embed.addFields({ name: i.toString()+')', type: locale.xp.leaderboardFields.replace('{username}', data.user).replace('{points}', nFormatter(data.points, 2)).replace('{level}', nFormatter(data.level, 0)) })

				i++
			}
		}

	  	return interaction.reply({ embeds: [embed] });
	}
};