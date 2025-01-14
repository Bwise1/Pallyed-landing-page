import getConfig from 'next/config';
import { userService } from '~/services';

const { publicRuntimeConfig } = getConfig();

function authHeader(url) {
    // return auth header with jwt if user is logged in and request is to the api url
    const user = userService.userValue;
    const isLoggedIn = user && user.token;
    const isApiUrl = url.startsWith(publicRuntimeConfig.apiUrl);
    if (isLoggedIn && isApiUrl) {
        return { Authorization: `Bearer ${user.token}` };
    }
        return {};
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if ([401, 403].includes(response.status) && userService.userValue) {
                // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
                userService.logout();
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}

function post(url, body) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(url) },
        credentials: 'include',
        body: JSON.stringify(body)
    };
    return fetch(url, requestOptions).then(handleResponse);
}

// eslint-disable-next-line import/prefer-default-export
export const fetchWrapper = {
    post
};
