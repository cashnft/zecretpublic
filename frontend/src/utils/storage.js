// Storage keys
const KEYS = {
    TOKEN: 'token',
    PRIVATE_KEY: 'privateKey',
    USER: 'user',
  };
  
  // Storage utility functions
  const storageUtils = {
    // Get an item from localStorage with error handling
    getItem: (key) => {
      try {
        if (typeof window === 'undefined') return null;
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error(`Error getting item ${key} from localStorage:`, e);
        return null;
      }
    },
  
    // Set an item in localStorage with error handling
    setItem: (key, value) => {
      try {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Error setting item ${key} in localStorage:`, e);
      }
    },
  
    // Remove an item from localStorage with error handling
    removeItem: (key) => {
      try {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`Error removing item ${key} from localStorage:`, e);
      }
    },
  
    // Clear all items in localStorage
    clear: () => {
      try {
        if (typeof window === 'undefined') return;
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    },
  
    // Auth-specific storage functions
    auth: {
      getToken: () => {
        try {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(KEYS.TOKEN);
        } catch (e) {
          console.error('Error getting token from localStorage:', e);
          return null;
        }
      },
      
      setToken: (token) => {
        try {
          if (typeof window === 'undefined') return;
          localStorage.setItem(KEYS.TOKEN, token);
        } catch (e) {
          console.error('Error setting token in localStorage:', e);
        }
      },
      
      getPrivateKey: () => {
        try {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(KEYS.PRIVATE_KEY);
        } catch (e) {
          console.error('Error getting private key from localStorage:', e);
          return null;
        }
      },
      
      setPrivateKey: (privateKey) => {
        try {
          if (typeof window === 'undefined') return;
          localStorage.setItem(KEYS.PRIVATE_KEY, privateKey);
        } catch (e) {
          console.error('Error setting private key in localStorage:', e);
        }
      },
      
      getUser: () => {
        try {
          if (typeof window === 'undefined') return null;
          const user = localStorage.getItem(KEYS.USER);
          return user ? JSON.parse(user) : null;
        } catch (e) {
          console.error('Error getting user from localStorage:', e);
          return null;
        }
      },
      
      setUser: (user) => {
        try {
          if (typeof window === 'undefined') return;
          localStorage.setItem(KEYS.USER, JSON.stringify(user));
        } catch (e) {
          console.error('Error setting user in localStorage:', e);
        }
      },
      
      clearAuth: () => {
        try {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(KEYS.TOKEN);
          localStorage.removeItem(KEYS.PRIVATE_KEY);
          localStorage.removeItem(KEYS.USER);
        } catch (e) {
          console.error('Error clearing auth from localStorage:', e);
        }
      }
    }
  };
  
  export default storageUtils;