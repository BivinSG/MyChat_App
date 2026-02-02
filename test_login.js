const axios = require('axios');

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/user/login', {
            email: 'guest@example.com',
            password: '123456'
        });
        console.log('Login Success:', response.data);
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
};

testLogin();
