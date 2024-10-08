const FOLDER_ID = '1Taf72Ce2WGV_XMtnBLRzmAZelWuG_NjR';
const API_KEY = 'AIzaSyCC0SvC3CQiDFStxQq0efuQvXFOILoAocs';

const imageGallery = document.getElementById('image-gallery');
const backgroundMusic = document.getElementById('background-music');
const playMusicBtn = document.getElementById('play-music');
const miniWindow = document.createElement('div');
miniWindow.id = 'mini-window';
document.body.appendChild(miniWindow);

function loadGoogleDriveAPI() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
        gapi.load('client', initClient);
    };
    document.body.appendChild(script);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    }).then(loadImages).catch(console.error);
}

function loadImages() {
    gapi.client.drive.files.list({
        q: `'${FOLDER_ID}' in parents and mimeType contains 'image/'`,
        fields: 'files(id, name, webContentLink)',
        orderBy: 'name'
    }).then(response => {
        const files = response.result.files;
        if (files && files.length > 0) {
            files.forEach((file, index) => {
                const imageItem = createImageItem(file, index);
                imageGallery.appendChild(imageItem);
            });
        }
    }).catch(console.error);
}

function createImageItem(file, index) {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    
    const directLink = file.webContentLink.replace('&export=download', '');
    const thumbnailLink = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`;
    
    imageItem.innerHTML = `
        <img src="${thumbnailLink}" alt="${file.name}" loading="lazy" data-full-img="${directLink}">
    `;
    
    imageItem.querySelector('img').addEventListener('click', () => openMiniWindow(directLink, file.name, file.id));
    
    return imageItem;
}

function openMiniWindow(imageUrl, caption, fileId) {
    miniWindow.innerHTML = `
        <div class="mini-window-content">
            <iframe src="https://drive.google.com/file/d/${fileId}/preview" width="640" height="480" allow="autoplay"></iframe>
            <p>${caption}</p>
            <a href="#" onclick="downloadImage('${imageUrl}', '${caption}'); return false;">Descargar</a>
            <button onclick="closeMiniWindow()">Cerrar</button>
        </div>
    `;
    miniWindow.style.display = 'block';
}

function closeMiniWindow() {
    miniWindow.style.display = 'none';
}

function downloadImage(imageUrl, fileName) {
    fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => console.error('Error al descargar la imagen:', error));
}

function playMusic() {
    backgroundMusic.play().then(() => {
        console.log('La música comenzó a reproducirse');
        playMusicBtn.style.display = 'none';
    }).catch((error) => {
        console.error('No se pudo reproducir la música automáticamente:', error);
        playMusicBtn.style.display = 'block';
    });
}

// Intentar reproducir la música en respuesta a varias interacciones del usuario
document.body.addEventListener('click', playMusic, { once: true });
document.body.addEventListener('touchstart', playMusic, { once: true });
document.body.addEventListener('keydown', playMusic, { once: true });

window.addEventListener('load', () => {
    // Intentar reproducir la música automáticamente al cargar la página
    playMusic();
    
    // Mantener el botón de reproducción por si falla la reproducción automática
    playMusicBtn.addEventListener('click', playMusic);
    
    loadGoogleDriveAPI();
});

// Intentar reproducir la música cuando la ventana obtiene el foco
window.addEventListener('focus', playMusic);

// Intentar reproducir la música periódicamente
setInterval(playMusic, 5000);
