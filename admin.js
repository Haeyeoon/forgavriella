
// ==================================
// GAVRIELLA BIRTHDAY — ADMIN PANEL
// ==================================

const SUPABASE_URL = "https://nuadtflqavnqvulpegqu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MhWrr_lBzSjLs_S2_8uPEQ_MQ3OSJ0h";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const BUCKET_NAME = "gavriella-gallery";

// HTML elements
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const adminImageInput = document.getElementById("adminImageInput");
const uploadMessage = document.getElementById("uploadMessage");
const adminGalleryGrid = document.getElementById("adminGalleryGrid");
const logoutButton = document.getElementById("logoutButton");

// ==================================
// LOGIN
// ==================================

loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    loginMessage.textContent = "Logging in...";

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        loginMessage.textContent = "Login failed: " + error.message;
        return;
    }

    loginMessage.textContent = "";
    await showDashboard();
});

// ==================================
// DASHBOARD
// ==================================

async function showDashboard() {
    loginSection.hidden = true;
    dashboard.hidden = false;

    await loadAdminGallery();
}

// Check whether an admin session already exists.
async function checkSession() {
    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        await showDashboard();
    }
}

// ==================================
// LOAD GALLERY
// ==================================

async function loadAdminGallery() {
    adminGalleryGrid.innerHTML = "<p>Loading pictures...</p>";

    const { data, error } = await supabaseClient
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        adminGalleryGrid.textContent = "Couldn't load pictures.";
        return;
    }

    adminGalleryGrid.innerHTML = "";

    if (!data.length) {
        adminGalleryGrid.textContent = "No pictures uploaded yet.";
        return;
    }

    data.forEach(item => {
        const { data: imageData } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(item.storage_path);

        const card = document.createElement("div");
        card.className = "gallery-card";

        const img = document.createElement("img");
        img.src = imageData.publicUrl;
        img.alt = item.caption || item.image_name;

        const caption = document.createElement("p");
        caption.textContent = item.caption || item.image_name;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete picture";

        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm("Delete this picture?");

            if (!confirmed) return;

            deleteButton.disabled = true;

            const { error: storageError } = await supabaseClient.storage
                .from(BUCKET_NAME)
                .remove([item.storage_path]);

            if (storageError) {
                alert("Couldn't delete the image: " + storageError.message);
                deleteButton.disabled = false;
                return;
            }

            const { error: databaseError } = await supabaseClient
                .from("gallery_images")
                .delete()
                .eq("id", item.id);

            if (databaseError) {
                alert("Image file deleted, but its gallery record couldn't be removed: " + databaseError.message);
                return;
            }

            await loadAdminGallery();
        });

        card.append(img, caption, deleteButton);
        adminGalleryGrid.append(card);
    });
}

// ==================================
// UPLOAD PICTURES
// ==================================

adminImageInput.addEventListener("change", async event => {
    const files = [...event.target.files]
        .filter(file => file.type.startsWith("image/"));

    if (!files.length) return;

    uploadMessage.textContent = "Uploading pictures...";

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        uploadMessage.textContent = "Please log in again.";
        return;
    }

    let successfulUploads = 0;

    for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error(uploadError);
            continue;
        }

        const { error: insertError } = await supabaseClient
            .from("gallery_images")
            .insert({
                image_name: file.name,
                caption: file.name.replace(/\.[^.]+$/, ""),
                storage_path: filePath,
                created_by: userData.user.id
            });

        if (insertError) {
            console.error(insertError);

            await supabaseClient.storage
                .from(BUCKET_NAME)
                .remove([filePath]);

            continue;
        }

        successfulUploads++;
    }

    uploadMessage.textContent =
        `${successfulUploads} picture(s) uploaded successfully!`;

    adminImageInput.value = "";

    await loadAdminGallery();
});

// ==================================
// LOG OUT
// ==================================

logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();

    dashboard.hidden = true;
    loginSection.hidden = false;

    loginForm.reset();
    loginMessage.textContent = "You have logged out.";
    adminGalleryGrid.innerHTML = "";
});

// Start
checkSession();
