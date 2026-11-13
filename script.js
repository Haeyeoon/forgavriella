
// ==================================
// GAVRIELLA BIRTHDAY WEBSITE
// SETTINGS
// ==================================

// Set to TRUE to preview the unlocked website.
// Set to FALSE to use the real countdown.
const PREVIEW_MODE = false;


// ==================================
// SUPABASE CONNECTION
// ==================================

const SUPABASE_URL = "https://nuadtflqavnqvulpegqu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MhWrr_lBzSjLs_S2_8uPEQ_MQ3OSJ0h";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase connected:", !!supabaseClient);

// Birthday unlock: November 13, 2026 at 9:00 PM WIB.
const unlockAt = new Date("2026-11-13T21:00:00+07:00").getTime();

const lockScreen = document.getElementById("lockScreen");
const birthdaySite = document.getElementById("birthdaySite");
const countdownMessage = document.getElementById("countdownMessage");

function updateCountdown() {
  if (PREVIEW_MODE) {
    lockScreen.classList.add("hidden");
    birthdaySite.classList.remove("hidden");
    return;
  }

  const remaining = unlockAt - Date.now();
  if (remaining <= 0) {
    lockScreen.classList.add("hidden");
    birthdaySite.classList.remove("hidden");
    document.title = "Happy Birthday, Gavriella!";
    return;
  }
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);


// ==================================
// SHARED SUPABASE GALLERY
// ==================================

const galleryGrid = document.getElementById("galleryGrid");
const imageCount = document.getElementById("imageCount");

const BUCKET_NAME = "gavriella-gallery";

// Display a message when the gallery is empty.
function showEmptyGallery() {
    galleryGrid.innerHTML = `
        <div class="empty-gallery">
            <span>❧</span>
            <p>Your favorite characters will look lovely here.</p>
            <small>The gallery is waiting for its first picture.</small>
        </div>
    `;
}

// Load pictures from Supabase.
async function loadGallery() {
    galleryGrid.innerHTML = "<p>Loading gallery...</p>";

    const { data, error } = await supabaseClient
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Gallery loading error:", error);
        galleryGrid.innerHTML = "<p>Couldn't load the gallery. Please try again.</p>";
        imageCount.textContent = "Gallery unavailable";
        return;
    }

    galleryGrid.innerHTML = "";

    if (!data.length) {
        showEmptyGallery();
        imageCount.textContent = "Your gallery is waiting";
        return;
    }

    imageCount.textContent =
        `${data.length} picture${data.length === 1 ? "" : "s"} in the gallery`;

    data.forEach(item => {
        const { data: imageData } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(item.storage_path);

        const card = document.createElement("div");
        card.className = "gallery-card";

        const img = document.createElement("img");
        img.src = imageData.publicUrl;
        img.alt = item.caption || "Favorite character";
        img.loading = "lazy";

        const caption = document.createElement("p");
        caption.textContent = item.caption || item.image_name;

        card.append(img, caption);
        galleryGrid.append(card);
    });
}



// Load the shared gallery when the website opens.
loadGallery();


// Envelope and letter reveal.
const envelopeButton = document.getElementById("envelopeButton");
const envelope = document.getElementById("envelope");
const letterContent = document.getElementById("letterContent");
envelopeButton.addEventListener("click", () => {
  envelope.classList.add("open");
  envelopeButton.setAttribute("aria-label", "Your birthday letter is open");
  setTimeout(() => {
    letterContent.classList.add("visible");
    letterContent.scrollIntoView({behavior: "smooth", block: "center"});
  }, 650);
});

// ==================================
// AUTOMATIC BACKGROUND MUSIC
// ==================================

const audio = document.getElementById("birthdayAudio");
const musicButton = document.getElementById("musicButton");

let musicStarted = false;

function updateMusicButton(isPlaying) {
    musicButton.innerHTML = isPlaying
        ? '♫ <span>Music on</span>'
        : '♫ <span>Music off</span>';

    musicButton.setAttribute("aria-pressed", String(isPlaying));
}

// Try to start music when the unlocked website opens.
async function startBackgroundMusic() {
    if (musicStarted) return;

    try {
        await audio.play();
        musicStarted = true;
        updateMusicButton(true);
    } catch (error) {
        console.log("Autoplay blocked. Waiting for visitor interaction.");
        musicButton.innerHTML = '♫ <span>Tap to play</span>';
    }
}

// Start automatically when the page loads.
if (!birthdaySite.classList.contains("hidden")) {
    startBackgroundMusic();
}

// If autoplay is blocked, the first interaction starts the music.
document.addEventListener("click", startBackgroundMusic, {
    once: true
});

// Music button: pause or resume.
musicButton.addEventListener("click", async () => {
    if (audio.paused) {
        try {
            await audio.play();
            musicStarted = true;
            updateMusicButton(true);
        } catch (error) {
            musicButton.innerHTML = '♫ <span>Tap to play</span>';
        }
    } else {
        audio.pause();
        updateMusicButton(false);
    }
});

// Keep the button accurate if playback ends or pauses.
audio.addEventListener("pause", () => updateMusicButton(false));
audio.addEventListener("play", () => updateMusicButton(true));


// ==================================
// SPARKLE CURSOR TRAIL
// ==================================

const sparkleTrail = document.getElementById("sparkle-trail");

const sparkleSymbols = ["✦", "✧", "⋆", "✨"];

let lastSparkleTime = 0;

document.addEventListener("mousemove", (event) => {
    const now = Date.now();

    // Prevent too many sparkles from appearing.
    if (now - lastSparkleTime < 45) return;

    lastSparkleTime = now;

    const sparkle = document.createElement("span");

    sparkle.className = "sparkle";
    sparkle.textContent =
        sparkleSymbols[Math.floor(Math.random() * sparkleSymbols.length)];

    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;

    sparkleTrail.appendChild(sparkle);

    // Remove sparkle after animation.
    setTimeout(() => {
        sparkle.remove();
    }, 800);
});