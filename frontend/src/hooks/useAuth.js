
useEffect(() => {
    const checkAuth = async () => {
      if (!isBrowser) {
        setLoading(false);
        return;
      }
        
      const token = localStorage.getItem('token');
      const storedPrivateKey = localStorage.getItem('privateKey');
      
      if (token) {
        try {
        
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            throw new Error('Token expired');
          }
          
          // Set up axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user info
          const response = await axios.get(`${API_URL}/api/users/profile`);
          setUser(response.data.user);
          
          // If private key is stored, set it
          if (storedPrivateKey) {
            //console.log('Found stored private key, setting it in context');
            setPrivateKey(storedPrivateKey);
          } else {
            // If no private key, redirect to login
            console.warn('No private key found in storage');
            throw new Error('No private key found');
          }
        } catch (error) {
          console.error('Auth error:', error);
          logout();
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);
  
  // In the login function
  const login = async (accessCode) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/login`, { access_code: accessCode });
      
      const { user, token } = response.data;
      
      // Ask for private key since the server doesn't store it
      const privateKeyInput = prompt('Please enter your private key:');
      if (!privateKeyInput) {
        throw new Error('Private key is required');
      }
      
      // Store token and private key
      localStorage.setItem('token', token);
      localStorage.setItem('privateKey', privateKeyInput);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setPrivateKey(privateKeyInput);
      //console.log('Private key set during login');
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your access code and private key.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };