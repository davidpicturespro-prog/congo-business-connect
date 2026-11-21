
const SUPABASE_URL = "COLLE_ICI_TON_URL_SUPABASE";
const SUPABASE_KEY = "COLLE_ICI_TA_CLE_PUBLISHABLE";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function loadBusinessDetails() {
    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("id");

    const name = document.getElementById("businessName");
    const category = document.getElementById("businessCategory");
    const city = document.getElementById("businessCity");
    const description = document.getElementById("businessDescription");
    const whatsapp = document.getElementById("whatsappButton");

    if (!businessId) {
        name.textContent = "Commerce introuvable";
        return;
    }

    const { data, error } = await client
        .from("businesses")
        .select("id, name, category, description, city, phone")
        .eq("id", businessId)
        .eq("status", "approved")
        .maybeSingle();

    if (error || !data) {
        name.textContent = "Commerce introuvable";
        description.textContent =
            "Ce commerce n'existe pas ou n'est pas disponible.";
        return;
    }

    name.textContent = data.name || "Sans nom";
    category.textContent = data.category || "";
    city.textContent = "📍 " + (data.city || "Ville non précisée") + ", RDC";
    description.textContent = data.description || "Aucune description disponible.";

    if (data.phone) {
        whatsapp.href =
            "https://wa.me/" + data.phone.replace(/\D/g, "");
        whatsapp.hidden = false;
    }
}

loadBusinessDetails();
