import {
    enableValidation,
    resetValidation,
    settings,
} from "../scripts/validation.js";
import Api from "../utils/Api.js";
import "./index.css";
import { safeSetAvatar } from "../scripts/helper.js";
import { handleSubmit } from "../scripts/utils.js";

// Import local images so webpack emits them (no html-loader needed)
import avatarImage from "../images/avatar.jpg";
import logoImage from "../images/logo.svg";
import pencilIcon from "../images/pencil.svg";
import whitePencilIcon from "../images/white_pencil.svg";

import plusIcon from "../images/plus.svg";
import heartIcon from "../images/heart.svg";
import likeActiveIcon from "../images/like_active.svg";
import deleteIcon from "../images/delete.svg";
import deleteDefaultIcon from "../images/delete_default.svg";
import closeGreyIcon from "../images/close_icon_grey.svg";
import closeIcon from "../images/close_icon.svg";


document.documentElement.style.setProperty("--pencil-icon", `url(${pencilIcon})`);
document.documentElement.style.setProperty(
    "--whitepencil-icon",
    `url(${whitePencilIcon})`
);
document.documentElement.style.setProperty("--plus-icon", `url(${plusIcon})`);
document.documentElement.style.setProperty("--heart-icon", `url(${heartIcon})`);
document.documentElement.style.setProperty("--like-active-icon", `url(${likeActiveIcon})`);
document.documentElement.style.setProperty("--delete-icon", `url(${deleteIcon})`);
document.documentElement.style.setProperty("--delete-default-icon", `url(${deleteDefaultIcon})`);
document.documentElement.style.setProperty("--close-grey-icon", `url(${closeGreyIcon})`);
document.documentElement.style.setProperty("--close-icon", `url(${closeIcon})`);


// ---------- API ----------
const api = new Api({
    baseUrl: "https://around-api.en.tripleten-services.com/v1",
    headers: {
        authorization: "b5bb21ca-524c-4b9b-82e8-ef9e8c025693",
        "Content-Type": "application/json",
    },
});

// ---------- DOM ----------
const headerLogoEl = document.querySelector(".header__logo");
const profileNameEl = document.querySelector(".profile__name");
const profileDescEl = document.querySelector(".profile__description");
const avatarImgEl = document.querySelector(".profile__avatar");

// set initial local images (API will overwrite avatar later if valid)
if (headerLogoEl) headerLogoEl.src = logoImage;
if (avatarImgEl) avatarImgEl.src = avatarImage;

const cardsListEl = document.querySelector(".cards__list");
const cardTemplate = document.querySelector("#card-template");

// Modals
const editProfileModal = document.querySelector("#edit-profile-modal");
const newPostModal = document.querySelector("#new-post-modal");
const deleteModal = document.querySelector("#delete-modal");
const avatarModal = document.querySelector("#avatar-modal");
const previewModal = document.querySelector("#preview-modal");

// Close buttons
const editProfileCloseBtn = editProfileModal ?
    editProfileModal.querySelector(".modal__close-btn") :
    null;
const newPostCloseBtn = newPostModal ?
    newPostModal.querySelector(".modal__close-btn") :
    null;
const deleteCloseBtn = deleteModal ?
    deleteModal.querySelector(".modal__close-btn") :
    null;
const avatarCloseBtn = avatarModal ?
    avatarModal.querySelector(".modal__close-btn") :
    null;
const previewCloseBtn = previewModal ?
    previewModal.querySelector(".modal__close-btn") :
    null;

// Forms + inputs
const editProfileForm = editProfileModal ?
    editProfileModal.querySelector(".modal__form") :
    null;
const newPostForm = newPostModal ?
    newPostModal.querySelector(".modal__form") :
    null;
const deleteForm = deleteModal ?
    deleteModal.querySelector(".modal__form") :
    null;
const avatarForm = avatarModal ?
    avatarModal.querySelector(".modal__form") :
    null;

const nameInput = editProfileForm ?
    editProfileForm.querySelector("#profile-name-input") :
    null;
const aboutInput = editProfileForm ?
    editProfileForm.querySelector("#profile-description-input") :
    null;

const linkInput = newPostForm ?
    newPostForm.querySelector("#card-image-input") :
    null;
const titleInput = newPostForm ?
    newPostForm.querySelector("#new-post-caption-input") :
    null;

