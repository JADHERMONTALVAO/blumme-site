(function (global) {
    var services = global.BlummeServices || {};
    var authService = services.authService;

    if (!authService) {
        return;
    }

    var form = document.getElementById("reset-form");
    var emailInput = document.getElementById("reset-email");
    var codeInput = document.getElementById("reset-code");
    var newPasswordInput = document.getElementById("reset-new-password");
    var confirmPasswordInput = document.getElementById("reset-confirm-password");

    var stage1 = document.getElementById("reset-stage-1");
    var stage2 = document.getElementById("reset-stage-2");
    var stage3 = document.getElementById("reset-stage-3");

    var indicator1 = document.getElementById("step-indicator-1");
    var indicator2 = document.getElementById("step-indicator-2");
    var indicator3 = document.getElementById("step-indicator-3");

    var stage1NextButton = document.getElementById("reset-stage1-next-btn");
    var stage2NextButton = document.getElementById("reset-stage2-next-btn");
    var resendCodeButton = document.getElementById("reset-resend-code-btn");
    var backButton = document.getElementById("reset-back-btn");
    var submitButton = document.getElementById("reset-submit-btn");
    var alertBox = document.getElementById("reset-alert");

    var state = {
        step: 1,
        email: "",
        code: "",
        temporaryPassword: ""
    };

    function setAlert(message, type) {
        if (!alertBox) {
            return;
        }
        alertBox.textContent = message || "";
        alertBox.classList.remove("show", "success", "error");
        if (message) {
            alertBox.classList.add("show", type === "success" ? "success" : "error");
        }
    }

    function setLoading(loading) {
        if (stage1NextButton) {
            stage1NextButton.disabled = loading;
        }
        if (stage2NextButton) {
            stage2NextButton.disabled = loading;
        }
        if (resendCodeButton) {
            resendCodeButton.disabled = loading;
        }
        if (submitButton) {
            submitButton.disabled = loading;
        }
        if (backButton) {
            backButton.disabled = loading;
        }
    }

    function setStep(step) {
        state.step = step;

        if (stage1) {
            stage1.classList.toggle("active", step === 1);
        }
        if (stage2) {
            stage2.classList.toggle("active", step === 2);
        }
        if (stage3) {
            stage3.classList.toggle("active", step === 3);
        }

        if (indicator1) {
            indicator1.classList.toggle("active", step === 1);
        }
        if (indicator2) {
            indicator2.classList.toggle("active", step === 2);
        }
        if (indicator3) {
            indicator3.classList.toggle("active", step === 3);
        }

        if (backButton) {
            backButton.style.display = step === 1 ? "none" : "inline-flex";
        }
    }

    function getQueryParam(name) {
        var params = new URLSearchParams(global.location.search || "");
        return (params.get(name) || "").trim();
    }

    function generateTemporaryPassword() {
        var random = Math.random().toString(36).slice(2, 8);
        return "Tmp#" + random + "9A!";
    }

    function sendRecoveryCode() {
        var email = (emailInput ? emailInput.value : "").trim();
        if (!email) {
            setAlert("Informe o e-mail para envio do código.", "error");
            return Promise.reject(new Error("email_obrigatorio"));
        }

        state.email = email;
        setLoading(true);
        setAlert("", "error");

        return authService.forgotPassword(email).then(function () {
            setAlert("Código enviado. Verifique seu e-mail e siga para a próxima etapa.", "success");
            setStep(2);
        }).catch(function (error) {
            setAlert(error && error.message ? error.message : "Falha ao enviar código de recuperação.", "error");
            throw error;
        }).finally(function () {
            setLoading(false);
        });
    }

    function validateCodeAndAdvance() {
        var code = (codeInput ? codeInput.value : "").trim();
        if (!state.email) {
            state.email = (emailInput ? emailInput.value : "").trim();
        }
        if (!state.email) {
            setAlert("Informe o e-mail e solicite o código primeiro.", "error");
            setStep(1);
            return;
        }
        if (!code) {
            setAlert("Informe o código recebido por e-mail.", "error");
            return;
        }

        state.code = code;
        state.temporaryPassword = generateTemporaryPassword();
        setLoading(true);
        setAlert("", "error");

        authService.confirmForgotPassword(state.email, state.code, state.temporaryPassword).then(function () {
            setAlert("Código validado. Agora escolha sua nova senha final.", "success");
            setStep(3);
        }).catch(function (error) {
            setAlert(error && error.message ? error.message : "Código inválido ou expirado.", "error");
        }).finally(function () {
            setLoading(false);
        });
    }

    function finalizePassword(event) {
        event.preventDefault();
        if (state.step !== 3) {
            return;
        }

        var newPass = (newPasswordInput ? newPasswordInput.value : "").trim();
        var confirmPass = (confirmPasswordInput ? confirmPasswordInput.value : "").trim();
        if (!newPass || !confirmPass) {
            setAlert("Informe e confirme a nova senha.", "error");
            return;
        }
        if (newPass !== confirmPass) {
            setAlert("A confirmação da senha não confere.", "error");
            return;
        }
        if (!state.email || !state.temporaryPassword) {
            setAlert("Fluxo incompleto. Refaça as etapas anteriores.", "error");
            setStep(1);
            return;
        }

        setLoading(true);
        setAlert("", "error");

        authService.signIn(state.email, state.temporaryPassword).then(function () {
            return authService.changePassword(state.temporaryPassword, newPass);
        }).then(function () {
            authService.signOut();
            setAlert("Senha redefinida com sucesso. Você já pode voltar e fazer login.", "success");
        }).catch(function (error) {
            setAlert(error && error.message ? error.message : "Falha ao finalizar redefinicao de senha.", "error");
        }).finally(function () {
            setLoading(false);
        });
    }

    function goBackStep() {
        if (state.step === 3) {
            setStep(2);
            return;
        }
        if (state.step === 2) {
            setStep(1);
        }
    }

    if (emailInput) {
        emailInput.value = getQueryParam("email");
    }
    if (stage1NextButton) {
        stage1NextButton.addEventListener("click", function () {
            sendRecoveryCode().catch(function () {
            });
        });
    }
    if (resendCodeButton) {
        resendCodeButton.addEventListener("click", function () {
            sendRecoveryCode().catch(function () {
            });
        });
    }
    if (stage2NextButton) {
        stage2NextButton.addEventListener("click", validateCodeAndAdvance);
    }
    if (backButton) {
        backButton.addEventListener("click", goBackStep);
    }
    if (form) {
        form.addEventListener("submit", finalizePassword);
    }

    setStep(1);
})(window);
