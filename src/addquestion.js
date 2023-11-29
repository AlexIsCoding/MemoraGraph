let selectedCategory = ""
let currentCardIndex = 0;
let cardsData = [];
// Define an array of categories
var categories = [];
let isCollectMode = false; // Variable to track the current mode

let driver;

document.addEventListener('DOMContentLoaded', async () => {

    console.log("called");
    if (sessionStorage.getItem("url") == null || sessionStorage.getItem("url") === "") {
        displayContent(true);

    }
    else {
        await initDriverFromStorage();
        displayContent(false);
        refreshData();
    }

});

function refreshData() {
    let session = driver.session();

    session
        .run('MATCH (n:QUESTION) RETURN n')
        .then(result => {
            result.records.forEach(record => {
                const node = record.get('n');
                const properties = node.properties;
                const id = node.identity.toString(); // Get the ID as a string
                const labels = node.labels;

                // Store properties, id, and labels in the cardsData array
                cardsData.push({ properties, id, labels });

            });
            console.log(cardsData);
            showCard(currentCardIndex);
        })
        .catch(error => {
            console.error(error);
        })
        .finally(() => {
            session.close();
            // driver.close();
        });

    session = driver.session();

    session
        .run('MATCH (n:CATEGORY) RETURN n')
        .then(result => {
            result.records.forEach(record => {
                const node = record.get('n');
                const name = node.properties.name;

                // Store properties, id, and labels in the cardsData array
                categories.push(name);

            });
            console.log(categories);

            // Call the populateCategories function to populate the dropdown on page load
            // populateCategories();
        })
        .catch(error => {
            console.error(error);
        })
        .finally(() => {
            session.close();
            // driver.close();
        });
}

function showCard(index) {
    const questionElement = document.getElementById('question');
    const answerElement = document.getElementById('answer');
    const indicatorButtons = document.querySelectorAll('.indicator button');

    const { properties, id, labels, correct } = cardsData[index];
    questionElement.textContent = 'Q: ' + properties.question;
    answerElement.textContent = 'A: ' + properties.answer;


    // Disable Previous button if it's the first card
    document.querySelector('.navigation button:first-child').disabled = index === 0;
    // Disable Next button if it's the last card
    document.querySelector('.navigation button:last-child').disabled = index === cardsData.length - 1;
    // Hide the answer and update button text when moving to the next/previous card
    // answerElement.style.display = 'none';
    // indicatorButtons[0].textContent = 'Show Answer';

    document.querySelector('.correct').style.display = 'none';

    if (correct !== true) {
        const correctButton = document.querySelector('.correct');
        correctButton.classList.remove('correct-clicked'); // Remove the class when displaying a new card
    } else {
        markCorrect();
    }
}
function toggleAnswer() {
    const answerElement = document.getElementById('answerContainer');

    if (answerElement.style.display === 'none' || answerElement.style.display === '') {
        answerElement.style.display = 'block';
        correctButton.style.display = 'block'; // Show "I knew the answer" button when the answer is visible
    } else {
        answerElement.style.display = 'none';
        correctButton.style.display = 'none'; // Hide "I knew the answer" button when the answer is not visible
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCard(currentCardIndex);
    }
}

function nextCard() {

    if (currentCardIndex < cardsData.length - 1) {
        currentCardIndex++;
        showCard(currentCardIndex);
    }
}


function markCorrect() {
    // Mark the answer as known or perform any other desired action
    console.log('Correct answer known!');
    cardsData[currentCardIndex].correct = true;
    const correctButton = document.querySelector('.correct');
    correctButton.classList.add('correct-clicked'); // Add a class to indicate the button is clicked
}

function addNewCard(event) {
    event.preventDefault();
    const newQuestion = document.getElementById('new-question').value;
    const newAnswer = document.getElementById('new-answer').value;
    var categoryDropdown = document.getElementById("category");
    // Read the selected category from the variable or hidden input field
    var category = selectedCategory || document.getElementById("selected-category").value || document.getElementById("new-category").value;

    if (!category) {
        alert("Please select a category.");
        return;
    }

    const newCard = {
        properties: {
            question: newQuestion,
            answer: newAnswer,
            category: category
        }
    };
    cardsData.push(newCard);
    // You can save the new card data to your database or perform other actions here
    console.log('New card added:', newCard);
    // Optionally, you can reset the form fields after adding a new card
    document.getElementById('new-question').value = '';
    document.getElementById('new-answer').value = '';
    saveToNeo4j(newCard);
}

