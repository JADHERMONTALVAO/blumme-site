(function (global) {
    var services = global.BlummeServices || {};
    var appConfigService = services.appConfig;
    var STORAGE_PREFIX = (global.BLUMME_AUTH_STORAGE_PREFIX || "default").toString().trim() || "default";
    var LOCAL_STORAGE_KEY = "blummeAuthSessionLocal:" + STORAGE_PREFIX;
    var SESSION_STORAGE_KEY = "blummeAuthSessionSession:" + STORAGE_PREFIX;

    function requireAws() {
        if (!global.AWS) {
            throw new Error("Biblioteca AWS SDK não carregada.");
        }
        if (!appConfigService) {
            throw new Error("appConfigService não inicializado.");
        }
    }

    function decodeJwtPayload(token) {
        if (!token || token.split(".").length < 2) {
            return {};
        }
        var payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        while (payload.length % 4 !== 0) {
            payload += "=";
        }
        try {
            return JSON.parse(global.atob(payload));
        } catch (error) {
            return {};
        }
    }

    function readSessionFromStorage(storage, key) {
        try {
            var raw = storage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function getStoredSessionRecord() {
        var localSession = readSessionFromStorage(global.localStorage, LOCAL_STORAGE_KEY);
        if (localSession) {
            localSession.__storage = "local";
            return localSession;
        }
        var sessionSession = readSessionFromStorage(global.sessionStorage, SESSION_STORAGE_KEY);
        if (sessionSession) {
            sessionSession.__storage = "session";
            return sessionSession;
        }
        return null;
    }

    function setStoredSession(session, options) {
        var remember = !options || options.remember !== false;
        var payload = {};
        Object.keys(session || {}).forEach(function (key) {
            payload[key] = session[key];
        });
        payload.rememberSession = remember;

        if (remember) {
            global.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
            global.sessionStorage.removeItem(SESSION_STORAGE_KEY);
            return;
        }
        global.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
        global.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    function clearStoredSession() {
        global.localStorage.removeItem(LOCAL_STORAGE_KEY);
        global.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    function isTokenExpired(idToken) {
        var payload = decodeJwtPayload(idToken);
        if (!payload.exp) {
            return true;
        }
        var now = Math.floor(Date.now() / 1000);
        return payload.exp <= now;
    }

    function getCurrentSession() {
        var session = getStoredSessionRecord();
        if (!session || !session.idToken || isTokenExpired(session.idToken)) {
            return null;
        }
        return session;
    }

    function getCurrentClaims() {
        var session = getCurrentSession();
        if (!session) {
            return {};
        }
        return decodeJwtPayload(session.idToken);
    }

    function getCurrentIntegradorId() {
        var claims = getCurrentClaims();
        return claims["custom:integrador_id"] || claims.integrador_id || "";
    }

    function getCurrentUsername() {
        var claims = getCurrentClaims();
        return claims.email || claims["cognito:username"] || "";
    }

    function isAdminUser() {
        var claims = getCurrentClaims();
        var groups = claims["cognito:groups"];
        if (!groups) {
            return false;
        }
        if (!Array.isArray(groups)) {
            groups = [groups];
        }
        return groups.indexOf("ADMIN") !== -1 || groups.indexOf("SYSBLUMME_ADMIN") !== -1;
    }

    function configureAwsCredentials() {
        requireAws();
        var config = appConfigService.get();
        var session = getCurrentSession();
        if (!session) {
            return Promise.reject(new Error("Sessão expirada. Faça login novamente."));
        }

        global.AWS.config.region = config.region;
        global.AWS.config.credentials = new global.AWS.CognitoIdentityCredentials({
            IdentityPoolId: config.identityPoolId,
            Logins: (function () {
                var key = "cognito-idp." + config.region + ".amazonaws.com/" + config.userPoolId;
                var result = {};
                result[key] = session.idToken;
                return result;
            })()
        });

        function isLoginMismatchError(error) {
            var message = (error && error.message ? error.message : "").toString().toLowerCase();
            return message.indexOf("logins don't match") !== -1;
        }

        function loadCredentials() {
            return new Promise(function (resolve, reject) {
                global.AWS.config.credentials.get(function (error) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        }

        function clearCachedIdentityId() {
            if (global.AWS.config.credentials && typeof global.AWS.config.credentials.clearCachedId === "function") {
                global.AWS.config.credentials.clearCachedId();
            }
        }

        return loadCredentials().catch(function (error) {
            if (!isLoginMismatchError(error)) {
                throw error;
            }
            clearCachedIdentityId();
            return loadCredentials();
        });
    }

    function buildAuthSession(result, fallbackRefreshToken) {
        return {
            idToken: result.IdToken,
            accessToken: result.AccessToken || "",
            refreshToken: result.RefreshToken || fallbackRefreshToken || "",
            tokenType: result.TokenType || "Bearer",
            expiresIn: result.ExpiresIn || 3600,
            authenticatedAt: new Date().toISOString()
        };
    }

    function refreshSessionWithToken(refreshToken) {
        requireAws();
        var configErrors = appConfigService.validate();
        if (configErrors.length > 0) {
            return Promise.reject(new Error(configErrors.join(" ")));
        }
        var config = appConfigService.get();
        var provider = new global.AWS.CognitoIdentityServiceProvider({ region: config.region });
        return provider.initiateAuth({
            AuthFlow: "REFRESH_TOKEN_AUTH",
            ClientId: config.clientId,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        }).promise().then(function (response) {
            var result = response.AuthenticationResult || {};
            if (!result.IdToken) {
                throw new Error("Não foi possível renovar a sessão.");
            }
            return buildAuthSession(result, refreshToken);
        });
    }

    function signIn(username, password, options) {
        requireAws();
        var configErrors = appConfigService.validate();
        if (configErrors.length > 0) {
            return Promise.reject(new Error(configErrors.join(" ")));
        }
        var config = appConfigService.get();
        var remember = !options || options.remember !== false;

        var provider = new global.AWS.CognitoIdentityServiceProvider({ region: config.region });
        return provider.initiateAuth({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: config.clientId,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password
            }
        }).promise().then(function (response) {
            if (response && response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
                return {
                    challengeName: response.ChallengeName,
                    username: username,
                    session: response.Session || "",
                    challengeParameters: response.ChallengeParameters || {},
                    rememberSession: remember
                };
            }

            var result = response.AuthenticationResult || {};
            if (!result.IdToken) {
                throw new Error("Falha no login: idToken não retornado.");
            }
            var session = buildAuthSession(result, "");
            setStoredSession(session, { remember: remember });
            return configureAwsCredentials().then(function () {
                return session;
            });
        });
    }

    function completeNewPassword(username, newPassword, challengeSession, options) {
        requireAws();
        var configErrors = appConfigService.validate();
        if (configErrors.length > 0) {
            return Promise.reject(new Error(configErrors.join(" ")));
        }
        var config = appConfigService.get();
        var remember = !options || options.remember !== false;
        var provider = new global.AWS.CognitoIdentityServiceProvider({ region: config.region });

        return provider.respondToAuthChallenge({
            ClientId: config.clientId,
            ChallengeName: "NEW_PASSWORD_REQUIRED",
            Session: challengeSession || undefined,
            ChallengeResponses: {
                USERNAME: username,
                NEW_PASSWORD: newPassword
            }
        }).promise().then(function (response) {
            var result = response.AuthenticationResult || {};
            if (!result.IdToken) {
                throw new Error("Não foi possível concluir troca de senha.");
            }
            var session = buildAuthSession(result, "");
            setStoredSession(session, { remember: remember });
            return configureAwsCredentials().then(function () {
                return session;
            });
        });
    }

    function restoreSession() {
        var stored = getStoredSessionRecord();
        if (!stored) {
            return Promise.reject(new Error("Nenhuma sessão ativa."));
        }
        if (stored.idToken && !isTokenExpired(stored.idToken)) {
            return configureAwsCredentials();
        }
        if (!stored.refreshToken) {
            clearStoredSession();
            return Promise.reject(new Error("Sessão expirada. Faça login novamente."));
        }
        return refreshSessionWithToken(stored.refreshToken).then(function (session) {
            setStoredSession(session, { remember: stored.__storage !== "session" });
            return configureAwsCredentials();
        }).catch(function (error) {
            clearStoredSession();
            throw error;
        });
    }

    function forgotPassword(username) {
        requireAws();
        var configErrors = appConfigService.validate();
        if (configErrors.length > 0) {
            return Promise.reject(new Error(configErrors.join(" ")));
        }
        var config = appConfigService.get();
        var provider = new global.AWS.CognitoIdentityServiceProvider({ region: config.region });
        return provider.forgotPassword({
            ClientId: config.clientId,
            Username: username
        }).promise();
    }

    function confirmForgotPassword(username, confirmationCode, newPassword) {
        requireAws();
        var configErrors = appConfigService.validate();
        if (configErrors.length > 0) {
            return Promise.reject(new Error(configErrors.join(" ")));
        }
        var config = appConfigService.get();
        var provider = new global.AWS.CognitoIdentityServiceProvider({ region: config.region });
        return provider.confirmForgotPassword({
            ClientId: config.clientId,
            Username: username,
            ConfirmationCode: confirmationCode,
            Password: newPassword
        }).promise();
    }

    function changePassword(oldPassword, newPassword) {
        requireAws();
        var configErrors = appConfigService.validate();
        if (configErrors.length > 0) {
            return Promise.reject(new Error(configErrors.join(" ")));
        }
        var session = getCurrentSession();
        if (!session || !session.accessToken) {
            return Promise.reject(new Error("Sessão inválida para alterar senha."));
        }
        var config = appConfigService.get();
        var provider = new global.AWS.CognitoIdentityServiceProvider({ region: config.region });
        return provider.changePassword({
            AccessToken: session.accessToken,
            PreviousPassword: oldPassword,
            ProposedPassword: newPassword
        }).promise();
    }

    function signOut() {
        clearStoredSession();
        if (global.AWS && global.AWS.config) {
            global.AWS.config.credentials = null;
        }
    }

    function adminCreateUser(input) {
        requireAws();
        var config = appConfigService.get();
        if (!isAdminUser()) {
            return Promise.reject(new Error("Usuário sem permissão administrativa."));
        }

        var email = (input.email || "").trim();
        var integradorId = (input.integrador_id || "").trim();
        var temporaryPassword = (input.temporaryPassword || "").trim();
        if (!email || !integradorId || !temporaryPassword) {
            return Promise.reject(new Error("Informe e-mail, integrador_id e senha temporária."));
        }

        var provider = new global.AWS.CognitoIdentityServiceProvider({ region: config.region });
        return provider.adminCreateUser({
            UserPoolId: config.userPoolId,
            Username: email,
            TemporaryPassword: temporaryPassword,
            MessageAction: "SUPPRESS",
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: "email_verified", Value: "true" },
                { Name: "custom:integrador_id", Value: integradorId }
            ]
        }).promise().then(function (result) {
            return provider.adminSetUserPassword({
                UserPoolId: config.userPoolId,
                Username: email,
                Password: temporaryPassword,
                Permanent: false
            }).promise().then(function () {
                return result;
            });
        });
    }

    function listIntegradorIdsAsAdmin() {
        requireAws();
        var config = appConfigService.get();
        if (!isAdminUser()) {
            return Promise.reject(new Error("Usuário sem permissão administrativa."));
        }

        var provider = new global.AWS.CognitoIdentityServiceProvider({ region: config.region });
        var seen = {};
        var ids = [];

        function addIntegradorId(value) {
            var clean = (value || "").toString().trim();
            if (!clean) {
                return;
            }
            var key = clean.toLowerCase();
            if (seen[key]) {
                return;
            }
            seen[key] = true;
            ids.push(clean);
        }

        function readIntegradorIdFromUser(user) {
            if (!user || !Array.isArray(user.Attributes)) {
                return;
            }
            var attr = user.Attributes.find(function (item) {
                return item && item.Name === "custom:integrador_id";
            });
            if (attr && attr.Value) {
                addIntegradorId(attr.Value);
            }
        }

        function run(nextToken) {
            var params = {
                UserPoolId: config.userPoolId,
                Limit: 60
            };
            if (nextToken) {
                params.PaginationToken = nextToken;
            }
            return provider.listUsers(params).promise().then(function (result) {
                var users = (result && result.Users) ? result.Users : [];
                users.forEach(readIntegradorIdFromUser);
                if (result && result.PaginationToken) {
                    return run(result.PaginationToken);
                }
                return ids.sort(function (a, b) {
                    return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
                });
            });
        }

        return run("");
    }

    global.BlummeServices = global.BlummeServices || {};
    global.BlummeServices.authService = {
        signIn: signIn,
        restoreSession: restoreSession,
        signOut: signOut,
        getCurrentClaims: getCurrentClaims,
        getCurrentIntegradorId: getCurrentIntegradorId,
        getCurrentUsername: getCurrentUsername,
        configureAwsCredentials: configureAwsCredentials,
        getCurrentSession: getCurrentSession,
        isAdminUser: isAdminUser,
        adminCreateUser: adminCreateUser,
        listIntegradorIdsAsAdmin: listIntegradorIdsAsAdmin,
        completeNewPassword: completeNewPassword,
        forgotPassword: forgotPassword,
        confirmForgotPassword: confirmForgotPassword,
        changePassword: changePassword
    };
})(window);
