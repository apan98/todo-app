const csurf = require('csurf');

const csrfProtection = csurf({ 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // should be true in production
        sameSite: 'strict'
    } 
});

module.exports = csrfProtection;
