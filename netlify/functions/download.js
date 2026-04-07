// netlify/functions/download.js
const ytdl = require('ytdl-core');

exports.handler = async (event) => {
  // 1. URL query parameter se video link lo
  const videoUrl = event.queryStringParameters.url;
  
  if (!videoUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No URL provided' })
    };
  }

  // 2. Validate YouTube URL
  if (!ytdl.validateURL(videoUrl)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid YouTube URL' })
    };
  }

  try {
    // 3. Video info fetch karo
    const info = await ytdl.getInfo(videoUrl);
    
    // 4. Sabse high quality video format chuno (with both video+audio)
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    
    // 5. Download URL return karo (Netlify direct video return nahi kar sakta, isliye sirf link)
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        title: info.videoDetails.title,
        downloadUrl: format.url,
        thumbnail: info.videoDetails.thumbnails[0].url
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
