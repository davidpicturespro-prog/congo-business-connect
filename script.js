
console.log("Congo Business Connect est lancé !");

function searchServices() {
    const input = document.getElementById("searchInput");
    const message = document.getElementById("searchMessage");

    const search = input.value.toLowerCase().trim();
    const categories = document.querySelectorAll(".category");

    let found = 0;

    categories.forEach(function(category) {
        const content = category.textContent.toLowerCase();

        if (content.includes(search)) {
            category.style.display = "block";
            found++;
        } else {
            category.style.display = "none";
        }
    });

    if (search === "") {
        categories.forEach(category => {
            category.style.display = "block";
        });
        message.textContent = "Toutes les catégories sont affichées.";
    } else if (found > 0) {
        message.textContent = found + " catégorie(s) trouvée(s).";
    } else {
        message.textContent = "Aucun service trouvé.";
    }
}
