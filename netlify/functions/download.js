const ytdl = require('ytdl-core');

exports.handler = async (event) => {
  const videoUrl = event.queryStringParameters.url;

  if (!videoUrl || !ytdl.validateURL(videoUrl)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid URL' }) };
  }

  try {
    // Video ko stream karo aur buffer mein store karo
    const videoStream = ytdl(videoUrl, { quality: 'lowest' }); // chhoti quality
    const chunks = [];
    for await (const chunk of videoStream) chunks.push(chunk);
    const videoBuffer = Buffer.concat(chunks);

    // Base64 mein convert karo
    const base64Video = videoBuffer.toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: base64Video, title: 'video.mp4' })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
