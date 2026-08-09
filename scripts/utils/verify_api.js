async function check() {
    try {
        const res = await fetch("http://localhost:5000/voter/0xCc792B595Fe3167515724783f2c3c6A59a09E445");
        const data = await res.json();
        console.log("API Response:", data);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
check();
