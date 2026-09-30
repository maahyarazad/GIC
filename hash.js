const bcrypt = require('bcrypt');

(async () => {
    const hashedPassword = await bcrypt.hash('veryStrongPassword', 10);
    console.log("Hashed Password:", hashedPassword);
})();