import {
    enableValidation,
    resetValidation,
    settings,
} from "../scripts/validation.js";
import Api from "../utils/Api.js";
import "./index.css";
import { safeSetAvatar } from "../scripts/helper.js";

// Import local images so webpack emits them (no html-loader needed)
import avatarImage from "../images/avatar.jpg";
import logoImage from "../images/logo.svg";

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

// Close buttons (no optional chaining to avoid VSCode formatter conflicts)
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
    // If we have a stored count for this card, use it
    if (cardLikeCounts.has(card._id)) {
        return cardLikeCounts.get(card._id);
    }

    // Otherwise, check if the card has a likeCount property
    if (card.likeCount !== undefined) return card.likeCount;
    if (card.likesCount !== undefined) return card.likesCount;
    if (card.like_count !== undefined) return card.like_count;

    // Default to 0 if no like count information is available
    return 0;
}

function isLikedByMe(card) {
    if (!currentUserId) return false;

    // Use the isLiked property that the API provides
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
    // close when clicking the overlay (outside container)
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

                // Update our stored count
                cardLikeCounts.set(card._id, newCount);

                // Update the UI
                likeBtn.classList.toggle("card__like-btn_active");
                likeCountEl.textContent = String(newCount);

                // Update the card object for future reference
                card.isLiked = !iLikeItNow;
            })
            .catch((err) => console.error(err));
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

        // SAFER: only set avatar if the URL really loads
        if (avatarImgEl) safeSetAvatar(avatarImgEl, user.avatar);

        // Initialize like counts - we'll need to get the actual counts from somewhere
        // For now, we'll set initial counts based on isLiked status
        cards.forEach((card) => {
            // If the card is liked by current user, start with count 1, otherwise 0
            // This is a temporary solution until we get actual like counts
            const initialCount = card.isLiked ? 1 : 0;
            cardLikeCounts.set(card._id, initialCount);
        });

        renderCards(cards);
    })
    .catch((err) => console.error(err));

// ---------- Edit Profile ----------
if (editProfileBtn && editProfileForm && nameInput && aboutInput) {
    editProfileBtn.addEventListener("click", () => {
        nameInput.value = profileNameEl ? profileNameEl.textContent : "";
        aboutInput.value = profileDescEl ? profileDescEl.textContent : "";
        resetValidation(editProfileForm, settings);
        openModal(editProfileModal);
    });

    editProfileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const submitBtn = editProfileForm.querySelector(".modal__submit-btn");
        const original = submitBtn.textContent;
        submitBtn.textContent = "Saving...";
        submitBtn.disabled = true;

        api
            .updateUser({ name: nameInput.value, about: aboutInput.value })
            .then((user) => {
                if (profileNameEl) profileNameEl.textContent = user.name;
                if (profileDescEl) profileDescEl.textContent = user.about;
                closeModal(editProfileModal);
            })
            .catch((err) => console.error(err))
            .finally(() => {
                submitBtn.textContent = original;
                submitBtn.disabled = false;
            });
    });
}

// ---------- New Post ----------
if (newPostBtn && newPostForm && titleInput && linkInput) {
    newPostBtn.addEventListener("click", () => {
        newPostForm.reset();
        resetValidation(newPostForm, settings);
        openModal(newPostModal);
    });

    newPostForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const submitBtn = newPostForm.querySelector(".modal__submit-btn");
        const original = submitBtn.textContent;
        submitBtn.textContent = "Saving...";
        submitBtn.disabled = true;

        api
            .addCard({ name: titleInput.value, link: linkInput.value })
            .then((card) => {
                // Initialize like count for new card
                cardLikeCounts.set(card._id, 0);
                prependCard(card);
                newPostForm.reset();
                resetValidation(newPostForm, settings);
                closeModal(newPostModal);
            })
            .catch((err) => console.error(err))
            .finally(() => {
                submitBtn.textContent = original;
                submitBtn.disabled = false;
            });
    });
}

// ---------- Delete Card ----------
if (deleteForm) {
    deleteForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!selectedCardId || !selectedCardEl) return;

        const submitBtn = deleteForm.querySelector(".modal__submit-btn");
        const original = submitBtn.textContent;
        submitBtn.textContent = "Deleting...";
        submitBtn.disabled = true;

        api
            .deleteCard(selectedCardId)
            .then(() => {
                // Remove the card from our like counts tracking
                cardLikeCounts.delete(selectedCardId);
                selectedCardEl.remove();
                selectedCardEl = null;
                selectedCardId = null;
                closeModal(deleteModal);
            })
            .catch((err) => console.error(err))
            .finally(() => {
                submitBtn.textContent = original;
                submitBtn.disabled = false;
            });
    });
}

// ---------- Avatar ----------
if (avatarBtn && avatarForm && avatarInput) {
    avatarBtn.addEventListener("click", () => {
        avatarForm.reset();
        resetValidation(avatarForm, settings);
        openModal(avatarModal);
    });

    avatarForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const submitBtn = avatarForm.querySelector(".modal__submit-btn");
        const original = submitBtn.textContent;
        submitBtn.textContent = "Saving...";
        submitBtn.disabled = true;

        api
            .updateAvatar(avatarInput.value)
            .then((user) => {
                if (avatarImgEl) safeSetAvatar(avatarImgEl, user.avatar);
                closeModal(avatarModal);
            })
            .catch((err) => console.error(err))
            .finally(() => {
                submitBtn.textContent = original;
                submitBtn.disabled = false;
            });
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