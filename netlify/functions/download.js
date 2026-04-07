const ytdl = require('ytdl-core');

exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const videoUrl = body.url;
    const action = body.action;
    const quality = body.quality || '720p';

    if (!videoUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No URL provided' })
      };
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(videoUrl)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid YouTube URL' })
      };
    }

    // Get video info
    const info = await ytdl.getInfo(videoUrl);

    if (action === 'analyze') {
      // Return video information
      const videoDetails = info.videoDetails;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          title: videoDetails.title,
          author: videoDetails.author.name,
          thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
          views: videoDetails.viewCount,
          duration: formatDuration(videoDetails.lengthSeconds),
          videoId: videoDetails.videoId
        })
      };
    } 
    else if (action === 'download') {
      // Choose format based on quality
      let formatOptions = { quality: 'highest' };
      
      if (quality === '1080p') formatOptions = { quality: 'highest' };
      else if (quality === '720p') formatOptions = { quality: 'highest' };
      else if (quality === '480p') formatOptions = { quality: 'lowest' };
      else if (quality === '360p') formatOptions = { quality: 'lowest' };
      else if (quality === 'audio') formatOptions = { quality: 'lowestaudio' };

      const format = ytdl.chooseFormat(info.formats, formatOptions);
      
      // Get video stream as buffer
      const stream = ytdl(videoUrl, formatOptions);
      const chunks = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: base64,
          title: info.videoDetails.title,
          size: buffer.length
        })
      };
    }
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
