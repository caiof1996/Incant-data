// Aguarda o carregamento completo do HTML antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // Define a chave para armazenar os dados no localStorage
    const STORAGE_KEY = 'coletorDadosPessoas';

    // Array para armazenar os dados coletados.
    // Tenta carregar os dados salvos no localStorage, se existirem. Se não, inicializa um array vazio.
    let pessoas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // Referências aos elementos do HTML, para manipulação no JavaScript
    const nomeInput = document.getElementById('nome');
    const whatsappInput = document.getElementById('whatsapp');
    const estadoSelect = document.getElementById('estado');
    const cidadeSelect = document.getElementById('cidade');
    const bairroInput = document.getElementById('bairro');
    const addButton = document.getElementById('add-btn');
    const generateButton = document.getElementById('generate-btn'); // Corrigido o ID aqui
    const dataTableBody = document.querySelector('#data-table tbody');

    // --- Funções de Persistência ---
    /**
     * Salva o array de pessoas no localStorage, para que os dados não se percam ao fechar a página.
     */
    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pessoas));
    }

    // --- Funções de Lógica ---

    /**
     * Carrega a lista de estados da API do IBGE e popula o seletor de estados.
     * A API retorna os estados em ordem alfabética.
     */
    async function loadStates() {
        // URL da API do IBGE para obter a lista de estados, ordenados por nome
        const url = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';
        try {
            // Faz a requisição para a API
            const response = await fetch(url);
            // Converte a resposta para JSON
            const states = await response.json();

            // Limpa o conteúdo atual do seletor de estados e adiciona uma opção padrão
            estadoSelect.innerHTML = '<option value="">Selecione um Estado</option>'; // Placeholder
            // Para cada estado retornado pela API, cria uma opção no seletor
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.sigla;
                option.textContent = state.nome;
                estadoSelect.appendChild(option);
            });
        } catch (error) { // Trata erros na requisição
            console.error('Erro ao carregar estados:', error);
            alert('Não foi possível carregar a lista de estados. Tente recarregar a página.');
        }
    }

    /**
     * Carrega a lista de municípios (cidades) para o estado selecionado, usando a API do IBGE.
     * Popula o seletor de cidades com os municípios retornados.
     */
    async function loadCities() {
        // Obtém a sigla do estado selecionado
        const selectedState = estadoSelect.value;
        // Se nenhum estado estiver selecionado, limpa o seletor de cidades e retorna
        if (!selectedState) {
            cidadeSelect.innerHTML = '<option value="">Selecione um estado primeiro</option>';
            return;
        }

        // Exibe uma mensagem de carregamento enquanto aguarda a resposta da API
        cidadeSelect.innerHTML = '<option value="">Carregando...</option>';
        // URL da API para obter os municípios do estado selecionado
        const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`;

        try {
            // Faz a requisição para a API
            const response = await fetch(url);
            // Converte a resposta para JSON
            const cities = await response.json();

            // Limpa o seletor de cidades e adiciona uma opção padrão
            cidadeSelect.innerHTML = '<option value="">Selecione uma Cidade</option>';
            // Para cada cidade retornada, cria uma opção no seletor
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.nome;
                option.textContent = city.nome;
                cidadeSelect.appendChild(option);
            });
        } catch (error) { // Trata erros na requisição
            console.error('Erro ao carregar cidades:', error);
            cidadeSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    /**
     * Adiciona uma nova pessoa à lista de registros.
     * Coleta os dados dos campos de entrada, valida-os, cria um objeto pessoa e o adiciona ao array.
     * Em seguida, atualiza a tabela de exibição e limpa os campos de entrada.
     */
    function addPessoa() {
        // Obtém os valores dos campos de entrada, removendo espaços em branco extras
        const nome = nomeInput.value.trim();
        const whatsapp = whatsappInput.value.trim();
        // Obtém o nome completo do estado selecionado
        const estado = estadoSelect.options[estadoSelect.selectedIndex].text;
        // Obtém a sigla do estado selecionado (UF)
        const estadoSigla = estadoSelect.value;
        const cidade = cidadeSelect.value;
        const bairro = bairroInput.value.trim();

        // Valida se todos os campos obrigatórios foram preenchidos
        if (!nome || !whatsapp || !estadoSigla || !cidade || !bairro) {
            alert('Por favor, preencha todos os pergaminhos (campos).');
            return;
        }

        // Cria um objeto pessoa com os dados coletados
        const pessoa = { nome, whatsapp, estado: estado, cidade, bairro }; // Inclui o nome do estado
        // Adiciona a pessoa ao array de pessoas
        pessoas.push(pessoa);

        // Atualiza a tabela de exibição com os novos dados
        updateTable();

        // Limpa os campos de entrada para permitir a adição de uma nova pessoa
        nomeInput.value = '';
        whatsappInput.value = '';
        bairroInput.value = '';
        nomeInput.focus(); // Coloca o foco de volta no campo nome para facilitar a próxima entrada
        alert('Bruxo(a) registrado com sucesso no Grande Livro!');
        saveData(); // Salva os dados no localStorage
    }

    /**
     * Atualiza a tabela HTML com os dados do array 'pessoas'.
     * Limpa o conteúdo atual da tabela e preenche com os registros atualizados.
     */
    function updateTable() {
        // Limpa o corpo da tabela HTML
        dataTableBody.innerHTML = '';

        // Para cada pessoa no array 'pessoas', cria uma nova linha na tabela
        pessoas.forEach(pessoa => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pessoa.nome}</td>
                <td>${pessoa.whatsapp}</td>
                <td>${pessoa.estado}</td> <!-- Exibe o nome do estado -->
                <td>${pessoa.cidade}</td>
                <td>${pessoa.bairro}</td>
            `;
            dataTableBody.appendChild(row);
        });
    }

    /**
     * Gera e baixa o arquivo Excel com os dados coletados.
     * Utiliza a biblioteca SheetJS para criar o arquivo no formato .xlsx.
     * O arquivo contém uma única planilha chamada "Dados Coletados" com todos os registros.
     */
    function generateExcel() {
        // Verifica se há dados para serem exportados. Se não houver, exibe uma mensagem.
        if (pessoas.length === 0) {
            alert('O Grande Livro está vazio. Não há registros para gerar o pergaminho.');
            return;
        }

        // Cria um novo "workbook" (arquivo Excel)
        const workbook = XLSX.utils.book_new();

        // Prepara os dados para a planilha, incluindo o cabeçalho
        const sheetData = [
            ["Nome do Bruxo(a)", "Contato", "Reino", "Cidade Mágica", "Comunidade/Bairro"] // Cabeçalho da planilha
        ].concat(pessoas.map(p => [
            p.nome,
            p.whatsapp,
            p.estado,
            p.cidade,
            p.bairro
        ]));

        // Cria a "worksheet" (planilha) a partir do array de dados
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Adiciona a planilha ao workbook, nomeando-a como "Dados Coletados"
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Coletados");

        // Gera o arquivo Excel no formato .xlsx e força o download para o usuário
        XLSX.writeFile(workbook, 'pergaminho_incantori.xlsx');
    }

    // --- Event Listeners ---
    // Adiciona um listener para o evento de mudança no seletor de estados.
    // Quando um estado é selecionado, carrega as cidades correspondentes.
    estadoSelect.addEventListener('change', loadCities);
    // Adiciona um listener para o botão de adicionar.
    // Quando o botão é clicado, chama a função para adicionar uma pessoa.
    addButton.addEventListener('click', addPessoa);
    // Adiciona um listener para o botão de gerar Excel.
    // Quando o botão é clicado, chama a função para gerar o arquivo Excel.
    generateButton.addEventListener('click', generateExcel);

    // --- Inicialização ---
    // Carrega a lista de estados na inicialização da página
    loadStates();
    // Atualiza a tabela com os dados previamente salvos (se houver)
    updateTable(); // Renderiza os dados carregados do localStorage
    // Inicializa o seletor de cidades com uma mensagem padrão, indicando que o usuário deve selecionar um estado primeiro
    cidadeSelect.innerHTML = '<option value="">Selecione um estado primeiro</option>';
});

            const option = document.createElement('option');
            option.value = cidade;
            option.textContent = cidade;
            cidadeSelect.appendChild(option);
        
        // Dispara a atualização dos bairros para a primeira cidade da lista
        populateBairros();
    

    // Popula o seletor de bairros com base na cidade selecionada
    function populateBairros() {
        const selectedCity = cidadeSelect.value;
        const bairros = cityBairroMap[selectedCity] || [];

        // Limpa opções existentes
        bairroSelect.innerHTML = '';
        // Adiciona os bairros correspondentes
        bairros.forEach(bairro => {
            const option = document.createElement('option');
            option.value = bairro;
            option.textContent = bairro;
            bairroSelect.appendChild(option);
        });
    }

    // Adiciona uma nova pessoa à lista e atualiza a tabela
    function addPessoa() {
        const nome = nomeInput.value.trim();
        const whatsapp = whatsappInput.value.trim();
        const cidade = cidadeSelect.value;
        const bairro = bairroSelect.value;

        if (!nome || !whatsapp || !cidade || !bairro) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const pessoa = { nome, whatsapp, cidade, bairro };
        pessoas.push(pessoa);

        updateTable();

        // Limpa os campos de entrada
        nomeInput.value = '';
        whatsappInput.value = '';
        nomeInput.focus(); // Coloca o foco de volta no campo nome
        alert('Dados adicionados com sucesso!');
    }

    // Atualiza a tabela HTML com os dados do array 'pessoas'
    function updateTable() {
        // Limpa a tabela
        dataTableBody.innerHTML = '';

        // Adiciona cada pessoa como uma nova linha na tabela
        pessoas.forEach(pessoa => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pessoa.nome}</td>
                <td>${pessoa.whatsapp}</td>
                <td>${pessoa.cidade}</td>
                <td>${pessoa.bairro}</td>
            `;
            dataTableBody.appendChild(row);
        });
    }

    // Gera e baixa o arquivo Excel
    function generateExcel() {
        if (pessoas.length === 0) {
            alert('Não há dados para gerar o arquivo Excel.');
            return;
        }

        // Agrupa as pessoas por bairro
        const pessoasByBairro = pessoas.reduce((acc, pessoa) => {
            const bairro = pessoa.bairro;
            if (!acc[bairro]) {
                acc[bairro] = [];
            }
            acc[bairro].push(pessoa);
            return acc;
        }, {});

        // Cria um novo workbook (arquivo Excel)
        const workbook = XLSX.utils.book_new();

        // Para cada bairro, cria uma nova aba (worksheet)
        for (const bairro in pessoasByBairro) {
            // Prepara os dados para a aba, começando com o cabeçalho
            const sheetData = [
                ["Nome", "Whatsapp", "Cidade"]
            ];
            // Adiciona os dados de cada pessoa
            pessoasByBairro[bairro].forEach(p => {
                sheetData.push([p.nome, p.whatsapp, p.cidade]);
            });

            // Cria a worksheet a partir do array de dados
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
            // Adiciona a worksheet ao workbook, nomeando a aba com o nome do bairro
            XLSX.utils.book_append_sheet(workbook, worksheet, bairro);
        }

        // Gera o arquivo e dispara o download
        XLSX.writeFile(workbook, 'dados_coletados_por_bairro.xlsx');
    }

    // --- Event Listeners ---
    cidadeSelect.addEventListener('change', populateBairros);
    addButton.addEventListener('click', addPessoa);
    generateButton.addEventListener('click', generateExcel);

    // --- Inicialização ---
    populateCities();