function toggleMode() {
    isCollectMode = !isCollectMode;
    displayContent(false);

}

function displayContent(onlySettings) {
    // const cardDisplay = document.querySelector('.card');


    //     cardDisplay.style.display = 'block';
}

function fillSettingsFromStorage() {

    var url = sessionStorage.getItem("url");
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");

    document.getElementById("url").value =  url;
    document.getElementById("username").value = username;
    document.getElementById("password").value = password;


    displayContent(true);
}

// Function to populate the categories in the dropdown
function populateCategories() {
    var categoryContainer = document.getElementById("category-container");

    categories.forEach(function (category) {
        var categoryCircle = document.createElement("div");
        categoryCircle.className = "category-circle";
        categoryCircle.textContent = category;
        categoryCircle.dataset.category = category;
        categoryCircle.addEventListener("click", function (event) {
            selectCategory(event.target.dataset.category);
        });
        categoryContainer.appendChild(categoryCircle);
    });
}

function selectCategory(category) {
    var categoryCircles = document.querySelectorAll(".category-circle");

    categoryCircles.forEach(function (circle) {
        if (circle.dataset.category === category && !circle.classList.contains("selected-category")) {
            circle.innerHTML = category;
            circle.classList.add("selected-category");
            // Store the selected category in the variable and hidden input field
            selectedCategory = category;
            document.getElementById("selected-category").value = selectedCategory;
        } else {
            circle.textContent = circle.dataset.category;
            circle.classList.remove("selected-category");
            selectedCategory = "";
            document.getElementById("selected-category").value = selectedCategory;

        }
    });

}


function saveToNeo4j(newCard) {
    const session = driver.session();

    const query = 'CREATE (n:QUESTION) SET n = $question.properties MERGE(c:CATEGORY {name: $question.properties.category}) CREATE (n)-[:IN_CATEGORY]->(c)'
    const parameters = {
        question: newCard
    };

    session
        .run(query, parameters)
        .then(result => {
            console.log(result.summary);
        })
        .catch(error => {
            console.error(error);
        })
        .finally(() => {
            session.close();
            // driver.close();
        });
}


function setConnectivityIndicator(isConnected)
{
    var element = document.getElementById("neo4j_indicator");

    if(isConnected)
    {
        element.innerHTML = "&#xe2c2;";
    }else
    {
        element.innerHTML = "&#xe2c1;";
    }
}

async function initDriverFromStorage()
{
    var url = sessionStorage.getItem("url");
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");

    if (await setupDBDriver(url, username, password) === true) {
        setConnectivityIndicator(true)
        // refreshData();
        // displayContent(false);
    } else {
        alert("Could not connect to " + url)

    }
}

// Function to set session storage
async function setSessionStorage(event) {

    console.log("test 0");

    var url = document.getElementById("url").value;
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    // Check if the inputs are not empty before setting session storage
    if (url && username && password) {
        sessionStorage.setItem("url", url);
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("password", password);
        console.log("test 1");
        if (await setupDBDriver(url, username, password) === true) {
            console.log("test 2");
            
            setConnectivityIndicator(true)
            // refreshData();
            // displayContent(false);
        } else {
            alert("Could not connect to " + url)

        }

    }
    else
    {
        alert('bla')
    }
}

async function setupDBDriver(url, username, password) {
    try {
        driver = neo4j.driver(url, neo4j.auth.basic(username, password))
        const serverInfo = await driver.getServerInfo()
        console.log(serverInfo)
        return true;
    } catch (err) {
        console.log(`Connection error\n${err}\nCause: ${err.cause}`)
        if (driver == null) {
            console.log(driver)
            await driver.close()
        } return false;
    }
}

// Function to clear session storage
async function clearSessionStorage() {
    sessionStorage.removeItem("url");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");

    if (driver == null) {
        await driver.close()

        alert("Connection closed!");
    }
    setConnectivityIndicator(false);
}