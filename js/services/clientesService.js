(function (global) {
    var services = global.BlummeServices || {};
    var authService = services.authService;
    var dynamoService = services.dynamoService;

    var ALLOWED_FASES = [
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

    function normalizeText(value) {
        return (value || "")
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase();
    }

    function normalizeFase(value) {
        return normalizeText(value).replace(/\s+/g, "_");
    }

    function validateFase(fase) {
        var normalized = normalizeFase(fase);
        if (ALLOWED_FASES.indexOf(normalized) === -1) {
            throw new Error("Fase inválida. Use uma das fases permitidas.");
        }
        return normalized;
    }

    function buildProtocolEntry(valor, observacao, data) {
        var cleanValue = (valor || "").toString().trim();
        if (!cleanValue) {
            return null;
        }
        return {
            valor: cleanValue,
            data: data || new Date().toISOString(),
            observacao: (observacao || "").toString().trim()
        };
    }

    function appendProtocolHistory(history, valor, observacao, data) {
        var list = Array.isArray(history) ? history.slice() : [];
        var entry = buildProtocolEntry(valor, observacao, data);
        if (!entry) {
            return list;
        }
        list.unshift(entry);
        return list;
    }

    function ensureProtocolHistory(history, atual) {
        var list = Array.isArray(history) ? history.slice() : [];
        var normalized = list
            .map(function (item) {
                if (!item) {
                    return null;
                }
                if (typeof item === "string") {
                    return buildProtocolEntry(item, "", new Date().toISOString());
                }
                return buildProtocolEntry(item.valor, item.observacao, item.data);
            })
            .filter(Boolean);

        var currentValue = (atual || "").toString().trim();
        if (currentValue && !normalized.some(function (entry) { return entry.valor === currentValue; })) {
            normalized.unshift(buildProtocolEntry(currentValue, "", new Date().toISOString()));
        }
        return normalized;
    }

    function buildFaseHistoryEntry(input, dateOverride) {
        if (!input) {
            return null;
        }
        var fase = validateFase(input.fase || "");
        var dataInicial = (input.fase_data_inicial || "").toString().trim();
        var dataFinal = (input.fase_data_final || "").toString().trim();
        var dataOcorrencia = (input.fase_data_ocorrencia || "").toString().trim();
        var registradoEm = dateOverride || new Date().toISOString();
        return {
            fase: fase,
            fase_data_inicial: dataInicial,
            fase_data_final: dataFinal,
            fase_data_ocorrencia: dataOcorrencia,
            registrado_em: registradoEm
        };
    }

    function normalizeFaseHistory(history) {
        if (!Array.isArray(history)) {
            return [];
        }
        return history.map(function (item) {
            if (!item || typeof item !== "object") {
                return null;
            }
            try {
                return buildFaseHistoryEntry({
                    fase: item.fase,
                    fase_data_inicial: item.fase_data_inicial,
                    fase_data_final: item.fase_data_final,
                    fase_data_ocorrencia: item.fase_data_ocorrencia
                }, (item.registrado_em || "").toString().trim() || new Date().toISOString());
            } catch (error) {
                return null;
            }
        }).filter(Boolean);
    }

    function areSameFaseHistoryEntry(a, b) {
        if (!a || !b) {
            return false;
        }
        return a.fase === b.fase &&
            (a.fase_data_inicial || "") === (b.fase_data_inicial || "") &&
            (a.fase_data_final || "") === (b.fase_data_final || "") &&
            (a.fase_data_ocorrencia || "") === (b.fase_data_ocorrencia || "");
    }

    function ensureFaseHistory(history, input) {
        var normalized = normalizeFaseHistory(history);
        var latest = buildFaseHistoryEntry(input, new Date().toISOString());
        if (!latest) {
            return normalized;
        }
        if (normalized.length > 0 && areSameFaseHistoryEntry(normalized[0], latest)) {
            return normalized;
        }
        normalized.unshift(latest);
        return normalized;
    }

    function buildClienteItem(input, integradorId, existingItem) {
        var clienteId = (input.cliente_id || "").trim();
        var nomeCliente = (input.nome_cliente || "").trim();
        var cidade = (input.cidade || "").trim();
        var now = new Date().toISOString();
        var fase = validateFase(input.fase);
        var protocoloHomologacaoAtual = (input.protocolo_homologacao_atual || "").trim();
        var protocoloVistoriaAtual = (input.protocolo_vistoria_atual || "").trim();
        var dataInicialHomologacao = (input.data_inicial_homologacao || "").trim();
        var dataFinalHomologacao = (input.data_final_homologacao || "").trim();
        var dataInicialVistoria = (input.data_inicial_vistoria || "").trim();
        var dataFinalVistoria = (input.data_final_vistoria || "").trim();
        var faseDataInicial = (input.fase_data_inicial || "").trim();
        var faseDataFinal = (input.fase_data_final || "").trim();
        var faseDataOcorrencia = (input.fase_data_ocorrencia || "").trim();
        var existing = existingItem || null;
        var baseHistoricoHomologacao = Array.isArray(input.protocolo_homologacao_historico)
            ? input.protocolo_homologacao_historico
            : (existing ? existing.protocolo_homologacao_historico : []);
        var baseHistoricoVistoria = Array.isArray(input.protocolo_vistoria_historico)
            ? input.protocolo_vistoria_historico
            : (existing ? existing.protocolo_vistoria_historico : []);
        var baseFaseHistorico = Array.isArray(input.fase_historico)
            ? input.fase_historico
            : (existing ? existing.fase_historico : []);
        var faseHistorico = ensureFaseHistory(input.fase_historico, {
            fase: fase,
            fase_data_inicial: faseDataInicial,
            fase_data_final: faseDataFinal,
            fase_data_ocorrencia: faseDataOcorrencia
        });

        if (!clienteId) {
            throw new Error("Informe cliente_id.");
        }
        if (!nomeCliente) {
            throw new Error("Informe nome_cliente.");
        }

        return {
            integrador_id: integradorId,
            cliente_id: clienteId,
            nome_cliente: nomeCliente,
            cidade: cidade,
            fase: fase,
            protocolo_homologacao_atual: protocoloHomologacaoAtual,
            protocolo_homologacao_historico: ensureProtocolHistory(
                baseHistoricoHomologacao,
                protocoloHomologacaoAtual
            ),
            data_inicial_homologacao: dataInicialHomologacao,
            data_final_homologacao: dataFinalHomologacao,
            protocolo_vistoria_atual: protocoloVistoriaAtual,
            protocolo_vistoria_historico: ensureProtocolHistory(
                baseHistoricoVistoria,
                protocoloVistoriaAtual
            ),
            data_inicial_vistoria: dataInicialVistoria,
            data_final_vistoria: dataFinalVistoria,
            fase_data_inicial: faseDataInicial,
            fase_data_final: faseDataFinal,
            fase_data_ocorrencia: faseDataOcorrencia,
            fase_historico: ensureFaseHistory(baseFaseHistorico, {
                fase: fase,
                fase_data_inicial: faseDataInicial,
                fase_data_final: faseDataFinal,
                fase_data_ocorrencia: faseDataOcorrencia
            }),
            created_at: (existing && existing.created_at) || now,
            updated_at: now
        };
    }

    function listClientesByIntegrador(integradorId) {
        return dynamoService.queryByIntegradorId(integradorId);
    }

    function listClientesDoIntegradorLogado() {
        var integradorId = authService.getCurrentIntegradorId();
        if (integradorId) {
            return listClientesByIntegrador(integradorId);
        }
        if (authService.isAdminUser()) {
            return listAllClientesAsAdmin();
        }
        if (!integradorId) {
            return Promise.reject(new Error("Usuário sem custom:integrador_id."));
        }
        return listClientesByIntegrador(integradorId);
    }

    function listAllClientesAsAdmin() {
        return dynamoService.scanAllClientes();
    }

    function upsertClienteDoIntegradorLogado(input) {
        var integradorId = authService.getCurrentIntegradorId();
        if (!integradorId) {
            return Promise.reject(new Error("Usuário sem custom:integrador_id."));
        }

        var clienteId = (input.cliente_id || "").trim();
        return dynamoService.getCliente(integradorId, clienteId).then(function (existing) {
            var item = buildClienteItem(input, integradorId, existing);
            return dynamoService.putCliente(item).then(function () {
                return item;
            });
        });
    }

    function upsertClienteAsAdmin(input, forcedIntegradorId) {
        var integradorId = (forcedIntegradorId || "").trim();
        if (!integradorId) {
            return Promise.reject(new Error("Informe integrador_id para operacao administrativa."));
        }
        var clienteId = (input.cliente_id || "").trim();
        return dynamoService.getCliente(integradorId, clienteId).then(function (existing) {
            var item = buildClienteItem(input, integradorId, existing);
            return dynamoService.putCliente(item).then(function () {
                return item;
            });
        });
    }

    function updateClienteDoIntegradorLogado(payload) {
        var integradorId = authService.getCurrentIntegradorId();
        var clienteId = (payload.cliente_id || "").trim();
        if (!integradorId || !clienteId) {
            return Promise.reject(new Error("Informe cliente_id e autentique-se com integrador_id valido."));
        }

        var fase = validateFase(payload.fase);
        var now = new Date().toISOString();
        var homologAtual = (payload.protocolo_homologacao_atual || "").trim();
        var vistoriaAtual = (payload.protocolo_vistoria_atual || "").trim();
        var dataInicialHomologacao = (payload.data_inicial_homologacao || "").trim();
        var dataFinalHomologacao = (payload.data_final_homologacao || "").trim();
        var dataInicialVistoria = (payload.data_inicial_vistoria || "").trim();
        var dataFinalVistoria = (payload.data_final_vistoria || "").trim();
        var faseDataInicial = (payload.fase_data_inicial || "").trim();
        var faseDataFinal = (payload.fase_data_final || "").trim();
        var faseDataOcorrencia = (payload.fase_data_ocorrencia || "").trim();
        return dynamoService.getCliente(integradorId, clienteId).then(function (existing) {
            if (!existing) {
                throw new Error("Cliente não encontrado para atualizar.");
            }
            var baseHomologacao = Array.isArray(payload.protocolo_homologacao_historico) ? payload.protocolo_homologacao_historico : existing.protocolo_homologacao_historico;
            var baseVistoria = Array.isArray(payload.protocolo_vistoria_historico) ? payload.protocolo_vistoria_historico : existing.protocolo_vistoria_historico;
            var baseFaseHistorico = Array.isArray(payload.fase_historico) ? payload.fase_historico : existing.fase_historico;
            var faseHistorico = ensureFaseHistory(baseFaseHistorico, {
                fase: fase,
                fase_data_inicial: faseDataInicial,
                fase_data_final: faseDataFinal,
                fase_data_ocorrencia: faseDataOcorrencia
            });

            return dynamoService.updateCliente(
                { integrador_id: integradorId, cliente_id: clienteId },
                "SET nome_cliente = :nome, cidade = :cidade, fase = :fase, protocolo_homologacao_atual = :pha, protocolo_homologacao_historico = :phh, data_inicial_homologacao = :dih, data_final_homologacao = :dfh, protocolo_vistoria_atual = :pva, protocolo_vistoria_historico = :pvh, data_inicial_vistoria = :div, data_final_vistoria = :dfv, fase_data_inicial = :fdi, fase_data_final = :fdf, fase_data_ocorrencia = :fdo, fase_historico = :fh, updated_at = :updatedAt",
                {
                    ":nome": (payload.nome_cliente || "").trim(),
                    ":cidade": (payload.cidade || "").trim(),
                    ":fase": fase,
                    ":pha": homologAtual,
                    ":phh": ensureProtocolHistory(baseHomologacao, homologAtual),
                    ":dih": dataInicialHomologacao,
                    ":dfh": dataFinalHomologacao,
                    ":pva": vistoriaAtual,
                    ":pvh": ensureProtocolHistory(baseVistoria, vistoriaAtual),
                    ":div": dataInicialVistoria,
                    ":dfv": dataFinalVistoria,
                    ":fdi": faseDataInicial,
                    ":fdf": faseDataFinal,
                    ":fdo": faseDataOcorrencia,
                    ":fh": faseHistorico,
                    ":updatedAt": now
                },
                null,
                "attribute_exists(integrador_id) AND attribute_exists(cliente_id)"
            );
        });
    }

    function updateClienteAsAdmin(payload, forcedIntegradorId) {
        var integradorId = (forcedIntegradorId || "").trim();
        var clienteId = (payload.cliente_id || "").trim();
        if (!integradorId || !clienteId) {
            return Promise.reject(new Error("Informe integrador_id e cliente_id para operacao administrativa."));
        }

        var fase = validateFase(payload.fase);
        var now = new Date().toISOString();
        var homologAtual = (payload.protocolo_homologacao_atual || "").trim();
        var vistoriaAtual = (payload.protocolo_vistoria_atual || "").trim();
        var dataInicialHomologacao = (payload.data_inicial_homologacao || "").trim();
        var dataFinalHomologacao = (payload.data_final_homologacao || "").trim();
        var dataInicialVistoria = (payload.data_inicial_vistoria || "").trim();
        var dataFinalVistoria = (payload.data_final_vistoria || "").trim();
        var faseDataInicial = (payload.fase_data_inicial || "").trim();
        var faseDataFinal = (payload.fase_data_final || "").trim();
        var faseDataOcorrencia = (payload.fase_data_ocorrencia || "").trim();
        return dynamoService.getCliente(integradorId, clienteId).then(function (existing) {
            if (!existing) {
                throw new Error("Cliente não encontrado para atualizar.");
            }
            var baseHomologacao = Array.isArray(payload.protocolo_homologacao_historico) ? payload.protocolo_homologacao_historico : existing.protocolo_homologacao_historico;
            var baseVistoria = Array.isArray(payload.protocolo_vistoria_historico) ? payload.protocolo_vistoria_historico : existing.protocolo_vistoria_historico;
            var baseFaseHistorico = Array.isArray(payload.fase_historico) ? payload.fase_historico : existing.fase_historico;
            var faseHistorico = ensureFaseHistory(baseFaseHistorico, {
                fase: fase,
                fase_data_inicial: faseDataInicial,
                fase_data_final: faseDataFinal,
                fase_data_ocorrencia: faseDataOcorrencia
            });

            return dynamoService.updateCliente(
                { integrador_id: integradorId, cliente_id: clienteId },
                "SET nome_cliente = :nome, cidade = :cidade, fase = :fase, protocolo_homologacao_atual = :pha, protocolo_homologacao_historico = :phh, data_inicial_homologacao = :dih, data_final_homologacao = :dfh, protocolo_vistoria_atual = :pva, protocolo_vistoria_historico = :pvh, data_inicial_vistoria = :div, data_final_vistoria = :dfv, fase_data_inicial = :fdi, fase_data_final = :fdf, fase_data_ocorrencia = :fdo, fase_historico = :fh, updated_at = :updatedAt",
                {
                    ":nome": (payload.nome_cliente || "").trim(),
                    ":cidade": (payload.cidade || "").trim(),
                    ":fase": fase,
                    ":pha": homologAtual,
                    ":phh": ensureProtocolHistory(baseHomologacao, homologAtual),
                    ":dih": dataInicialHomologacao,
                    ":dfh": dataFinalHomologacao,
                    ":pva": vistoriaAtual,
                    ":pvh": ensureProtocolHistory(baseVistoria, vistoriaAtual),
                    ":div": dataInicialVistoria,
                    ":dfv": dataFinalVistoria,
                    ":fdi": faseDataInicial,
                    ":fdf": faseDataFinal,
                    ":fdo": faseDataOcorrencia,
                    ":fh": faseHistorico,
                    ":updatedAt": now
                },
                null,
                "attribute_exists(integrador_id) AND attribute_exists(cliente_id)"
            );
        });
    }

    function deleteClienteAsAdmin(integradorId, clienteId) {
        var pk = (integradorId || "").trim();
        var sk = (clienteId || "").trim();
        if (!pk || !sk) {
            return Promise.reject(new Error("Informe integrador_id e cliente_id."));
        }
        return dynamoService.deleteCliente(pk, sk);
    }

    function deleteClienteDoIntegradorLogado(clienteId) {
        var integradorId = authService.getCurrentIntegradorId();
        var sk = (clienteId || "").trim();
        if (!integradorId || !sk) {
            return Promise.reject(new Error("Informe cliente_id e autentique-se com integrador_id valido."));
        }
        return dynamoService.deleteCliente(integradorId, sk);
    }

    global.BlummeServices = global.BlummeServices || {};
    global.BlummeServices.clientesService = {
        ALLOWED_FASES: ALLOWED_FASES,
        validateFase: validateFase,
        normalizeFase: normalizeFase,
        buildProtocolEntry: buildProtocolEntry,
        appendProtocolHistory: appendProtocolHistory,
        ensureProtocolHistory: ensureProtocolHistory,
        buildFaseHistoryEntry: buildFaseHistoryEntry,
        ensureFaseHistory: ensureFaseHistory,
        listClientesByIntegrador: listClientesByIntegrador,
        listClientesDoIntegradorLogado: listClientesDoIntegradorLogado,
        listAllClientesAsAdmin: listAllClientesAsAdmin,
        upsertClienteDoIntegradorLogado: upsertClienteDoIntegradorLogado,
        upsertClienteAsAdmin: upsertClienteAsAdmin,
        updateClienteDoIntegradorLogado: updateClienteDoIntegradorLogado,
        updateClienteAsAdmin: updateClienteAsAdmin,
        deleteClienteAsAdmin: deleteClienteAsAdmin,
        deleteClienteDoIntegradorLogado: deleteClienteDoIntegradorLogado
    };
})(window);
