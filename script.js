
document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const searchMessage = document.getElementById("searchMessage");
    const noResults = document.getElementById("noResults");
    const businessCards = document.querySelectorAll(".business-card");
    const categories = document.querySelectorAll(".category");

    function searchServices() {
        const query = searchInput.value
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        let count = 0;

        businessCards.forEach(function (card) {
            const content = (
                card.dataset.name + " " +
                card.dataset.category + " " +
                card.dataset.service + " " +
                card.dataset.city + " " +
                card.textContent
            ).toLowerCase().normalize("NFD")
             .replace(/[\u0300-\u036f]/g, "");

            const matches = content.includes(query);

            card.hidden = !matches;

            if (matches) count++;
        });

        noResults.hidden = count !== 0;
        searchMessage.textContent = query
            ? count + " professionnel(s) trouvé(s)."
            : "";
    }

    searchButton.addEventListener("click", searchServices);

    searchInput.addEventListener("input", searchServices);

    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            searchServices();
        }
    });

    categories.forEach(function (category) {
        category.addEventListener("click", function () {
            searchInput.value = category.dataset.category;
            searchServices();

            document.getElementById("professionals")
                .scrollIntoView({ behavior: "smooth" });
        });
    });

});