const avatarInput = avatarForm ?
    avatarForm.querySelector("#avatar-input") :
    null;

// Open buttons
const editProfileBtn = document.querySelector(".profile__edit-btn");
const newPostBtn = document.querySelector(".profile__new-post-btn");
const avatarBtn = document.querySelector(".profile__avatar-edit-btn");

// Preview modal content
const previewImgEl = previewModal ?
    previewModal.querySelector(".modal__image") :
    null;
const previewCapEl = previewModal ?
    previewModal.querySelector(".modal__caption") :
    null;

// ---------- State ----------
let currentUserId = null;
let selectedCardEl = null;
let selectedCardId = null;

// Track like counts separately since the API doesn't provide them initially
const cardLikeCounts = new Map();

// ---------- Helpers for likes ----------
function getLikeCount(card) {
    if (cardLikeCounts.has(card._id)) {
        return cardLikeCounts.get(card._id);
    }
    if (card.likeCount !== undefined) return card.likeCount;
    if (card.likesCount !== undefined) return card.likesCount;
    if (card.like_count !== undefined) return card.like_count;
    return 0;
}

function isLikedByMe(card) {
    if (!currentUserId) return false;
    if (card.isLiked !== undefined) return card.isLiked;
    if (card.liked !== undefined) return card.liked;
    if (card.is_liked !== undefined) return card.is_liked;
    return false;
}

// ---------- Modal helpers ----------
function openModal(modal) {
    if (!modal) return;
    modal.classList.add("modal_is-opened");
    document.addEventListener("keydown", handleEscClose);
    modal.addEventListener("mousedown", handleOverlayClose);
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("modal_is-opened");
    document.removeEventListener("keydown", handleEscClose);
    modal.removeEventListener("mousedown", handleOverlayClose);
}

function handleEscClose(evt) {
    if (evt.key === "Escape") {
        const opened = document.querySelector(".modal.modal_is-opened");
        if (opened) closeModal(opened);
    }
}

function handleOverlayClose(evt) {
    if (evt.target.classList.contains("modal_is-opened")) {
        closeModal(evt.currentTarget);
    }
}

// ---------- Render ----------
function createCardEl(card) {
    const li = cardTemplate.content.querySelector(".card").cloneNode(true);
    const img = li.querySelector(".card__image");
    const title = li.querySelector(".card__title");
    const likeBtn = li.querySelector(".card__like-btn");
    const likeCountEl = li.querySelector(".card__like-count");
    const deleteBtn = li.querySelector(".card__delete-btn");

    img.src = card.link;
    img.alt = card.name;
    title.textContent = card.name;

    // Initial likes render
    likeCountEl.textContent = String(getLikeCount(card));
    if (isLikedByMe(card)) {
        likeBtn.classList.add("card__like-btn_active");
    } else {
        likeBtn.classList.remove("card__like-btn_active");
    }

    // Like / Unlike
    likeBtn.addEventListener("click", () => {
        const iLikeItNow = likeBtn.classList.contains("card__like-btn_active");
        const req = iLikeItNow ? api.unlikeCard(card._id) : api.likeCard(card._id);

        req
            .then((updatedCard) => {
                // The updated card from the API should have the correct like count
                const currentCount = getLikeCount(updatedCard);
                const newCount = iLikeItNow ?
                    Math.max(0, currentCount - 1) :
                    currentCount + 1;

                cardLikeCounts.set(card._id, newCount);

                likeBtn.classList.toggle("card__like-btn_active");
                likeCountEl.textContent = String(newCount);

                card.isLiked = !iLikeItNow;
            })
            .catch(console.error);
    });

    // Delete (only for owner)
    let ownerId = null;
    if (typeof card.owner === "string") {
        ownerId = card.owner;
    } else if (card.owner && typeof card.owner === "object") {
        ownerId = card.owner._id || card.owner.id || card.owner.userId;
    }

    if (ownerId === currentUserId) {
        deleteBtn.style.display = "block";
        deleteBtn.addEventListener("click", () => {
            selectedCardEl = li;
            selectedCardId = card._id;
            openModal(deleteModal);
        });
    } else {
        deleteBtn.style.display = "none";
    }

    // Preview
    img.addEventListener("click", () => {
        if (!previewImgEl || !previewCapEl) return;
        previewImgEl.src = card.link;
        previewImgEl.alt = card.name;
        previewCapEl.textContent = card.name;
        openModal(previewModal);
    });

    return li;
}

