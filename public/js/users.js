// The endpoint is determined by the data attribute on the users page element
const usersPage = document.getElementById('users-admin');
const usersEndpoint = usersPage.dataset.usersEndpoint;

const listElement = document.getElementById('users-list');
const templateElement = document.getElementById('user-row-template');
const editTemplateElement = document.getElementById('user-edit-template');
const loadingElement = document.getElementById('users-loading');
const errorElement = document.getElementById('users-error');
const emptyElement = document.getElementById('users-empty');

const usersById = new Map();

const findUser = (userId) => usersById.get(String(userId));

const showError = (message) => {
    errorElement.textContent = message;
    errorElement.hidden = false;
};

const requestJson = async (url, options) => {
    const response = await fetch(url, options);
    const payload = response.status === 204 ? null : await response.json();
    if (!response.ok) {
        throw new Error(payload?.error || payload?.message || 'The request failed.');
    }
    return payload;
};

const deleteUser = async (userId) => {
    const user = findUser(userId);
    if (!user) {
        return;
    }

    if (!window.confirm(`Delete ${user.name || 'this user'}?`)) {
        return;
    }

    errorElement.hidden = true;
    try {
        const result = await requestJson(`/api/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
        if (result.deletedSelf) {
            window.location.assign('/login');
            return;
        }
        await loadUsers();
    } catch (error) {
        showError(error.message);
    }
};

const renderUserCard = (userId) => {
    const user = findUser(userId);
    if (!user) {
        return null;
    }

    const card = templateElement.content.firstElementChild.cloneNode(true);
    card.querySelector('[data-field="name"]').textContent = user.name || '';
    card.querySelector('[data-field="email"]').textContent = user.email || '';
    card.querySelector('[data-field="role"]').textContent = user.role?.name || 'User';
    card.querySelector('.user-edit').addEventListener('click', () => {
        listElement.replaceChild(renderUserEditCard(userId), card);
    });
    return card;
};

const renderUserEditCard = (userId) => {
    const user = findUser(userId);
    if (!user) {
        return null;
    }

    const form = editTemplateElement.content.firstElementChild.cloneNode(true);
    const nameInput = form.elements.namedItem('name');
    const emailInput = form.elements.namedItem('email');
    const roleSelect = form.elements.namedItem('role');
    nameInput.value = user.name || '';
    emailInput.value = user.email || '';
    if (roleSelect) {
        roleSelect.value = user.role?.name || 'customer';
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorElement.hidden = true;
        try {
            await requestJson(`/api/users/${encodeURIComponent(userId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nameInput.value,
                    email: emailInput.value,
                    ...(roleSelect ? { role: roleSelect.value } : {}),
                }),
            });
            await loadUsers();
        } catch (error) {
            showError(error.message);
        }
    });

    form.querySelector('.user-cancel').addEventListener('click', () => {
        listElement.replaceChild(renderUserCard(userId), form);
    });
    form.querySelector('.user-delete').addEventListener('click', () => deleteUser(userId));
    return form;
};

const renderUsers = (users) => {
    usersById.clear();
    const fragment = document.createDocumentFragment();
    users.forEach((user) => {
        const userId = String(user._id || user.id);
        usersById.set(userId, user);
        fragment.appendChild(renderUserCard(userId));
    });
    listElement.replaceChildren(fragment);
    emptyElement.hidden = users.length !== 0;
};

async function loadUsers() {
    loadingElement.hidden = false;
    errorElement.hidden = true;
    try {
        const payload = await requestJson(usersEndpoint);
        const users = Array.isArray(payload) ? payload : payload ? [payload] : [];
        renderUsers(users);
    } catch (error) {
        showError('Unable to load users. Please try again.');
    } finally {
        loadingElement.hidden = true;
    }
}

loadUsers();