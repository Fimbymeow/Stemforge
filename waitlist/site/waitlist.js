const messages = {
  joined: "You’re on the list. We’ll let you know when Orthic launches.",
  already_joined: "You’re already on the list.",
  invalid_email: "Enter a valid email address.",
  rate_limited: "Too many attempts. Try again shortly.",
  server_error: "We couldn’t add you just now. Please try again.",
};

const template = document.querySelector("#waitlist-form-template");

for (const [index, host] of document.querySelectorAll("[data-waitlist-form]").entries()) {
  const fragment = template.content.cloneNode(true);
  const form = fragment.querySelector("form");
  const input = fragment.querySelector("[data-email-input]");
  const label = fragment.querySelector("[data-email-label]");
  const button = fragment.querySelector("button");
  const buttonLabel = fragment.querySelector("[data-button-label]");
  const help = fragment.querySelector("[data-help]");
  const message = fragment.querySelector("[data-message]");
  const id = `waitlist-email-${index + 1}`;
  const helpId = `${id}-help`;
  const messageId = `${id}-message`;

  input.id = id;
  label.htmlFor = id;
  help.id = helpId;
  message.id = messageId;
  input.setAttribute("aria-describedby", helpId);

  input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", helpId);
    message.textContent = "";
    message.className = "form-message";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = input.value.trim();
    if (!input.validity.valid || !email) {
      showResult("invalid_email", true);
      return;
    }

    button.disabled = true;
    buttonLabel.textContent = "Joining…";
    message.textContent = "";
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, website: form.elements.website.value }),
      });
      const result = await response.json();
      showResult(Object.hasOwn(messages, result.status) ? result.status : "server_error", false);
    } catch {
      showResult("server_error", false);
    } finally {
      button.disabled = false;
      buttonLabel.textContent = "Join the waitlist";
    }
  });

  function showResult(status, clientError) {
    const success = status === "joined" || status === "already_joined";
    message.textContent = messages[status];
    message.className = `form-message ${success ? "form-success" : "form-error"}`;
    message.setAttribute("role", success ? "status" : "alert");
    input.toggleAttribute("aria-invalid", !success);
    input.setAttribute("aria-describedby", `${helpId} ${messageId}`);
    if (success) {
      form.querySelector(".form-row").hidden = true;
      help.hidden = true;
    } else if (clientError) {
      input.focus();
    }
  }

  host.append(fragment);
}

