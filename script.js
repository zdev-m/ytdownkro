let currentVideoUrl = '';
let selectedQuality = '720p';
let currentMode = 'video';

// Analyze video
async function analyzeVideo() {
  const urlInput = document.getElementById('videoUrl');
  const url = urlInput.value.trim();
  
  if (!url) {
    showToast('Please enter a YouTube URL', 'error');
    return;
  }
  
  currentVideoUrl = url;
  
  document.getElementById('inputSection').style.display = 'none';
  document.getElementById('loadingSection').style.display = 'block';
  
  try {
    const response = await fetch('/.netlify/functions/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentVideoUrl, action: 'analyze' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('videoTitle').textContent = data.title;
      document.getElementById('videoAuthor').textContent = data.author;
      document.getElementById('videoThumbnail').src = data.thumbnail;
      document.getElementById('viewCount').textContent = parseInt(data.views).toLocaleString();
      document.getElementById('durationBadge').textContent = data.duration;
      
      document.getElementById('loadingSection').style.display = 'none';
      document.getElementById('videoInfo').style.display = 'block';
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast(error.message, 'error');
    resetApp();
  }
}

// Start download
async function startDownload() {
  const downloadBtn = document.querySelector('.download-btn');
  const progressDiv = document.getElementById('downloadProgress');
  const percentSpan = document.getElementById('downloadPercent');
  
  downloadBtn.disabled = true;
  progressDiv.style.display = 'flex';
  percentSpan.style.display = 'inline';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    document.getElementById('downloadProgressFill').style.width = progress + '%';
    percentSpan.textContent = progress + '%';
    if (progress >= 90) clearInterval(interval);
  }, 300);
  
  try {
    const quality = currentMode === 'audio' ? 'audio' : selectedQuality;
    
    const response = await fetch('/.netlify/functions/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: currentVideoUrl, 
        action: 'download',
        quality: quality
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      clearInterval(interval);
      document.getElementById('downloadProgressFill').style.width = '100%';
      percentSpan.textContent = '100%';
      
      // Convert base64 to blob and download
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: currentMode === 'audio' ? 'audio/mpeg' : 'video/mp4' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${data.title}.${currentMode === 'audio' ? 'mp3' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      setTimeout(() => {
        document.getElementById('videoInfo').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
      }, 500);
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    clearInterval(interval);
    showToast('Download failed: ' + error.message, 'error');
    resetApp();
  } finally {
    downloadBtn.disabled = false;
    setTimeout(() => {
      progressDiv.style.display = 'none';
      percentSpan.style.display = 'none';
      document.getElementById('downloadProgressFill').style.width = '0%';
    }, 1000);
  }
}

// Select quality
function selectFormat(element, quality) {
  document.querySelectorAll('.format-card').forEach(card => {
    card.classList.remove('selected');
  });
  element.classList.add('selected');
  selectedQuality = quality;
}

// Switch tabs
function switchTab(type) {
  currentMode = type;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  if (type === 'video') {
    document.getElementById('videoFormats').style.display = 'grid';
    document.getElementById('audioFormats').style.display = 'none';
    selectedQuality = '720p';
    document.querySelector('#videoFormats .format-card').classList.add('selected');
  } else {
    document.getElementById('videoFormats').style.display = 'none';
    document.getElementById('audioFormats').style.display = 'grid';
    selectedQuality = 'audio';
    document.querySelector('#audioFormats .format-card').classList.add('selected');
  }
}

// Paste URL
async function pasteUrl() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('videoUrl').value = text;
    showToast('URL pasted!', 'success');
  } catch (err) {
    showToast('Could not paste', 'error');
  }
}

// Reset app
function resetApp() {
  document.getElementById('successMessage').style.display = 'none';
  document.getElementById('videoInfo').style.display = 'none';
  document.getElementById('inputSection').style.display = 'block';
  document.getElementById('videoUrl').value = '';
  currentVideoUrl = '';
}

// Show toast
function showToast(message, type) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  toastMessage.textContent = message;
  toast.classList.add('show');
  toast.style.background = type === 'error' ? '#dc2626' : '#10b981';
  setTimeout(() => {
    toast.classList.remove('show');
    toast.style.background = '#1f2937';
  }, 3000);
}
