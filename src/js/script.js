document.addEventListener("DOMContentLoaded", () => {
    // Adicionar função para criar o header
    function createHeader() {
        const header = document.createElement('header');
        header.classList.add('page-header');
        
        header.innerHTML = `
            <div class="header-top">
                <a href="https://bitmates.io/" target="_blank" class="image-link">
                    <img src="https://bitmates.io/assets/BitmatesLogo1-DL6rVBW_.png" alt="Logo" class="zoom-effect">
                </a>
            </div>
        `;

        return header;
    }

    // Inserir o header no início do body
    document.body.insertBefore(createHeader(), document.body.firstChild);

    const apiUrl = "https://bitmatemediator.net/game/v1/onlineplayers";
    const playerApiUrl = "https://bitmatemediator.net/highscore/v1/player/";

    async function fetchOnlinePlayers() {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            return data.players;
        } catch (error) {
            console.error("Erro ao carregar jogadores:", error);
            throw error;
        }
    }

    async function fetchPlayerName(address) {
        try {
            const response = await fetch(`${playerApiUrl}${address}`);
            const data = await response.json();
            return data.data.name;
        } catch (error) {
            console.error(`Erro ao carregar o nome do jogador para a carteira ${address}:`, error);
            return address;
        }
    }

    async function updateOnlinePlayers() {
        const contentDiv = document.getElementById("content");
        contentDiv.innerHTML = "<h2 class='loading-text'>Loading...</h2>";

        try {
            const players = await fetchOnlinePlayers();
            const servers = {};
            const serverMax = 200;
            const serverOrder = [
                { name: "Server 2", world: "eu-west-2.bitmates.online" },
                { name: "Server 3", world: "us-east-3.bitmates.online" },
                { name: "Server 4", world: "br-4.bitmates.online" },
                { name: "Server 5", world: "us-east-5.bitmates.online" }
            ];

            // Organize players by server
            players.forEach(player => {
                if (!servers[player.world]) {
                    servers[player.world] = [];
                }
                servers[player.world].push(player.address);
            });

            // Load all player names first
            const serverSections = await Promise.all(serverOrder.map(async server => {
                if (!servers[server.world]) return null;

                const playerNames = await Promise.all(
                    servers[server.world].map(address => fetchPlayerName(address))
                );

                return {
                    server,
                    playerCount: servers[server.world].length,
                    playerNames
                };
            }));

            // After loading all data, create the HTML
            contentDiv.innerHTML = "";
            
            // Adicionar o total de jogadores
            const totalPlayers = players.length;
            const totalSection = document.createElement("div");
            totalSection.className = "ranking-category";
            totalSection.innerHTML = `
                <div class="category-header">
                    <h2>Total: ${totalPlayers}</h2>
                </div>
            `;
            contentDiv.appendChild(totalSection);

            serverSections.forEach(section => {
                if (!section) return;

                const serverSection = document.createElement("div");
                serverSection.className = "ranking-category";

                const categoryHeader = document.createElement("div");
                categoryHeader.className = "category-header";

                const serverHeader = document.createElement("h2");
                serverHeader.textContent = `${section.server.name} (${section.playerCount}/${serverMax})`;
                
                const toggleBtn = document.createElement("button");
                toggleBtn.className = "toggle-btn";
                toggleBtn.textContent = "▼";

                categoryHeader.appendChild(serverHeader);
                categoryHeader.appendChild(toggleBtn);
                serverSection.appendChild(categoryHeader);

                const categoryContent = document.createElement("div");
                categoryContent.className = "category-content active";

                const tableContainer = document.createElement("div");
                tableContainer.className = "table-container";

                const table = document.createElement("table");
                table.className = "ranking-table";

                const tbody = document.createElement("tbody");

                section.playerNames.forEach(playerName => {
                    const row = document.createElement("tr");
                    const cell = document.createElement("td");
                    cell.textContent = playerName;
                    row.appendChild(cell);
                    tbody.appendChild(row);
                });

                table.appendChild(tbody);
                tableContainer.appendChild(table);
                categoryContent.appendChild(tableContainer);
                serverSection.appendChild(categoryContent);
                contentDiv.appendChild(serverSection);
            });

            // Add toggle functionality to the categories
            document.querySelectorAll('.category-header').forEach(header => {
                header.addEventListener('click', () => {
                    const content = header.nextElementSibling;
                    const toggleBtn = header.querySelector('.toggle-btn');
                    content.classList.toggle('active');
                    toggleBtn.textContent = content.classList.contains('active') ? '▲' : '▼';
                });
            });

            // Adicionar ícone de download CSV
            const downloadIcon = document.createElement('i');
            downloadIcon.className = 'fa-solid fa-file-csv csv-download';
            downloadIcon.title = 'Download Online Players List';
            downloadIcon.style.cursor = 'pointer';

            downloadIcon.addEventListener('click', () => {
                const csvData = [['Server', 'Player']];
                
                serverSections.forEach(section => {
                    if (!section) return;
                    
                    section.playerNames.forEach(playerName => {
                        csvData.push([section.server.name, playerName]);
                    });
                });
                
                const csvContent = csvData.map(row => row.join(',')).join('\n');
                downloadCSV(csvContent, 'bitmates_online_players.csv');
            });

            contentDiv.appendChild(downloadIcon);

            // Adicionar função downloadCSV se ainda não existir
            function downloadCSV(csvContent, fileName) {
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            contentDiv.innerHTML = "<h2 class='error-text'>Error loading players.</h2>";
        }
    }

    // Update online players initially
    updateOnlinePlayers();

    // Set up automatic updates every 30 seconds
    // setInterval(updateOnlinePlayers, 30000);

    // Add click event to the refresh icon
    document.getElementById("refresh-icon").addEventListener("click", updateOnlinePlayers);
});