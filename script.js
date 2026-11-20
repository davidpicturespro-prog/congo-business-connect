
document.addEventListener("DOMContentLoaded", async function () {

    // CONFIGURATION SUPABASE
    const SUPABASE_URL = "https://pdnhqubbhkeibikkmbrb.supabase.co";
    const SUPABASE_KEY = "sb_publishable_1oKoLQ9VIairdQJIrz0ROA_-tC4Lrhk";

    const message = document.getElementById("accountMessage");

    function showMessage(text, error = false) {
        message.textContent = text;
        message.style.color = error ? "#b42318" : "#087443";
    }

    if (!window.supabase) {
        showMessage("Bibliothèque Supabase non chargée.", true);
        return;
    }

    if (
        SUPABASE_URL.includes("COLLE_") ||
        SUPABASE_KEY.includes("COLLE_")
    ) {
        showMessage("Ajoute tes deux clés Supabase.", true);
        return;
    }

    const client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    let currentUser = null;

    const authArea = document.getElementById("authArea");
    const businessArea = document.getElementById("businessArea");
    const userEmail = document.getElementById("userEmail");

    // AFFICHER LES COMMERCES
    async function loadBusinesses() {
        const list = document.getElementById("businessList");
        const noResults = document.getElementById("noResults");

        list.replaceChildren();

        const { data, error } = await client
            .from("businesses")
            .select("id, name, category, description, city, phone")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            noResults.textContent = "Erreur : " + error.message;
            noResults.hidden = false;
            return;
        }

        if (!data || data.length === 0) {
            noResults.textContent =
                "Aucun commerce disponible pour le moment.";
            noResults.hidden = false;
            return;
        }

        noResults.hidden = true;

        data.forEach(function (business) {
            const card = document.createElement("article");
            card.className = "business-card";

            const title = document.createElement("h3");
            title.textContent = business.name;

            const category = document.createElement("p");
            category.className = "business-type";
            category.textContent = business.category;

            const description = document.createElement("p");
            description.textContent = business.description || "";

            const city = document.createElement("p");
            city.textContent = "📍 " + business.city + ", RDC";

            card.append(title, category, description, city);

            if (business.phone) {
                const link = document.createElement("a");
                link.href =
                    "https://wa.me/" +
                    business.phone.replace(/\D/g, "");
                link.textContent = "Contacter sur WhatsApp";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.className = "business-button";
                card.appendChild(link);
            }

            list.appendChild(card);
        });
    }

    // AFFICHER MES COMMERCES
    async function loadMyBusinesses() {
        const container = document.getElementById("myBusinesses");
        container.replaceChildren();

        const { data, error } = await client
            .from("businesses")
            .select("id, name, category, city, status")
            .eq("owner_id", currentUser.id)
            .order("created_at", { ascending: false });

        if (error) {
            container.textContent = "Erreur : " + error.message;
            return;
        }

        if (!data || data.length === 0) {
            container.textContent =
                "Tu n'as pas encore enregistré d'entreprise.";
            return;
        }

        data.forEach(function (business) {
            const item = document.createElement("p");

            item.textContent =
                business.name + " — " +
                business.city + " — " +
                (business.status === "approved"
                    ? "Approuvée"
                    : "En attente de validation");

            container.appendChild(item);
        });
    }

    // INTERFACE
    async function updateInterface(user) {
        currentUser = user;
        authArea.hidden = !!user;
        businessArea.hidden = !user;

        if (user) {
            userEmail.textContent = "Connecté : " + user.email;
            await loadMyBusinesses();
        }
    }

    const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

    if (sessionError) {
        showMessage(sessionError.message, true);
    }

    await updateInterface(sessionData.session?.user || null);

    client.auth.onAuthStateChange(function (_event, session) {
        currentUser = session?.user || null;
        authArea.hidden = !!currentUser;
        businessArea.hidden = !currentUser;

        if (currentUser) {
            userEmail.textContent = "Connecté : " + currentUser.email;
            loadMyBusinesses();
        }
    });

    await loadBusinesses();

// MOT DE PASSE OUBLIE
document.getElementById("forgotPasswordBtn")
    .addEventListener("click", function () {
        document.getElementById("resetEmail").value =
            document.getElementById("loginEmail").value;

        document.getElementById("resetPasswordForm").hidden = false;

        showMessage("Entre ton adresse e-mail pour recevoir un lien.");
    });

document.getElementById("resetPasswordForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const email =
            document.getElementById("resetEmail").value.trim();

        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: "https://congo-business-connect.vercel.app"
        });

        if (error) {
            showMessage(error.message, true);
            return;
        }

        showMessage("Lien de réinitialisation envoyé. Vérifie ton e-mail !");
    });

 // ENREGISTRER LE NOUVEAU MOT DE PASSE
