(function (global) {
    var defaultConfig = {
        region: "us-east-1",
        userPoolId: "us-east-1_KkpJ6KqUV",
        clientId: "1hejqatcu5uigua2jeg43jo6hn",
        identityPoolId: "us-east-1:ea046255-0aa2-4acd-b4ba-5070141cb6d1",
        tableName: "Acompanhamento"
    };

    var injected = global.BLUMME_APP_CONFIG || {};
    var config = {
        region: injected.region || defaultConfig.region,
        userPoolId: injected.userPoolId || defaultConfig.userPoolId,
        clientId: injected.clientId || defaultConfig.clientId,
        identityPoolId: injected.identityPoolId || defaultConfig.identityPoolId,
        tableName: "Acompanhamento"
    };

    function isPlaceholder(value) {
        return !value || /^SEU_/i.test(value);
    }

    function validate() {
        var errors = [];
        if (isPlaceholder(config.region)) {
            errors.push("Configure BLUMME_APP_CONFIG.region.");
        }
        if (isPlaceholder(config.userPoolId)) {
            errors.push("Configure BLUMME_APP_CONFIG.userPoolId.");
        }
        if (isPlaceholder(config.clientId)) {
            errors.push("Configure BLUMME_APP_CONFIG.clientId.");
        }
        if (isPlaceholder(config.identityPoolId)) {
            errors.push("Configure BLUMME_APP_CONFIG.identityPoolId.");
        }
        return errors;
    }

    global.BlummeServices = global.BlummeServices || {};
    global.BlummeServices.appConfig = {
        get: function () {
            return config;
        },
        validate: validate
    };
})(window);
