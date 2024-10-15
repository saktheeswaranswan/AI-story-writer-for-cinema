async function sendMessage() {
    const userInput = document.getElementById("userInput");
    const sendButton = document.getElementById("sendButton");
    const sendIcon = document.getElementById("sendIcon");

    const message = userInput.innerText.trim(); // Get text from contenteditable

    if (message === "") return; // Prevent sending empty messages

    // Disable the input and change the send icon to a loading icon
    userInput.setAttribute("contenteditable", "false"); // Disable input
    sendButton.disabled = true; // Disable send button
    sendIcon.src = "static/images/stop.png"; // Change to loading spinner

    // Append user message to chat
    appendMessage(message, "user-message");
    userInput.innerText = ""; // Clear the input after sending

    loadingBotResponse(); // Show loading message

    try {
        // Send POST request to the bot
        const response = await fetch("/writer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_input: message }), // Format the input as JSON
        });

        if (!response.ok) {
            console.error("Error:", response.statusText);
            streamBotResponse("Error: " + response.statusText);
            return;
        }

        // Read the response as a stream of data
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        streamBotResponse(""); // Start streaming response
        const messageContainers = document.querySelectorAll(".bot-message-container");
          const messageContainer = messageContainers[messageContainers.length - 1];

        let resultText = messageContainer.querySelector(".bot-message");

        // Read each chunk from the stream
        let done = false;
        while (!done) {
            // Read the next chunk
            const { value, done: readerDone } = await reader.read();
            done = readerDone;

            if (value) {
                // Decode the chunk
                console.log("decoder")
                console.log(decoder)
                const chunk = decoder.decode(value);
                console.log("chunk")
                console.log(chunk)
                const lines = chunk.split("\n"); // Split by line breaks
                console.log("lines")
                console.log(lines)
                const parsedLines = lines
                .map((line) => line.replace(/^data: /, "")) // Remove the "data: " prefix
                .filter((line) => line !== "[DONE]") // Remove empty lines and "[DONE]"
                // .map((line) => JSON.parse(line)); // Parse the JSON string
                console.log("parsedLines")
                console.log(parsedLines)
                
                // Iterate over the parsed lines
                for (const parsedLine of parsedLines) {
                      console.log(parsedLine);
                      resultText.innerHTML += parsedLine; // Append content with a space
                }
            }
        }
        // Find and remove the loading message
          const loadingMessage = document.getElementById("loading-message");
          if (loadingMessage) {
                loadingMessage.remove(); // Remove loading message container
          }
    } catch (error) {
        console.error("Error during message sending:", error);
        streamBotResponse("Error: Something went wrong.");
    } finally {
        // Re-enable the input and restore the send icon
        userInput.setAttribute("contenteditable", "true"); // Enable input
        sendButton.disabled = false; // Enable send button
        sendIcon.src = "static/images/icons8-arrow-100.png"; // Restore original icon
    }
}

function streamBotResponse(chunk) {
    const chatContainer = document.getElementById("chat-container");

    // Always create a new message container for each bot response
    let messageContainer = document.createElement("div");
    messageContainer.classList.add("bot-message-container");

    // Create bot icon container
    const botIconContainer = document.createElement("div");
    botIconContainer.classList.add("bot-icon-container");

    // Create message element to hold the bot's message
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", "bot-message");

    // Append bot icon and message element to the message container
    messageContainer.appendChild(messageElement);

    // Create action button container (hidden initially)
    const actionButtonContainer = document.createElement("div");
    actionButtonContainer.classList.add("action-button-container");
    actionButtonContainer.style.opacity = "0"; // Hidden initially

    // Add feedback and copy buttons (if needed)
    const copyButton = createCopyButton(messageElement);

    // Append buttons to action button container
    actionButtonContainer.appendChild(copyButton);

    messageContainer.appendChild(actionButtonContainer);

    // Show action buttons on hover
    messageContainer.onmouseover = () => {
          actionButtonContainer.style.opacity = "1";
    };
    messageContainer.onmouseout = () => {
          actionButtonContainer.style.opacity = "0";
    };

    // Append the new message container to the chat container
    chatContainer.appendChild(messageContainer);

    // Append chunk of the response to the newly created message
    messageElement.innerHTML += chunk;

    // Scroll to the bottom of the chat container
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function cleanInput() {
    const userInput = document.getElementById("userInput");
    // Remove all <span> elements, keeping their inner content
    userInput.innerHTML = userInput.innerHTML.replace(/<span[^>]*>(.*?)<\/span>/g, "$1");
}

function appendMessage(content, className) {
    const chatContainer = document.getElementById("chat-container");

    // Create the wrapper container
    const messageContainer = document.createElement("div");
    messageContainer.classList.add(`${className}-container`); // Class based on message type

    // Create the message element
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", className);
    messageElement.textContent = content;

    // Append the message element inside the container
    messageContainer.appendChild(messageElement);

    // Append the container to the chat container
    chatContainer.appendChild(messageContainer);

    // Auto-scroll to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function loadingBotResponse(responseText) {
    const chatContainer = document.getElementById("chat-container");
    const loadingMessageContainer = document.createElement("div");
    loadingMessageContainer.classList.add("bot-loading-message-container");
    loadingMessageContainer.textContent = "Writing";
    loadingMessageContainer.id = "loading-message";
    chatContainer.appendChild(loadingMessageContainer);
}

function createCopyButton(messageElement) {
    const copyButton = document.createElement("button");
    copyButton.classList.add("copy-button");

    const copyIcon = document.createElement("img");
    copyIcon.src = "static/images/copy.png"; // Path to copy icon
    copyIcon.classList.add("action-icon"); // Shared class
    copyButton.appendChild(copyIcon);
    copyButton.onclick = () => {
          copyToClipboard(messageElement.textContent);
          changeIconTemporary(copyIcon, "static/images/copy-checked.png", 3000); // Temporary icon change for 3 seconds
    };

    return copyButton;
}

function copyToClipboard(text) {
    navigator.clipboard
          .writeText(text)
          .then(() => {})
          .catch((err) => {
                console.error("Failed to copy: ", err);
          });
}

function handleKeyPress(event) {
    const sendButton = document.getElementById("sendButton");

    if (event.key === "Enter" && !sendButton.disabled) {
          // Disable if the send button is disabled
          event.preventDefault(); // Prevent the default newline behavior
          sendMessage(); // Call sendMessage function
    }
}

function checkInput() {
    const userInput = document.getElementById("userInput").textContent.trim();
    const sendButton = document.getElementById("sendButton");

    if (userInput.length > 0) {
          sendButton.style.backgroundImage = "linear-gradient(111.8deg, rgb(0, 104, 155) 19.8%, rgb(0, 173, 239) 92.1%)"; // Active color
    } else {
          sendButton.style.backgroundImage = "linear-gradient(45deg, rgb(91 153 207), rgb(144 222 255))"; // Inactive color
    }
}

function handlePaste(event) {
    // Prevent the default paste behavior
    event.preventDefault();

    // Get the plain text from the clipboard
    const text = event.clipboardData.getData("text/plain");

    // Insert the plain text into the contenteditable element
    document.execCommand("insertText", false, text);
}