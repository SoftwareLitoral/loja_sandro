const TOKEN_KEY = 'lds.token';
const USER_KEY = 'lds.user';
const CART_TOKEN_KEY = 'lds.cartToken';

export const store = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setSession({ token, user }) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn: () => Boolean(localStorage.getItem(TOKEN_KEY)),
  getCartToken() {
    let token = localStorage.getItem(CART_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      localStorage.setItem(CART_TOKEN_KEY, token);
    }
    return token;
  },
  clearCartToken() {
    localStorage.removeItem(CART_TOKEN_KEY);
  },
};
