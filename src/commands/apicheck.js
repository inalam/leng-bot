const axios = require('axios');
module.exports = {
  name: 'apicheck',
  description: 'is TLT Instagram API okay?',
  execute: async (message) => {
      const tag = `<@303900226240905216>`;
      try {

        const fetchProfile = await axios.get("https://www.instagram.com/thelazytitip/channel/?__a=1&__d=dis", {
            headers: {
                "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36 Edg/103.0.1264.49",
                Cookie: process.env.INSTAGRAM_COOKIE
            },
            withCredentials: true
        })
        const timeline = fetchProfile.data.graphql.user.edge_owner_to_timeline_media.edges

        if(timeline) {
         return await message.channel.send(`All is good ${tag}`)
        }
      } catch (e) {
        console.log(e,"\nPlease renew your instagram cookies.")
        const report = client.channels.cache.get(process.env.GENERAL_CHANNEL_ID);
        await report.send('Please renew <@303900226240905216> instagram cookies.')
        throw e;
      }
  }
}