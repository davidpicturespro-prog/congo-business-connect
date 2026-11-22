
const SUPABASE_URL = "https://pdnhqubbhkeibikkmbrb.supabase.co";
const SUPABASE_KEY = "";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let currentBusiness = null;

async function loadBusinessDetails() {
    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("id");

    const name = document.getElementById("businessName");
    const category = document.getElementById("businessCategory");
    const city = document.getElementById("businessCity");
    const description = document.getElementById("businessDescription");
    const whatsapp = document.getElementById("whatsappButton");
    const uploadSection = document.getElementById("imageUploadSection");

    if (!businessId) {
        name.textContent = "Commerce introuvable";
        return;
    }

    const { data, error } = await client
        .from("businesses")
        .select("id, name, category, description, city, phone, owner_id, logo_url, gallery_urls")
        .eq("id", businessId)
        .eq("status", "approved")
        .maybeSingle();

    if (error || !data) {
        name.textContent = "Commerce introuvable";
        description.textContent = "Ce commerce n'existe pas ou n'est pas disponible.";
        console.error(error);
        return;
    }

    currentBusiness = data;

    name.textContent = data.name || "Sans nom";
    category.textContent = data.category || "";
    city.textContent = "📍 " + (data.city || "Ville non précisée") + ", RDC";
    description.textContent = data.description || "Aucune description disponible.";

    if (data.phone) {
        whatsapp.href = "https://wa.me/" + data.phone.replace(/\D/g, "");
        whatsapp.hidden = false;
    }

    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;

    if (user && user.id === data.owner_id) {
        uploadSection.hidden = false;
    }

    displayBusinessImages(data);
}

function displayBusinessImages(business) {
    let section = document.getElementById("businessImagesSection");

    if (!section) {
        section = document.createElement("section");
        section.id = "businessImagesSection";
        section.className = "admin-card";

        const heading = document.createElement("h2");
        heading.textContent = "Photos de l'entreprise";

        const container = document.createElement("div");
        container.id = "businessImages";

        section.appendChild(heading);
        section.appendChild(container);

        document.querySelector("main").appendChild(section);
    }

    const container = document.getElementById("businessImages");
    container.replaceChildren();

    if (business.logo_url) {
        const logoTitle = document.createElement("h3");
        logoTitle.textContent = "Logo";
        container.appendChild(logoTitle);

        const logo = document.createElement("img");
        logo.src = business.logo_url;
        logo.alt = "Logo de " + business.name;
        logo.style.maxWidth = "180px";
        logo.style.maxHeight = "180px";
        container.appendChild(logo);
    }

    if (business.gallery_urls && business.gallery_urls.length > 0) {
        const galleryTitle = document.createElement("h3");
        galleryTitle.textContent = "Galerie photos";
        container.appendChild(galleryTitle);

        business.gallery_urls.forEach(function(url) {
            const img = document.createElement("img");
            img.src = url;
            img.alt = "Photo de " + business.name;
            img.style.maxWidth = "220px";
            img.style.maxHeight = "180px";
            img.style.margin = "8px";
            container.appendChild(img);
        });
    }
}

async function uploadImage(file, businessId, prefix) {
    if (!file.type.startsWith("image/")) {
        throw new Error("Choisis uniquement des fichiers image.");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("Chaque image doit faire moins de 5 Mo.");
    }

    const extension = file.name.split(".").pop().replace(/[^a-zA-Z0-9]/g, "");
    const filePath = businessId + "/" + prefix + "-" + Date.now() + "." + extension;

    const { error } = await client.storage
        .from("business-images")
        .upload(filePath, file);

    if (error) {
        throw error;
    }

    const { data } = client.storage
        .from("business-images")
        .getPublicUrl(filePath);

    return data.publicUrl;
}

async function saveBusinessImages() {
    const message = document.getElementById("uploadMessage");
    const button = document.getElementById("uploadImagesButton");
    const logoFile = document.getElementById("logoFile").files[0];
    const galleryFiles = Array.from(
        document.getElementById("galleryFiles").files
    );

    if (!currentBusiness) {
        message.textContent = "Commerce introuvable.";
        return;
    }

    if (!logoFile && galleryFiles.length === 0) {
        message.textContent = "Choisis au moins une image.";
        return;
    }

    button.disabled = true;
    message.textContent = "Envoi des images en cours...";

    try {
        const updates = {};

        if (logoFile) {
            updates.logo_url = await uploadImage(
                logoFile,
                currentBusiness.id,
                "logo"
            );
        }

        if (galleryFiles.length > 0) {
            const newUrls = [];

            for (const file of galleryFiles) {
                const url = await uploadImage(
                    file,
                    currentBusiness.id,
                    "photo"
                );
                newUrls.push(url);
            }

            updates.gallery_urls = [
                ...(currentBusiness.gallery_urls || []),
                ...newUrls
            ];
        }

        const { error } = await client
            .from("businesses")
            .update(updates)
            .eq("id", currentBusiness.id)
            .eq("owner_id", currentBusiness.owner_id);

        if (error) {
            throw error;
        }

        currentBusiness = {
            ...currentBusiness,
            ...updates
        };

        displayBusinessImages(currentBusiness);

        document.getElementById("logoFile").value = "";
        document.getElementById("galleryFiles").value = "";

        message.textContent = "Images enregistrées avec succès !";

    } catch (error) {
        console.error("Erreur images :", error);
        message.textContent = "Erreur : " + error.message;
    } finally {
        button.disabled = false;
    }
}

document
    .getElementById("uploadImagesButton")
    .addEventListener("click", saveBusinessImages);

loadBusinessDetails();
