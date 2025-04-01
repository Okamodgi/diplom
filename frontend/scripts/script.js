document.getElementById('btn').addEventListener('click', async () => {
    const response = await fetch('http://localhost:3000/api/message');
    const data = await response.json();
    document.getElementById('output').innerText = data.message;
});
