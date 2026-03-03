const DRUPAL_API_URL = 'http://drupaltest/web/jsonapi/node/menu_item?include=field_image_couverture.field_media_image';

document.addEventListener('DOMContentLoaded', () => {
    const triggerBtn = document.getElementById('menu-trigger');
    const megaMenu = document.getElementById('mega-menu');
    const overlay = document.getElementById('page-overlay');
    const contentGrid = document.getElementById('api-content');
    
    let dataLoaded = false;

    // Gestion de l'ouverture/fermeture
    triggerBtn.addEventListener('click', () => {
        const isActive = megaMenu.classList.contains('active');
        if (!isActive) {
            megaMenu.classList.add('active');
            overlay.classList.add('active');
            triggerBtn.classList.add('active');
            if (!dataLoaded) {
                fetchDrupalData();
            }
        } else {
            closeMenu();
        }
    });

    overlay.addEventListener('click', closeMenu);

    function closeMenu() {
        megaMenu.classList.remove('active');
        overlay.classList.remove('active');
        triggerBtn.classList.remove('active');
    }

    async function fetchDrupalData() {
        try {
            const response = await fetch(DRUPAL_API_URL);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const json = await response.json();
            renderMenuItems(json.data, json.included || []);
            dataLoaded = true;
        } catch (error) {
            console.error("Erreur de connexion Drupal:", error);
            contentGrid.innerHTML = `<div style="color:red; grid-column: span 2;">Erreur : Impossible de charger les données Drupal.</div>`;
        }
    }

    function renderMenuItems(items, included) {
        const itemsToProcess = (items || []).slice(0, 6); 

        const column1Items = itemsToProcess.slice(0, 3);
        const column2Items = itemsToProcess.slice(3, 6);

        const createColumnHTML = (columnData) => {
            if (columnData.length === 0) return '';
            
            return `<div class="menu-column">` + columnData.map(item => {
                const attr = item.attributes;
                let imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

                // Résolution Média Drupal
                const mediaRelation = item.relationships?.field_image_couverture?.data;
                if (mediaRelation && included.length > 0) {
                    const mediaItem = included.find(inc => inc.type === mediaRelation.type && inc.id === mediaRelation.id);
                    if (mediaItem) {
                        const fileRelation = mediaItem.relationships?.field_media_image?.data;
                        if (fileRelation) {
                            const fileItem = included.find(inc => inc.type === fileRelation.type && inc.id === fileRelation.id);
                            if (fileItem && fileItem.attributes?.uri?.url) {
                                imageUrl = `http://drupaltest${fileItem.attributes.uri.url}`;
                            }
                        }
                    }
                }

                return `
                    <div class="drupal-item">
                        <img src="${imageUrl}" alt="${attr.title || 'Image'}">
                        <div class="item-content">
                            <h3>${attr.title || 'Sans titre'}</h3>
                            <p>${attr.field_texte_du_lien || ''}</p>
                            <a href="${attr.field_link?.uri || '#'}">${attr.field_link?.title || 'Voir plus ›'}</a>
                        </div>
                    </div>
                `;
            }).join('') + `</div>`;
        };

        // Injection des 2 colonnes dans le conteneur principal
        contentGrid.innerHTML = createColumnHTML(column1Items) + createColumnHTML(column2Items);
    }
});