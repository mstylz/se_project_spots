const showInputError = (formEl, inputEl, errorMsg) => {
    const errorMsgEl = document.querySelector(`#${inputEl.id}-error`);
    errorMsgEl.textContent = errorMsg;
    inputEl.classList.add("modal__input_type_error");
};

const hideInputError = (formEl, inputEl, errorMsg) => {
    const errorMsgEl = document.querySelector(`#${inputEl.id}-error`);
    errorMsgEl.textContent = "";
    inputEl.classList.remove("modal__input_type_error");
};

const checkInputValidity = (formEl, inputEl) => {
    if (!inputEl.validity.valid) {
        showInputError(formEl, inputEl, inputEl.validationMessage);
    } else {
        hideInputError(formEl, inputEl, errorMsg);
    }
};

const hasInvalidInput = (inputList) => {
    return inputList.some((input) => {
        return !input.validity.valid;
    });
};

const toggleButtonState = (inputList, buttonEl) => {
    if (hasInvalidInput(inputList)) {
        disableButton(buttonEl);
    } else {
        buttonEl.disabled = false;
    }
};

const disableButton = (buttonEl) => {
    buttonEl.disabled = true;
};

const setEventListeners = (formEl) => {
    const inputList = Array.from(formEl.querySelectorAll(".modal__input"));
    const buttonElement = formEl.querySelectorAll("modal__button");

    toggleButtonState(inputList, buttonElement);

    inputList.forEach((inputElement) => {
        inputElement.addEventListener("input", function() {
            checkInputValidity(formEl, inputElement);
            toggleButtonState(inputList, buttonElement);
        });
    });
};

const enableValidation = () => {
    const formList = Array.from(document.querySelectorAll(".modal__form"));
    formList.forEach((formEl) => {
        setEventListeners(formEl);
    });
};

enableValidation();
