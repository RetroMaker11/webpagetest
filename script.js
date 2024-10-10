const FOLDER_ID = '1Taf72Ce2WGV_XMtnBLRzmAZelWuG_NjR';
const API_KEY = 'AIzaSyCC0SvC3CQiDFStxQq0efuQvXFOILoAocs';

const imageGallery = document.getElementById('image-gallery');
const backgroundMusic = document.getElementById('background-music');
const playMusicBtn = document.getElementById('play-music');
const miniWindow = document.createElement('div');
miniWindow.id = 'mini-window';
document.body.appendChild(miniWindow);

const searchIcon = document.getElementById('search-icon');
const searchInput = document.getElementById('search-input');
const backButton = document.getElementById('back-button');
let allImages = [];
let isSearchActive = false;

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
            allImages = files;
            displayImages(allImages);
        }
    }).catch(console.error);
}

function displayImages(images) {
    imageGallery.innerHTML = '';
    if (images.length === 0) {
        imageGallery.innerHTML = '<p id="no-results">No se han encontrado resultados</p>';
        return;
    }
    images.forEach((file, index) => {
        const imageItem = createImageItem(file, index);
        imageGallery.appendChild(imageItem);
    });
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
            <a href="${imageUrl}" target="_blank" rel="noopener noreferrer">Abrir y Descargar</a>
            <button onclick="closeMiniWindow()">Cerrar</button>
        </div>
    `;
    miniWindow.style.display = 'block';
}

function closeMiniWindow() {
    miniWindow.style.display = 'none';
}

function playMusic() {
    backgroundMusic.volume = 0.3;
    backgroundMusic.play().then(() => {
        console.log('La música comenzó a reproducirse');
        playMusicBtn.style.display = 'none';
    }).catch((error) => {
        console.error('No se pudo reproducir la música automáticamente:', error);
        playMusicBtn.style.display = 'block';
    });
}

function performSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredImages = allImages.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
    );
    displayImages(filteredImages);
    isSearchActive = true;
    backButton.style.display = 'block';
    history.pushState({ searchTerm }, '', `?search=${encodeURIComponent(searchTerm)}`);
}

function resetSearch() {
    searchInput.value = '';
    displayImages(allImages);
    isSearchActive = false;
    backButton.style.display = 'none';
    history.pushState(null, '', window.location.pathname);
}

document.body.addEventListener('click', playMusic, { once: true });
document.body.addEventListener('touchstart', playMusic, { once: true });
document.body.addEventListener('keydown', playMusic, { once: true });

window.addEventListener('load', () => {
    playMusic();
    playMusicBtn.addEventListener('click', playMusic);
    loadGoogleDriveAPI();
    
    searchIcon.addEventListener('click', () => {
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        } else {
            resetSearch();
        }
    });

    searchInput.addEventListener('input', performSearch);

    backButton.addEventListener('click', resetSearch);

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.searchTerm) {
            searchInput.value = event.state.searchTerm;
            performSearch();
        } else {
            resetSearch();
        }
    });
});

window.addEventListener('focus', playMusic);

setInterval(playMusic, 5000);

// Manejar el botón "atrás" del navegador
window.addEventListener('popstate', function(event) {
    if (!isSearchActive) {
        return; // Si no hay búsqueda activa, no hacemos nada
    }
    resetSearch(); // Resetear la búsqueda y volver a la pantalla principal
});
