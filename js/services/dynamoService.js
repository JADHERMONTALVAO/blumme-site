(function (global) {
    var services = global.BlummeServices || {};
    var appConfigService = services.appConfig;
    var authService = services.authService;

    var TABLE_NAME = "Acompanhamento";
    var documentClient = null;

    function requireDependencies() {
        if (!global.AWS) {
            throw new Error("Biblioteca AWS SDK não carregada.");
        }
        if (!appConfigService) {
            throw new Error("appConfigService não inicializado.");
        }
        if (!authService) {
            throw new Error("authService não inicializado.");
        }
    }

    function getDocumentClient() {
        requireDependencies();
        if (!documentClient) {
            var config = appConfigService.get();
            documentClient = new global.AWS.DynamoDB.DocumentClient({ region: config.region });
        }
        return documentClient;
    }

    function queryByIntegradorId(integradorId) {
        var pk = (integradorId || "").trim();
        if (!pk) {
            return Promise.reject(new Error("integrador_id e obrigatorio."));
        }
        return authService.configureAwsCredentials().then(function () {
            return getDocumentClient().query({
                TableName: TABLE_NAME,
                KeyConditionExpression: "integrador_id = :pk",
                ExpressionAttributeValues: {
                    ":pk": pk
                }
            }).promise();
        }).then(function (result) {
            return (result && result.Items) ? result.Items : [];
        });
    }

    function scanAllClientes() {
        return authService.configureAwsCredentials().then(function () {
            var client = getDocumentClient();
            var items = [];

            function run(lastKey) {
                var params = {
                    TableName: TABLE_NAME
                };
                if (lastKey) {
                    params.ExclusiveStartKey = lastKey;
                }
                return client.scan(params).promise().then(function (result) {
                    var chunk = (result && result.Items) ? result.Items : [];
                    items = items.concat(chunk);
                    if (result && result.LastEvaluatedKey) {
                        return run(result.LastEvaluatedKey);
                    }
                    return items;
                });
            }

            return run(null);
        });
    }

    function getCliente(integradorId, clienteId) {
        var pk = (integradorId || "").trim();
        var sk = (clienteId || "").trim();
        if (!pk || !sk) {
            return Promise.reject(new Error("integrador_id e cliente_id são obrigatórios."));
        }
        return authService.configureAwsCredentials().then(function () {
            return getDocumentClient().get({
                TableName: TABLE_NAME,
                Key: {
                    integrador_id: pk,
                    cliente_id: sk
                }
            }).promise();
        }).then(function (result) {
            return result ? result.Item : null;
        });
    }

    function putCliente(item, conditionExpression) {
        if (!item || !item.integrador_id || !item.cliente_id) {
            return Promise.reject(new Error("Item invalido: informe integrador_id e cliente_id."));
        }
        return authService.configureAwsCredentials().then(function () {
            var params = {
                TableName: TABLE_NAME,
                Item: item
            };
            if (conditionExpression) {
                params.ConditionExpression = conditionExpression;
            }
            return getDocumentClient().put(params).promise();
        });
    }

    function updateCliente(key, updateExpression, expressionAttributeValues, expressionAttributeNames, conditionExpression) {
        if (!key || !key.integrador_id || !key.cliente_id) {
            return Promise.reject(new Error("Chave inválida: informe integrador_id e cliente_id."));
        }
        return authService.configureAwsCredentials().then(function () {
            var params = {
                TableName: TABLE_NAME,
                Key: key,
                UpdateExpression: updateExpression,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: "ALL_NEW"
            };
            if (expressionAttributeNames) {
                params.ExpressionAttributeNames = expressionAttributeNames;
            }
            if (conditionExpression) {
                params.ConditionExpression = conditionExpression;
            }
            return getDocumentClient().update(params).promise();
        }).then(function (result) {
            return result ? result.Attributes : null;
        });
    }

    function deleteCliente(integradorId, clienteId) {
        var pk = (integradorId || "").trim();
        var sk = (clienteId || "").trim();
        if (!pk || !sk) {
            return Promise.reject(new Error("integrador_id e cliente_id são obrigatórios."));
        }
        return authService.configureAwsCredentials().then(function () {
            return getDocumentClient().delete({
                TableName: TABLE_NAME,
                Key: {
                    integrador_id: pk,
                    cliente_id: sk
                },
                ConditionExpression: "attribute_exists(integrador_id) AND attribute_exists(cliente_id)"
            }).promise();
        });
    }

    global.BlummeServices = global.BlummeServices || {};
    global.BlummeServices.dynamoService = {
        TABLE_NAME: TABLE_NAME,
        getDocumentClient: getDocumentClient,
        queryByIntegradorId: queryByIntegradorId,
        getCliente: getCliente,
        putCliente: putCliente,
        updateCliente: updateCliente,
        deleteCliente: deleteCliente,
        scanAllClientes: scanAllClientes
    };
})(window);
