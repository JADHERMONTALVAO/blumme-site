(function (global) {
    var services = global.BlummeServices || {};
    var authService = services.authService;
    var clientesService = services.clientesService;

    if (!authService || !clientesService) {
        return;
    }

    var form = document.getElementById("mensagem-login-form");
    var loginHero = document.querySelector(".mensagem-login-hero");
    var dashboardBlock = document.querySelector(".acompanhamento-dashboard-block");
    var pageLoader = document.getElementById("page-loader");
    var alertBox = document.getElementById("mensagem-login-alert");
    var submitButton = document.getElementById("entrar-btn");
    var emailInput = document.getElementById("login-email");
    var passwordInput = document.getElementById("login-password");
    var toggleLoginPasswordButton = document.getElementById("toggle-login-password");
    var rememberSessionInput = document.getElementById("login-remember-session");
    var newPasswordWrap = document.getElementById("login-new-password-wrap");
    var newPasswordInput = document.getElementById("login-new-password");
    var forgotPasswordLink = document.getElementById("forgot-password-link");
    var dashboard = document.getElementById("acompanhamento-dashboard");
    var refreshButton = document.getElementById("atualizar-dashboard");
    var logoutButton = document.getElementById("sair-dashboard");
    var filterInput = document.getElementById("filtro-cliente");
    var sortSelect = document.getElementById("ordenacao-cliente");
    var contextLabel = document.getElementById("acompanhamento-contexto");
    var greetingLabel = document.getElementById("acompanhamento-saudacao");
    var tbody = document.getElementById("acompanhamento-tbody");
    var historicoModalOverlay = document.getElementById("acompanhamento-historico-modal-overlay");
    var historicoModalClose = document.getElementById("acompanhamento-historico-modal-close");
    var historicoModalSubtitle = document.getElementById("acompanhamento-historico-modal-subtitle");
    var historicoModalList = document.getElementById("acompanhamento-historico-modal-list");

    var cardTotal = document.getElementById("card-total");
    var cardHomologacao = document.getElementById("card-homologacao");
    var cardVistoria = document.getElementById("card-vistoria");
    var cardLigados = document.getElementById("card-ligados");

    var state = {
        integradorId: "",
        integradorNome: "",
        isAdmin: false,
        allItems: [],
        filteredItems: [],
        pendingChallenge: null,
        rememberSession: false
    };

    function setAlert(message, type) {
        if (!alertBox) {
            return;
        }
        alertBox.textContent = message || "";
        alertBox.classList.remove("is-error", "is-success", "is-visible");
        if (message) {
            alertBox.classList.add(type === "success" ? "is-success" : "is-error", "is-visible");
        }
    }

    function hidePageLoader() {
        if (pageLoader) {
            pageLoader.classList.add("is-hidden");
        }
    }

    function setLoading(loading) {
        if (submitButton) {
            submitButton.disabled = loading;
            submitButton.textContent = loading ? "Processando..." : (state.pendingChallenge ? "Definir nova senha" : "Entrar");
        }
        if (refreshButton) {
            refreshButton.disabled = loading;
        }
    }

    function setChallengeMode(challenge) {
        state.pendingChallenge = challenge || null;
        if (challenge && typeof challenge.rememberSession === "boolean") {
            state.rememberSession = challenge.rememberSession;
        }
        if (rememberSessionInput && !state.pendingChallenge) {
            state.rememberSession = !!rememberSessionInput.checked;
        }
        if (newPasswordWrap) {
            newPasswordWrap.style.display = challenge ? "block" : "none";
        }
        if (newPasswordInput) {
            newPasswordInput.required = !!challenge;
            if (!challenge) {
                newPasswordInput.value = "";
            }
        }
        if (emailInput) {
            emailInput.readOnly = !!challenge;
        }
        if (passwordInput) {
            passwordInput.readOnly = !!challenge;
        }
        if (submitButton) {
            submitButton.textContent = challenge ? "Definir nova senha" : "Entrar";
        }
    }

    function setupPasswordToggle() {
        if (!passwordInput || !toggleLoginPasswordButton) {
            return;
        }
        toggleLoginPasswordButton.addEventListener("click", function () {
            var showing = passwordInput.type === "text";
            passwordInput.type = showing ? "password" : "text";
            toggleLoginPasswordButton.classList.toggle("is-active", !showing);
            toggleLoginPasswordButton.setAttribute("aria-pressed", (!showing).toString());
            toggleLoginPasswordButton.setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
        });
    }

    function normalizeText(value) {
        return (value || "")
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase();
    }

    function getFaseLabel(fase) {
        var normalized = normalizeText(fase);
        var labels = {
            "AGUARDANDO_INFORMACOES_DOCUMENTOS": "Aguardando informações/documentos",
            "ANALISE_DOCUMENTOS": "Análise de documentos",
            "CRIANDO_PROJETO": "Criando projeto",
            "PROJETO_ENVIADO_AO_INTEGRADOR": "Projeto enviado ao integrador",
            "AGUARDANDO_ART": "Aguardando ART",
            "HOMOLOGACAO": "Homologação",
            "PROJETO_DEFERIDO": "Projeto deferido",
            "PROJETO_INDEFERIDO": "Projeto indeferido",
            "VISTORIA": "Vistoria",
            "VISTORIA_INDEFERIDA": "Vistoria indeferida",
            "CLIENTE_CONECTADO": "Cliente conectado",
            "PROJETO_DADO_BAIXA": "Projeto dado baixa"
        };
        return labels[normalized] || normalized.replace(/_/g, " ").toLowerCase();
    }

    function isFaseIndeferida(fase) {
        return normalizeText(fase).indexOf("INDEFERID") !== -1;
    }

    function parseDateValue(value) {
        if (value === undefined || value === null || value === "") {
            return 0;
        }
        if (typeof value === "number") {
            return value;
        }
        var parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function formatDatePtBr(dateValue) {
        var raw = (dateValue || "").toString().trim();
        if (!raw) {
            return "";
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            var parts = raw.split("-");
            return parts[2] + "/" + parts[1] + "/" + parts[0];
        }
        var parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
            return raw;
        }
        return parsed.toLocaleDateString("pt-BR");
    }

    function getFaseDataDisplay(item) {
        var dataInicial = (item.faseDataInicial || "").trim();
        var dataFinal = (item.faseDataFinal || "").trim();
        var dataOcorrencia = (item.faseDataOcorrencia || "").trim();
        if (dataInicial && dataFinal) {
            return formatDatePtBr(dataInicial) + " - " + formatDatePtBr(dataFinal);
        }
        if (dataInicial) {
            return formatDatePtBr(dataInicial);
        }
        if (dataOcorrencia) {
            return formatDatePtBr(dataOcorrencia);
        }
        return "-";
    }

    function getFaseDataDisplayFromEntry(entry) {
        return getFaseDataDisplay({
            faseDataInicial: entry.fase_data_inicial || "",
            faseDataFinal: entry.fase_data_final || "",
            faseDataOcorrencia: entry.fase_data_ocorrencia || ""
        });
    }

    function normalizeFaseHistoryEntries(history) {
        if (!Array.isArray(history)) {
            return [];
        }
        return history.map(function (entry) {
            if (!entry || typeof entry !== "object") {
                return null;
            }
            return {
                fase: (entry.fase || "").toString().trim(),
                fase_data_inicial: (entry.fase_data_inicial || "").toString().trim(),
                fase_data_final: (entry.fase_data_final || "").toString().trim(),
                fase_data_ocorrencia: (entry.fase_data_ocorrencia || "").toString().trim(),
                registrado_em: (entry.registrado_em || "").toString().trim()
            };
        }).filter(function (entry) {
            return !!entry && !!entry.fase;
        });
    }

    function extractProtocolValues(history, currentValue) {
        var values = [];
        if (Array.isArray(history)) {
            history.forEach(function (entry) {
                if (!entry) {
                    return;
                }
                if (typeof entry === "string") {
                    values.push(entry.trim());
                    return;
                }
                if (entry.valor) {
                    values.push(entry.valor.toString().trim());
                }
            });
        }
        if (currentValue && values.indexOf(currentValue) === -1) {
            values.unshift(currentValue);
        }
        return values.filter(Boolean).filter(function (value, index, arr) {
            return arr.indexOf(value) === index;
        });
    }

    function normalizeItem(item, index) {
        var id = item.cliente_id || item.id || ("registro-" + (index + 1));
        var nomeCliente = item.nome_cliente || item.nomeCliente || "Sem nome";
        var faseProjeto = item.fase || item.faseProjeto || "NAO_INFORMADO";
        var protocoloHomologacaoAtual = item.protocolo_homologacao_atual || "";
        var protocoloVistoriaAtual = item.protocolo_vistoria_atual || "";

        var historicoHomologacao = extractProtocolValues(
            item.protocolo_homologacao_historico || item.protocoloHomologacaoHistorico,
            protocoloHomologacaoAtual
        );
        var historicoVistoria = extractProtocolValues(
            item.protocolo_vistoria_historico || item.protocoloVistoriaHistorico,
            protocoloVistoriaAtual
        );

        var timestamp = parseDateValue(item.created_at || item.createdAt || item.updated_at || item.updatedAt);

        return {
            integradorId: (item.integrador_id || item.integradorId || "").toString(),
            id: id.toString(),
            nomeCliente: nomeCliente.toString(),
            cidade: (item.cidade || "").toString(),
            faseProjeto: faseProjeto.toString(),
            faseNormalizada: normalizeText(faseProjeto),
            faseDataInicial: (item.fase_data_inicial || item.faseDataInicial || "").toString(),
            faseDataFinal: (item.fase_data_final || item.faseDataFinal || "").toString(),
            faseDataOcorrencia: (item.fase_data_ocorrencia || item.faseDataOcorrencia || "").toString(),
            faseHistorico: normalizeFaseHistoryEntries(item.fase_historico || item.faseHistorico),
            protocoloHomologacaoAtual: protocoloHomologacaoAtual.toString(),
            protocoloVistoriaAtual: protocoloVistoriaAtual.toString(),
            historicoHomologacao: historicoHomologacao,
            historicoVistoria: historicoVistoria,
            timestamp: timestamp,
            fallbackOrder: index
        };
    }

    function renderHistoryPills(values) {
        if (!values || values.length === 0) {
            return '<span class="hist-pill">Sem protocolo</span>';
        }
        return values.map(function (value) {
            return '<span class="hist-pill">' + escapeHtml(value) + "</span>";
        }).join("");
    }

    function escapeHtml(text) {
        return (text || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function toTitleCase(text) {
        return (text || "").toString().replace(/\s+/g, " ").trim().split(" ").map(function (part) {
            if (!part) {
                return "";
            }
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join(" ");
    }

    function sanitizeDisplayName(rawValue) {
        var text = (rawValue || "").toString().trim();
        if (!text) {
            return "";
        }
        var localPart = text.indexOf("@") !== -1 ? text.split("@")[0] : text;
        localPart = localPart.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
        return toTitleCase(localPart);
    }

    function resolveIntegradorNome() {
        var claims = authService.getCurrentClaims ? authService.getCurrentClaims() : {};
        var byClaims = claims["custom:integrador_id"] ||
            claims.integrador_id ||
            "";
        var normalizedByClaims = sanitizeDisplayName(byClaims);
        if (normalizedByClaims) {
            return normalizedByClaims;
        }
        var normalizedById = sanitizeDisplayName(state.integradorId);
        if (normalizedById) {
            return normalizedById;
        }
        return "Integrador";
    }

    function getGreetingByHour() {
        var hour = new Date().getHours();
        if (hour < 12) {
            return "Bom dia";
        }
        if (hour < 18) {
            return "Boa tarde";
        }
        return "Boa noite";
    }

    function updateDashboardGreeting() {
        if (!greetingLabel) {
            return;
        }
        greetingLabel.textContent = getGreetingByHour() + ", " + (state.integradorNome || "Integrador");
    }

    function updateCards(items) {
        var total = items.length;
        var homologacao = items.filter(function (item) {
            return item.faseNormalizada.indexOf("HOMOLOGACAO") !== -1;
        }).length;
        var vistoria = items.filter(function (item) {
            return item.faseNormalizada.indexOf("VISTORIA") !== -1;
        }).length;
        var ligados = items.filter(function (item) {
            return item.faseNormalizada.indexOf("CLIENTE_CONECTADO") !== -1;
        }).length;

        cardTotal.textContent = total.toString();
        cardHomologacao.textContent = homologacao.toString();
        cardVistoria.textContent = vistoria.toString();
        cardLigados.textContent = ligados.toString();
    }

    function getSortedItems(items, order) {
        var cloned = items.slice();
        if (order === "novo") {
            return cloned.sort(function (a, b) {
                if (b.timestamp !== a.timestamp) {
                    return b.timestamp - a.timestamp;
                }
                return b.fallbackOrder - a.fallbackOrder;
            });
        }
        if (order === "velho") {
            return cloned.sort(function (a, b) {
                if (a.timestamp !== b.timestamp) {
                    return a.timestamp - b.timestamp;
                }
                return a.fallbackOrder - b.fallbackOrder;
            });
        }
        return cloned.sort(function (a, b) {
            return a.nomeCliente.localeCompare(b.nomeCliente, "pt-BR", { sensitivity: "base" });
        });
    }

    function renderTable() {
        var filter = (filterInput && filterInput.value ? filterInput.value : "").trim().toLowerCase();
        var order = sortSelect ? sortSelect.value : "alfabetica";
        var filtered = state.allItems.filter(function (item) {
            return item.nomeCliente.toLowerCase().indexOf(filter) !== -1;
        });
        state.filteredItems = getSortedItems(filtered, order);

        if (!tbody) {
            return;
        }

        if (state.filteredItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7"><p class="acompanhamento-no-data">Nenhum cliente encontrado para o filtro aplicado.</p></td></tr>';
            return;
        }

        tbody.innerHTML = state.filteredItems.map(function (item) {
            return "" +
                "<tr>" +
                "<td>" + escapeHtml(item.nomeCliente) + "</td>" +
                "<td>" + escapeHtml(item.cidade || "-") + "</td>" +
                '<td><span class="' + (isFaseIndeferida(item.faseProjeto) ? "fase-badge is-indeferida" : "fase-badge") + '">' + escapeHtml(getFaseLabel(item.faseProjeto)) + "</span></td>" +
                "<td>" + escapeHtml(getFaseDataDisplay(item)) + "</td>" +
                "<td>" + escapeHtml(item.protocoloHomologacaoAtual || "-") + "</td>" +
                "<td>" + escapeHtml(item.protocoloVistoriaAtual || "-") + "</td>" +
                '<td class="acompanhamento-action-cell"><button type="button" class="acompanhamento-button-secondary acompanhamento-history-btn js-historico-btn" data-cliente-id="' + escapeHtml(item.id) + '">Histórico</button></td>' +
                "</tr>";
        }).join("");
    }

    function closeHistoricoModal() {
        if (!historicoModalOverlay) {
            return;
        }
        historicoModalOverlay.classList.remove("is-open");
        historicoModalOverlay.setAttribute("aria-hidden", "true");
    }

    function openHistoricoModal(item) {
        if (!historicoModalOverlay || !historicoModalList || !item) {
            return;
        }
        var historico = normalizeFaseHistoryEntries(item.faseHistorico);
        if (historico.length === 0 && item.faseProjeto) {
            historico = [{
                fase: item.faseProjeto,
                fase_data_inicial: item.faseDataInicial || "",
                fase_data_final: item.faseDataFinal || "",
                fase_data_ocorrencia: item.faseDataOcorrencia || "",
                registrado_em: ""
            }];
        }

        if (historicoModalSubtitle) {
            historicoModalSubtitle.textContent = "Cliente: " + (item.nomeCliente || "-") + " | Fase atual: " + getFaseLabel(item.faseProjeto || "-");
        }

        if (!historico || historico.length === 0) {
            historicoModalList.innerHTML = '<p class="acompanhamento-no-data">Sem histórico.</p>';
        } else {
            var homologacaoIndex = 0;
            var vistoriaIndex = 0;
            historicoModalList.innerHTML = historico.map(function (entry, index) {
                var faseNorm = normalizeText(entry.fase || "");
                var dataFase = getFaseDataDisplayFromEntry(entry);
                var registradoEm = formatDatePtBr(entry.registrado_em || "");
                var protocoloLinha = "";
                if (faseNorm.indexOf("HOMOLOGACAO") !== -1) {
                    var protocoloHomologacao = item.historicoHomologacao[homologacaoIndex] || item.protocoloHomologacaoAtual || "-";
                    homologacaoIndex += 1;
                    protocoloLinha = "<p><strong>Protocolo:</strong> " + escapeHtml(protocoloHomologacao) + "</p>";
                } else if (faseNorm.indexOf("VISTORIA") !== -1) {
                    var protocoloVistoria = item.historicoVistoria[vistoriaIndex] || item.protocoloVistoriaAtual || "-";
                    vistoriaIndex += 1;
                    protocoloLinha = "<p><strong>Protocolo:</strong> " + escapeHtml(protocoloVistoria) + "</p>";
                }
                return '' +
                    '<article class="acompanhamento-history-item">' +
                    '<h4>' + escapeHtml(String(index + 1) + ". " + getFaseLabel(entry.fase || "-")) + "</h4>" +
                    "<p><strong>Data da fase:</strong> " + escapeHtml(dataFase || "-") + "</p>" +
                    protocoloLinha +
                    "<p><strong>Registro:</strong> " + escapeHtml(registradoEm || "-") + "</p>" +
                    "</article>";
            }).join("");
        }

        historicoModalOverlay.classList.add("is-open");
        historicoModalOverlay.setAttribute("aria-hidden", "false");
    }

    function onHistoryClick(event) {
        var button = event.target.closest(".js-historico-btn");
        if (!button) {
            return;
        }
        var clienteId = button.getAttribute("data-cliente-id") || "";
        var found = state.filteredItems.find(function (item) {
            return item.id === clienteId;
        });
        if (!found) {
            return;
        }
        openHistoricoModal(found);
    }
    function showDashboard(show) {
        if (loginHero) {
            loginHero.style.display = show ? "none" : "";
        }
        document.body.classList.toggle("acompanhamento-logado", !!show);
        if (dashboardBlock) {
            dashboardBlock.classList.toggle("is-hidden", !show);
            dashboardBlock.classList.toggle("is-dashboard-only", !!show);
        }
        if (dashboard) {
            dashboard.classList.toggle("is-hidden", !show);
        }
    }

    function focusDashboard() {
        if (!dashboard || dashboard.classList.contains("is-hidden")) {
            return;
        }
        dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function loadDashboard() {
        return clientesService.listClientesDoIntegradorLogado().then(function (items) {
            state.allItems = items.map(normalizeItem);
            updateCards(state.allItems);
            renderTable();
            updateDashboardGreeting();
            if (contextLabel) {
                contextLabel.textContent = "Ultima atualizacao: " + new Date().toLocaleString("pt-BR");
            }
            showDashboard(true);
        });
    }

    function handleLogin(event) {
        event.preventDefault();
        setAlert("", "error");

        var username = (emailInput ? emailInput.value : "").trim();
        var password = (passwordInput ? passwordInput.value : "").trim();
        if (!state.pendingChallenge) {
            state.rememberSession = !!(rememberSessionInput && rememberSessionInput.checked);
        }
        if (!state.pendingChallenge && (!username || !password)) {
            setAlert("Informe e-mail e senha para entrar.", "error");
            return;
        }

        setLoading(true);

        if (state.pendingChallenge) {
            var typedNewPassword = (newPasswordInput ? newPasswordInput.value : "").trim();
            if (!typedNewPassword) {
                setAlert("Informe a nova senha para concluir o primeiro login.", "error");
                setLoading(false);
                return;
            }
        }

        var run = state.pendingChallenge
            ? authService.completeNewPassword(
                state.pendingChallenge.username,
                (newPasswordInput ? newPasswordInput.value : "").trim(),
                state.pendingChallenge.session,
                { remember: state.rememberSession }
            )
            : authService.signIn(username, password, { remember: state.rememberSession });

        run.then(function (result) {
            if (result && result.challengeName === "NEW_PASSWORD_REQUIRED") {
                setChallengeMode(result);
                setAlert("Primeiro acesso detectado. Defina uma nova senha para continuar.", "error");
                return;
            }
            setChallengeMode(null);
            state.integradorId = authService.getCurrentIntegradorId();
            state.isAdmin = authService.isAdminUser();
            state.integradorNome = resolveIntegradorNome();
            if (!state.integradorId && !state.isAdmin) {
                throw new Error("Usuário autenticado sem atributo custom:integrador_id.");
            }
            return loadDashboard();
        }).then(function () {
            setAlert("Login realizado com sucesso.", "success");
            if (passwordInput) {
                passwordInput.value = "";
            }
            if (newPasswordInput) {
                newPasswordInput.value = "";
            }
            focusDashboard();
        }).catch(function (error) {
            var message = "Erro ao autenticar.";
            if (error && error.code === "NotAuthorizedException") {
                if (state.pendingChallenge) {
                    message = "Sessão para definir nova senha expirou ou ficou inválida. Entre novamente com e-mail e senha temporária.";
                    setChallengeMode(null);
                } else {
                    message = "Usuário ou senha inválidos.";
                }
            } else if (error && error.code === "InvalidPasswordException") {
                message = "Nova senha não atende à política do Cognito.";
            } else if (error && error.message) {
                message = error.message;
            }
            setAlert(message, "error");
        }).finally(function () {
            setLoading(false);
        });
    }

    function refreshDashboard() {
        setLoading(true);
        setAlert("", "error");
        loadDashboard().then(function () {
            setAlert("Dashboard atualizado.", "success");
        }).catch(function (error) {
            setAlert(error && error.message ? error.message : "Erro ao atualizar dashboard.", "error");
        }).finally(function () {
            setLoading(false);
        });
    }

    function logout() {
        authService.signOut();
        state.integradorId = "";
        state.integradorNome = "";
        state.isAdmin = false;
        state.allItems = [];
        state.filteredItems = [];
        if (filterInput) {
            filterInput.value = "";
        }
        if (sortSelect) {
            sortSelect.value = "alfabetica";
        }
        if (emailInput) {
            emailInput.value = "";
        }
        if (passwordInput) {
            passwordInput.value = "";
        }
        if (rememberSessionInput) {
            rememberSessionInput.checked = false;
        }
        setChallengeMode(null);
        updateCards([]);
        renderTable();
        showDashboard(false);
        setAlert("Sessão encerrada.", "success");
    }

    function bootstrapSession() {
        authService.restoreSession().then(function () {
            state.integradorId = authService.getCurrentIntegradorId();
            state.isAdmin = authService.isAdminUser();
            state.integradorNome = resolveIntegradorNome();
            if (!state.integradorId && !state.isAdmin) {
                throw new Error("Usuário autenticado sem atributo custom:integrador_id.");
            }
            return loadDashboard();
        }).catch(function () {
            showDashboard(false);
        }).finally(function () {
            hidePageLoader();
        });
    }

    if (form) {
        form.addEventListener("submit", handleLogin);
    }
    setupPasswordToggle();
    if (refreshButton) {
        refreshButton.addEventListener("click", refreshDashboard);
    }
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
    if (filterInput) {
        filterInput.addEventListener("input", renderTable);
    }
    if (sortSelect) {
        sortSelect.addEventListener("change", renderTable);
    }
    if (tbody) {
        tbody.addEventListener("click", onHistoryClick);
    }
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", function () {
            var email = (emailInput ? emailInput.value : "").trim();
            forgotPasswordLink.href = email
                ? ("mensagemrecuperarsenha.html?email=" + encodeURIComponent(email))
                : "mensagemrecuperarsenha.html";
        });
    }
    if (historicoModalClose) {
        historicoModalClose.addEventListener("click", closeHistoricoModal);
    }
    if (historicoModalOverlay) {
        historicoModalOverlay.addEventListener("click", function (event) {
            if (event.target === historicoModalOverlay) {
                closeHistoricoModal();
            }
        });
    }
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeHistoricoModal();
        }
    });

    var hasPersistedSession = !!authService.getCurrentSession();
    if (hasPersistedSession) {
        if (loginHero) {
            loginHero.style.display = "none";
        }
        document.body.classList.add("acompanhamento-logado");
        if (dashboardBlock) {
            dashboardBlock.classList.add("is-dashboard-only");
        }
    } else {
        showDashboard(false);
    }
    bootstrapSession();
})(window);

