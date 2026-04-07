const ytdl = require('ytdl-core');

exports.handler = async (event) => {
  const { url, format } = JSON.parse(event.body);
  
  if (!url || !ytdl.validateURL(url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid YouTube URL' })
    };
  }

  try {
    if (event.path.includes('/analyze')) {
      // Video info fetch karo
      const info = await ytdl.getInfo(url);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          title: info.videoDetails.title,
          author: info.videoDetails.author.name,
          thumbnail: info.videoDetails.thumbnails[0].url,
          views: info.videoDetails.viewCount,
          duration: formatDuration(info.videoDetails.lengthSeconds)
        })
      };
    } 
    else {
      // Download URL fetch karo
      const qualityMap = {
        '1080p': 'highest',
        '720p': 'highest',
        '480p': 'lowest',
        '360p': 'lowest',
        'mp3-320': 'audioonly',
        'mp3-192': 'audioonly',
        'mp3-128': 'audioonly'
      };
      
      const quality = qualityMap[format] || 'highest';
      const options = format.includes('mp3') ? { quality: 'lowestaudio' } : { quality };
      const info = await ytdl.getInfo(url);
      const videoFormat = ytdl.chooseFormat(info.formats, options);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          downloadUrl: videoFormat.url,
          title: info.videoDetails.title
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
