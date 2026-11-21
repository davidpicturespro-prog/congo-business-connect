
const SUPABASE_URL = "https://pdnhqubbhkeibikkmbrb.supabase.co";
const SUPABASE_KEY = "sb_publishable_1oKoLQ9VIairdQJIrz0ROA_-tC4Lrhk";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const message = document.getElementById("adminMessage");
const container = document.getElementById("pendingBusinesses");

async function loadAdmin() {
    message.textContent = "Vérification de ton compte...";

    const { data: { user }, error: userError } =
        await client.auth.getUser();

    if (userError || !user) {
        message.textContent =
            "Connecte-toi d'abord sur la page principale.";
        return;
    }

    const { data: isAdmin, error: adminError } =
        await client.rpc("is_admin");

    if (adminError || !isAdmin) {
        message.textContent =
            "Accès refusé : compte administrateur requis.";
        return;
    }

    message.textContent = "Chargement des entreprises...";

    const { data: businesses, error } = await client
        .from("businesses")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        message.textContent =
            "Erreur : " + error.message;
        return;
    }

    container.replaceChildren();

    if (!businesses || businesses.length === 0) {
        message.textContent =
            "Aucune entreprise en attente de validation.";
        return;
    }

    message.textContent =
        businesses.length + " entreprise(s) en attente.";

    businesses.forEach((business) => {
        const card = document.createElement("article");
        card.className = "admin-card";

        const title = document.createElement("h3");
        title.textContent = business.name || "Sans nom";

        const details = document.createElement("p");
        details.textContent =
            "Catégorie : " + (business.category || "Non précisée") +
            " | Ville : " + (business.city || "Non précisée");

        const description = document.createElement("p");
        description.textContent =
            business.description || "Aucune description";

        const approve = document.createElement("button");
        approve.textContent = "Approuver";
        approve.className = "approve";

        const reject = document.createElement("button");
        reject.textContent = "Refuser";
        reject.className = "reject";

        approve.addEventListener("click", () => {
            updateStatus(business.id, "approved");
        });

        reject.addEventListener("click", () => {
            updateStatus(business.id, "rejected");
        });

        card.append(title, details, description, approve, reject);
        container.appendChild(card);
    });
}

async function updateStatus(id, status) {
    const confirmation = confirm(
        status === "approved"
            ? "Approuver cette entreprise ?"
            : "Refuser cette entreprise ?"
    );

    if (!confirmation) return;

    message.textContent = "Mise à jour en cours...";

    const { data, error } = await client
        .from("businesses")
        .update({ status })
        .eq("id", id)
        .eq("status", "pending")
        .select("id");

    if (error) {
        message.textContent =
            "Erreur : " + error.message;
        return;
    }

    if (!data || data.length === 0) {
        message.textContent =
            "Aucune modification effectuée.";
        return;
    }

    message.textContent =
        status === "approved"
            ? "Entreprise approuvée !"
            : "Entreprise refusée.";

    loadAdmin();
}

loadAdmin();
