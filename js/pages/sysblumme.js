(function (global) {
    var services = global.BlummeServices || {};
    var authService = services.authService;
    var clientesService = services.clientesService;

    if (!authService || !clientesService) {
        return;
    }

    var faseOptions = [
        "AGUARDANDO_INFORMACOES_DOCUMENTOS",
        "ANALISE_DOCUMENTOS",
        "CRIANDO_PROJETO",
        "PROJETO_ENVIADO_AO_INTEGRADOR",
        "AGUARDANDO_ART",
        "HOMOLOGACAO",
        "PROJETO_DEFERIDO",
        "PROJETO_INDEFERIDO",
        "VISTORIA",
        "VISTORIA_INDEFERIDA",
        "CLIENTE_CONECTADO",
        "PROJETO_DADO_BAIXA"
    ];

    var pendingChallenge = null;
    var rememberSession = false;
    var currentClientes = [];
    var selectedCliente = null;
    var scopeWarningMessage = "";
    var integradorIdsCache = [];
    var ADMIN_INTEGRADORES_STORAGE_KEY = "sysblumme_admin_integradores";
    var INTERVALO_FASES = {
        "AGUARDANDO_INFORMACOES_DOCUMENTOS": true,
        "ANALISE_DOCUMENTOS": true,
        "CRIANDO_PROJETO": true,
        "HOMOLOGACAO": true,
        "VISTORIA": true
    };

    var ui = {
        tabs: Array.prototype.slice.call(document.querySelectorAll(".sys-tab-btn")),
        panels: Array.prototype.slice.call(document.querySelectorAll(".sys-tab-panel")),

        adminLoginForm: document.getElementById("admin-login-form"),
        adminLoginEmail: document.getElementById("admin-login-email"),
        adminLoginPassword: document.getElementById("admin-login-password"),
        adminRememberSession: document.getElementById("admin-remember-session"),
        adminForgotPasswordLink: document.getElementById("admin-forgot-password-link"),
        adminNewPasswordWrap: document.getElementById("admin-new-password-wrap"),
        adminLoginNewPassword: document.getElementById("admin-login-new-password"),
        adminLoginButton: document.getElementById("admin-login-button"),
        adminLogoutButton: document.getElementById("admin-logout-button"),
        sidebarLogoutButton: document.getElementById("sidebar-logout-button"),
        adminSessionInfo: document.getElementById("admin-session-info"),
        adminAlert: document.getElementById("admin-alert"),

        cadastroForm: document.getElementById("cadastro-form"),
        cadastroAlert: document.getElementById("cadastro-alert"),
        cadastroIntegradorId: document.getElementById("cadastro-integrador-id"),
        cadastroSearch: document.getElementById("cadastro-search"),
        cadastroLista: document.getElementById("cadastro-lista"),
        cadastroNome: document.getElementById("cadastro-nome-cliente"),
        cadastroCidade: document.getElementById("cadastro-cidade"),
        cadastroFase: document.getElementById("cadastro-fase"),
        cadastroFaseDataSection: document.getElementById("cadastro-fase-data-section"),
        cadastroFaseIntervaloFields: document.getElementById("cadastro-fase-intervalo-fields"),
        cadastroFaseOcorrenciaField: document.getElementById("cadastro-fase-ocorrencia-field"),
        cadastroFaseDataInicial: document.getElementById("cadastro-fase-data-inicial"),
        cadastroFaseDataFinal: document.getElementById("cadastro-fase-data-final"),
        cadastroFaseDataOcorrencia: document.getElementById("cadastro-fase-data-ocorrencia"),
        cadastroClienteId: document.getElementById("cadastro-cliente-id"),
        cadastroGerarIdBtn: document.getElementById("cadastro-gerar-id"),
        cadastroSalvarBtn: document.getElementById("cadastro-salvar"),
        cadastroLimparBtn: document.getElementById("cadastro-limpar"),

        acompanhamentoForm: document.getElementById("acompanhamento-form"),
        acompanhamentoAlert: document.getElementById("acompanhamento-alert"),
        acompanhamentoIntegradorId: document.getElementById("acompanhamento-integrador-id"),
        acompanhamentoNomeCliente: document.getElementById("acompanhamento-nome-cliente"),
        acompanhamentoBuscarBtn: document.getElementById("acompanhamento-buscar"),
        acompanhamentoHomologacaoSection: document.getElementById("acompanhamento-homologacao-section"),
        acompanhamentoVistoriaSection: document.getElementById("acompanhamento-vistoria-section"),
        acompanhamentoClienteId: document.getElementById("acompanhamento-cliente-id"),
        acompanhamentoCidade: document.getElementById("acompanhamento-cidade"),
        acompanhamentoFase: document.getElementById("acompanhamento-fase"),
        acompanhamentoFaseDataSection: document.getElementById("acompanhamento-fase-data-section"),
        acompanhamentoFaseIntervaloFields: document.getElementById("acompanhamento-fase-intervalo-fields"),
        acompanhamentoFaseOcorrenciaField: document.getElementById("acompanhamento-fase-ocorrencia-field"),
        acompanhamentoFaseDataInicial: document.getElementById("acompanhamento-fase-data-inicial"),
        acompanhamentoFaseDataFinal: document.getElementById("acompanhamento-fase-data-final"),
        acompanhamentoFaseDataOcorrencia: document.getElementById("acompanhamento-fase-data-ocorrencia"),
        acompanhamentoProtocoloHomologacao: document.getElementById("acompanhamento-protocolo-homologacao"),
        acompanhamentoDataInicialHomologacao: document.getElementById("acompanhamento-data-inicial-homologacao"),
        acompanhamentoDataFinalHomologacao: document.getElementById("acompanhamento-data-final-homologacao"),
        acompanhamentoHistoricoHomologacao: document.getElementById("acompanhamento-historico-homologacao"),
        acompanhamentoProtocoloVistoria: document.getElementById("acompanhamento-protocolo-vistoria"),
        acompanhamentoDataInicialVistoria: document.getElementById("acompanhamento-data-inicial-vistoria"),
        acompanhamentoDataFinalVistoria: document.getElementById("acompanhamento-data-final-vistoria"),
        acompanhamentoHistoricoVistoria: document.getElementById("acompanhamento-historico-vistoria"),
        acompanhamentoSalvarBtn: document.getElementById("acompanhamento-salvar"),

        dashboardIntegradorId: document.getElementById("dashboard-integrador-id"),
        dashboardAtualizarBtn: document.getElementById("dashboard-atualizar"),
        dashboardBusca: document.getElementById("dashboard-busca"),
        dashboardTbody: document.getElementById("dashboard-tbody"),
        cardTotal: document.getElementById("card-total"),
        cardHomologacao: document.getElementById("card-homologacao"),
        cardVistoria: document.getElementById("card-vistoria"),
        cardLigados: document.getElementById("card-ligados"),
        historicoModalOverlay: document.getElementById("historico-modal-overlay"),
        historicoModalClose: document.getElementById("historico-modal-close"),
        historicoModalTitle: document.getElementById("historico-modal-title"),
        historicoModalSubtitle: document.getElementById("historico-modal-subtitle"),
        historicoModalList: document.getElementById("historico-modal-list"),

        userForm: document.getElementById("sys-user-form"),
        userEmail: document.getElementById("novo-usuario-email"),
        userIntegradorId: document.getElementById("novo-usuario-integrador-id"),
        userTemporaryPassword: document.getElementById("novo-usuario-temporary-password"),
        userCreateButton: document.getElementById("create-user-button"),
        userAlert: document.getElementById("sys-user-alert")
    };

    function showAlert(target, message, type) {
        if (!target) {
            return;
        }
        target.textContent = message || "";
        target.classList.remove("show", "success", "error");
        if (message) {
            target.classList.add("show", type === "success" ? "success" : "error");
        }
    }

    function isPermissionError(error) {
        var code = (error && (error.code || error.name) ? (error.code || error.name) : "").toString();
        var message = (error && error.message ? error.message : "").toString();
        var text = (code + " " + message).toUpperCase();
        return text.indexOf("ACCESSDENIED") !== -1 ||
            text.indexOf("NOTAUTHORIZED") !== -1 ||
            text.indexOf("UNAUTHORIZED") !== -1 ||
            text.indexOf("NOT AUTHORIZED") !== -1 ||
            text.indexOf("PERMISSION") !== -1;
    }

    function getActiveTabId() {
        var activePanel = ui.panels.find(function (panel) {
            return panel.classList.contains("is-active");
        });
        return activePanel ? activePanel.id : "tab-login";
    }

    function getAlertTargetForActiveTab() {
        var activeTabId = getActiveTabId();
        if (activeTabId === "tab-cadastro") {
            return ui.cadastroAlert;
        }
        if (activeTabId === "tab-acompanhamento" || activeTabId === "tab-dashboard") {
            return ui.acompanhamentoAlert;
        }
        return ui.adminAlert;
    }

    function appendMissingPermission(target, label) {
        if (!label) {
            return;
        }
        if (target.indexOf(label) !== -1) {
            return;
        }
        target.push(label);
    }

    function isAdmin() {
        return authService.isAdminUser();
    }

    function normalizeText(value) {
        return (value || "")
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase();
    }

    function escapeHtml(text) {
        return (text || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function slugify(value) {
        return (value || "")
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .replace(/_+/g, "_");
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
        if (!value) {
            return 0;
        }
        var parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
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

    function formatDatePtBr(dateValue) {
        var raw = (dateValue || "").trim();
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

    function setTabsState(activeTabId) {
        ui.tabs.forEach(function (button) {
            var isActive = button.getAttribute("data-tab-target") === activeTabId;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        ui.panels.forEach(function (panel) {
            panel.classList.toggle("is-active", panel.id === activeTabId);
        });
    }

    function setAppAuthenticated(authenticated) {
        ui.tabs.forEach(function (button) {
            var targetId = button.getAttribute("data-tab-target");
            var isLoginTab = targetId === "tab-login";
            button.style.display = authenticated ? (isLoginTab ? "none" : "") : (isLoginTab ? "" : "none");
        });
        if (ui.sidebarLogoutButton) {
            ui.sidebarLogoutButton.style.display = authenticated ? "" : "none";
        }
        if (!authenticated) {
            setTabsState("tab-login");
        }
    }

    function resolveIntegradorId(typedValue) {
        var typed = (typedValue || "").trim();
        if (typed) {
            return typed;
        }
        if (isAdmin()) {
            return "";
        }
        return authService.getCurrentIntegradorId();
    }

    function getUniqueIntegradorIds(items) {
        var seen = {};
        return (items || [])
            .map(function (item) {
                return (item && item.integrador_id ? item.integrador_id : "").trim();
            })
            .filter(function (id) {
                return !!id;
            })
            .filter(function (id) {
                if (seen[id]) {
                    return false;
                }
                seen[id] = true;
                return true;
            })
            .sort(function (a, b) {
                return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
            });
    }

    function mergeIntegradorIds() {
        var seen = {};
        var all = [];
        Array.prototype.slice.call(arguments).forEach(function (list) {
            (Array.isArray(list) ? list : []).forEach(function (value) {
                var id = (value || "").toString().trim();
                if (!id) {
                    return;
                }
                var key = id.toLowerCase();
                if (seen[key]) {
                    return;
                }
                seen[key] = true;
                all.push(id);
            });
        });
        return all.sort(function (a, b) {
            return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
        });
    }

    function getStoredAdminIntegradorIds() {
        try {
            var raw = global.localStorage.getItem(ADMIN_INTEGRADORES_STORAGE_KEY);
            if (!raw) {
                return [];
            }
            return mergeIntegradorIds(JSON.parse(raw));
        } catch (error) {
            return [];
        }
    }

    function saveStoredAdminIntegradorIds(ids) {
        try {
            global.localStorage.setItem(ADMIN_INTEGRADORES_STORAGE_KEY, JSON.stringify(mergeIntegradorIds(ids)));
        } catch (error) {
            return;
        }
    }

    function rememberIntegradorIds(ids) {
        var merged = mergeIntegradorIds(integradorIdsCache, getStoredAdminIntegradorIds(), ids);
        integradorIdsCache = merged;
        saveStoredAdminIntegradorIds(merged);
    }

    function getUniqueClienteNomes(items) {
        var seen = {};
        return (items || [])
            .map(function (item) {
                return (item && item.nome_cliente ? item.nome_cliente : "").trim();
            })
            .filter(function (nome) {
                return !!nome;
            })
            .filter(function (nome) {
                var key = nome.toLowerCase();
                if (seen[key]) {
                    return false;
                }
                seen[key] = true;
                return true;
            })
            .sort(function (a, b) {
                return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
            });
    }

    function setIntegradorOptions(field, ids, emptyLabel, keepValue) {
        if (!field) {
            return;
        }
        var previous = keepValue ? (field.value || "") : "";
        var effectiveIds = Array.isArray(ids) ? ids.slice() : [];
        if (previous && effectiveIds.indexOf(previous) === -1) {
            effectiveIds.push(previous);
        }
        var options = ['<option value="">' + escapeHtml(emptyLabel) + "</option>"]
            .concat(effectiveIds.map(function (id) {
                return '<option value="' + escapeHtml(id) + '">' + escapeHtml(id) + "</option>";
            }))
            .concat(['<option value="__manual__">Digitar integrador_id...</option>']);
        field.innerHTML = options.join("");
        if (previous && previous !== "__manual__") {
            field.value = previous;
        }
    }

    function handleManualIntegradorSelection(field) {
        if (!field) {
            return false;
        }
        var selected = (field.value || "").trim();
        if (selected !== "__manual__") {
            return false;
        }
        var typed = (global.prompt("Informe o integrador_id:") || "").trim();
        if (!typed) {
            field.value = "";
            return true;
        }
        rememberIntegradorIds([typed]);
        applyIntegradorOptions(integradorIdsCache, true);
        field.value = typed;
        return true;
    }

    function applyIntegradorOptions(ids, keepValues) {
        var list = Array.isArray(ids) ? ids : [];
        setIntegradorOptions(ui.cadastroIntegradorId, list, "Selecione...", keepValues);
        setIntegradorOptions(ui.acompanhamentoIntegradorId, list, "Selecione...", keepValues);
        setIntegradorOptions(ui.dashboardIntegradorId, list, "Todos os integradores", keepValues);
    }

    function setNomeClienteOptions(items, keepValue) {
        if (!ui.acompanhamentoNomeCliente) {
            return;
        }
        var nomes = getUniqueClienteNomes(items);
        var previous = keepValue ? (ui.acompanhamentoNomeCliente.value || "") : "";
        var options = ['<option value="">Selecione um cliente...</option>'].concat(nomes.map(function (nome) {
            return '<option value="' + escapeHtml(nome) + '">' + escapeHtml(nome) + "</option>";
        }));
        ui.acompanhamentoNomeCliente.innerHTML = options.join("");
        if (previous && nomes.indexOf(previous) !== -1) {
            ui.acompanhamentoNomeCliente.value = previous;
        }
    }

    function updateAcompanhamentoSectionsVisibility() {
        var fase = normalizeText(ui.acompanhamentoFase ? ui.acompanhamentoFase.value : "");
        var hasFase = !!fase;
        var hasIntervalo = !!INTERVALO_FASES[fase];
        if (ui.acompanhamentoFaseDataSection) {
            ui.acompanhamentoFaseDataSection.style.display = hasFase ? "block" : "none";
        }
        if (ui.acompanhamentoFaseIntervaloFields) {
            ui.acompanhamentoFaseIntervaloFields.style.display = hasFase && hasIntervalo ? "grid" : "none";
        }
        if (ui.acompanhamentoFaseOcorrenciaField) {
            ui.acompanhamentoFaseOcorrenciaField.style.display = hasFase && !hasIntervalo ? "grid" : "none";
        }
        if (ui.acompanhamentoHomologacaoSection) {
            ui.acompanhamentoHomologacaoSection.style.display = fase === "HOMOLOGACAO" ? "block" : "none";
        }
        if (ui.acompanhamentoVistoriaSection) {
            ui.acompanhamentoVistoriaSection.style.display = fase === "VISTORIA" ? "block" : "none";
        }
    }

    function updateCadastroSectionsVisibility() {
        var fase = normalizeText(ui.cadastroFase ? ui.cadastroFase.value : "");
        var hasFase = !!fase;
        var hasIntervalo = !!INTERVALO_FASES[fase];
        if (ui.cadastroFaseDataSection) {
            ui.cadastroFaseDataSection.style.display = hasFase ? "block" : "none";
        }
        if (ui.cadastroFaseIntervaloFields) {
            ui.cadastroFaseIntervaloFields.style.display = hasFase && hasIntervalo ? "grid" : "none";
        }
        if (ui.cadastroFaseOcorrenciaField) {
            ui.cadastroFaseOcorrenciaField.style.display = hasFase && !hasIntervalo ? "grid" : "none";
        }
    }

    function refreshAcompanhamentoNomeOptions() {
        if (!authService.getCurrentSession()) {
            setNomeClienteOptions([], false);
            return;
        }
        var integradorId = resolveIntegradorId(ui.acompanhamentoIntegradorId ? ui.acompanhamentoIntegradorId.value : "");
        if (!integradorId && !isAdmin()) {
            setNomeClienteOptions([], false);
            return;
        }
        getIntegradorScopedClientes(integradorId).then(function (items) {
            setNomeClienteOptions(items, true);
            if (scopeWarningMessage) {
                showAlert(ui.acompanhamentoAlert, scopeWarningMessage, "error");
            }
        }).catch(function () {
            setNomeClienteOptions([], false);
        });
    }

    function refreshIntegradorOptionsForAdmin() {
        if (!isAdmin() || !authService.getCurrentSession()) {
            return Promise.resolve([]);
        }
        var permissionDenied = false;
        var missingPermissions = [];
        var fromClientes = clientesService.listAllClientesAsAdmin().then(function (items) {
            return getUniqueIntegradorIds(items);
        }).catch(function (error) {
            if (isPermissionError(error)) {
                permissionDenied = true;
                appendMissingPermission(missingPermissions, "dynamodb:Scan (tabela Acompanhamento)");
            }
            return [];
        });

        var fromUsers = typeof authService.listIntegradorIdsAsAdmin === "function"
            ? authService.listIntegradorIdsAsAdmin().catch(function (error) {
                if (isPermissionError(error)) {
                    permissionDenied = true;
                    appendMissingPermission(missingPermissions, "cognito-idp:ListUsers (User Pool)");
                }
                return [];
            })
            : Promise.resolve([]);

        return Promise.all([fromClientes, fromUsers]).then(function (results) {
            var fallback = authService.getCurrentIntegradorId();
            var merged = mergeIntegradorIds(
                results[0],
                results[1],
                fallback ? [fallback] : []
            );
            rememberIntegradorIds(merged);
            applyIntegradorOptions(integradorIdsCache, true);
            var hasClientesSource = Array.isArray(results[0]) && results[0].length > 0;
            var hasUsersSource = Array.isArray(results[1]) && results[1].length > 0;
            if (permissionDenied && !hasClientesSource && !hasUsersSource) {
                var permissionsText = missingPermissions.length > 0
                    ? (" Permissão ausente: " + missingPermissions.join(" | ") + ".")
                    : "";
                showAlert(
                    getAlertTargetForActiveTab(),
                    "Sem permissão para verificar a lista completa de integradores." + permissionsText + " Exibindo opções disponíveis.",
                    "error"
                );
            }
            return integradorIdsCache;
        }).catch(function () {
            var fallback = authService.getCurrentIntegradorId();
            rememberIntegradorIds(fallback ? [fallback] : []);
            applyIntegradorOptions(integradorIdsCache, true);
            return integradorIdsCache;
        });
    }

    function createClienteIdAuto(nomeCliente, cidade, existingItems) {
        var baseNome = slugify(nomeCliente) || "cliente";
        var baseCidade = slugify(cidade);
        var base = baseCidade ? (baseNome + "_" + baseCidade) : baseNome;
        var existingIds = (existingItems || []).map(function (item) {
            return (item.cliente_id || "").toLowerCase();
        });

        if (existingIds.indexOf(base.toLowerCase()) === -1) {
            return base;
        }

        var seq = 2;
        while (seq < 10000) {
            var candidate = base + "_" + ("0" + seq).slice(-2);
            if (existingIds.indexOf(candidate.toLowerCase()) === -1) {
                return candidate;
            }
            seq += 1;
        }
        return base + "_" + Date.now();
    }

    function getIntegradorScopedClientes(integradorId) {
        scopeWarningMessage = "";
        if (!integradorId) {
            if (isAdmin()) {
                return clientesService.listAllClientesAsAdmin().then(function (items) {
                    currentClientes = Array.isArray(items) ? items : [];
                    return currentClientes;
                }).catch(function () {
                    var fallbackIntegradorId = authService.getCurrentIntegradorId();
                    if (!fallbackIntegradorId) {
                        throw new Error("Falha ao buscar todos os integradores e não há integrador_id no token para fallback.");
                    }
                    scopeWarningMessage = "Sem permissão para listar todos os integradores. Exibindo apenas o integrador do token: " + fallbackIntegradorId + ".";
                    return clientesService.listClientesByIntegrador(fallbackIntegradorId).then(function (fallbackItems) {
                        currentClientes = Array.isArray(fallbackItems) ? fallbackItems : [];
                        return currentClientes;
                    });
                });
            }
            return Promise.reject(new Error("Não foi possível definir integrador_id."));
        }
        return clientesService.listClientesByIntegrador(integradorId).then(function (items) {
            currentClientes = Array.isArray(items) ? items : [];
            return currentClientes;
        });
    }

    function historyToValues(history, currentValue) {
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

    function normalizeCliente(item) {
        var protocoloHomologacaoAtual = (item.protocolo_homologacao_atual || "").trim();
        var protocoloVistoriaAtual = (item.protocolo_vistoria_atual || "").trim();
        return {
            integrador_id: item.integrador_id || "",
            cliente_id: item.cliente_id || "",
            nome_cliente: item.nome_cliente || "",
            cidade: item.cidade || "",
            fase: item.fase || "ANALISE_DOCUMENTOS",
            faseNorm: normalizeText(item.fase || ""),
            protocolo_homologacao_atual: protocoloHomologacaoAtual,
            protocolo_homologacao_historico: historyToValues(item.protocolo_homologacao_historico, protocoloHomologacaoAtual),
            data_inicial_homologacao: item.data_inicial_homologacao || "",
            data_final_homologacao: item.data_final_homologacao || "",
            protocolo_vistoria_atual: protocoloVistoriaAtual,
            protocolo_vistoria_historico: historyToValues(item.protocolo_vistoria_historico, protocoloVistoriaAtual),
            data_inicial_vistoria: item.data_inicial_vistoria || "",
            data_final_vistoria: item.data_final_vistoria || "",
            fase_data_inicial: item.fase_data_inicial || "",
            fase_data_final: item.fase_data_final || "",
            fase_data_ocorrencia: item.fase_data_ocorrencia || "",
            fase_historico: normalizeFaseHistoryEntries(item.fase_historico),
            updated_at: item.updated_at || item.created_at || "",
            sortTime: parseDateValue(item.updated_at || item.created_at || "")
        };
    }

    function updateSessionInfo() {
        var username = authService.getCurrentUsername();
        var integradorId = authService.getCurrentIntegradorId();
        var admin = isAdmin();
        if (ui.adminSessionInfo) {
            ui.adminSessionInfo.textContent = username
                ? ("Logado como " + username + " | integrador_id do token: " + (integradorId || "-") + " | perfil: " + (admin ? "ADMIN" : "INTEGRADOR"))
                : "Sem sessão ativa";
        }
        if (ui.adminLogoutButton) {
            ui.adminLogoutButton.disabled = !username;
        }
        if (ui.userCreateButton) {
            ui.userCreateButton.disabled = !username || !admin;
        }
    }

    function setAuthLoading(isLoading) {
        if (!ui.adminLoginButton) {
            return;
        }
        ui.adminLoginButton.disabled = isLoading;
        ui.adminLoginButton.textContent = isLoading ? "Processando..." : (pendingChallenge ? "Definir nova senha" : "Entrar");
    }

    function setAdminChallengeMode(challenge) {
        pendingChallenge = challenge || null;
        if (challenge && typeof challenge.rememberSession === "boolean") {
            rememberSession = challenge.rememberSession;
        }
        if (ui.adminRememberSession && !pendingChallenge) {
            rememberSession = !!ui.adminRememberSession.checked;
        }
        if (ui.adminNewPasswordWrap) {
            ui.adminNewPasswordWrap.style.display = challenge ? "block" : "none";
        }
        if (ui.adminLoginNewPassword) {
            ui.adminLoginNewPassword.required = !!challenge;
            if (!challenge) {
                ui.adminLoginNewPassword.value = "";
            }
        }
        if (ui.adminLoginEmail) {
            ui.adminLoginEmail.readOnly = !!challenge;
        }
        if (ui.adminLoginPassword) {
            ui.adminLoginPassword.readOnly = !!challenge;
        }
    }

    function preloadIntegradorFields() {
        var tokenIntegradorId = authService.getCurrentIntegradorId();
        var admin = isAdmin();

        [ui.cadastroIntegradorId, ui.acompanhamentoIntegradorId, ui.dashboardIntegradorId].forEach(function (field) {
            if (!field) {
                return;
            }
            if (!admin) {
                setIntegradorOptions(field, tokenIntegradorId ? [tokenIntegradorId] : [], field === ui.dashboardIntegradorId ? "Todos os integradores" : "Selecione...", false);
                field.value = tokenIntegradorId || "";
                field.disabled = true;
            } else {
                field.disabled = false;
            }
        });
        if (admin) {
            applyIntegradorOptions(integradorIdsCache, true);
        }
    }

    function renderCadastroList(items) {
        if (!ui.cadastroLista) {
            return;
        }

        var query = (ui.cadastroSearch.value || "").trim().toLowerCase();
        var filtered = (items || []).filter(function (item) {
            if (!query) {
                return true;
            }
            var nome = (item.nome_cliente || "").toLowerCase();
            var id = (item.cliente_id || "").toLowerCase();
            return nome.indexOf(query) !== -1 || id.indexOf(query) !== -1;
        });

        if (filtered.length === 0) {
            ui.cadastroLista.innerHTML = '<p class="sys-empty">Nenhum cliente encontrado.</p>';
            return;
        }

        ui.cadastroLista.innerHTML = filtered.map(function (item) {
            return "" +
                '<button class="sys-list-item" type="button" data-cliente-id="' + escapeHtml(item.cliente_id || "") + '">' +
                '<span class="sys-list-item-name">' + escapeHtml(item.nome_cliente || "Sem nome") + "</span>" +
                '<span class="sys-list-item-meta">' + escapeHtml(item.integrador_id || "-") + " | " + escapeHtml(item.cliente_id || "-") + " | " + escapeHtml(item.cidade || "-") + "</span>" +
                "</button>";
        }).join("");

        Array.prototype.slice.call(ui.cadastroLista.querySelectorAll(".sys-list-item")).forEach(function (button) {
            button.addEventListener("click", function () {
                var id = button.getAttribute("data-cliente-id") || "";
                var found = currentClientes.find(function (item) {
                    return (item.cliente_id || "") === id;
                });
                if (!found) {
                    return;
                }
                if (isAdmin() && !ui.cadastroIntegradorId.value) {
                    ui.cadastroIntegradorId.value = found.integrador_id || "";
                }
                ui.cadastroClienteId.value = found.cliente_id || "";
                ui.cadastroNome.value = found.nome_cliente || "";
                ui.cadastroCidade.value = found.cidade || "";
                showAlert(ui.cadastroAlert, "Cliente carregado para referencia.", "success");
            });
        });
    }

    function refreshCadastroList() {
        if (!authService.getCurrentSession()) {
            renderCadastroList([]);
            return;
        }
        var integradorId = resolveIntegradorId(ui.cadastroIntegradorId.value);
        if (!integradorId && !isAdmin()) {
            renderCadastroList([]);
            return;
        }
        getIntegradorScopedClientes(integradorId).then(function (items) {
            renderCadastroList(items);
            if (scopeWarningMessage) {
                showAlert(ui.cadastroAlert, scopeWarningMessage, "error");
            }
        }).catch(function () {
            renderCadastroList([]);
        });
    }

    function renderHistorico(target, values) {
        if (!target) {
            return;
        }
        if (!values || values.length === 0) {
            target.innerHTML = '<span class="hist-pill">Sem histórico</span>';
            return;
        }
        target.innerHTML = values.map(function (value) {
            return '<span class="hist-pill">' + escapeHtml(value) + "</span>";
        }).join("");
    }

    function fillAcompanhamentoForm(cliente) {
        selectedCliente = cliente || null;
        if (!cliente) {
            ui.acompanhamentoClienteId.value = "";
            ui.acompanhamentoCidade.value = "";
            ui.acompanhamentoFase.value = "";
            ui.acompanhamentoProtocoloHomologacao.value = "";
            ui.acompanhamentoDataInicialHomologacao.value = "";
            ui.acompanhamentoDataFinalHomologacao.value = "";
            ui.acompanhamentoProtocoloVistoria.value = "";
            ui.acompanhamentoDataInicialVistoria.value = "";
            ui.acompanhamentoDataFinalVistoria.value = "";
            if (ui.acompanhamentoFaseDataInicial) {
                ui.acompanhamentoFaseDataInicial.value = "";
            }
            if (ui.acompanhamentoFaseDataFinal) {
                ui.acompanhamentoFaseDataFinal.value = "";
            }
            if (ui.acompanhamentoFaseDataOcorrencia) {
                ui.acompanhamentoFaseDataOcorrencia.value = "";
            }
            renderHistorico(ui.acompanhamentoHistoricoHomologacao, []);
            renderHistorico(ui.acompanhamentoHistoricoVistoria, []);
            updateAcompanhamentoSectionsVisibility();
            return;
        }

        ui.acompanhamentoClienteId.value = cliente.cliente_id || "";
        ui.acompanhamentoCidade.value = cliente.cidade || "";
        ui.acompanhamentoFase.value = cliente.fase || "";
        ui.acompanhamentoProtocoloHomologacao.value = cliente.protocolo_homologacao_atual || "";
        ui.acompanhamentoDataInicialHomologacao.value = cliente.data_inicial_homologacao || "";
        ui.acompanhamentoDataFinalHomologacao.value = cliente.data_final_homologacao || "";
        ui.acompanhamentoProtocoloVistoria.value = cliente.protocolo_vistoria_atual || "";
        ui.acompanhamentoDataInicialVistoria.value = cliente.data_inicial_vistoria || "";
        ui.acompanhamentoDataFinalVistoria.value = cliente.data_final_vistoria || "";
        if (ui.acompanhamentoFaseDataInicial) {
            ui.acompanhamentoFaseDataInicial.value = cliente.fase_data_inicial || "";
        }
        if (ui.acompanhamentoFaseDataFinal) {
            ui.acompanhamentoFaseDataFinal.value = cliente.fase_data_final || "";
        }
        if (ui.acompanhamentoFaseDataOcorrencia) {
            ui.acompanhamentoFaseDataOcorrencia.value = cliente.fase_data_ocorrencia || "";
        }
        renderHistorico(ui.acompanhamentoHistoricoHomologacao, cliente.protocolo_homologacao_historico || []);
        renderHistorico(ui.acompanhamentoHistoricoVistoria, cliente.protocolo_vistoria_historico || []);
        updateAcompanhamentoSectionsVisibility();
    }

    function computeCards(items) {
        var total = items.length;
        var homologacao = items.filter(function (item) {
            return item.faseNorm.indexOf("HOMOLOGACAO") !== -1;
        }).length;
        var vistoria = items.filter(function (item) {
            return item.faseNorm.indexOf("VISTORIA") !== -1;
        }).length;
        var ligados = items.filter(function (item) {
            return item.faseNorm.indexOf("CLIENTE_CONECTADO") !== -1;
        }).length;

        ui.cardTotal.textContent = String(total);
        ui.cardHomologacao.textContent = String(homologacao);
        ui.cardVistoria.textContent = String(vistoria);
        ui.cardLigados.textContent = String(ligados);
    }

    function getFaseDataDisplay(item) {
        var faseNorm = normalizeText(item && item.fase ? item.fase : "");
        var isIntervalo = !!INTERVALO_FASES[faseNorm];
        var inicial = formatDatePtBr(item && item.fase_data_inicial ? item.fase_data_inicial : "");
        var final = formatDatePtBr(item && item.fase_data_final ? item.fase_data_final : "");
        var ocorrencia = formatDatePtBr(item && item.fase_data_ocorrencia ? item.fase_data_ocorrencia : "");

        if (isIntervalo) {
            if (inicial && final) {
                return inicial + " a " + final;
            }
            if (inicial) {
                return "Inicio: " + inicial;
            }
            if (final) {
                return "Fim: " + final;
            }
            return "-";
        }

        return ocorrencia || "-";
    }

    function getFaseDataDisplayFromEntry(entry) {
        return getFaseDataDisplay({
            fase: entry.fase || "",
            fase_data_inicial: entry.fase_data_inicial || "",
            fase_data_final: entry.fase_data_final || "",
            fase_data_ocorrencia: entry.fase_data_ocorrencia || ""
        });
    }

    function closeHistoricoModal() {
        if (!ui.historicoModalOverlay) {
            return;
        }
        ui.historicoModalOverlay.classList.remove("is-open");
        ui.historicoModalOverlay.setAttribute("aria-hidden", "true");
    }

    function openHistoricoModal(cliente) {
        if (!ui.historicoModalOverlay || !cliente) {
            return;
        }
        var historico = normalizeFaseHistoryEntries(cliente.fase_historico);
        if (historico.length === 0 && cliente.fase) {
            historico = [{
                fase: cliente.fase,
                fase_data_inicial: cliente.fase_data_inicial || "",
                fase_data_final: cliente.fase_data_final || "",
                fase_data_ocorrencia: cliente.fase_data_ocorrencia || "",
                registrado_em: cliente.updated_at || ""
            }];
        }

        if (ui.historicoModalTitle) {
            ui.historicoModalTitle.textContent = "Histórico de fases";
        }
        if (ui.historicoModalSubtitle) {
            ui.historicoModalSubtitle.textContent = "Cliente: " + (cliente.nome_cliente || "-") + " | ID: " + (cliente.cliente_id || "-") + " | Integrador: " + (cliente.integrador_id || "-");
        }

        if (!ui.historicoModalList) {
            return;
        }

        if (!historico || historico.length === 0) {
            ui.historicoModalList.innerHTML = '<p class="sys-empty">Sem histórico.</p>';
        } else {
            ui.historicoModalList.innerHTML = historico.map(function (entry, index) {
                var dataFase = getFaseDataDisplayFromEntry(entry);
                var registradoEm = formatDatePtBr(entry.registrado_em || "");
                return '' +
                    '<article class="sys-history-item">' +
                    '<h4>' + escapeHtml(String(index + 1) + ". " + getFaseLabel(entry.fase || "-")) + "</h4>" +
                    "<p><strong>Data da fase:</strong> " + escapeHtml(dataFase || "-") + "</p>" +
                    "<p><strong>Registro:</strong> " + escapeHtml(registradoEm || "-") + "</p>" +
                    "</article>";
            }).join("");
        }

        ui.historicoModalOverlay.classList.add("is-open");
        ui.historicoModalOverlay.setAttribute("aria-hidden", "false");
    }

    function openClienteInAcompanhamento(cliente) {
        setTabsState("tab-acompanhamento");
        ui.acompanhamentoNomeCliente.value = cliente.nome_cliente || "";
        ui.acompanhamentoIntegradorId.value = cliente.integrador_id || resolveIntegradorId(ui.acompanhamentoIntegradorId.value);
        fillAcompanhamentoForm(cliente);
        showAlert(ui.acompanhamentoAlert, "Cliente aberto para edicao a partir do dashboard.", "success");
    }

    function renderDashboardTable(items) {
        if (!ui.dashboardTbody) {
            return;
        }

        var query = (ui.dashboardBusca.value || "").trim().toLowerCase();
        var filtered = items.filter(function (item) {
            if (!query) {
                return true;
            }
            return (item.nome_cliente || "").toLowerCase().indexOf(query) !== -1 ||
                (item.cliente_id || "").toLowerCase().indexOf(query) !== -1 ||
                (item.fase || "").toLowerCase().indexOf(query) !== -1;
        }).sort(function (a, b) {
            if (b.sortTime !== a.sortTime) {
                return b.sortTime - a.sortTime;
            }
            return (a.nome_cliente || "").localeCompare(b.nome_cliente || "", "pt-BR", { sensitivity: "base" });
        });

        if (filtered.length === 0) {
            ui.dashboardTbody.innerHTML = '<tr><td colspan="9" class="sys-empty-cell">Nenhum cliente encontrado.</td></tr>';
            return;
        }

        ui.dashboardTbody.innerHTML = filtered.map(function (item) {
            var faseLabel = getFaseLabel(item.fase);
            var faseBadgeClass = isFaseIndeferida(item.fase) ? "fase-badge is-indeferida" : "fase-badge";
            return "" +
                "<tr>" +
                "<td>" + escapeHtml(item.integrador_id || "-") + "</td>" +
                "<td>" + escapeHtml(item.cliente_id) + "</td>" +
                "<td>" + escapeHtml(item.nome_cliente) + "</td>" +
                "<td>" + escapeHtml(item.cidade || "-") + "</td>" +
                '<td><span class="' + faseBadgeClass + '">' + escapeHtml(faseLabel) + "</span></td>" +
                "<td>" + escapeHtml(getFaseDataDisplay(item)) + "</td>" +
                "<td>" + escapeHtml(item.protocolo_homologacao_atual || "-") + "</td>" +
                "<td>" + escapeHtml(item.protocolo_vistoria_atual || "-") + "</td>" +
                '<td class="sys-table-actions-cell">' +
                '<button type="button" class="sys-btn-inline" data-action="edit" data-id="' + escapeHtml(item.cliente_id) + '">Editar</button>' +
                '<button type="button" class="sys-btn-inline info" data-action="history" data-id="' + escapeHtml(item.cliente_id) + '">Histórico</button>' +
                '<button type="button" class="sys-btn-inline danger" data-action="delete" data-id="' + escapeHtml(item.cliente_id) + '">Excluir</button>' +
                "</td>" +
                "</tr>";
        }).join("");

        Array.prototype.slice.call(ui.dashboardTbody.querySelectorAll("button[data-action]")).forEach(function (button) {
            button.addEventListener("click", function () {
                var action = button.getAttribute("data-action");
                var clienteId = button.getAttribute("data-id") || "";
                var found = currentClientes.map(normalizeCliente).find(function (item) {
                    return item.cliente_id === clienteId;
                });
                if (!found) {
                    return;
                }
                if (action === "edit") {
                    openClienteInAcompanhamento(found);
                    return;
                }
                if (action === "history") {
                    openHistoricoModal(found);
                    return;
                }
                if (action === "delete") {
                    onDeleteFromDashboard(found);
                }
            });
        });
    }

    function refreshDashboard() {
        if (!authService.getCurrentSession()) {
            computeCards([]);
            renderDashboardTable([]);
            return;
        }

        var integradorId = resolveIntegradorId(ui.dashboardIntegradorId.value);
        if (!integradorId && !isAdmin()) {
            computeCards([]);
            renderDashboardTable([]);
            return;
        }

        ui.dashboardAtualizarBtn.disabled = true;
        ui.dashboardAtualizarBtn.textContent = "Atualizando...";

        getIntegradorScopedClientes(integradorId).then(function (items) {
            var normalized = items.map(normalizeCliente);
            computeCards(normalized);
            renderDashboardTable(normalized);
            renderCadastroList(items);
            setNomeClienteOptions(items, true);
            if (scopeWarningMessage) {
                showAlert(ui.acompanhamentoAlert, scopeWarningMessage, "error");
            }
        }).catch(function (error) {
            computeCards([]);
            renderDashboardTable([]);
            showAlert(ui.acompanhamentoAlert, error && error.message ? error.message : "Falha ao carregar dashboard.", "error");
        }).finally(function () {
            ui.dashboardAtualizarBtn.disabled = false;
            ui.dashboardAtualizarBtn.textContent = "Atualizar";
        });
    }

    function onDeleteFromDashboard(cliente) {
        if (!cliente || !cliente.cliente_id) {
            return;
        }

        var confirmed = global.confirm("Excluir cliente " + cliente.nome_cliente + " (" + cliente.cliente_id + ")?");
        if (!confirmed) {
            return;
        }

        var integradorId = resolveIntegradorId(ui.dashboardIntegradorId.value) || cliente.integrador_id;
        if (!integradorId) {
            return;
        }
        rememberIntegradorIds([integradorId]);

        var run = isAdmin()
            ? clientesService.deleteClienteAsAdmin(integradorId, cliente.cliente_id)
            : clientesService.deleteClienteDoIntegradorLogado(cliente.cliente_id);

        run.then(function () {
            refreshDashboard();
            refreshCadastroList();
            refreshIntegradorOptionsForAdmin();
        }).catch(function (error) {
            showAlert(ui.acompanhamentoAlert, error && error.message ? error.message : "Falha ao excluir cliente.", "error");
        });
    }

    function onAdminLogin(event) {
        event.preventDefault();
        showAlert(ui.adminAlert, "", "error");
        setAuthLoading(true);

        var email = (ui.adminLoginEmail.value || "").trim();
        var password = (ui.adminLoginPassword.value || "").trim();
        if (!pendingChallenge) {
            rememberSession = !!(ui.adminRememberSession && ui.adminRememberSession.checked);
        }
        if (!pendingChallenge && (!email || !password)) {
            showAlert(ui.adminAlert, "Informe e-mail e senha.", "error");
            setAuthLoading(false);
            return;
        }

        if (pendingChallenge) {
            var typedNewPassword = (ui.adminLoginNewPassword.value || "").trim();
            if (!typedNewPassword) {
                showAlert(ui.adminAlert, "Informe a nova senha para concluir o primeiro login.", "error");
                setAuthLoading(false);
                return;
            }
        }

        var run = pendingChallenge
            ? authService.completeNewPassword(
                pendingChallenge.username,
                (ui.adminLoginNewPassword.value || "").trim(),
                pendingChallenge.session,
                { remember: rememberSession }
            )
            : authService.signIn(email, password, { remember: rememberSession });

        run.then(function (result) {
            if (result && result.challengeName === "NEW_PASSWORD_REQUIRED") {
                setAdminChallengeMode(result);
                showAlert(ui.adminAlert, "Primeiro acesso detectado. Defina uma nova senha para continuar.", "error");
                return;
            }
            setAdminChallengeMode(null);
            showAlert(ui.adminAlert, "Sessão iniciada.", "success");
            ui.adminLoginPassword.value = "";
            if (ui.adminLoginNewPassword) {
                ui.adminLoginNewPassword.value = "";
            }
            updateSessionInfo();
            preloadIntegradorFields();
            refreshIntegradorOptionsForAdmin();
            setAppAuthenticated(true);
            setTabsState("tab-cadastro");
            refreshCadastroList();
            refreshDashboard();
        }).catch(function (error) {
            var message = "Falha no login.";
            if (error && error.code === "NotAuthorizedException") {
                if (pendingChallenge) {
                    message = "Sessão para definir nova senha expirou ou ficou inválida. Entre novamente com e-mail e senha temporária.";
                    setAdminChallengeMode(null);
                } else {
                    message = "Usuário ou senha inválidos.";
                }
            } else if (error && error.code === "InvalidPasswordException") {
                message = "Nova senha não atende à política do Cognito.";
            } else if (error && error.message) {
                message = error.message;
            }
            showAlert(ui.adminAlert, message, "error");
        }).finally(function () {
            setAuthLoading(false);
        });
    }

    function onAdminLogout() {
        authService.signOut();
        setAdminChallengeMode(null);
        currentClientes = [];
        selectedCliente = null;
        renderDashboardTable([]);
        renderCadastroList([]);
        showAlert(ui.adminAlert, "Sessão encerrada.", "success");
        setAppAuthenticated(false);
        setTabsState("tab-login");
        updateSessionInfo();
        preloadIntegradorFields();
    }

    function onGerarClienteId() {
        showAlert(ui.cadastroAlert, "", "error");
        if (!authService.getCurrentSession()) {
            showAlert(ui.cadastroAlert, "Faça login antes de gerar cliente_id.", "error");
            return;
        }

        var integradorId = resolveIntegradorId(ui.cadastroIntegradorId.value);
        if (!integradorId) {
            showAlert(ui.cadastroAlert, "Informe integrador_id para gerar o cliente_id.", "error");
            return;
        }

        var nome = (ui.cadastroNome.value || "").trim();
        var cidade = (ui.cadastroCidade.value || "").trim();
        if (!nome) {
            showAlert(ui.cadastroAlert, "Informe nome_cliente para gerar cliente_id.", "error");
            return;
        }

        ui.cadastroGerarIdBtn.disabled = true;
        getIntegradorScopedClientes(integradorId).then(function (items) {
            var generated = createClienteIdAuto(nome, cidade, items);
            ui.cadastroClienteId.value = generated;
            showAlert(ui.cadastroAlert, "cliente_id gerado automaticamente: " + generated, "success");
            renderCadastroList(items);
        }).catch(function (error) {
            showAlert(ui.cadastroAlert, error && error.message ? error.message : "Falha ao gerar cliente_id.", "error");
        }).finally(function () {
            ui.cadastroGerarIdBtn.disabled = false;
        });
    }

    function onCadastroSave(event) {
        event.preventDefault();
        showAlert(ui.cadastroAlert, "", "error");

        if (!authService.getCurrentSession()) {
            showAlert(ui.cadastroAlert, "Faça login antes de salvar.", "error");
            return;
        }

        var integradorId = resolveIntegradorId(ui.cadastroIntegradorId.value);
        if (!integradorId) {
            showAlert(ui.cadastroAlert, "Informe integrador_id.", "error");
            return;
        }
        rememberIntegradorIds([integradorId]);

        var payload = {
            cliente_id: (ui.cadastroClienteId.value || "").trim(),
            nome_cliente: (ui.cadastroNome.value || "").trim(),
            cidade: (ui.cadastroCidade.value || "").trim(),
            fase: (ui.cadastroFase.value || "").trim(),
            protocolo_homologacao_atual: "",
            protocolo_homologacao_historico: [],
            data_inicial_homologacao: "",
            data_final_homologacao: "",
            protocolo_vistoria_atual: "",
            protocolo_vistoria_historico: [],
            data_inicial_vistoria: "",
            data_final_vistoria: "",
            fase_data_inicial: "",
            fase_data_final: "",
            fase_data_ocorrencia: ""
        };

        if (!payload.nome_cliente) {
            showAlert(ui.cadastroAlert, "Informe nome_cliente.", "error");
            return;
        }

        if (!payload.cliente_id) {
            showAlert(ui.cadastroAlert, "Gere ou informe cliente_id.", "error");
            return;
        }

        if (!payload.fase) {
            showAlert(ui.cadastroAlert, "Selecione a fase inicial.", "error");
            return;
        }

        var faseNormalizada = normalizeText(payload.fase);
        var faseIntervalo = !!INTERVALO_FASES[faseNormalizada];
        var faseDataInicial = faseIntervalo ? (ui.cadastroFaseDataInicial.value || "").trim() : "";
        var faseDataFinal = faseIntervalo ? (ui.cadastroFaseDataFinal.value || "").trim() : "";
        var faseDataOcorrencia = faseIntervalo ? "" : (ui.cadastroFaseDataOcorrencia.value || "").trim();

        if (faseIntervalo && !faseDataInicial) {
            showAlert(ui.cadastroAlert, "Informe a data inicial da fase.", "error");
            return;
        }
        if (!faseIntervalo && !faseDataOcorrencia) {
            showAlert(ui.cadastroAlert, "Informe a data de ocorrência da fase.", "error");
            return;
        }

        payload.fase_data_inicial = faseDataInicial;
        payload.fase_data_final = faseDataFinal;
        payload.fase_data_ocorrencia = faseDataOcorrencia;
        if (faseNormalizada === "HOMOLOGACAO" && faseIntervalo) {
            payload.data_inicial_homologacao = faseDataInicial;
            payload.data_final_homologacao = faseDataFinal;
        }
        if (faseNormalizada === "VISTORIA" && faseIntervalo) {
            payload.data_inicial_vistoria = faseDataInicial;
            payload.data_final_vistoria = faseDataFinal;
        }

        ui.cadastroSalvarBtn.disabled = true;
        ui.cadastroSalvarBtn.textContent = "Salvando...";

        var run = isAdmin()
            ? clientesService.upsertClienteAsAdmin(payload, integradorId)
            : clientesService.upsertClienteDoIntegradorLogado(payload);

        run.then(function (savedItem) {
            showAlert(ui.cadastroAlert, "Cliente salvo: " + savedItem.cliente_id, "success");
            refreshCadastroList();
            refreshDashboard();
        }).catch(function (error) {
            showAlert(ui.cadastroAlert, error && error.message ? error.message : "Falha ao salvar cliente.", "error");
        }).finally(function () {
            ui.cadastroSalvarBtn.disabled = false;
            ui.cadastroSalvarBtn.textContent = "Salvar cliente";
        });
    }

    function onCadastroLimpar() {
        ui.cadastroForm.reset();
        if (ui.cadastroFase) {
            ui.cadastroFase.value = "ANALISE_DOCUMENTOS";
        }
        updateCadastroSectionsVisibility();
        preloadIntegradorFields();
        showAlert(ui.cadastroAlert, "", "error");
        refreshCadastroList();
    }

    function onBuscarAcompanhamento() {
        showAlert(ui.acompanhamentoAlert, "", "error");
        if (!authService.getCurrentSession()) {
            showAlert(ui.acompanhamentoAlert, "Faça login antes de buscar cliente.", "error");
            return;
        }

        var integradorId = resolveIntegradorId(ui.acompanhamentoIntegradorId.value);
        var nomeCliente = normalizeText(ui.acompanhamentoNomeCliente.value);
        if (integradorId) {
            rememberIntegradorIds([integradorId]);
        }
        if (!integradorId && !isAdmin()) {
            showAlert(ui.acompanhamentoAlert, "Informe integrador_id para busca.", "error");
            return;
        }
        if (!nomeCliente) {
            showAlert(ui.acompanhamentoAlert, "Informe nome_cliente para busca.", "error");
            return;
        }

        ui.acompanhamentoBuscarBtn.disabled = true;
        ui.acompanhamentoBuscarBtn.textContent = "Buscando...";

        getIntegradorScopedClientes(integradorId).then(function (items) {
            var normalizedItems = items.map(normalizeCliente);
            var exactMatches = normalizedItems.filter(function (item) {
                return normalizeText(item.nome_cliente) === nomeCliente;
            });
            if (scopeWarningMessage) {
                showAlert(ui.acompanhamentoAlert, scopeWarningMessage, "error");
            }
            if (exactMatches.length > 1 && isAdmin() && !integradorId) {
                fillAcompanhamentoForm(null);
                showAlert(ui.acompanhamentoAlert, "Mais de um cliente com esse nome foi encontrado. Informe integrador_id para filtrar.", "error");
                return;
            }
            var found = exactMatches.length > 0 ? exactMatches[0] : null;
            if (!found) {
                fillAcompanhamentoForm(null);
                showAlert(ui.acompanhamentoAlert, "Cliente não encontrado para esse integrador_id.", "error");
                return;
            }
            if (isAdmin() && !integradorId) {
                ui.acompanhamentoIntegradorId.value = found.integrador_id || "";
            }
            fillAcompanhamentoForm(found);
            showAlert(ui.acompanhamentoAlert, "Cliente encontrado. Atualize os campos e salve.", "success");
        }).catch(function (error) {
            showAlert(ui.acompanhamentoAlert, error && error.message ? error.message : "Falha ao buscar cliente.", "error");
        }).finally(function () {
            ui.acompanhamentoBuscarBtn.disabled = false;
            ui.acompanhamentoBuscarBtn.textContent = "Buscar cliente";
        });
    }

    function onSalvarAcompanhamento(event) {
        event.preventDefault();
        showAlert(ui.acompanhamentoAlert, "", "error");

        if (!authService.getCurrentSession()) {
            showAlert(ui.acompanhamentoAlert, "Faça login antes de salvar.", "error");
            return;
        }
        if (!selectedCliente || !selectedCliente.cliente_id) {
            showAlert(ui.acompanhamentoAlert, "Busque um cliente antes de salvar o acompanhamento.", "error");
            return;
        }

        var fase = (ui.acompanhamentoFase.value || "").trim();
        if (!fase) {
            showAlert(ui.acompanhamentoAlert, "Selecione a fase do projeto.", "error");
            return;
        }

        var integradorId = resolveIntegradorId(ui.acompanhamentoIntegradorId.value) || (selectedCliente ? selectedCliente.integrador_id : "");
        if (!integradorId) {
            showAlert(ui.acompanhamentoAlert, "Informe integrador_id.", "error");
            return;
        }

        var homologAtual = (ui.acompanhamentoProtocoloHomologacao.value || "").trim();
        var vistoriaAtual = (ui.acompanhamentoProtocoloVistoria.value || "").trim();
        var faseNormalizada = normalizeText(fase);
        var faseIntervalo = !!INTERVALO_FASES[faseNormalizada];
        var faseDataInicial = faseIntervalo ? (ui.acompanhamentoFaseDataInicial.value || "").trim() : "";
        var faseDataFinal = faseIntervalo ? (ui.acompanhamentoFaseDataFinal.value || "").trim() : "";
        var faseDataOcorrencia = faseIntervalo ? "" : (ui.acompanhamentoFaseDataOcorrencia.value || "").trim();

        if (faseIntervalo && !faseDataInicial) {
            showAlert(ui.acompanhamentoAlert, "Informe a data inicial da fase.", "error");
            return;
        }
        if (!faseIntervalo && !faseDataOcorrencia) {
            showAlert(ui.acompanhamentoAlert, "Informe a data de ocorrência da fase.", "error");
            return;
        }

        var homologDataInicial = (ui.acompanhamentoDataInicialHomologacao.value || "").trim();
        var homologDataFinal = (ui.acompanhamentoDataFinalHomologacao.value || "").trim();
        var vistoriaDataInicial = (ui.acompanhamentoDataInicialVistoria.value || "").trim();
        var vistoriaDataFinal = (ui.acompanhamentoDataFinalVistoria.value || "").trim();

        if (faseNormalizada === "HOMOLOGACAO" && faseIntervalo) {
            homologDataInicial = faseDataInicial;
            homologDataFinal = faseDataFinal;
            ui.acompanhamentoDataInicialHomologacao.value = homologDataInicial;
            ui.acompanhamentoDataFinalHomologacao.value = homologDataFinal;
        }
        if (faseNormalizada === "VISTORIA" && faseIntervalo) {
            vistoriaDataInicial = faseDataInicial;
            vistoriaDataFinal = faseDataFinal;
            ui.acompanhamentoDataInicialVistoria.value = vistoriaDataInicial;
            ui.acompanhamentoDataFinalVistoria.value = vistoriaDataFinal;
        }

        var payload = {
            cliente_id: selectedCliente.cliente_id,
            nome_cliente: selectedCliente.nome_cliente,
            cidade: (ui.acompanhamentoCidade.value || "").trim(),
            fase: fase,
            protocolo_homologacao_atual: homologAtual,
            protocolo_homologacao_historico: clientesService.ensureProtocolHistory(selectedCliente.protocolo_homologacao_historico || [], homologAtual),
            data_inicial_homologacao: homologDataInicial,
            data_final_homologacao: homologDataFinal,
            protocolo_vistoria_atual: vistoriaAtual,
            protocolo_vistoria_historico: clientesService.ensureProtocolHistory(selectedCliente.protocolo_vistoria_historico || [], vistoriaAtual),
            data_inicial_vistoria: vistoriaDataInicial,
            data_final_vistoria: vistoriaDataFinal,
            fase_data_inicial: faseDataInicial,
            fase_data_final: faseDataFinal,
            fase_data_ocorrencia: faseDataOcorrencia,
            fase_historico: clientesService.ensureFaseHistory(selectedCliente.fase_historico || [], {
                fase: fase,
                fase_data_inicial: faseDataInicial,
                fase_data_final: faseDataFinal,
                fase_data_ocorrencia: faseDataOcorrencia
            })
        };

        ui.acompanhamentoSalvarBtn.disabled = true;
        ui.acompanhamentoSalvarBtn.textContent = "Salvando...";

        var run = isAdmin()
            ? clientesService.updateClienteAsAdmin(payload, integradorId)
            : clientesService.updateClienteDoIntegradorLogado(payload);

        run.then(function () {
            selectedCliente = normalizeCliente(payload);
            fillAcompanhamentoForm(selectedCliente);
            showAlert(ui.acompanhamentoAlert, "Acompanhamento salvo com histórico atualizado automaticamente.", "success");
            refreshDashboard();
            refreshCadastroList();
        }).catch(function (error) {
            showAlert(ui.acompanhamentoAlert, error && error.message ? error.message : "Falha ao salvar acompanhamento.", "error");
        }).finally(function () {
            ui.acompanhamentoSalvarBtn.disabled = false;
            ui.acompanhamentoSalvarBtn.textContent = "Salvar acompanhamento";
        });
    }

    function onCreateUser(event) {
        event.preventDefault();
        showAlert(ui.userAlert, "", "error");

        if (!isAdmin()) {
            showAlert(ui.userAlert, "Apenas usuário ADMIN pode criar contas.", "error");
            return;
        }

        var email = (ui.userEmail.value || "").trim();
        var integradorId = (ui.userIntegradorId.value || "").trim();
        var temporaryPassword = (ui.userTemporaryPassword.value || "").trim();
        if (!email || !integradorId || !temporaryPassword) {
            showAlert(ui.userAlert, "Informe e-mail, integrador_id e senha temporária.", "error");
            return;
        }

        ui.userCreateButton.disabled = true;
        ui.userCreateButton.textContent = "Criando...";

        authService.adminCreateUser({
            email: email,
            integrador_id: integradorId,
            temporaryPassword: temporaryPassword
        }).then(function () {
            rememberIntegradorIds([integradorId]);
            showAlert(ui.userAlert, "Usuário criado com custom:integrador_id=" + integradorId + ".", "success");
            ui.userForm.reset();
        }).catch(function (error) {
            showAlert(ui.userAlert, error && error.message ? error.message : "Falha ao criar usuário.", "error");
        }).finally(function () {
            ui.userCreateButton.disabled = false;
            ui.userCreateButton.textContent = "Criar usuário";
        });
    }

    function wireEvents() {
        ui.tabs.forEach(function (button) {
            button.addEventListener("click", function () {
                setTabsState(button.getAttribute("data-tab-target"));
            });
        });

        if (ui.adminLoginForm) {
            ui.adminLoginForm.addEventListener("submit", onAdminLogin);
        }
        if (ui.adminLogoutButton) {
            ui.adminLogoutButton.addEventListener("click", onAdminLogout);
        }
        if (ui.sidebarLogoutButton) {
            ui.sidebarLogoutButton.addEventListener("click", onAdminLogout);
        }
        if (ui.adminForgotPasswordLink) {
            ui.adminForgotPasswordLink.addEventListener("click", function () {
                var email = (ui.adminLoginEmail.value || "").trim();
                ui.adminForgotPasswordLink.href = email
                    ? ("mensagemrecuperarsenha.html?email=" + encodeURIComponent(email))
                    : "mensagemrecuperarsenha.html";
            });
        }

        if (ui.cadastroForm) {
            ui.cadastroForm.addEventListener("submit", onCadastroSave);
        }
        if (ui.cadastroGerarIdBtn) {
            ui.cadastroGerarIdBtn.addEventListener("click", onGerarClienteId);
        }
        if (ui.cadastroLimparBtn) {
            ui.cadastroLimparBtn.addEventListener("click", onCadastroLimpar);
        }
        if (ui.cadastroSearch) {
            ui.cadastroSearch.addEventListener("input", function () {
                renderCadastroList(currentClientes);
            });
        }
        if (ui.cadastroIntegradorId) {
            ui.cadastroIntegradorId.addEventListener("change", function () {
                handleManualIntegradorSelection(ui.cadastroIntegradorId);
                refreshCadastroList();
            });
            ui.cadastroIntegradorId.addEventListener("focus", refreshIntegradorOptionsForAdmin);
            ui.cadastroIntegradorId.addEventListener("mousedown", refreshIntegradorOptionsForAdmin);
        }
        if (ui.cadastroFase) {
            ui.cadastroFase.addEventListener("change", updateCadastroSectionsVisibility);
        }

        if (ui.acompanhamentoBuscarBtn) {
            ui.acompanhamentoBuscarBtn.addEventListener("click", onBuscarAcompanhamento);
        }
        if (ui.acompanhamentoForm) {
            ui.acompanhamentoForm.addEventListener("submit", onSalvarAcompanhamento);
        }
        if (ui.acompanhamentoIntegradorId) {
            ui.acompanhamentoIntegradorId.addEventListener("change", function () {
                handleManualIntegradorSelection(ui.acompanhamentoIntegradorId);
                refreshAcompanhamentoNomeOptions();
                fillAcompanhamentoForm(null);
            });
        }
        if (ui.acompanhamentoFase) {
            ui.acompanhamentoFase.addEventListener("change", updateAcompanhamentoSectionsVisibility);
        }

        if (ui.dashboardAtualizarBtn) {
            ui.dashboardAtualizarBtn.addEventListener("click", refreshDashboard);
        }
        if (ui.dashboardBusca) {
            ui.dashboardBusca.addEventListener("input", function () {
                renderDashboardTable(currentClientes.map(normalizeCliente));
            });
        }
        if (ui.dashboardIntegradorId) {
            ui.dashboardIntegradorId.addEventListener("change", function () {
                handleManualIntegradorSelection(ui.dashboardIntegradorId);
                refreshDashboard();
            });
            ui.dashboardIntegradorId.addEventListener("focus", refreshIntegradorOptionsForAdmin);
            ui.dashboardIntegradorId.addEventListener("mousedown", refreshIntegradorOptionsForAdmin);
        }

        if (ui.acompanhamentoIntegradorId) {
            ui.acompanhamentoIntegradorId.addEventListener("focus", refreshIntegradorOptionsForAdmin);
            ui.acompanhamentoIntegradorId.addEventListener("mousedown", refreshIntegradorOptionsForAdmin);
        }

        if (ui.userForm) {
            ui.userForm.addEventListener("submit", onCreateUser);
        }

        if (ui.historicoModalClose) {
            ui.historicoModalClose.addEventListener("click", closeHistoricoModal);
        }
        if (ui.historicoModalOverlay) {
            ui.historicoModalOverlay.addEventListener("click", function (event) {
                if (event.target === ui.historicoModalOverlay) {
                    closeHistoricoModal();
                }
            });
        }
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeHistoricoModal();
            }
        });
    }

    function ensureFaseOptions() {
        var optionsHtml = '<option value="">Selecione...</option>' + faseOptions.map(function (fase) {
            return '<option value="' + escapeHtml(fase) + '">' + escapeHtml(getFaseLabel(fase)) + "</option>";
        }).join("");
        if (ui.acompanhamentoFase) {
            ui.acompanhamentoFase.innerHTML = optionsHtml;
        }
        if (ui.cadastroFase) {
            ui.cadastroFase.innerHTML = optionsHtml;
            if (!ui.cadastroFase.value) {
                ui.cadastroFase.value = "ANALISE_DOCUMENTOS";
            }
        }
    }

    function bootstrap() {
        integradorIdsCache = getStoredAdminIntegradorIds();
        ensureFaseOptions();
        wireEvents();
        updateSessionInfo();
        preloadIntegradorFields();
        setAppAuthenticated(false);
        setTabsState("tab-login");
        setNomeClienteOptions([], false);
        updateCadastroSectionsVisibility();
        updateAcompanhamentoSectionsVisibility();

        authService.restoreSession().then(function () {
            updateSessionInfo();
            preloadIntegradorFields();
            return refreshIntegradorOptionsForAdmin();
        }).then(function () {
            setAppAuthenticated(true);
            setTabsState("tab-cadastro");
            refreshCadastroList();
            refreshAcompanhamentoNomeOptions();
            refreshDashboard();
        }).catch(function () {
            setAppAuthenticated(false);
        });
    }

    bootstrap();
})(window);
