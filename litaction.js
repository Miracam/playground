const go = async (eoa, owner) => {
    
  return fetch('https://api.miracam.xyz/lit', {
    body: JSON.stringify({ eoa, owner }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(res => res.verified)
};