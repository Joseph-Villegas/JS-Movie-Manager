const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", event => {
	// Keep form data from reaching server before being validated
	event.preventDefault();

	document.getElementById("login-btn").disabled = true;

	login();
});

const login = async () => {
	// Retrieve necessary DOM elements
	const username = document.getElementById("username").value.trim();
	const password = document.getElementById("password").value.trim();

	const error = document.getElementById("login-error");

	// Clear any previous submission errors
	error.style.display = 'none';

	// Validate username and password inputs
	if (!username.length) {
		error.innerHTML = "¡Error: Username field is blank!";
		error.style.display = 'inline-block';
		document.getElementById("login-btn").disabled = false;
		return;
	}

	if (!password.length) {
		error.innerHTML = "¡Error: Password field is blank!";
		error.style.display = 'inline-block';
		document.getElementById("login-btn").disabled = false;
		return;
	}

	// Send credentials to server, handle errors if any, else go to dashboard
	const response = await fetch(`/users/login?username=${username}&password=${password}`);
	const data = await response.json();

	if (!data.success) {
		document.getElementById("login-btn").disabled = false;
		error.innerHTML = `¡Error: ${data.msg}!`;
		error.style.display = 'inline-block';
		return;
	}

	window.location.href = "/dashboard";
};