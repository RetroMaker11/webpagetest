const FOLDER_ID = "1Taf72Ce2WGV_XMtnBLRzmAZelWuG_NjR"
const API_KEY = "AIzaSyCC0SvC3CQiDFStxQq0efuQvXFOILoAocs"

const imageGallery = document.getElementById("image-gallery")
const backgroundMusic = document.getElementById("background-music")
const playMusicBtn = document.getElementById("play-music")
const miniWindow = document.createElement("div")
miniWindow.id = "mini-window"
document.body.appendChild(miniWindow)

const searchIcon = document.getElementById("search-icon")
const searchInput = document.getElementById("search-input")
const backButton = document.getElementById("back-button")
const muteButton = document.getElementById("mute-button")
const changeMusicButton = document.getElementById("change-music-button")
const favoritesButton = document.getElementById("favorites-button")
const favoritesSection = document.getElementById("favorites-section")
const favoritesGrid = document.getElementById("favorites-grid")

let allMedia = []
let isSearchActive = false
let isMuted = false
let currentMusicIndex = 0

const musicTracks = [
  "https://www.cjoint.com/doc/24_10/NJkhjyxKF6X_nintendo-wii-u-mii-maker-music-but-it-s-lofi-MP3-160K-.mp3",
  "https://www.cjoint.com/doc/25_01/OACqRFxFFFd_audio2.mp3",
  "https://www.cjoint.com/doc/25_01/OACqSxzOV0d_audio3.mp3",
  "https://www.cjoint.com/doc/25_01/OACqTkaXFSd_audio4.mp3",
]

function loadGoogleDriveAPI() {
  gapi.load("client", initClient)
}

function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    })
    .then(loadMedia)
    .catch(console.error)
}

function loadMedia() {
  gapi.client.drive.files
    .list({
      q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
      fields: "files(id, name, webContentLink, mimeType)",
      orderBy: "name",
      pageSize: 320,
    })
    .then((response) => {
      const files = response.result.files
      if (files && files.length > 0) {
        allMedia = files
        displayMedia(allMedia)
      }
    })
    .catch(console.error)
}

function displayMedia(media) {
  imageGallery.innerHTML = ""
  if (media.length === 0) {
    imageGallery.innerHTML = '<p id="no-results">No se han<br>encontrado resultados</p>'
    return
  }
  media.forEach((file, index) => {
    const mediaItem = createMediaItem(file, index)
    imageGallery.appendChild(mediaItem)
  })
  lazyLoadMedia()
  updateFavoriteIcons()
}

