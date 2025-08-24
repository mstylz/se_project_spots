// src/scripts/validation.js
export const settings = {
    inputSelector: ".modal__input",
    submitButtonSelector: ".modal__submit-btn",
    inactiveButtonClass: "modal__submit-btn-disabled",
    inputErrorClass: "modal__input_type_error",
    errorClass: "modal__error_visible",
};

function showInputError(form, input, message, cfg) {
    const errorEl = form.querySelector(`#${input.id}-error`);
    input.classList.add(cfg.inputErrorClass);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = "block";
    }
}

function hideInputError(form, input, cfg) {
    const errorEl = form.querySelector(`#${input.id}-error`);
    input.classList.remove(cfg.inputErrorClass);
    if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = "none";
    }
}

function checkInputValidity(form, input, cfg) {
    if (!input.validity.valid) {
        showInputError(form, input, input.validationMessage, cfg);
    } else {
        hideInputError(form, input, cfg);
    }
}

function toggleButtonState(inputs, button, cfg) {
    const hasInvalid = inputs.some((i) => !i.validity.valid);
    button.disabled = hasInvalid;
    button.classList.toggle(cfg.inactiveButtonClass, hasInvalid);
}

export function enableValidation(cfg) {
    const forms = Array.from(document.querySelectorAll(".modal__form"));
    forms.forEach((form) => {
        const inputs = Array.from(form.querySelectorAll(cfg.inputSelector));
        const button = form.querySelector(cfg.submitButtonSelector);
        toggleButtonState(inputs, button, cfg);

        inputs.forEach((input) => {
            input.addEventListener("input", () => {
                checkInputValidity(form, input, cfg);
                toggleButtonState(inputs, button, cfg);
            });
        });

        form.addEventListener("submit", (e) => {
            if (button.disabled) e.preventDefault();
        });
    });
}

export function resetValidation(form, cfg) {
    const inputs = Array.from(form.querySelectorAll(cfg.inputSelector));
    const button = form.querySelector(cfg.submitButtonSelector);
    inputs.forEach((i) => hideInputError(form, i, cfg));
    toggleButtonState(inputs, button, cfg);
}