document.getElementById("newPasswordForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const password =
            document.getElementById("newPassword").value;

        const { error } = await client.auth.updateUser({
            password: password
        });

        if (error) {
            showMessage(error.message, true);
            return;
        }

        showMessage("Mot de passe modifié avec succès !");

        document.getElementById("newPasswordForm").hidden = true;
        document.getElementById("loginForm").hidden = false;
    });

    // INSCRIPTION
    document.getElementById("signupForm")
        .addEventListener("submit", async function (event) {
            event.preventDefault();

            const email =
                document.getElementById("signupEmail").value.trim();
            const password =
                document.getElementById("signupPassword").value;

            showMessage("Création du compte en cours...");

            const { data, error } = await client.auth.signUp({
                email,
                password
            });

            if (error) {
                showMessage(error.message, true);
                return;
            }

            if (data.session) {
                await updateInterface(data.user);
                showMessage("Compte créé avec succès !");
            } else {
                showMessage(
                    "Compte créé ! Consulte ton e-mail pour confirmer."
                );
            }
        });

    // CONNEXION
    document.getElementById("loginForm")
        .addEventListener("submit", async function (event) {
            event.preventDefault();

            const email =
                document.getElementById("loginEmail").value.trim();
            const password =
                document.getElementById("loginPassword").value;

            showMessage("Connexion en cours...");

            const { data, error } =
                await client.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                showMessage(error.message, true);
                return;
            }

            await updateInterface(data.user);
            showMessage("Connexion réussie !");
        });

    // ENREGISTRER UN COMMERCE
    document.getElementById("businessForm")
        .addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!currentUser) {
                showMessage("Connecte-toi d'abord.", true);
                return;
            }

            const business = {
                owner_id: currentUser.id,
                name: document.getElementById("businessName").value.trim(),
                category: document.getElementById("businessCategory").value,
                city: document.getElementById("businessCity").value.trim(),
                phone: document.getElementById("businessPhone").value.trim(),
                description:
                    document.getElementById("businessDescription").value.trim()
            };

            showMessage("Enregistrement en cours...");

            const { error } = await client
                .from("businesses")
                .insert(business);

            if (error) {
                showMessage(error.message, true);
                return;
            }

            document.getElementById("businessForm").reset();

            showMessage(
                "Commerce enregistré ! En attente de validation."
            );

            await loadMyBusinesses();
        });

    // DECONNEXION
    document.getElementById("logoutButton")
        .addEventListener("click", async function () {
            const { error } = await client.auth.signOut();

            if (error) {
                showMessage(error.message, true);
                return;
            }

            await updateInterface(null);
            showMessage("Déconnexion réussie.");
        });

    // RECHERCHE
    const searchInput = document.getElementById("searchInput");

    function searchBusinesses() {
        const query = searchInput.value.trim().toLowerCase();
        let count = 0;

        document.querySelectorAll("#businessList .business-card")
            .forEach(function (card) {
                const matches =
                    card.textContent.toLowerCase().includes(query);

                card.hidden = !matches;
                if (matches) count++;
            });

        document.getElementById("searchMessage").textContent =
            query ? count + " commerce(s) trouvé(s)." : "";
    }

    document.getElementById("searchButton")
        .addEventListener("click", searchBusinesses);

    searchInput.addEventListener("input", searchBusinesses);

    // CATEGORIES
    document.querySelectorAll(".category").forEach(function (category) {
        category.addEventListener("click", function () {
            searchInput.value = category.dataset.category;
            searchBusinesses();

            document.getElementById("professionals")
                .scrollIntoView({ behavior: "smooth" });
        });
    });

});
