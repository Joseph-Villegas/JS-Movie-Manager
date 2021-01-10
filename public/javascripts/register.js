const registerForm = document.getElementById("register-form");
registerForm.addEventListener("submit", event => {
	// Keep form data from reaching server before being validated
	event.preventDefault();

	register();
});

const register = async () => {
    console.log("Registering");

    // Retrieve necessary DOM elements
    const username = document.getElementById("username").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
	const password = document.getElementById("password").value.trim();

	const error = document.getElementById("register-error");

	// Clear any previous submission errors
	error.style.display = 'none';

	// Check for empty fields
	if (!username.length || !firstName.length || !lastName.length || !email.length || !password.length) {
		error.innerHTML = "¡Error: Empty Field!";
		error.style.display = 'inline-block';
		return;
    }
    
    // Send credentials to server, handle errors if any, else go to login
    const inputs = { username, firstName, lastName, email, password };
    const options = {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(inputs)
    };

    const response = await fetch(`/users/register`, options);
    const data = await response.json();

    if (!data.success) {
        error.innerHTML = `¡Error: ${data.msg}!`;
		error.style.display = 'inline-block';
		return;
    }

    window.location.href = "/login";
};