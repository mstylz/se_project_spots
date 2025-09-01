// src/utils/Api.js
export default class Api {
    constructor({ baseUrl, headers }) {
        this._baseUrl = baseUrl;
        this._headers = headers;
    }

    _check(res) {
        if (res.ok) return res.json();
        return Promise.reject(`Error: ${res.status}`);
    }

    _request(endpoint, options = {}) {
        const finalOptions = {
            headers: this._headers,
            ...options,
        };
        const url = `${this._baseUrl}${endpoint}`;
        return fetch(url, finalOptions).then(this._check);
    }

    getUser() {
        return this._request("/users/me");
    }

    getCards() {
        return this._request("/cards");
    }

    getAppData() {
        return Promise.all([this.getUser(), this.getCards()]);
    }

    updateUser({ name, about }) {
        return this._request("/users/me", {
            method: "PATCH",
            body: JSON.stringify({ name, about }),
        });
    }

    updateAvatar(avatar) {
        return this._request("/users/me/avatar", {
            method: "PATCH",
            body: JSON.stringify({ avatar }),
        });
    }

    addCard({ name, link }) {
        return this._request("/cards", {
            method: "POST",
            body: JSON.stringify({ name, link }),
        });
    }

    deleteCard(cardId) {
        return this._request(`/cards/${cardId}`, {
            method: "DELETE",
        });
    }

    likeCard(cardId) {
        return this._request(`/cards/${cardId}/likes`, {
            method: "PUT",
        });
    }

    unlikeCard(cardId) {
        return this._request(`/cards/${cardId}/likes`, {
            method: "DELETE",
        });
    }
}
