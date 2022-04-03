const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const express = require('express')
const bodyParser = require('body-parser');
const webServer = express();
const isValidUrl = require('./src/utils/is_valid_url');
const cors = require('cors');
const axios = require('axios');

const ENABLE_CACHE= process.env.ENABLE_CACHE == 'true' || process.env.ENABLE_CACHE == 'TRUE'

//check cache folder
if(!fs.existsSync(path.join(__dirname,'cache'))) {
  fs.mkdirSync(path.join(__dirname,'cache'))
}

if(!fs.existsSync(path.join(__dirname,'cache/notification_lazynitip.json'))) {
  fs.writeFileSync(path.join(__dirname,'cache/notification_lazynitip.json'),JSON.stringify([]))
}

webServer.use(express.static('./src/public'))
webServer.use(bodyParser());
webServer.use(cors());
webServer.get('/', (req, res) => {
  res.json({
        status: 'healty',
        message: 'Don\'t worry, im healthy'
      });
})

webServer.post('/share/url',
(req, res, next) => {
  if(req.headers['x-api-key'] !== process.env.X_API_KEY) {
    return res.status(403).json({
      error_code: 'INVALID_API_KEY',
      message: 'Please enter valid api key'
    });
  }

  const url = req.body.url;

  if(!url) {
    return res.status(400).json({
      error_code: 'API_VALIDATION_ERROR',
      message: 'Url is required'
    });
  }

  if(!isValidUrl(url)) {
    return res.status(400).json({
      error_code: 'API_VALIDATION_ERROR',
      message: 'You must send a valid url'
    });
  }

  return next();
},
(req, res) => {
  const url = req.body.url;
  const textChannel = webServer.mahasiswaSantai.client.channels.cache.get(process.env.MEME_CHANNEL_ID);
  if(!textChannel) {
    res.status(404).json({
      error_code: 'TEXT_CHANNEL_NOT_FOUND',
      message: 'Cannot find particular text channel'
    });
  }

  textChannel.send(url);
  return res.json({
    url: url
  });


});

// have to be a json file
function writeCache(value, file) {
  const temp = JSON.parse(fs.readFileSync(path.join(__dirname, 'cache',file), 'utf-8'))
  temp.push(value)
  fs.writeFileSync(path.join(__dirname,'cache',file), JSON.stringify(temp))
}

webServer.get('/lazynitip/product', async (req, res, next) => {
  if(req.headers['x-api-key'] !== process.env.X_API_KEY) {
    return res.status(403).json({
      error_code: 'INVALID_API_KEY',
      message: 'Please enter valid api key'
    });
  }
  try {
    const keywords = [
      "ddr4",
      "rtx",
      "rx",
      "gtx",
    ]

    const fetchProfile = await axios.get("https://www.instagram.com/thelazytitip/?__a=1")
    const timeline = fetchProfile.data.graphql.user.edge_owner_to_timeline_media.edges
    const lastPost = timeline[19]
    const id = lastPost.node.id
    const caption = lastPost.node.edge_media_to_caption.edges[0].node.text
    const shortcode = lastPost.node.shortcode
    const cache = JSON.parse(fs.readFileSync(path.join(__dirname,"cache/notification_lazynitip.json")))
    const url = `https://www.instagram.com/p/${shortcode}`
    if (!cache.includes(id)) {
      for(let word of keywords){
        if (caption.includes(word[0])){
          const textChannel = webServer.mahasiswaSantai.client.channels.cache.get(process.env.GENERAL_CHANNEL_ID);
          textChannel.send(`Barang baru gan, silahkan check sebelum kehabisan <@${process.env.SUBSCRIBER_ID}>  ${url}`)
          if (ENABLE_CACHE) {
            writeCache(id, 'notification_lazynitip.json')
          }
          break
        }
      }
    }
    return res.json({url})
  } catch (e) {
    return res.status(500).json({
      error_code: 'SOMETHING_WRONG',
      message: 'We investigate the issue'
    })
  }

})

const BOT_TOKEN = process.env.BOT_TOKEN;

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandHandlers = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandHandlers) {
  const command = require(`./src/commands/${file}`);
  client.commands.set(command.name, command)
}

client.on('ready', async () => {
  const mahasiswaSantai = new Discord.Guild(client, { id: process.env.MAHASISWA_SANTAI_SERVER_ID})
  webServer.mahasiswaSantai = mahasiswaSantai;
  const PORT = process.env.PORT || 8081
  webServer.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})
  console.log('Bot is online!');
  client.user.setActivity('Everybody is a CELENG')
})

client.on('message', async (msg) => {
  try {
    if(msg.author.bot) return;
    if(msg.content.toLowerCase().includes('mantap')) {
      msg.channel.send({
        files: ['https://media.discordapp.net/attachments/300169651755941889/313669913187188747/dickhand.png?width=540&height=540']
      })
    }
    if(msg.content.includes(process.env.CELENG_ID)) {
      const celeng = new Discord.User(msg.client, { id: process.env.CELENG_ID });
      celeng.send(`DARI <@!${msg.author.id}> : ${msg.content}`);
    }
    if(!msg.content.startsWith('c!')) return;
    const command = msg.content.trim().split(' ')[1]
    let args = msg.content.trim().replace(/(c!+\s*\w+)\s/,'');
    args = args.replace(/(c!+\s*\w+)/, '');
    const handler = client.commands.get(command);
    if(handler) {
      return await handler.execute(msg, args);
    }
    return;
  } catch (e) {
    console.log(e);
    if(e.httpStatus === 403) {
      return message.reply('Please enable permission :(');
    }
    return msg.reply('Duh pusing, jadi error dah');
  }
})

client.login(BOT_TOKEN);