function renderCards(cards) {
    if (!cardsListEl) return;
    cardsListEl.innerHTML = "";
    cards.forEach((c) => cardsListEl.appendChild(createCardEl(c)));
}

function prependCard(card) {
    if (!cardsListEl) return;
    cardsListEl.prepend(createCardEl(card));
}

// ---------- Startup: load user + cards ----------
api
    .getAppData()
    .then(([user, cards]) => {
        currentUserId = user._id;
        if (profileNameEl) profileNameEl.textContent = user.name;
        if (profileDescEl) profileDescEl.textContent = user.about;
        if (avatarImgEl) safeSetAvatar(avatarImgEl, user.avatar);
        cards.forEach((card) => {
            const initialCount = card.isLiked ? 1 : 0;
            cardLikeCounts.set(card._id, initialCount);
        });
        renderCards(cards);
    })
    .catch(console.error);

// ---------- Edit Profile ----------
if (editProfileBtn && editProfileForm && nameInput && aboutInput) {
    editProfileBtn.addEventListener("click", () => {
        nameInput.value = profileNameEl ? profileNameEl.textContent : "";
        aboutInput.value = profileDescEl ? profileDescEl.textContent : "";
        resetValidation(editProfileForm, settings);
        openModal(editProfileModal);
    });

    editProfileForm.addEventListener("submit", (evt) => {
        function makeRequest() {
            return api.updateUser({ name: nameInput.value, about: aboutInput.value })
                .then((user) => {
                    if (profileNameEl) profileNameEl.textContent = user.name;
                    if (profileDescEl) profileDescEl.textContent = user.about;
                    closeModal(editProfileModal);
                });
        }
        handleSubmit(makeRequest, evt, "Saving...");
    });
}

// ---------- New Post ----------
if (newPostBtn && newPostForm && titleInput && linkInput) {
    newPostBtn.addEventListener("click", () => {
        newPostForm.reset();
        resetValidation(newPostForm, settings);
        openModal(newPostModal);
    });

    newPostForm.addEventListener("submit", (evt) => {
        function makeRequest() {
            return api.addCard({ name: titleInput.value, link: linkInput.value })
                .then((card) => {
                    cardLikeCounts.set(card._id, 0);
                    prependCard(card);
                    newPostForm.reset();
                    resetValidation(newPostForm, settings);
                    closeModal(newPostModal);
                });
        }
        handleSubmit(makeRequest, evt, "Saving...");
    });
}

// ---------- Delete Card ----------
if (deleteForm) {
    deleteForm.addEventListener("submit", (evt) => {
        function makeRequest() {
            if (!selectedCardId || !selectedCardEl) return Promise.resolve();
            return api.deleteCard(selectedCardId)
                .then(() => {
                    cardLikeCounts.delete(selectedCardId);
                    selectedCardEl.remove();
                    selectedCardEl = null;
                    selectedCardId = null;
                    closeModal(deleteModal);
                });
        }
        handleSubmit(makeRequest, evt, "Deleting...");
    });
}

// ---------- Avatar ----------
if (avatarBtn && avatarForm && avatarInput) {
    avatarBtn.addEventListener("click", () => {
        avatarForm.reset();
        resetValidation(avatarForm, settings);
        openModal(avatarModal);
    });

    avatarForm.addEventListener("submit", (evt) => {
        function makeRequest() {
            return api.updateAvatar(avatarInput.value)
                .then((user) => {
                    if (avatarImgEl) safeSetAvatar(avatarImgEl, user.avatar);
                    closeModal(avatarModal);
                });
        }
        handleSubmit(makeRequest, evt, "Saving...");
    });
}

// ---------- Close buttons & preview ----------
if (editProfileCloseBtn)
    editProfileCloseBtn.addEventListener("click", () =>
        closeModal(editProfileModal)
    );
if (newPostCloseBtn)
    newPostCloseBtn.addEventListener("click", () => closeModal(newPostModal));
if (deleteCloseBtn)
    deleteCloseBtn.addEventListener("click", () => closeModal(deleteModal));
if (avatarCloseBtn)
    avatarCloseBtn.addEventListener("click", () => closeModal(avatarModal));
if (previewCloseBtn)
    previewCloseBtn.addEventListener("click", () => closeModal(previewModal));

// ---------- Form validation ----------
enableValidation(settings);