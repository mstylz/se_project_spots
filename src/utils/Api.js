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

    getUser() {
        return fetch(`${this._baseUrl}/users/me`, { headers: this._headers }).then(
            this._check
        );
    }

    getCards() {
        return fetch(`${this._baseUrl}/cards`, { headers: this._headers }).then(
            this._check
        );
    }

    getAppData() {
        return Promise.all([this.getUser(), this.getCards()]);
    }

    updateUser({ name, about }) {
        return fetch(`${this._baseUrl}/users/me`, {
            method: "PATCH",
            headers: this._headers,
            body: JSON.stringify({ name, about }),
        }).then(this._check);
    }

    updateAvatar(avatar) {
        return fetch(`${this._baseUrl}/users/me/avatar`, {
            method: "PATCH",
            headers: this._headers,
            body: JSON.stringify({ avatar }),
        }).then(this._check);
    }

    addCard({ name, link }) {
        return fetch(`${this._baseUrl}/cards`, {
            method: "POST",
            headers: this._headers,
            body: JSON.stringify({ name, link }),
        }).then(this._check);
    }

    deleteCard(cardId) {
        return fetch(`${this._baseUrl}/cards/${cardId}`, {
            method: "DELETE",
            headers: this._headers,
        }).then(this._check);
    }

    likeCard(cardId) {
        return fetch(`${this._baseUrl}/cards/${cardId}/likes`, {
            method: "PUT",
            headers: this._headers,
        }).then(this._check);
    }

    unlikeCard(cardId) {
        return fetch(`${this._baseUrl}/cards/${cardId}/likes`, {
            method: "DELETE",
            headers: this._headers,
        }).then(this._check);
    }
}