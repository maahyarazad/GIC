const crypto = require('crypto');
const bcrypt = require('bcryptjs');
function roundcubeSsoUrl(user) {
//   const secret = 'IAz6ylCkUSj8juIAF';          // same secret as the RC plugin
  const secret = '398@Azad';          // same secret as the RC plugin
  const exp    = Math.floor(Date.now() / 1000) + 60; // Unix *seconds*, matches PHP time()

  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${user}|${exp}`)
    .digest('hex');

  return 'https://buenapublica.cmpsrv.com/rc/?_autologin=1'
    + '&user=' + encodeURIComponent(user)
    + `&exp=${exp}&sig=${sig}`;
}

console.log(roundcubeSsoUrl("ricco.deutscher@german-industry-club.com"));


async function hashPassword() {
    const hashedPassword = await bcrypt.hash('IAz6ylCkUSj8juIAF', 10);
    
    console.log(hashedPassword)
}

hashPassword();