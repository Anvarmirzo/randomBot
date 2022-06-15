const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require('dotenv').config();
const {gameOptions, againOptions} = require('./options');

const app = express();
const port = process.env.PORT || 5000;
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});
app.use(express.json());

const chats = {};

const startGame = async (chatId) => {
	await bot.sendMessage(chatId, 'Now I will think of a number from 0 to 9, and you have to guess it');
	const number = Math.floor(Math.random() * 10);
	chats[chatId] = number;
	await bot.sendMessage(chatId, 'Cool! Now guess the number', gameOptions);
};

const start = async () => {
	await bot.setMyCommands([
		{command: '/start', description: 'Start the bot'},
		{command: '/me', description: 'Get info about my account'},
		{command: '/game', description: 'Start a game'}
	]);

// Matches "/echo [whatever]"
	bot.onText(/\/echo (.+)/, async (msg, match) => {
		const chatId = msg.chat.id;
		const resp = match[1];

		await bot.sendMessage(chatId, resp);
	});

	bot.on('message', async (msg) => {
		const chat = msg.chat;
		const author = msg.from;

		const chatId = chat.id;
		const text = msg.text;

		switch (text) {
			case '/start':
				return bot.sendMessage(chatId, `Hello ${author.username || author.first_name}!`);
			case '/me':
				return await bot.sendMessage(chatId, `Your id is ${author.id}
Your username is ${author.username || 'not set'}
Your nickname is ${author.first_name}
			`);
			case '/game':
				return startGame(chatId);
			default:
				return bot.sendMessage(chatId, 'Received your message');
		}
	});

	bot.on('callback_query', async (msg) => {
		const data = msg.data;
		const chatId = msg.message.chat.id;

		if (data === '/again') return startGame(chatId);

		if (+data === chats[chatId]) {
			return bot.sendMessage(chatId, 'Congrats! You guessed it!', againOptions);
		} else {
			return bot.sendMessage(chatId, 'unfortunately, you could not guess, I guessed the number ' + chats[chatId], againOptions);
		}
	});
};

app.get('/', (req, res) => {
	res.status(200).json({message: 'Hello from the Bot API.'});
});
// TELEGRAM WEBHOOK - https://core.telegram.org/bots/api#setwebhook
app.post(`/${process.env.BOT_TOKEN}`, (req, res) => {
	bot.processUpdate(req.body);
	res.status(200).json({message: 'ok'});
});


app.listen(port, async() => {
	await start();
	console.log(`\n\nServer running on port ${port}.\n\n`);
});