function createMediaItem(file, index) {
  const mediaItem = document.createElement("div")
  mediaItem.className = "image-item"

  const thumbnailLink = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`

  if (file.mimeType.startsWith("image/")) {
    mediaItem.innerHTML = `
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${thumbnailLink}" alt="${file.name}" loading="lazy" data-file-id="${file.id}">
            <i class="far fa-star favorite-icon" data-file-id="${file.id}"></i>
        `
  } else if (file.mimeType.startsWith("video/")) {
    mediaItem.innerHTML = `
            <video data-poster="${thumbnailLink}" preload="none" muted data-file-id="${file.id}"></video>
            <i class="far fa-star favorite-icon" data-file-id="${file.id}"></i>
        `
  }

  mediaItem
    .querySelector("img, video")
    .addEventListener("click", () => openMiniWindow(file.id, file.name, file.mimeType))
  mediaItem.querySelector(".favorite-icon").addEventListener("click", (e) => {
    e.stopPropagation()
    toggleFavorite(file.id)
  })

  return mediaItem
}

function lazyLoadMedia() {
  const mediaItems = document.querySelectorAll("img[data-src], video[data-poster]")
  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  }

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const mediaItem = entry.target
        if (mediaItem.tagName === "IMG") {
          mediaItem.src = mediaItem.dataset.src
        } else if (mediaItem.tagName === "VIDEO") {
          mediaItem.poster = mediaItem.dataset.poster
        }
        observer.unobserve(mediaItem)
      }
    })
  }, options)

  mediaItems.forEach((item) => observer.observe(item))
}

function openMiniWindow(fileId, caption, mimeType) {
  let mediaContent
  if (mimeType.startsWith("image/")) {
    mediaContent = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="640" height="480" allow="autoplay" allowfullscreen></iframe>`
  } else if (mimeType.startsWith("video/")) {
    mediaContent = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="640" height="480" allow="autoplay" allowfullscreen></iframe>`
  }

  const miniWindowContent = `
    <div class="mini-window-content">
      ${mediaContent}
      <p>${caption}</p>
      <a href="https://drive.google.com/uc?export=download&id=${fileId}" target="_blank" rel="noopener noreferrer">Descargar</a>
      <button onclick="closeMiniWindow()">Cerrar</button>
    </div>
  `

  if (favoritesSection.style.display === "block") {
    const favoriteMiniWindow = favoritesSection.querySelector(".mini-window") || document.createElement("div")
    favoriteMiniWindow.className = "mini-window"
    favoriteMiniWindow.innerHTML = miniWindowContent
    favoritesSection.appendChild(favoriteMiniWindow)
    favoriteMiniWindow.style.display = "block"
  } else {
    miniWindow.innerHTML = miniWindowContent
    miniWindow.style.display = "block"
  }
}

function closeMiniWindow() {
  if (favoritesSection.style.display === "block") {
    const favoriteMiniWindow = favoritesSection.querySelector(".mini-window")
    if (favoriteMiniWindow) {
      favoriteMiniWindow.style.display = "none"
    }
  } else {
    miniWindow.style.display = "none"
  }
}

function playMusic() {
  if (!isMuted) {
    backgroundMusic.volume = 0.3
    backgroundMusic
      .play()
      .then(() => {
        console.log("La música comenzó a reproducirse")
        playMusicBtn.style.display = "none"
      })
      .catch((error) => {
        console.error("No se pudo reproducir la música automáticamente:", error)
        playMusicBtn.style.display = "block"
      })
  }
}

function changeMusic() {
  currentMusicIndex = (currentMusicIndex + 1) % musicTracks.length
  backgroundMusic.src = musicTracks[currentMusicIndex]
  playMusic()
}

function performSearch() {
  const searchTerm = searchInput.value.toLowerCase()
  const filteredMedia = allMedia.filter((file) => file.name.toLowerCase().includes(searchTerm))
  displayMedia(filteredMedia)
  isSearchActive = true
  backButton.style.display = "block"
  history.pushState({ searchTerm }, "", `?search=${encodeURIComponent(searchTerm)}`)
}

function resetSearch() {
  searchInput.value = ""
  displayMedia(allMedia)
  isSearchActive = false
  backButton.style.display = "none"
  history.pushState(null, "", window.location.pathname)
}

function toggleMute() {
  isMuted = !isMuted
  if (isMuted) {
    backgroundMusic.pause()
    muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>'
  } else {
    playMusic()
    muteButton.innerHTML = '<i class="fas fa-volume-up"></i>'
  }
}

function toggleFavorite(fileId) {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || []
  const index = favorites.indexOf(fileId)

  if (index === -1) {
    favorites.push(fileId)
  } else {
    favorites.splice(index, 1)
  }

  localStorage.setItem("favorites", JSON.stringify(favorites))
  updateFavoriteIcons()

  if (favoritesSection.style.display === "block") {
    showFavorites()
  }
}

function updateFavoriteIcons() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || []
  document.querySelectorAll(".favorite-icon").forEach((icon) => {
    const fileId = icon.dataset.fileId
    if (favorites.includes(fileId)) {
      icon.classList.remove("far")
      icon.classList.add("fas")
    } else {
      icon.classList.remove("fas")
      icon.classList.add("far")
    }
  })
}

function showFavorites() {
  favoritesGrid.innerHTML = ""

  const favorites = JSON.parse(localStorage.getItem("favorites")) || []
  const favoriteItems = allMedia.filter((file) => favorites.includes(file.id))

  // Eliminar el botón "Atrás" existente si lo hay
  const existingBackButton = document.getElementById("favorites-back-button")
  if (existingBackButton) {
    existingBackButton.remove()
  }

  // Insertar el nuevo botón "Atrás"
  favoritesSection.insertAdjacentHTML(
    "beforeend",
    '<button id="favorites-back-button" class="back-button"><i class="fas fa-arrow-left"></i></button>',
  )
  document.getElementById("favorites-back-button").addEventListener("click", hideFavorites)

  if (favoriteItems.length === 0) {
    favoritesGrid.innerHTML = '<p class="no-favorites">No tienes<br>favoritos guardados</p>'
  } else {
    favoriteItems.forEach((file, index) => {
      const mediaItem = createMediaItem(file, index)
      favoritesGrid.appendChild(mediaItem)
    })
  }

  favoritesSection.style.display = "block"
  document.body.classList.add("body-no-scroll")
  lazyLoadMedia()
}

function hideFavorites() {
  favoritesSection.style.display = "none"
  const backButton = document.getElementById("favorites-back-button")
  if (backButton) {
    backButton.remove()
  }
  document.body.classList.remove("body-no-scroll")
  searchInput.classList.remove("active")
  // Cerrar la mini ventana si está abierta en la sección de favoritos
  const favoriteMiniWindow = favoritesSection.querySelector(".mini-window")
  if (favoriteMiniWindow) {
    favoriteMiniWindow.style.display = "none"
  }
}

window.addEventListener("load", () => {
  loadGoogleDriveAPI()
  playMusic()

  searchIcon.addEventListener("click", () => {
    searchInput.classList.toggle("active")
    if (searchInput.classList.contains("active")) {
      searchInput.focus()
    } else {
      resetSearch()
    }
  })

  searchInput.addEventListener("input", performSearch)
  backButton.innerHTML = '<i class="fas fa-arrow-left"></i>'
  backButton.addEventListener("click", () => {
    if (favoritesSection.style.display === "block") {
      hideFavorites()
    } else {
      resetSearch()
    }
  })
  muteButton.addEventListener("click", toggleMute)
  changeMusicButton.addEventListener("click", changeMusic)
  favoritesButton.addEventListener("click", showFavorites)
  playMusicBtn.addEventListener("click", playMusic)
})

window.addEventListener("focus", () => {
  if (!isMuted && backgroundMusic.paused) {
    playMusic()
  }
})

window.addEventListener("popstate", (event) => {
  if (isSearchActive) {
    resetSearch()
  }
})
      
